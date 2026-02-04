function global:hc {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
  )
  . "$PSScriptRoot\lib.ps1"
  $root = Get-RepoRoot
  & (Join-Path $root "scripts\hc.ps1") @Args
}

Set-Alias -Name hydra -Value hc -Scope Global

Write-Host "Aliases set for this session: hc, hydra"
