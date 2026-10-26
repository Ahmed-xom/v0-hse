# AMNKO HSE attachment migration — next action

## Current result

- 46 attachment files have verified archive paths.
- 0 of 46 have a defensible legacy-parent-to-Neon target mapping.
- 0 files were uploaded and 0 database/storage records were written.
- Deleted-state evidence is not present in the supplied manifest; no item was reactivated.
- No duplicate manifest paths were found.

## Exact next action

Provide the single approved target-evidence artifact at:

`reports/amnko-required-target-export.csv`

It contains one row for each of the 29 distinct legacy parents represented by the 46 attachment records, with these columns:

`ParentGroup`, `LegacyParentId`, `LegacyRowguid`, `LegacyReference`, `LegacyTitle`, `TargetTable`, `TargetId`, `EvidenceArtifact`, `EvidenceRowReference`, `MappingStatus`.

Fill only `TargetId`, `EvidenceArtifact`, `EvidenceRowReference`, and `MappingStatus` when an explicit row-level legacy-to-Neon match is proven. Keep unsupported rows as `UNRESOLVED_TARGET_ID`; do not use numeric equality, approximate titles, or test records.

This is the single blocker that unblocks the crosswalk. Do not use numeric-ID equality, title similarity, aggregate counts, or test records as proof. After that artifact is reviewed locally, separately approve the proposed attachment-record storage design before any Blob upload or Neon link write.

## Approved execution constraints after review

1. Revalidate every archive path and SHA-256.
2. Upload privately with deterministic, non-overwriting object keys and idempotency on legacy identity plus SHA-256.
3. Create attachment records only after the target mapping is verified.
4. Preserve original filename, archive path, parent identity, deletion flag, and duplicate-path metadata.
5. Never overwrite `incident` or `journey` single-attachment fields.
6. Roll back only objects/records created by that migration run; never delete pre-existing data.

## Neon read-only verification

The existing Neon integration is connected and exposes read-only database access. Existing application schema confirms:

- `public.incident`: `id`, `reference_no`, `title`, `date`, `created_at`, and one attachment URL/name pair.
- `public.journey`: `id`, journey details, and one `attachment_url`/`attachment_name` pair; no legacy `JM-...` reference column is present.
- `public.aegis_migration_record`: existing source-to-target crosswalk inventory.

A read-only lookup of the eight incident references in this manifest returned zero rows. A read-only lookup of `public.aegis_migration_record` for all 29 source keys also returned zero rows. No actual Neon ID is therefore proven, and no crosswalk row was updated.

## Minimal authorized target export required

Export one read-only workbook/CSV package from the authorized Neon admin tooling containing:

- `incident`: `id`, `reference_no`, `title`, `date`, `created_at`, `data_gathering_attachment`, `data_gathering_attachment_name`
- `journey`: `id`, `departure_date`, `origin`, `destination`, `purpose`, `driver`, `vehicle_plate`, `created_at`, `attachment_url`, `attachment_name`
- `aegis_migration_record`: `source_table`, `source_key`, `target_table`, `target_id`, `comparison_status`, `row_hash`, `created_at`

Include the export date and exact evidence source. A row becomes VERIFIED only when the artifact contains an actual target `id` plus a traceable legacy key/Rowguid mapping; numeric equality, title similarity, and test records do not qualify.

This report is read-only planning. No query, upload, schema change, environment change, commit, push, or production change was performed.
