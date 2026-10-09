# Aegis isolated target assessment

Assessment date: 2026-10-09
Branch: `v0/fix-data-migration-access`

## Result

**No isolated pilot target was positively verified.** The migration write gate remains closed.

## Read-only evidence

The connected Neon integration is project `spring-surf-19710398` (`neon-green-umbrella`) in `aws-us-east-1`, PostgreSQL 17. The project has exactly one visible branch:

- branch: `main`
- branch id: `br-falling-violet-apb5begy`
- primary: `true`
- default: `true`
- state: `ready`
- `init_source`: `parent-data`

No development, staging, disposable, or secondary branch is present. No branch was created.

The project-local Vercel environment uses the Neon host family `c-7.us-east-1.aws.neon.tech`, database `neondb`, with pooled and unpooled endpoints. Credentials and full URLs are intentionally not recorded here. The host/database identity matches the connected Neon project metadata, but this does not prove that the database is safe for writes.

The current read-only database identity was previously observed as:

```text
database: neondb
schema: public
user: neondb_owner
PostgreSQL: 17.11
```

`NODE_ENV=staging` is not used as isolation evidence.

## Exact next step

Create a separate development branch from Neon project `spring-surf-19710398`, with a clear name such as `aegis-pilot-20261009`, and give it its own compute endpoint. Do not change the Vercel project's existing `DATABASE_URL` or production environment variables.

After creation, obtain the branch ID and a branch-scoped connection through the Neon integration, then run only this metadata preflight against that branch:

```sql
SELECT current_database() AS database_name,
       current_schema() AS schema_name,
       current_user AS database_user,
       current_setting('server_version') AS server_version;
```

The operator must independently attest that the returned branch is the newly created non-production branch and that application production still points to `main`. Record the branch ID and redacted metadata in the pilot report. Only then may the separate pilot mapping be considered for a later, explicit write approval; this assessment does not approve mappings.

## Prohibited in this step

- No `--write` importer invocation.
- No `CREATE`, `ALTER`, `INSERT`, `UPDATE`, `DELETE`, or `TRUNCATE`.
- No change to `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, or production variables.
- No Better Auth queries or changes.
- No deployment.

## Reversible alternative

If the Neon project owner does not want a persistent development branch, create a disposable branch from `main`, use it only after the same metadata attestation, and delete/dispose of it after the pilot using the Neon project controls. Branch creation/deletion is intentionally not performed by this turn.

## Safety state

- mapping approval: `false`
- writes executed: `false`
- schema changed: `false`
- auth changed: `false`
- production environment changed: `false`
- deployment: `false`

This file contains no connection strings, passwords, tokens, or secrets.
