# AMNKO HSE attachment implementation preparation

## Prepared code

- `lib/amnko-attachment-migration.ts`
  - Requires a verified `targetId` and non-empty legacy `Rowguid`.
  - Rejects deleted attachments.
  - Computes SHA-256 before upload and verifies it again immediately before upload.
  - Builds deterministic object keys containing target table/ID, legacy Rowguid, attachment ID, SHA-256, and sanitized filename.
  - Uses private Blob storage, `addRandomSuffix: false`, and `allowOverwrite: false`.
  - Provides rollback for only the objects returned by the current upload run.
  - Does not write Neon fields or alter the database schema.

## Deliberate non-implementation

No route, workflow entry point, schema migration, attachment link write, or upload runner is enabled yet. This prevents an unresolved or test/demo parent from receiving a file and avoids overwriting the single existing incident/journey attachment fields.

## Required approval/input

One approval is required for the storage model: create a separate attachment-record persistence layer that can store multiple rows per `incident` or `journey`, rather than placing multiple files into the existing single URL/name fields. This requires a proposed database schema change and explicit approval before implementation.

The destination mapping source is also still required: an authoritative local ledger with `LegacyParentId` + `LegacyRowguid` → actual Neon `TargetId`, excluding test/demo rows. The current local crosswalk has 0 verified targets, so the prepared uploader will intentionally upload 0 files until that ledger exists.

## Execution estimate

After both the approved storage model and authoritative mapping ledger are available, the controlled run is expected to take approximately 5–15 minutes for 46 files, depending on Blob transfer throughput. This is an estimate, not a completed operation.
