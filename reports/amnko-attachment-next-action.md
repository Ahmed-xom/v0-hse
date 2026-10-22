# AMNKO HSE attachment migration — next action

## Current result

- 46 attachment files have verified archive paths.
- 0 of 46 have a defensible legacy-parent-to-Neon target mapping.
- 0 files were uploaded and 0 database/storage records were written.
- Deleted-state evidence is not present in the supplied manifest; no item was reactivated.
- No duplicate manifest paths were found.

## Exact next action

Provide one approved, local target-evidence artifact containing one row for each required legacy parent with:

`ParentGroup`, `LegacyParentId`, `LegacyRowguid`, `TargetTable`, and the actual Neon `TargetId` (`public.incident.id` or `public.journey.id`), plus the evidence reference that proves the row-level match.

This is the single blocker that unblocks the crosswalk. Do not use numeric-ID equality, title similarity, aggregate counts, or test records as proof. After that artifact is reviewed locally, separately approve the proposed attachment-record storage design before any Blob upload or Neon link write.

## Approved execution constraints after review

1. Revalidate every archive path and SHA-256.
2. Upload privately with deterministic, non-overwriting object keys and idempotency on legacy identity plus SHA-256.
3. Create attachment records only after the target mapping is verified.
4. Preserve original filename, archive path, parent identity, deletion flag, and duplicate-path metadata.
5. Never overwrite `incident` or `journey` single-attachment fields.
6. Roll back only objects/records created by that migration run; never delete pre-existing data.

This report is read-only planning. No query, upload, schema change, environment change, commit, push, or production change was performed.
