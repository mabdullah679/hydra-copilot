. "$PSScriptRoot\lib.ps1"
$root = Get-RepoRoot
Set-Location $root

function Smoke-Marketing {
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
}

function Smoke-Invoice-ForcedFail {
  $payload = @{
    document = @{
      content_base64 = "vendor: Zeta LLC`ninvoice date: 2026-01-15`ndue date: 2026-02-15`ntotal: 2500`nline items total: 2400"
      content_type   = "text/plain"
    }
    metadata = @{ force_validation_fail = $true }
  } | ConvertTo-Json

  $resp = Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/workflows/invoice/submit `
    -ContentType "application/json" `
    -Body $payload
  Write-Host "run_id:" $resp.run_id
  Start-Sleep -Seconds 1
  Invoke-RestMethod -Uri ("http://127.0.0.1:8000/runs/" + $resp.run_id) | ConvertTo-Json -Depth 6
}

function Smoke-Contract-ForcedRisks {
  $payload = @{
    document = @{ content_base64 = "..."; content_type = "application/pdf" }
    metadata = @{ force_risks = @("liability_cap_missing","unlimited_indemnity") }
  } | ConvertTo-Json

  $resp = Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/workflows/contract/submit `
    -ContentType "application/json" `
    -Body $payload
  Write-Host "run_id:" $resp.run_id
  Start-Sleep -Seconds 1
  Invoke-RestMethod -Uri ("http://127.0.0.1:8000/runs/" + $resp.run_id) | ConvertTo-Json -Depth 6
}

function Smoke-Events {
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
  Invoke-RestMethod -Uri ("http://127.0.0.1:8000/runs/" + $resp.run_id + "/events") | ConvertTo-Json -Depth 6
}

Write-Host "Smoke options:"
Write-Host "  1) Marketing basic"
Write-Host "  2) Invoice forced validation fail (ap-exceptions)"
Write-Host "  3) Contract forced risks (legal-review)"
Write-Host "  4) Events endpoint (marketing)"

$choice = Read-Host "Select an option (1-4)"
switch ($choice) {
  "1" { Smoke-Marketing }
  "2" { Smoke-Invoice-ForcedFail }
  "3" { Smoke-Contract-ForcedRisks }
  "4" { Smoke-Events }
  default { Write-Host "Invalid option." }
}
