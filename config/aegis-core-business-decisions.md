# Aegis core pilot decisions

Status: technical review complete; no mapping is approved.

## Decisions still requiring business input

1. **Company identity** — The source has one `Cmp_Id=8`, while Neon already has three companies. Recommended default: preserve the source key as `aegis:company:8` and insert only if name/code do not conflict. Alternative: explicitly designate an existing Neon company as the source company; this would avoid an insert but risks merging distinct entities. **Blocks pilot: yes.**
2. **Business-unit company relationship** — Source `CId` and `Client_Id` are null in the reviewed BU records, so they cannot prove the company relationship. Recommended default: do not import BU rows until a source relationship or explicit company assignment is supplied. Alternative: assign all seven BUs to the approved source company; this changes tenant ownership. **Blocks pilot: yes.**
3. **BU hierarchy** — `BU_Under_Id` expresses parentage, but `public.business_unit` has no parent column. Recommended default: preserve hierarchy in quarantine/audit only, not by dropping it or overloading `company_id`. Alternative: approve a schema change or flatten the hierarchy. **Blocks pilot: yes.**
4. **Employee key and conflicts** — Recommended default: deterministic `aegis:employee:<Emp_Id>` IDs, exact unique payroll/email matching for evidence only, never update existing rows. Alternative: merge by payroll/email, which can alter live employee records. **Blocks pilot: yes.**
5. **Employee payroll nullability** — Source payroll is nullable; live `employee.payroll_no` is required in the actual database review. Recommended default: quarantine rows without a non-empty unique payroll number. Alternative: approve a schema change or a separate staging table. **Blocks pilot: yes.**
6. **Status dictionary** — Source `Emp_Status` is numeric and no authoritative code dictionary was exported. Recommended default: quarantine employees until the code mapping is supplied. Alternative: assume `0=Active`, which risks activating/inactivating incorrectly. **Blocks pilot: yes.**
7. **Time zone and audit identities** — SQL Server datetimes have no proven timezone and `CreatedBy/UpdatedBy` cannot be linked to Better Auth. Recommended default: require an explicit timezone (prefer UTC only if the source is confirmed UTC), preserve audit identities as unmapped metadata, and use source CreatedAt as UpdatedAt fallback. **Blocks pilot: yes for timestamps; no for rows if business accepts fallback.**
8. **Unmapped sensitive/operational fields** — Birth date, tax, logo, department/designation lookups have no safe destination. Recommended default: quarantine or preserve outside the pilot; do not discard silently. Alternative: create a staging model, which is a separate scope. **Blocks pilot: only for rows requiring those fields.**

## Automatically resolved

- No Better Auth table, user, session, account, membership, password, or role is queried or targeted.
- Source IDs are not reused as raw IDs; deterministic prefixed text avoids numeric collisions.
- Matching row counts are not treated as entity equality.
- Existing rows are protected: no updates/deletes; ambiguous matches quarantine.
- Import order is company, then business_unit, then employee.
- Email comparison is trimmed/lowercased for comparison only; no auth linking.
- Empty strings become null only in the transformation layer; no destination row is written without required fields.
- `ON CONFLICT DO NOTHING` is not treated as success; inserted/skipped/conflict outcomes remain separate.

## Next single action

Provide decisions for items 1–7, especially company assignment, BU ownership/hierarchy, payroll policy, status codes, and timezone. Until then the pilot mapping remains unapproved and no write command is safe.
