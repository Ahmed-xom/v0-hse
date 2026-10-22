# AMNKO HSE attachment migration report

Read-only inspection completed. No database/Neon/Blob connection or write, upload, overwrite, schema change, environment change, commit, or push was performed.

- Manifest: `reports/amnko-asset-linking-manifest.csv` (46 records)
- Archive verified copy: `/vercel/share/amnko-git-recovery-20261022/amnko-drive-confirmed.zip` (available; 3658 files)
- Archive path matches verified: 46
- Files genuinely absent from the available archive: 0
- Upload successes: 0 (not attempted)
- Links completed to verified destination records: 0
- Target IDs already present in manifest: 0
- Unresolved records: 46

## Blocking reasons

- All 46 manifest rows have blank `TargetId` and `UNRESOLVED_NEON_ID`; no row-level legacy-to-Neon evidence is present.
- The archive matches all paths, but the archive is an existing verified copy outside the project root; no files were extracted or uploaded.
- Multiple legacy records have multiple attachments while `incident`/`journey` currently expose one attachment URL/name pair. No existing attachment may be overwritten, so linking cannot proceed without an approved multi-attachment design.
- Deleted flags and duplicate-path information remain preserved in the manifest; no deleted item was reactivated.

## Per-record status

All rows: `ARCHIVE_PATH_VERIFIED`, `NOT_UPLOADED`, `UNRESOLVED_NEON_ID`.
