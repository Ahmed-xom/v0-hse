[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateScript({ Test-Path $_ -PathType Leaf })]
  [string]$ArchivePath,
  [string]$OutputDirectory = ".\migration-review"
)

$ErrorActionPreference = "Stop"

if ([IO.Path]::GetExtension($ArchivePath).ToLowerInvariant() -ne ".zip") {
  throw "ArchivePath must point to a .zip file."
}

$resolvedArchive = (Resolve-Path $ArchivePath).Path
Write-Host "Running read-only inventory for $resolvedArchive"
Write-Host "No Neon, Blob, or Production writes are performed by this command."

pnpm install --frozen-lockfile
pnpm inventory:legacy -- $resolvedArchive $OutputDirectory

Write-Host "Dry-run report written to $((Resolve-Path $OutputDirectory).Path)\legacy-migration-dry-run.json"
Write-Host "Review the report and obtain explicit approval before implementing any import phase."
