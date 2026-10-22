# AMNKO HSE parent crosswalk status

Verified mappings: 0/29 parents.
Safely linkable attachments: 0/46.

The read-only Neon export contains four current incident rows, one current journey row, and zero `aegis_migration_record` rows. The incident rows are test/current records (`INC-20260912-0001` through `INC-20260913-0003`) and the journey row is a current test/application journey; none has an AMNKO legacy key or Rowguid. All attachment fields in these rows are NULL.

No `TargetId` was populated in `reports/amnko-required-target-export.csv` or `reports/amnko-attachment-crosswalk.csv` because no row-level legacy-to-target relationship was proven. The exact missing evidence is a target-side record carrying the AMNKO `LegacyParentId`/`LegacyRowguid` (or an approved migration record explicitly linking those values) to `public.incident.id` or `public.journey.id`.

No attachment upload, storage/database write, schema change, deployment, commit, push, or archive rescan was performed. The separate multi-attachment record design remains unapproved and unimplemented.
