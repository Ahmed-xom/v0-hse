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

- Incidents: **19 parent records**, identified by `tblHSEINC.Event_Id`.
- Journeys: **27 parent records**, identified by `tblJM.JMId`.
- Attachments: **46 rows**, owned by `ParentGroup=HSEINCMaster` or `ParentGroup=JM` and `ParentId`.

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

## Current decision

Do not execute yet. The practical next step is to approve preparation of the resumable parent ledger and confirm where the ledger may be stored without altering existing data. After the ledger is generated and reviewed, request a second explicit approval for parent insertion, followed by a separate approval for the 46 exact-key attachment links.
