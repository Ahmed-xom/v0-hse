# Historical Aegis export validation

- Git blob: `d0958240c73b1a4fed16ca186b58108c4518ec1a:.tmp/Aegis_XOM_Export.zip`
- Blob size: 4,918,503 bytes
- ZIP entries: 350; table JSON files: 341; metadata files: 8
- ZIP integrity: PASS

## Reconciliation
- Source inventory tables: 341
- Source tables missing from archive: 0
- Extra archive tables: 0
- Duplicate mappings: 0
- Per-table declared vs parsed row-count mismatches: 0
- Invalid/non-JSON table entries: 72 empty byte files

## Row-count validation
- Manifest/row-count declared sum: 139,093
- Parsed JSON row-count sum: 139,093 (empty files excluded)
- Documented source total: 139,123
- Discrepancy: **30 rows**
- Therefore the per-table export does **not** reconcile to the documented total; no adjustment was inferred.

## Empty-file ambiguity
The 72 tables declared with zero rows are represented by zero-byte ZIP entries, not JSON `[]`. They are reported as `empty_file_declared_zero_rows` and `json_not_parseable_empty_bytes`, rather than being called valid JSON. Their zero row count is taken only from the export manifest/row_counts metadata, not guessed from the empty bytes.

## Outputs
- `reports/aegis-historical-export-manifest.json` — 341 per-table records with source table, ZIP entry, declared/parsed counts, SHA-256 match, and validation status.
- `reports/aegis-historical-export-validation.md` — this validation summary.

The ZIP was read from the Git object database in memory only. It was not restored or extracted. No Neon, Blob, SQL Server, Vercel, import, deployment, environment, or commit operation occurred.
