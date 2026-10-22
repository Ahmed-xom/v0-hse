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

This report is read-only planning. No query, upload, schema change, environment change, commit, push, or production change was performed.
