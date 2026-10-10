# Aegis_XOM Core Mapping Review

**Scope:** read-only validation of `dbo.tblCompany`, `dbo.tblBusinessUnit`, and `dbo.tblEmployee` against Neon `public.company`, `public.business_unit`, and `public.employee`.

**Status:** all mappings remain `approved: false`.

## Safety boundary

- No `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `CREATE`, `ALTER`, `DROP`, import, auth change, schema change, or deploy was executed.
- Neon inspection used read-only `information_schema`, `pg_indexes`, constraints, and `count(*)` queries.
- No Better Auth users, sessions, accounts, memberships, organizations, or roles were queried, matched, created, updated, or linked.
- The export ZIP was read with CRC validation. Its manifest reports 341 tables and 139,123 rows.

## Row counts and source facts

| Source | Destination | Source rows | Destination rows | Source PK | Destination PK |
|---|---|---:|---:|---|---|
| `dbo.tblCompany` | `public.company` | 1 | 3 | `Cmp_Id` | `id` |
| `dbo.tblBusinessUnit` | `public.business_unit` | 7 | 7 | `BU_Id` | `id` |
| `dbo.tblEmployee` | `public.employee` | 378 | 369 | `Emp_Id` | `id` |

The `tblCompany` data file exists in the ZIP but contained no readable representative records during this inspection. No company name/code/value is inferred from it. `tblBusinessUnit` samples included `XOM Oman`, `XOM LLC HO`, and `XOM Drilling System`. Employee samples included payroll values `1224`, `i`, and `2ejd`; these are evidence that source payroll values are not uniformly numeric.

## Live Neon destination shape

### `public.company`

| Column | Type | Nullable | Default / constraint |
|---|---|---|---|
| `id` | text | no | primary key |
| `name` | text | no | unique |
| `code` | text | yes | unique |
| `status` | text | no | `Active` |
| `created_at` | timestamptz | no | `now()` |
| `updated_at` | timestamptz | no | `now()` |

### `public.business_unit`

| Column | Type | Nullable | Default / constraint |
|---|---|---|---|
| `id` | text | no | primary key |
| `company_id` | text | no | unique composite with `name` |
| `name` | varchar | no | unique composite with `company_id` |
| `code` | varchar | yes | — |
| `description` | text | yes | — |
| `manager` | varchar | yes | — |
| `email` | varchar | yes | — |
| `type` | varchar | no | `Business Unit` |
| `status` | varchar | no | `Active` |
| `created_at` | timestamptz | no | `now()` |
| `updated_at` | timestamptz | no | `now()` |

### `public.employee`

The live database reports `id`, `payroll_no`, and `name` as non-null; `email` is nullable. Unique indexes exist on `id`, `payroll_no`, and `email`. The Drizzle schema additionally defines `designation`, `businessUnit`, `status`, `department`, `manager`, `createdAt`, and `updatedAt`. No foreign key relationship from employee to Better Auth was used in this review.

## 1. `tblCompany` → `company`

### Explicit mapping

| Source column | Destination | Transformation | Status |
|---|---|---|---|
| `Cmp_Id` numeric PK | `id` text | deterministic text such as `aegis:company:<id>`; preserve original in audit | Review |
| `Cmp_Name` nvarchar | `name` text | trim Unicode text | Review |
| `Cmp_Code` nvarchar nullable | `code` text nullable | trim; empty string to null | Review |
| `CreatedAt` datetime | `created_at` timestamptz | explicit timezone policy required | Review |
| `UpdatedAt` datetime nullable | `updated_at` timestamptz | fallback to `CreatedAt` or default only by policy | Review |
| `Cmp_Short_Name` | — | no destination field | Unmapped |
| `TANNo`, `VATNo` | — | no destination fields | Unmapped |
| `Cmp_Logo_File`, `Cmp_Logo` | — | separate asset policy required | Blocked |
| `Book_Op_Date` | — | no destination field | Unmapped |
| `CreatedBy`, `UpdatedBy` | — | cannot map to auth identities | Blocked |
| `Rowguid` | — | audit/staging only unless approved | Review |

### Risks and decisions

- Existing `name` and `code` uniqueness can reject inserts even when the source ID is new.
- The source row cannot be validated against actual values because the export data file had no readable records.
- `CreatedBy` and `UpdatedBy` must not be guessed or linked to auth users.
- Company must be imported before business units, but only after the source company value is re-exported or otherwise made available for review.

## 2. `tblBusinessUnit` → `business_unit`

### Explicit mapping

| Source column | Destination | Transformation | Status |
|---|---|---|---|
| `BU_Id` numeric PK | `id` text | deterministic text such as `aegis:business-unit:<id>` | Review |
| `BU_Name` nvarchar | `name` varchar | trim Unicode text | Review |
| `BU_Desc` nvarchar | `description` text | empty string to null | Review |
| `BU_EmailId` nvarchar | `email` varchar | validate/split semicolon-delimited addresses; policy required | Review |
| `BU_TypeName` nvarchar | `type` varchar | trim; default only when empty | Review |
| `Is_Deleted` int | `status` varchar | `0 → Active`, `1 → Inactive` only after confirmation | Review |
| `CreatedAt` | `created_at` | SQL Server datetime to timestamptz | Review |
| `UpdatedAt` nullable | `updated_at` | timezone and null fallback policy | Review |
| `BU_Under_Id` | — | parent hierarchy has no destination column | Blocked |
| `BU_Type` | — | numeric lookup not retained | Review |
| `CId` / `Client_Id` | `company_id` | only after source semantics are confirmed | Blocked |
| audit user IDs | — | no auth mapping | Blocked |
| `DeletedAt`, `DeletedBy` | — | no destination deletion/audit fields | Review/Blocked |
| `Rowguid`, `EqpCId` | — | audit or unmapped | Review/Unmapped |

### Risks and decisions

- Current destination also has seven rows, so equal counts do not prove identity or equivalence.
- `company_id` is required and cannot safely be inferred from `CId` or `Client_Id` without source semantics.
- `BU_Under_Id` cannot be preserved in the current destination schema.
- The source contains multi-address strings such as `mnessal@xomoman.com;hfarsi@xomoman.com;...`, while destination has one varchar field.
- Existing `(company_id, name)` uniqueness must be checked before any insert.

## 3. `tblEmployee` → `employee`

### Explicit mapping

| Source column | Destination | Transformation | Status |
|---|---|---|---|
| `Emp_Id` numeric PK | `id` text | deterministic text such as `aegis:employee:<id>` | Review |
| `Emp_Payroll_No` nullable nvarchar | `payroll_no` text | trim; current live destination is non-null | Blocked |
| `Emp_Name` nvarchar | `name` text | trim Unicode text | Review |
| `Emp_EmailId` nullable nvarchar | `email` text nullable | trim/lowercase for comparison only; unique check | Review |
| `Emp_Desig_Id` | `designation` | lookup resolution required | Review |
| `BU_Id` | `businessUnit` | approved BU mapping required; destination is text | Review |
| `Emp_Dept_Id` | `department` | lookup resolution required | Review |
| `Emp_Status` int | `status` | source code dictionary required; no assumption about `0` | Blocked |
| `Emp_First_Name`, `Emp_Middle_Name`, `Emp_Last_Name` | — | matching/audit evidence only | Review |
| `Emp_Gender`, `Emp_Join_Date`, `Emp_Birth_Date`, `Loc_Id`, `JobPositionId` | — | no destination fields; birth date needs sensitive-data policy | Unmapped/Blocked |
| `CreatedAt`, `UpdatedAt` | `createdAt`, `updatedAt` | datetime conversion and null fallback | Review |
| `Is_Deleted` | `status` | precedence with `Emp_Status` required | Blocked |
| audit user IDs, `Rowguid` | — | no auth mapping; audit-only | Blocked/Review |

### Matching policy

1. Compare exact normalized non-empty payroll number only when unique in both source and destination.
2. Compare exact normalized lowercase email only when unique; this is comparison evidence only.
3. Use name plus payroll/email as manual review evidence, never as an automatic match.
4. Do not query or link `neon_auth.user`, `company_membership`, organizations, or roles.

### Risks and decisions

- Source has 378 rows and destination has 369.
- Current live `payroll_no` is non-null while source payroll is nullable.
- Source status is numeric and its code dictionary is not established.
- Source department/designation/business-unit values are numeric IDs while destination stores text.
- Existing employee rows are application data and must not be updated by migration.

## Blocking issues

1. All three mappings remain unapproved.
2. Source company representative data is unavailable in the export ZIP.
3. Company identity and business-unit `company_id` semantics are unresolved.
4. Employee nullable payroll values conflict with the live non-null destination column.
5. Employee and business-unit status code dictionaries are unresolved.
6. Parent business-unit hierarchy is not representable in the current destination.
7. Several source audit, logo, tax, HR, and lookup fields have no destination.
8. Existing unique keys and application-owned rows require quarantine rather than updates.

## Safe import order

```text
company → business_unit → employee
```

This is only a proposed dependency order. It is not approval to write.

## Insert-only conflict policy

- Never update, delete, truncate, replace, or overwrite an existing destination row.
- Use deterministic namespaced source IDs so source IDs cannot collide accidentally with application IDs.
- Before insertion, reject/quarantine any source row whose ID, unique name/code, payroll number, email, required field, or approved foreign-key mapping conflicts.
- Treat ambiguous matches as `REVIEW`, not as matches.
- Record every skipped/quarantined row with source table, source key, reason, and source row hash.
- Authentication records and memberships remain completely outside the import.

## Later dry-run commands (not executed)

```bash
node --env-file-if-exists=/vercel/share/.env.project \
  scripts/import-aegis-to-neon.mjs \
  --zip .tmp/Aegis_XOM_Export.zip \
  --mapping config/aegis-core-mapping-review.json \
  --dry-run \
  --report .tmp/aegis-core-dry-run.json

node --env-file-if-exists=/vercel/share/.env.project \
  scripts/verify-aegis-import.mjs \
  --zip .tmp/Aegis_XOM_Export.zip \
  --report .tmp/aegis-core-dry-run.json
```

These commands are intentionally dry-run/read-only. No write command was run in this review.
