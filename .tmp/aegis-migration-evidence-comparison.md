# AMNKO HSE migration evidence comparison

Status: BLOCKED_MISSING_LOCAL_EVIDENCE

## Current branch
- Branch: `v0/amnko-phase-a-export`
- Starting commit: `9bde40a`

## Proven local facts
- `.tmp/aegis-source-table-inventory.json` is available with 341 source table entries and 139,123 total source rows.
- The source inventory was recovered from historical archive metadata and has `classification: unknown` for every entry.
- `.tmp/Aegis_XOM_Export.zip` is not available in the current working tree.
- No export `table_data` directory or per-table JSON evidence files are available locally; available file count is 0.
- The local export manifest is `.tmp/aegis-local-export-manifest.json` and contains zero table-file entries.
- `139123` is proven locally as the source export total, not as a Neon staging/import count.
- References to `aegis_import.raw_rows`, `aegis_import.source_rows`, and `aegis_import.import_log` are code/report references only; no execution evidence was found.

## Confirmed comparison
- Confirmed Neon-imported tables: none.
- Confirmed missing Neon tables: none.
- Neon row-count mismatches: not computable.
- Proposed mappings and unexecuted scripts were not treated as import evidence.

## Exact missing artifacts
1. The 341 per-table source JSON files, or an equivalent local export manifest containing evidence filename and parsed row count for each table.
2. A per-table Neon staging evidence file containing `source_schema`, `source_table`, `target_schema`, `target_table`, `imported_row_count`, `evidence_file`, and `verification_status`.
3. A completed import/reconciliation audit if any import actually occurred.

## Safety
This phase performed repository and Git inspection only. No PowerShell, SQL Server connection, Neon connection/query, Blob operation, archive extraction, import, production change, environment change, or deployment occurred.

## Next evidence-only step
Attach or add the missing per-table JSON export evidence and the per-table Neon staging inventory as local machine-readable files. Then run a read-only file comparison in v0; no database connection is required for that comparison.
