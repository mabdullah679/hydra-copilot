. "$PSScriptRoot\lib.ps1"

$root = Get-RepoRoot
Set-Location $root

. "$PSScriptRoot\alias.ps1"

function Wait-Port {
  param([int]$Port, [int]$TimeoutSeconds = 30)
  $sw = [Diagnostics.Stopwatch]::StartNew()
  while ($sw.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
    try {
      $client = New-Object System.Net.Sockets.TcpClient("127.0.0.1", $Port)
      $client.Close()
      return $true
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }
  return $false
}

function Wait-Http {
  param([string]$Url, [int]$TimeoutSeconds = 30)
  $sw = [Diagnostics.Stopwatch]::StartNew()
  while ($sw.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
    try {
      $resp = Invoke-RestMethod -Uri $Url -TimeoutSec 2
      if ($resp.status -eq "ok") { return $true }
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }
  return $false
}

Write-Host "Starting Redis..."
Start-Process -FilePath "docker" -ArgumentList "run --rm -p 6379:6379 redis:7" | Out-Null
if (-not (Wait-Port -Port 6379 -TimeoutSeconds 20)) {
  Write-Host "Redis did not become ready on port 6379." -ForegroundColor Red
  exit 1
}

Write-Host "Starting API..."
Start-Process -FilePath "uvicorn" -ArgumentList "app.main:app --reload" | Out-Null
if (-not (Wait-Http -Url "http://127.0.0.1:8000/health" -TimeoutSeconds 30)) {
  Write-Host "API did not become ready at /health." -ForegroundColor Red
  exit 1
}

Write-Host "Starting worker..."
Start-Process -FilePath "celery" -ArgumentList "-A app.worker.celery_app worker --loglevel=info --pool=solo" | Out-Null
Start-Sleep -Seconds 2

Write-Host "Ready to smoke test. Would you like to run it now or manually? (y/n)"
$ans = Read-Host
if ($ans -match '^(y|yes)$') {
  . "$PSScriptRoot\smoke.ps1"
} else {
  Write-Host "Sure! When you want to run it in the future, run: hc smoke"
}
