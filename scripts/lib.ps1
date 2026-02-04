function Get-RepoRoot {
  param([string]$StartPath = (Get-Location).Path)
  $current = Get-Item -LiteralPath $StartPath
  while ($null -ne $current) {
    if (Test-Path -LiteralPath (Join-Path $current.FullName ".git")) {
      return $current.FullName
    }
    $current = $current.Parent
  }
  throw "Repo root not found. Run from inside the hydra-copilot repo."
}
