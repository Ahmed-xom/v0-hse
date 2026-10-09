# Core pilot procedure

This procedure is prepared but not executed. It requires an isolated Neon database/branch or an explicitly verified disposable target. `NODE_ENV=staging` alone is not sufficient.

## Read-only preflight

```bash
node scripts/validate-aegis-export.mjs .tmp/Aegis_XOM_Export.zip .tmp/aegis-export-validation.json
node --env-file-if-exists=/vercel/share/.env.project scripts/reconcile-aegis-export.mjs .tmp/Aegis_XOM_Export.zip config/aegis-core-pilot-mapping.json .tmp/aegis-core-reconciliation.json
node --env-file-if-exists=/vercel/share/.env.project scripts/import-aegis-to-neon.mjs --zip .tmp/Aegis_XOM_Export.zip --mapping config/aegis-core-pilot-mapping.json --dry-run --batch-size 100 --report .tmp/aegis-core-dry-run.json
```

Before any write, verify the target connection without printing its URL or password: query `current_database()`, `current_schema()`, `current_user`, and the expected non-production marker supplied by the operator. Refuse the pilot if the target is the production database or if the target identity is ambiguous.

## Pilot gate

Do not use `--write` until all three table records are explicitly changed to `approved: true`, the top-level mapping is approved, and the business decision sheet is resolved. This file intentionally does not perform that change.

## Write strategy

1. Use a disposable Neon branch/database with the required application schema already present.
2. Run company, then business-unit, then employee mappings.
3. Keep insert-only semantics. Existing IDs, unique payroll numbers, emails, and names are conflicts, not updates.
4. Use deterministic source IDs and a persisted checkpoint only after a successful transaction.
5. Quarantine rows failing required-field, lookup, duplicate, or relationship checks.
6. Never query or modify `neon_auth`.

Example command after the gate is satisfied (not to be run now):

```bash
NODE_ENV=staging node --env-file-if-exists=/vercel/share/.env.project scripts/import-aegis-to-neon.mjs \
  --zip .tmp/Aegis_XOM_Export.zip \
  --mapping config/aegis-core-pilot-mapping.json \
  --write --confirm-non-production --batch-size 100 \
  --report .tmp/aegis-core-pilot-write.json \
  --checkpoint .tmp/aegis-core-pilot-checkpoint.json
```

## Post-write verification

- Compare inserted counts against the report, not source row counts.
- Query only target tables for exact inserted deterministic IDs and relationship columns.
- Re-run the read-only reconciliation and verify no existing rows changed.
- Verify all quarantined rows have explicit reasons.
- Run application smoke checks against the isolated target.
- Preserve the report, checkpoint, target identity, and rollback/disposal record.

Rollback is disposal of the isolated target or deletion of only pilot-created deterministic IDs under an separately approved runbook; no production rollback is authorized by this procedure.
