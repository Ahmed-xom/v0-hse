# AMNKO HSE Attachment Migration Execution Plan

## Status and approval gate

This is a preparation-only plan. No database connection, SQL, DDL, Blob operation, environment change, UI change, commit, push, or deployment is performed by this plan. Execution requires one separate explicit approval after review of the generated source-to-target ledger.

## Source scope

The source export already available in the project is the only input:

- `table_data\\dbo__tblHSEINC.json` — incident source records.
- `table_data\\dbo__tblJM.json` — journey source records.
- `table_data\\dbo__tblAttachments.json` — attachment ownership rows.
- Existing verified attachment package and manifests are reused; the 46 files are not downloaded or re-scanned in this phase.

Required source counts:

- Attachments: **46 rows**, owned by `ParentGroup=HSEINCMaster` or `ParentGroup=JM` and `ParentId`.
- Distinct incident parents required by those attachments: **8**, identified by `tblHSEINC.Event_Id` (the 19 figure is the attachment-row count, not a distinct-parent count).
- Distinct journey parents required by those attachments: **21**, identified by `tblJM.JMId` (the 27 figure is the attachment-row count, not a distinct-parent count).
- The source export may contain additional parent rows, but execution scope must be limited to the exact distinct parent keys referenced by the 46 attachment rows unless separately approved.

`tblAttachments.Rowguid` is the attachment-row Rowguid, not a proven parent Rowguid. A parent Rowguid is retained only when it is actually present in the relevant parent source record.

## Files to prepare or modify during approved execution

1. `scripts/amnko-prepare-parent-migration.mjs` — resumable, read/validate/insert orchestration; must be written before execution and reviewed.
2. `scripts/amnko-verify-parent-ledger.mjs` — read-only ledger verification; must fail closed on missing, duplicate, or conflicting mappings.
3. `scripts/amnko-link-attachments.mjs` — separate second-stage attachment linking operation, enabled only after ledger approval.
4. `reports/amnko-parent-target-ledger.csv` — generated ledger, never hand-filled.
5. `reports/amnko-attachment-source-crosswalk.csv` — updated only from approved ledger joins.
6. `reports/amnko-attachment-migration-execution-report.md` — execution audit, including counts, conflicts, skips, and rollback identifiers.

The existing source export and verified attachment archive are inputs, not files to rewrite.

## Ledger contract

The parent ledger must contain at least:

```text
source_table,source_id,source_rowguid,target_table,target_id,source_fingerprint,status,run_id,created_at
```

Allowed source-to-target pairs are explicit:

- `dbo.tblHSEINC.Event_Id` -> `public.incident.id`
- `dbo.tblJM.JMId` -> `public.journey.id`

`source_rowguid` is nullable only when absent from the source parent record; it must never be fabricated from the attachment Rowguid. `source_fingerprint` is a deterministic hash of the source identity and normalized source payload used for resumability and conflict detection.

Required uniqueness and conflict rules:

- Unique key: `(source_table, source_id)`.
- If a ledger row already exists with the same source key and same fingerprint, resume by reusing its `target_id`; do not insert again.
- If the same source key has a different fingerprint, stop the run and mark `CONFLICT`; do not update or overwrite either record.
- If a target row is already present but no authoritative ledger row identifies it, leave it untouched and mark the source row `UNRESOLVED`; do not match by name, date, number, destination, or generated UUID.
- Any duplicate source key, duplicate target ID, missing required source key, or target-table mismatch is a hard failure.

## Resumable parent migration

1. Read and validate all 19 incident and 27 journey source records locally.
2. Produce a deterministic preflight manifest with counts, source keys, available parent Rowguid values, and fingerprints.
3. Load or create the ledger in an isolated migration transaction/operation. The implementation must use idempotent inserts keyed by the source key and must capture the actual generated target UUID immediately after each successful insert.
4. Never delete, replace, or rewrite the five existing Neon records. Existing records are preserved. They may only be associated if an authoritative pre-existing ledger or persisted source key proves ownership; otherwise they are treated as occupied/unresolved targets and skipped.
5. Commit each resumable batch only after its ledger rows and target IDs are captured. A failed batch is retried from the ledger, not reinserted blindly.
6. Write an execution audit with `run_id`, batch boundaries, inserted/skipped/conflicted counts, and rollback identifiers.

### Current importer assessment and required changes

The existing `scripts/import-aegis-to-neon.mjs:1-90` is not sufficient for this migration:

- It imports only `APPROVED` generic table mappings from `config/aegis-table-mapping.json`; it does not define the `tblHSEINC.Event_Id -> public.incident` or `tblJM.JMId -> public.journey` contracts.
- It maps only approved source columns to target columns and has no source-key/Rowguid ledger output.
- Its `INSERT ... ON CONFLICT DO NOTHING` does not use a source-key uniqueness constraint and does not `RETURNING id`; therefore it cannot safely capture or resume the actual generated UUID.
- Its checkpoint is table-level (`checkpointKey`), not row-level, so a partial batch cannot prove which source row owns a target UUID.
- It selects `DATABASE_URL_UNPOOLED || DATABASE_URL` and can write unless guarded by runtime flags; this plan does not authorize invoking it.

Before any execution, a dedicated parent importer or a reviewed extension must be prepared to:

1. Define explicit source contracts for `dbo.tblHSEINC` and `dbo.tblJM`, including the exact source key and nullable parent Rowguid field.
2. Compute a deterministic fingerprint per source row and validate duplicate/conflicting source keys before opening a write transaction.
3. Persist the source key and fingerprint in an approved target-side ledger or approved source-key columns. If the current schema lacks these, stop and obtain separate approval for a ledger table/columns; do not silently add DDL.
4. Insert only a source row whose `(source_table, source_id)` is absent from the ledger, capture the generated target UUID with `RETURNING id`, and write the ledger entry in the same transaction.
5. On resume, reuse an existing same-fingerprint ledger row; stop on a different fingerprint or an occupied target row without authoritative ownership evidence.
6. Preserve the five existing target rows: because no authoritative source ownership has been found for them, they must be classified `EXISTING_UNMAPPED` and never replaced, merged, or matched by descriptive fields.

The target schema must first be confirmed to support source-key persistence or a separate ledger table. If it does not, execution must stop before DDL and request approval for the ledger storage design; this plan does not authorize schema changes.

## Ledger review gate

Before any attachment operation, verify:

- 19 incident source keys have exactly one authoritative target UUID or an explicit `UNRESOLVED`/`CONFLICT` status.
- 27 journey source keys have exactly one authoritative target UUID or an explicit `UNRESOLVED`/`CONFLICT` status.
- No existing Neon row was replaced.
- Every target UUID belongs to the declared target table.
- Re-running the preparation produces no new inserts and no changed fingerprints.

Any failure blocks attachment linking.

## Separate attachment linking stage

Only after the parent ledger is approved, join the 46 attachment rows by exact source identity:

- `ParentGroup=HSEINCMaster` + `ParentId` -> approved `dbo.tblHSEINC.Event_Id` ledger row.
- `ParentGroup=JM` + `ParentId` -> approved `dbo.tblJM.JMId` ledger row.
- Carry `AttachmentId`, attachment-row `Rowguid`, filename, verified archive key, target table, and approved `target_id` into the attachment crosswalk.

Each attachment link must be rejected if its parent ledger row is missing, conflicted, duplicated, or unresolved. No filename, date, number, title, origin, destination, or purpose similarity may create a link.

The attachment stage must be independently resumable and idempotent on `(source_table, source_id, AttachmentId)`. Existing attachment records must be preserved unless an exact source-key ledger proves that the existing row is the same record; conflicts are reported and skipped.

## Pre- and post-execution checks

Preflight:

- Validate source counts: 19 incidents, 27 journeys, 46 attachment ownership rows.
- Validate required source keys and detect duplicates.
- Validate source fingerprints and available parent Rowguid values.
- Read current target inventory without exposing unrelated personal fields.
- Confirm no target-side ledger conflicts.
- Confirm the verified archive manifest is available; do not re-download or re-hash files in this phase.

Post-parent migration:

- Re-read the ledger and target IDs.
- Assert one-to-one source-key coverage and no target replacement.
- Assert idempotent rerun produces zero duplicate inserts.
- Produce unresolved/conflict lists.

Post-attachment linking:

- Assert each linked attachment has exactly one approved parent target UUID.
- Assert unresolved/conflicted rows remain unlinked.
- Verify attachment record counts and exact source keys using metadata only; content verification remains the previously completed step.
- Produce a final audit report and rollback manifest.

## Rollback

Rollback is by `run_id` and ledger entries only. Before execution, record all newly inserted target IDs and attachment record IDs created by that run. If review fails, delete only records created by that run, in reverse dependency order, after an explicit rollback approval. Never delete or modify pre-existing records, and never use a broad table-wide delete. If the target schema cannot identify run-owned rows safely, stop and require a reviewed rollback design before execution.

## Ledger preparation completed

The approved read-only ledger was created at `reports/amnko-parent-migration-ledger.csv` from the existing local source crosswalk evidence. It contains 29 distinct source parent records covering the 19 incident attachments and 27 journey attachments: 8 `tblHSEINC` parents and 21 `tblJM` parents. Every row has `status=UNRESOLVED` and an empty `target_id` because no authoritative target UUID evidence exists. The five current Neon records are preserved and untouched; no attachments were linked.

CSV validation: header columns are exactly `source_table,source_id,source_rowguid,target_table,target_id,status,evidence`; 29 data rows; 0 confirmed; 29 unresolved; 0 blank source IDs; 0 non-empty target IDs. This is a preparation ledger, not a database migration or attachment-link operation.

## Current decision

**Decision: a safe migration cannot be prepared for execution from the available evidence alone; a specific additional export is required first.**

The source rows are sufficient to identify the exact 8 incident parents and 21 journey parents referenced by the 46 attachments, but not sufficient to avoid duplicating or incorrectly associating the five existing Neon rows. The current generic importer also cannot create the required source-key ledger or capture generated UUIDs safely.

Required additional evidence before execution:

1. A target-side or historical migration export containing one row per source parent with `source_table`, `source_id` (`Event_Id`/`JMId`), source parent `Rowguid` where available, `target_table`, and the actual target UUID; or
2. If no historical crosswalk exists, an approved migration design that adds source-key persistence/ledger storage and a dedicated row-level importer. This requires a separate schema/write approval; it is not covered by the current preparation approval.

Until one of these is supplied and reviewed, the five current rows remain untouched and classified `EXISTING_UNMAPPED`; no parent insertion and no attachment linking may proceed.
