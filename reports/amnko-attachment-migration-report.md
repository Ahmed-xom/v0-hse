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

- All 46 manifest rows have blank `TargetId` and `UNRESOLVED_NEON_ID`; no row-level legacy-to-Neon evidence is present. Existing source references and `LegacyRowguid` are not sufficient without an approved target-row export or crosswalk.
- The archive matches all paths, but no files were extracted or uploaded. Blob is connected, but no upload was attempted and no storage write was authorized.
- The current `public.incident` and `public.journey` schema exposes one attachment URL/name pair per row; no supported attachment/document table or multi-attachment relation was found for these records. Multiple legacy attachments therefore cannot be preserved without an approved storage/linking decision, and no existing field may be overwritten.
- The supplied manifest has no `Is_Deleted` column, so deleted-state evidence is unavailable in this artifact; no deleted item was reactivated. Attachment paths are unique in the 46-row manifest (no duplicate manifest paths).

## Upload plan

`reports/amnko-attachment-upload-plan.csv` contains deterministic, non-overwriting object paths for all 46 archive-verified rows. All 46 rows are `BLOCKED_UNRESOLVED_TARGET`; none are eligible for upload until a verified Neon `TargetId` and an approved multi-attachment strategy exist. No upload was attempted.

## Per-record status

All rows: `ARCHIVE_PATH_VERIFIED`, `NOT_UPLOADED`, `UNRESOLVED_NEON_ID`. The single remaining blocker is a traceable legacy-to-Neon target crosswalk plus an approved way to preserve multiple attachments without overwriting existing fields.
