param(
  [Parameter(Position = 0)]
  [string]$Command = "help"
)

$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
. "$PSScriptRoot\lib.ps1"

$root = Get-RepoRoot
Set-Location $root

switch ($Command) {
  "help" {
    @"
Hydra Copilot commands:
  hc dev       - start API (uvicorn)
  hc worker    - start Celery worker (Windows-safe solo pool)
  hc redis     - start Redis via Docker
  hc smoke     - submit a marketing request + print JSON
  hc test      - run pytest
"@ | Write-Host
  }
  "dev" {
    uvicorn app.main:app --reload
  }
  "worker" {
    celery -A app.worker.celery_app worker --loglevel=info --pool=solo
  }
  "redis" {
    docker run --rm -p 6379:6379 redis:7
  }
  "smoke" {
    . "$PSScriptRoot\smoke.ps1"
  }
  "test" {
    python -m pytest -q
  }
  default {
    Write-Host "Unknown command: $Command"
    & $PSCommandPath help
  }
}
