# Aegis XOM read-only migration inspection

## Scope

Inspection only. No INSERT, UPDATE, DELETE, TRUNCATE, ALTER, authentication change, or public-table migration was executed.

## Export verification

- Archive: `Aegis_XOM_Export-ehS63umUV0Hh535tYJZ7sOkTrauKFS.zip`
- Manifest format: `Aegis_XOM_ReadOnly_Export_v1`
- Source database: `Aegis_XOM`
- Source server recorded by export: `localhost\\SQLEXPRESS`
- Export timestamp: `2026-10-09T09:20:50.3805064Z`
- Source tables in manifest: **341**
- Populated source tables: **269**
- Empty source tables: **72**
- Manifest row count: **139,123**
- ZIP JSON files: **350** = 341 data files + 9 metadata/diagnostic files
- ZIP files were extracted and all 350 JSON files were parseable, including empty files.
- The manifest's `row_counts`, `tables`, `columns`, `primary_keys`, `foreign_keys`, and `indexes` metadata are present and were inspected.

The archive has 9 non-table metadata files, so they must not be treated as application tables. Empty JSON files also remain excluded from any proposed migration.

## Neon staging verification

Read-only Neon inspection of `aegis_import.source_rows` returned:

- Rows: **139,123**
- Distinct source tables: **269**
- All staging source names use the `dbo__` prefix.
- `count(*)` and `count(DISTINCT row_number)` agree for the inspected staging groups.

This matches the manifest totals and the stated completed staging import. No source row was written during this inspection.

## Existing target schema

The connected Neon database currently exposes:

- `public`: application tables plus migration ledger tables
- `aegis_import.source_rows`: read-only staging source rows
- `neon_auth`: Better Auth tables, excluded from migration

The public application schema contains tables such as `company`, `business_unit`, `employee`, `course`, `incident`, `inspection`, `observation`, `meeting`, `moc`, `permit_to_work`, `training`, `vehicle`, and others. The existing migration ledger tables are `public.aegis_migration_import`, `public.aegis_migration_mapping`, `public.aegis_migration_record`, and `public.aegis_migration_issue`.

No existing approved rows were found in `public.aegis_migration_mapping` for this inspection query.

## Mapping result

The existing proposal remains unapproved. Its classification is:

| Classification | Count |
|---|---:|
| Proposed business mapping | 8 |
| Requires manual review | 6 |
| Legacy/audit data | 34 |
| Empty table | 72 |
| Security/auth excluded | 5 |
| No safe destination | 216 |

The 8 proposed business mappings are candidates only, not approvals. Naming similarity alone is not treated as equivalence. Each candidate still requires column-level validation, key collision checks, null/type conversion checks, dependency ordering, and an explicit insert-only policy.

High-risk conflicts identified:

- Source primary keys are commonly numeric or SQL Server identifiers while application IDs are often stable text IDs or UUIDs.
- Existing public tables have different column names and semantics from the SQL Server export; exact-name overlap is not sufficient evidence of equivalence.
- Source audit/history, search/index, email-router, tenant, user-rights, and system tables have no safe direct destination in the application schema.
- Better Auth schemas are excluded and must not receive source users, passwords, sessions, accounts, tokens, or authorization rows.
- Foreign keys and dependency order must be taken from the export metadata rather than inferred from table names.
- Several source fields require explicit conversion decisions (SQL Server numeric/datetime/image/uniqueidentifier to existing PostgreSQL text, timestamp, boolean, array, or JSONB columns).

## Proposed report shape

For every source data table, the approval report must contain:

`source_schema`, `source_table`, `source_row_count`, `source_primary_key`, `source_foreign_keys`, `source_columns`, `proposed_target_table`, `column_mapping`, `mapping_confidence`, `dependency_order`, `conflicts`, `missing_target_columns`, and `approval_status`.

The current proposal JSON contains this shape for candidate mappings. Tables classified as `NO_SAFE_DESTINATION`, `LEGACY_OR_AUDIT_DATA`, `SECURITY_OR_AUTH_EXCLUDED`, or `EMPTY_TABLE` remain blocked and have no migration target.

## Important limitation

This run verified the attached archive and the existing Neon staging totals, but it did not execute a full row-by-row semantic mapping approval. The current repository proposal is not approval evidence. The production migration remains **not performed** and no claim of migrated public data is made.

## Required approval before migration

Approve an explicit mapping manifest, not the whole archive. The approved manifest must specify:

1. Exact source table and target table for each approved table.
2. Exact source-to-target column conversions.
3. Source and target key strategy, including collision behavior.
4. Foreign-key dependency order and handling of unresolved references.
5. Insert-only behavior and duplicate/conflict policy.
6. Treatment of audit, history, binary, search, tenant, and authorization data.
7. Row-count and quarantine acceptance thresholds.
8. A disposable Neon branch or equivalent isolated target for the pilot.

Only after approval should the next step be a dry-run on that isolated target, followed by an explicit write pilot and read-back counts. The pilot must verify inserted, skipped, quarantined, and conflicting row counts per table and leave `public` production tables unchanged until separately approved.

## Current status

**STOPPED AFTER READ-ONLY INSPECTION — AWAITING MAPPING APPROVAL**

No database writes were performed by this inspection.

Generated: 2026-10-10
