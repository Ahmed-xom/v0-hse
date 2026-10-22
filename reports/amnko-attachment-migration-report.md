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

## Evidence resolution

Exhausted local manifest, archive, migration artifacts, source snapshots, cached inventories, crosswalk proposals, and application schema evidence. No attachment has a defensible row-level mapping from `LegacyParentId`/`LegacyRowguid` to an actual Neon `incident.id` or `journey.id`. Aggregate counts, matching titles/references, numeric similarity, and test records were not accepted as evidence.

Verified mappings: 0/46. Safely linkable attachments: 0/46. The crosswalk remains unresolved for every row; `reports/amnko-attachment-crosswalk.csv` retains the source reference, Rowguid, archive evidence, empty target ID, and unresolved status.

## Upload plan

`reports/amnko-attachment-upload-plan.csv` contains deterministic, non-overwriting object paths for all 46 archive-verified rows. All 46 rows are `BLOCKED_UNRESOLVED_TARGET`; none are eligible for upload until a verified Neon `TargetId` and an approved multi-attachment strategy exist. No upload was attempted.

The existing upload implementation uses private Blob objects, deterministic path prefixes, `allowOverwrite: false`, and SHA-256 deduplication. The approved execution package should retain that behavior, add per-file idempotency keyed by `(LegacyRowguid, AttachmentPath, sha256)`, and record each upload before any target link is written.

## Multi-attachment preservation design

No existing supported attachment/document relation was found for `incident` or `journey`; each currently has only one URL/name pair. Do not use those fields for this migration because doing so would overwrite existing values or discard additional files.

Proposed design for approval only: a separate attachment-record model keyed by a stable attachment ID, with `target_table`, `target_id`, `legacy_parent_group`, `legacy_parent_id`, `legacy_rowguid`, original filename, original archive path, private Blob pathname, SHA-256, byte size, `is_deleted`, and timestamps. A unique constraint on `(legacy_parent_group, legacy_parent_id, legacy_rowguid, archive_path, sha256)` provides idempotency; object paths include the target/table, legacy Rowguid, attachment ID, and sanitized filename. Existing files/records are never deleted or overwritten. Rollback removes only objects and rows created by the approved migration run, never pre-existing objects or records.

## Per-record status

All rows: `ARCHIVE_PATH_VERIFIED`, `NOT_UPLOADED`, `UNRESOLVED_NEON_ID`. The exact blocker is the missing row-level legacy-to-Neon target evidence and approval of the separate attachment-record design.
