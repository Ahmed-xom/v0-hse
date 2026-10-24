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
