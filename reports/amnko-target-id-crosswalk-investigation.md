# AMNKO target-ID crosswalk investigation

## Scope and safety

Read-only local inspection on branch `v0/amnko-phase-a-export` at the current working tree. No Neon/SQL connection, Blob operation, environment change, UI change, database write, commit, push, or deploy was performed. The 46 attachment files were not re-read or downloaded.

## Files and code inspected

- `scripts/import-aegis-to-neon.mjs:11-28,42-52` — generic import runner. It loads approved mappings and source JSON paths, then inserts the approved source columns into the configured target table. It does not contain special handling for `Event_Id`, `JMId`, `Rowguid`, or `Event_Number`, and it does not write an old-to-new ID ledger. Its target IDs would only come from the mapping file/source-column mapping; no incident/journey ID-generation or capture path is present.
- `config/aegis-crosswalk-runtime.json` — review-only runtime configuration. It explicitly requires new IDs to be explicit (`rules.newIdsMustBeExplicit: true`, `rules.oldIdsAreReferenceOnly: true`) and requires external evidence for old ID/Rowguid to new ID mappings. Its listed approved target tables are company/business-unit/employee only; it contains no `tblHSEINC`/`tblJM` to `public.incident`/`public.journey` mapping.
- `reports/aegis-crosswalk-proposed.csv:1-19` — shows the established crosswalk convention: `Old...`, `New...`, `status`, `evidence_source`, and unresolved fields. This is evidence that unproven new IDs remain blank; it provides no incident or journey target ID.
- `lib/aegis-migration-preview.ts:4-8,15-24` — proposes `tblHSEINC` as `incident (new additive target required)` but reports target row counts as unavailable, eligible/insert/update counts as zero, and relationships as “NOT DETERMINED.” It preserves source fields conceptually but performs no operational insert and does not assign or record target UUIDs.
- `lib/aegis-migration-audit.ts:8-41` — records table/column/duplicate/orphan review issues for an import, but its issue model has source table/details only. It has no source-parent-to-target-row ID resolver or crosswalk writer.
- `lib/legacy-migration-contracts.ts:1-20,119-151` — defines review/read-only migration contracts and requires explicit target IDs; no incident/journey identity conversion exists.
- `lib/amnko-attachment-migration.ts:3-25,44-64` — attachment execution expects a pre-verified `targetId`; `prepareAttachment` rejects missing target ID (`VERIFIED_MAPPING_REQUIRED`) and deterministic Blob paths include that target ID. This is a consumer of a crosswalk, not a producer of one.
- `scripts/export-amnko-parent-crosswalk-readonly.sql:54-59` — exports `AttachmentId, ParentGroup, ParentId, AttachmentName, AttachmentPath, SrNo, Is_Deleted, Rowguid` from `dbo.tblAttachments`. It preserves source attachment identity but does not query or emit a target Neon UUID.
- `reports/amnko-attachment-source-crosswalk.csv` — has the 46 source rows and unresolved target fields; no `TargetId` is proven.
- `reports/amnko-neon-aegis-migration-record-export.csv` — reviewed as the migration-ledger artifact; it has no row-level evidence that maps `Event_Id`/`JMId`/parent Rowguid to a target UUID.
- `reports/amnko-neon-incident-export.csv`, `reports/amnko-neon-journey-export.csv`, and `reports/amnko-required-target-export.csv` — reviewed as target-side evidence artifacts; they do not contain a proven legacy source key/Rowguid to target-ID crosswalk.
- `.tmp/aegis-migration-evidence-comparison.md` — records that local import/staging evidence and per-table reconciliation artifacts were missing; it explicitly says proposed mappings and unexecuted scripts are not import evidence.
- Git history through the current branch — contains the generic import, review, and crosswalk proposal commits, but no commit introducing an operational `tblHSEINC`/`tblJM` to target UUID ledger or target-side legacy-key columns.

## Findings

### How target IDs are created

No local code inspected creates `public.incident.id` or `public.journey.id` from `Event_Id`, `JMId`, `Rowguid`, or `Event_Number`. The generic importer only inserts configured approved columns and does not capture generated IDs into a source-to-target table. The preview layer is explicitly read-only and marks the incident target as a new target requiring review.

The attachment migration requires an already-known `targetId`; it cannot derive one. Therefore the repository contains no documented transformation that can recover the actual target UUIDs from the source keys.

### Whether target IDs can be recovered from saved target fields

No. The reviewed local target exports and migration reports do not show target rows carrying `Event_Id`, `JMId`, `Event_Number`, or a parent Rowguid field that could serve as a deterministic reverse lookup. The migration ledger artifact does not supply row-level mappings. Numeric equality, incident-number similarity, names, counts, or test records are not sufficient evidence and were not used.

## Determination

- Proven `public.incident.id` mappings: **0**
- Proven `public.journey.id` mappings: **0**
- Ambiguous mappings accepted: **0**
- Unresolved target IDs: **46**

The specific missing evidence is an authoritative row-level ledger or target export containing, for each source parent, the source entity and key (`dbo.tblHSEINC.Event_Id` or `dbo.tblJM.JMId`), preferably the parent source `Rowguid`, and the actual `public.incident.id` or `public.journey.id`. The current importer and reports do not create or preserve that relationship. No UUIDs were invented and no speculative map was created.

## Safe read-only matching preparation

### Target fields actually present in the project schema

`lib/db/schema.ts:272-307` defines `journey` with `id`, user/trip attributes, dates, status, notes, and attachment URL/name fields. It has no `JMId`, `Event_Id`, `Event_Number`, `Rowguid`, legacy ID, or source-key column.

`lib/db/schema.ts:311-347` defines `incident` with `id`, `referenceNo`, title, category/type, severity/status, date, location, reporter fields, narrative fields, and attachment-name/path fields. It has no `Event_Id`, `Event_Number`, `Rowguid`, legacy ID, or source-key column. `referenceNo` is an application reference string, not a proven legacy `Event_Number` mapping.

The only generic source-shaped storage visible in the schema is `excel_data.data` (`lib/db/schema.ts:111-121`), a JSONB import area. No code reviewed establishes that it contains the target incident/journey rows or a source-to-target ID ledger.

### Authorized minimum read set

The eventual database read should be performed only through the existing authorized server-side database access path and an authenticated/admin-controlled read route or operator tool. It must use parameterized SQL, return no credentials/session data, and select only the columns below. It must not expose personal fields such as reporter emails, user emails, driver names, or narrative text.

For incidents, the minimum safe projection is:

```sql
SELECT id, reference_no, date
FROM public.incident
ORDER BY id;
```

For journeys, the minimum safe projection is:

```sql
SELECT id, departure_date, origin, destination, purpose
FROM public.journey
ORDER BY id;
```

These projections are useful for inventory and audit, but they cannot prove a match by themselves because the schema has no stored legacy key. Do not use `title`, `origin`, `destination`, `purpose`, dates, or numeric/string similarity as a sole match key.

If a schema inspection is separately authorized and required before the reads, the safe metadata query is:

```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('incident', 'journey')
ORDER BY table_name, ordinal_position;
```

This metadata query is read-only and contains no row data. It should be run only to verify that the selected columns exist; it is not a source crosswalk.

### Required evidence to complete matching

The following must be supplied or discovered in an authoritative target-side export before any attachment is linked:

1. A row-level ledger with `source_entity` (`tblHSEINC` or `tblJM`), `source_key` (`Event_Id` or `JMId`), optionally the parent source `Rowguid`, `target_table`, and the actual target `id`.
2. Alternatively, target rows containing a persisted legacy key/Rowguid column or a documented `excel_data` JSONB contract that stores the same source key alongside the target ID.
3. Evidence that the ledger was produced by the migration/import that created the current records, not a manually inferred spreadsheet.

Until that evidence exists, all 46 attachment rows remain `UNRESOLVED`. The two SELECTs above can safely inventory candidate target IDs, but cannot safely convert source keys into target IDs.

## Verified staging read (2026-10-24)

The requested branch was verified before querying:

- Neon project: `spring-surf-19710398`
- Branch name: `aegis-pilot-20261009`
- Branch ID: `br-wispy-hill-apxr32tq`
- State: `ready`
- No writes were issued.

Read-only results using only the requested target fields:

- `public.incident`: 4 rows returned, each with `id`, `reference_no`, and `date`.
- `public.journey`: 1 row returned, with `id`, `departure_date`, `origin`, `destination`, and `purpose`.
- `public.aegis_migration_record`: 0 rows returned for `source_table`, `source_key`, `target_table`, `target_id`, and `comparison_status`.

The live schema inventory contains no `public.excel_data` table. Therefore no `excel_data.data` evidence was assumed or queried. The available `aegis_import.source_rows` JSONB table is not treated as a crosswalk because no verified contract was supplied that it stores the target row ID alongside the source key.

The four incident rows and one journey row are candidate target inventory only. Their IDs cannot be assigned to any of the 46 attachments: the rows expose no `Event_Id`, `JMId`, source Rowguid, legacy key, or migration record. Dates, reference numbers, origin/destination, and purpose were not used as matching evidence. Confirmed matches remain **0/46**; all **46/46** remain `UNRESOLVED`.

To complete matching safely, provide a target-side row-level ledger or persisted target fields containing: `source_entity`, `source_key` (`Event_Id` or `JMId`), optional parent source `Rowguid`, `target_table`, and the actual target `id`. A migration export containing those fields is sufficient; a list of current target IDs alone is not.
