. "$PSScriptRoot\lib.ps1"
$root = Get-RepoRoot
Set-Location $root

$payload = @{
  outline = "Launch message"
  persona = "busy founder"
  channel = "email"
  brand_rules = @("Be concise")
} | ConvertTo-Json

$resp = Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/workflows/marketing/submit `
  -ContentType "application/json" `
  -Body $payload

Write-Host "run_id:" $resp.run_id
Start-Sleep -Seconds 1
Invoke-RestMethod -Uri ("http://127.0.0.1:8000/runs/" + $resp.run_id) | ConvertTo-Json -Depth 6
