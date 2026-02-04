. "$PSScriptRoot\lib.ps1"

function hc {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
  )
  $root = Get-RepoRoot
  & (Join-Path $root "scripts\hc.ps1") @Args
}

Set-Alias -Name hydra -Value hc

Write-Host "Aliases set for this session: hc, hydra"
