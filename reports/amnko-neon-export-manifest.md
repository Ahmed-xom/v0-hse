# AMNKO Neon read-only export

Export timestamp: 2026-10-22 (chat execution date)
Evidence source: Neon read-only `neon_run_sql` against project `spring-surf-19710398`, default branch; no writes.

Files:
- `amnko-neon-incident-export.csv` — 4 rows
- `amnko-neon-journey-export.csv` — 1 row
- `amnko-neon-aegis-migration-record-export.csv` — 0 rows

The four incidents and one journey are test/current application records and do not match the AMNKO legacy references or Rowguid values. No target ID was added to the crosswalk. Numeric IDs, titles, and test records were not treated as evidence.
