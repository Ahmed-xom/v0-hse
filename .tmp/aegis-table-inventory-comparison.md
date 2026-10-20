# Aegis table inventory comparison

Status: BLOCKED_MISSING_STAGING_INVENTORY

## Recovered
- Source inventory: `.tmp/aegis-source-table-inventory.json`
- Entries: 341
- Fields: `schema_name`, `table_name`, `row_count`
- `classification`: `unknown` because no recovered artifact states it per table.
- Provenance: historical Git revision `bb95a79^`, archive metadata read in memory without extraction.

## Not recovered
- Per-table Neon staging/import inventory with target schema/table, imported row count, and source mapping.

## Comparison
- Confirmed missing tables: none.
- Unverified source tables: 341.
- Count mismatches: none reported because the staging side is absent.
- Proposed mappings remain unapproved and were not used as confirmed imports.

## Safety
No SQL Server or Neon connection, query, import, write, Blob operation, archive extraction, environment change, or Production deployment occurred.

## Next step
Attach the machine-readable Neon staging inventory, then rerun this comparison read-only through v0.
