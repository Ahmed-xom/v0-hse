# AMNKO HSE parent crosswalk status

Verified mappings: 0/29 parents.
Safely linkable attachments: 0/46.

The read-only Neon export contains four current incident rows, one current journey row, and zero `aegis_migration_record` rows. The incident rows are test/current records (`INC-20260912-0001` through `INC-20260913-0003`) and the journey row is a current test/application journey; none has an AMNKO legacy key or Rowguid. All attachment fields in these rows are NULL.

No `TargetId` was populated in `reports/amnko-required-target-export.csv` or `reports/amnko-attachment-crosswalk.csv` because no row-level legacy-to-target relationship was proven. The exact missing evidence is a target-side record carrying the AMNKO `LegacyParentId`/`LegacyRowguid` (or an approved migration record explicitly linking those values) to `public.incident.id` or `public.journey.id`.

## Local recovery findings

The local artifacts and read-only Git history were searched for a prior source-to-target identity map. The only AMNKO-specific artifacts are the attachment manifest/crosswalk, export instructions, Neon read-only exports, and status reports; none contains a target-side row with an AMNKO legacy key or Rowguid. The Neon migration-record export is empty.

The broader staging evidence independently reports `dbo.tblJM` with 92 source rows and `no reliable mapping`, and the migration final-status evidence marks approved/imported as 0. The import scripts are guarded/proposal-oriented and do not provide an execution log or source-to-target ID ledger for `tblHSEINCMaster`, `tblHSEINCMaster2`, or `tblJM`. Git history contains the preparation and review artifacts but no AMNKO import commit or target-ID ledger.

Conclusion: the available evidence proves **not found in available evidence**, not **never imported**. It is not possible to distinguish those states without an authoritative import ledger or target-side export containing the legacy keys/Rowguid values.

Verified mappings remain 0/29 and safely linkable attachments remain 0/46. The four test incidents and one test journey remain excluded.

## Exact next action

Obtain one read-only, authoritative source-to-target import ledger or staging export for `dbo.tblHSEINCMaster`, `dbo.tblHSEINCMaster2`, and `dbo.tblJM` containing `source_table`, legacy primary key, `Rowguid`, `target_table`, actual Neon `target_id`, import status, and evidence row reference. Do not use numeric ID equality, title matching, or test records. Until that artifact exists, leave all parents unresolved and do not upload or link attachments.

No attachment upload, storage/database write, schema change, deployment, commit, push, or archive rescan was performed. The separate multi-attachment record design remains unapproved and unimplemented.
