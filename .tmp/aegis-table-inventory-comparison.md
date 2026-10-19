# Aegis_XOM → Neon table inventory comparison

## Result

**BLOCKED_MISSING_COMPARISON_INPUTS**

No confirmed missing tables are reported. Determining missing tables requires both complete per-table inventories; the available repository artifacts do not provide them.

## Available source evidence

- Source database: `Aegis_XOM`
- Reported source tables: `341`
- Populated tables: `269`
- Empty tables: `72`
- Reported source rows: `139123`
- Existing aggregate artifact: `.tmp/aegis-readonly-inspection.json`

## Missing artifacts

1. **Source per-table inventory:** a machine-readable list preserving `schema_name`, `table_name`, `row_count`, and `classification` for all source tables.
2. **Imported/staged Neon per-table inventory:** a machine-readable list of imported/staged target tables, including target schema/table and source mapping where applicable.

The mapping proposal and aggregate compatibility report are not substitutes for either inventory. The compatibility report states `341` missing by exact name, but that is not a confirmed migration gap because the migration uses proposed mappings and may intentionally use different target names.

## Safety

This report was generated read-only. SQL Server and Neon were not accessed; Neon, Production, DATABASE_URL, Blob contents, and the 2.18 GB archive were not modified or extracted.

## Next step through v0

Attach or import the two per-table JSON/CSV inventories into the project through the v0 interface. Then run a read-only comparison to produce confirmed missing tables without connecting to SQL Server, writing to Neon, or creating a deployment.
