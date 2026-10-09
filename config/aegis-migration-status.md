# Aegis_XOM → Neon migration status

Generated after commit `3c0534d`. This document records safe preparation only.

## Safety state

- Mapping approval: **false**.
- Neon writes: **none**.
- DDL/schema changes: **none**.
- Better Auth tables or identities: **not queried or modified**.
- Automatic matching by name, row count, payroll, or email: **disabled**.
- Source IDs remain deterministic `aegis:` IDs in the proposal/staging model.
- Unknown, ambiguous, unresolved, or unrepresentable rows remain quarantined.

## Verified Neon target identity

A read-only metadata query returned:

```text
database: neondb
schema: public
user: neondb_owner
server: PostgreSQL 17.11
```

This does **not** prove that the target is disposable or non-production. No environment label, branch identity, or disposable-target attestation was available. `NODE_ENV=staging` is not accepted as proof. Therefore the write gate remains closed.

## Current mapping state

The 15 proposed mappings remain unapproved. The only mappings eligible for business review are:

1. `dbo.tblCompany → public.company`
2. `dbo.tblBusinessUnit → public.business_unit`
3. `dbo.tblEmployee → public.employee`

The remaining 12 mappings have no safe current destination and remain blocked.

## Only business decisions that block a pilot

1. **Company identity:** confirm whether `aegis:company:8` is a new source identity; never auto-link it to an existing Neon company.
2. **Business-unit ownership:** confirm ownership only if source evidence proves it. Otherwise preserve the seven BUs as source identities with unresolved company ownership.
3. **Hierarchy representation:** approve a staging/reporting representation for `BU_Under_Id`; do not discard it or put it in `company_id`.
4. **Employee required fields:** approve quarantine for null payroll, unknown status, unresolved BU/department/designation, and ambiguous matches.
5. **Datetime/timezone:** provide the source timezone or approve preserving source datetime plus an explicit conversion-required marker.
6. **Unrepresentable business data:** approve quarantine rather than lossy transformation.
7. **Audit identity:** approve retaining source audit IDs as source metadata, never as Better Auth identities.

Technical decisions already established by schema/source evidence are not repeated as blockers.

## Synthetic safety validation completed

`node scripts/test-aegis-migration-safety.mjs` passed with fixtures covering:

- singleton JSON payload handling;
- unapproved mapping write gate;
- `ON CONFLICT DO NOTHING` duplicate prevention;
- transaction rollback path;
- retry/checkpoint code paths;
- production target refusal.

These are static/fixture tests. They do not claim a real Neon write, rollback, or retry occurred.

## Dependency and quarantine report

Generated with:

```bash
node scripts/analyze-aegis-dependencies.mjs \
  config/aegis-table-mapping-proposal.json \
  .tmp/aegis-dependency-quarantine-report.json
```

The proposal currently exposes no machine-readable FK edges for the 15 proposed mappings, so the report records zero resolvable dependency edges and quarantines all 15 mappings pending approval. This is an evidence limitation, not proof that the source has no relationships. Source FK metadata remains authoritative for the eventual staging import and must be attached to the approved mapping before a pilot.

## Next safe step

Create or identify a verified disposable/non-production Neon target, then rerun read-only preflight. No write command should be run until that target identity is independently attested and the seven decisions above are recorded in the pilot mapping.
