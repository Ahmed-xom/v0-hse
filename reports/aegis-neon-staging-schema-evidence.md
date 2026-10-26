# Neon staging schema evidence

## Scope and safety

- Project: `spring-surf-19710398`
- Branch: `aegis-pilot-20261009` (`br-wispy-hill-apxr32tq`)
- Branch confirmed `primary: false`, `default: false`, `protected: false`, state `ready`.
- Queries were read-only metadata queries against `neondb` on this branch.
- No row values, employee names, emails, or other personal data were selected.

## Metadata collected

The schema query collected every non-system table's schema/table name, estimated PostgreSQL row count (`pg_class.reltuples`), column names and `format_type` data types, nullability/ordinal position, and PostgreSQL primary/foreign/unique/check constraint definitions. `reltuples` values are estimates and are not treated as exact import verification.

Observed target structures relevant to prior proposals include the `neon_auth` schema and application tables in `public`. The catalog specifically showed:

| Target evidence | Observed metadata |
|---|---|
| `neon_auth.employee` | `id:uuid`, `user_id:uuid`, `payroll_no:text`, `designation:text`, `business_unit:text`, `created_at:timestamptz`, `updated_at:timestamptz`; PK `id`; unique `payroll_no` and `user_id`; FK `user_id → neon_auth.user(id)`. Estimated rows unavailable (`-1`). |
| `neon_auth.account` | `id:uuid`, provider/account/user linkage and token fields; PK `id`; FK `userId → neon_auth.user(id)`. This is auth data, not a legacy source-table target. |
| `public.company`, `public.business_unit`, `public.employee` | Present in the staging catalog used for the existing proposals. Their prior mapping/count evidence remains the basis for the three unapproved proposals; this inspection does not approve them. |

## Mapping result

For the 338 previously unresolved source tables, **0 were resolved by new schema evidence** and **0 were approved**. No source table was auto-mapped based only on a similar name, target-table presence, or approximate shape.

The three existing, unapproved proposals remain unchanged:

- `dbo.tblCompany → public.company`: source 1, staging 3.
- `dbo.tblBusinessUnit → public.business_unit`: source 7, staging 7.
- `dbo.tblEmployee → public.employee`: source 378, staging 369.

These are proposals supported by prior mapping artifacts and limited count checks, not approvals.

## Exact blockers for the 338

The live target catalog alone does not establish source-to-target identity. Missing evidence:

1. A reviewed mapping manifest for every source table naming its target schema/table.
2. Source/target key correspondence, including documented transformations where names/types differ.
3. Target column-level metadata for each proposed counterpart plus a decision for incompatible/absent columns.
4. A non-PII record-level comparison method, such as hashed primary-key sets or stable-key/count comparisons.

Until these artifacts exist, catalog presence and aggregate counts are insufficient to resolve the 338 mappings.

## Limitations

The inspection used PostgreSQL catalog metadata and estimated `pg_class.reltuples`; it did not run exact `COUNT(*)` queries or retrieve table rows. This is schema evidence, not proof of import success.
