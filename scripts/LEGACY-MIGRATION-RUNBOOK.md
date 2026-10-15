# Legacy migration dry-run

## Secure download

The SharePoint link must be opened by an authorized Microsoft 365 user. Do not bypass authentication or copy session cookies. In SharePoint, choose **Download** and save `XOM_Files.zip` to a local Windows folder.

If download is denied, ask the SharePoint owner to grant the named Microsoft 365 account read/download permission or provide an approved OneDrive/SharePoint sync folder. Do not use anonymous mirrors.

## Windows dry-run

```powershell
Set-Location C:\path\to\v0-hse
$archive = 'C:\Users\<user>\Downloads\XOM_Files.zip'
$output = 'C:\Users\<user>\Downloads\amnko-migration-review'
& .\scripts\run-legacy-migration-dry-run.ps1 -ArchivePath $archive -OutputDirectory $output
```

The command extracts into a review directory, inventories files, calculates SHA-256 checksums, detects database/metadata/training/attachment candidates, flags unsafe paths, and reports duplicate content. It does not connect to Neon, upload to Blob, or write application tables.

## Validation

```powershell
Get-FileHash $archive -Algorithm SHA256
Get-Content "$output\legacy-migration-dry-run.json" | ConvertFrom-Json | Format-List
```

Review `issues`, `detected`, `duplicateFiles`, and all company mappings before approval. Missing source manifests, ambiguous company identity, missing attachments, duplicate records, and ACL conflicts remain review items.

## Rollback

Before any future import, snapshot/export the target rows and record an immutable audit batch ID. A rollback must delete only rows and storage objects created by that batch, in dependency order, after a second approval. Never truncate shared tables or restore over existing records.

Required future environment variables are read by the application/server only; do not put credentials in this script, command history, or logs. The dry-run itself requires no database or storage credential.
