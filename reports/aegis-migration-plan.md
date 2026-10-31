# Aegis_XOM → AMNKO HSE migration plan

## Execution state
Read-only audit and documentation only. No database writes were performed.

## Confirmed blockers
1. No Staging-specific snapshot/restore evidence. The listed manual snapshot belongs to main (2026-10-21).
2. Staging migration tables are empty: import 0, mapping 0, issue 0, record 0.
3. Source rows (139,123 across 269 source tables) are present on main, not Staging.
4. No approved mapping contract is evidenced.
5. Known company/business-unit/employee/designation ambiguities remain.

## Safe next sequence
1. Recover original export archive and its exact per-table manifest in a non-production workspace.
2. Generate exact per-table source counts, PK/FK definitions, and column metadata.
3. Extract Staging schema metadata and compare with source manifest.
4. Produce proposed mappings with evidence, confidence, and explicit unresolved rows.
5. Obtain Staging-only restore point and verify restore on a disposable branch.
6. Make source archive available to Staging using an explicitly approved isolated transfer route.
7. Approve mappings and write scope per table.
8. Run dry-run and validate constraints.
9. Execute approved insert-only batches on Staging with audit and quarantine.
10. Reconcile exact per-table counts, keys, FKs, and hashes.

## Hard stop
Do not run DDL/DML, copy source_rows from main, restore snapshots, or change main/production configuration until the required approvals and backup/restore gates are evidenced.
