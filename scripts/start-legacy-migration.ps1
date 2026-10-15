[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^https://[^/]+\.sharepoint\.com/')]
  [string]$SharingUrl,
  [string]$DownloadDirectory = "$env:USERPROFILE\Downloads",
  [string]$OutputDirectory = "$env:USERPROFILE\Downloads\amnko-migration-review",
  [switch]$UseExistingArchive
)

$ErrorActionPreference = "Stop"
$downloadRoot = [IO.Path]::GetFullPath($DownloadDirectory)
$outputRoot = [IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Force -Path $downloadRoot, $outputRoot | Out-Null

Write-Host "Opening the SharePoint link in your default browser..."
Write-Host "Sign in with your authorized Microsoft 365 account if prompted."
Write-Host "Do not paste cookies, tokens, or credentials into this terminal."
Start-Process $SharingUrl

$archive = Join-Path $downloadRoot "XOM_Files.zip"
if (-not $UseExistingArchive) {
  Write-Host "In SharePoint, choose Download and save the archive as: $archive"
  Read-Host "Press Enter after the authorized download has completed"
}

if (-not (Test-Path $archive -PathType Leaf)) {
  throw "Archive was not found at '$archive'. Download it through the authenticated SharePoint UI and run this command again with -UseExistingArchive."
}
if ([IO.Path]::GetExtension($archive).ToLowerInvariant() -ne ".zip") { throw "The downloaded file must be a .zip archive." }

$hash = Get-FileHash -Path $archive -Algorithm SHA256
$hash | ConvertTo-Json | Set-Content -Encoding UTF8 (Join-Path $outputRoot "archive-sha256.json")
Write-Host "Archive SHA-256: $($hash.Hash)"
Write-Host "Running read-only inventory. No Neon, Blob, or production writes are performed."

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\")).Path
Push-Location $repoRoot
try {
  pnpm install --frozen-lockfile
  pnpm inventory:legacy -- $archive $outputRoot
} finally {
  Pop-Location
}

Write-Host "Dry-run report: $(Join-Path $outputRoot 'legacy-migration-dry-run.json')"
Write-Host "STOP: review the report and approve a separate import implementation before any production write."
