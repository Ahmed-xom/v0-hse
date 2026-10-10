# Aegis_XOM to Neon Mapping Approval Checklist

Generated: 2026-10-09T10:15:59.833Z

## Safety status

- Mapping file remains unchanged and unapproved.
- No writes, DDL, authentication changes, Better Auth access, or deployment were performed.

## Recommended limited pilot scope

- `dbo.tblCompany` → `public.company`: 1 source row.
- `dbo.tblBusinessUnit` → `public.business_unit`: 7 source rows.
- `dbo.tblEmployee` → `public.employee`: 378 source rows.
- Pilot must remain insert-only, quarantine conflicts, preserve existing rows, and never link Better Auth users.

## Exact read-only validation commands

```bash
node scripts/validate-aegis-export.mjs .tmp/Aegis_XOM_Export.zip .tmp/aegis-export-validation.json
node --env-file-if-exists=/vercel/share/.env.project scripts/reconcile-aegis-export.mjs .tmp/Aegis_XOM_Export.zip config/aegis-table-mapping-proposal.json .tmp/aegis-full-reconciliation.json
node --env-file-if-exists=/vercel/share/.env.project scripts/import-aegis-to-neon.mjs --zip .tmp/Aegis_XOM_Export.zip --mapping config/aegis-table-mapping.json --dry-run --batch-size 100 --report .tmp/aegis-pilot-dry-run.json
node --env-file-if-exists=/vercel/share/.env.project scripts/verify-aegis-import.mjs --zip .tmp/Aegis_XOM_Export.zip --report .tmp/aegis-pilot-dry-run.json
```

## Business decisions requiring explicit input

1. Confirm source-to-Neon company identity and whether the singleton source company may be represented by deterministic id aegis:company:8.
2. Confirm whether BU CId/Client_Id are authoritative company references and how BU_Under_Id hierarchy should be preserved.
3. Confirm employee status-code dictionary, nullable payroll policy, and whether employee imports may create rows without Better Auth links.
4. Confirm explicit timezone policy for SQL Server datetime values and treatment of CreatedBy/UpdatedBy audit identities.
5. Confirm whether unmatched source fields (tax, logo, birth date, department/designation lookups) are quarantined or require a separate staging model.

## Decision records

### dbo.tblCompany → public.company

- Recommended action: **NEEDS_DECISION**
- Source rows: 1; destination rows: 3
- Primary-key strategy: Preserve source Cmp_Id as prefixed text id; verify collision with existing public.company.
- Foreign-key dependencies: None declared; verify source references before pilot.
- Duplicate/conflict policy: REQUIRES_MANUAL_REVIEW; default must remain insert-only and skip conflicts.
- Evidence:
  - HIGH confidence proposal for Companies and business units.
  - Source row count is 1; source PK is Cmp_Id.
  - Destination is an existing application table; no table creation is proposed.
  - Latest read-only review recorded 3 destination rows.
- Required conversions:
  - Cmp_Id → id: numeric to stable text id
  - Cmp_Name → name: nvarchar to text
  - Cmp_Code → code: nvarchar to text
- Risks:
  - Source has one row; image/blob and tax fields have no current destination.
  - Existing company uniqueness constraints must be checked.
- Blocking issues:
  - Existing company name/code uniqueness may conflict.
  - Source company sample values are unavailable in the archive data file.
  - CreatedBy/UpdatedBy cannot be mapped to auth users under this review.
  - No destination fields exist for tax, logo, short-name, or opening-date fields.
- Approval: `NOT APPROVED`

### dbo.tblBusinessUnit → public.business_unit

- Recommended action: **NEEDS_DECISION**
- Source rows: 7; destination rows: 7
- Primary-key strategy: Preserve source BU_Id as prefixed text id; map companyId only after Cmp_Id/CId relationship is confirmed.
- Foreign-key dependencies: None declared; verify source references before pilot.
- Duplicate/conflict policy: REQUIRES_MANUAL_REVIEW; default must remain insert-only and skip conflicts.
- Evidence:
  - MEDIUM confidence proposal for Companies and business units.
  - Source row count is 7; source PK is BU_Id.
  - Destination is an existing application table; no table creation is proposed.
  - Latest read-only review recorded 7 destination rows.
  - Representative source records reviewed: BU_Id 1 / XOM Oman; BU_Id 2 / XOM LLC HO; BU_Id 3 / XOM Drilling System.
- Required conversions:
  - BU_Id → id: numeric to stable text id
  - BU_Name → name: nvarchar to text
  - BU_Desc → description: nvarchar to text
  - BU_Under_Id → parent relationship: requires explicit hierarchy decision
- Risks:
  - BU_Id is numeric and destination companyId is required.
  - Parent hierarchy has no direct destination column.
- Blocking issues:
  - company_id cannot be safely derived from CId/Client_Id without confirming source semantics.
  - Parent BU hierarchy has no destination parent column.
  - Source has semicolon-delimited email values and numeric type/status conventions.
  - Existing destination has exactly seven rows, so identity/name conflicts must be quarantined.
- Approval: `NOT APPROVED`

### dbo.tblEmployee → public.employee

- Recommended action: **NEEDS_DECISION**
- Source rows: 378; destination rows: 369
- Primary-key strategy: Never target neon_auth.user/account/session. Create/update employee records only after email and role matching is approved.
- Foreign-key dependencies: None declared; verify source references before pilot.
- Duplicate/conflict policy: REQUIRES_MANUAL_REVIEW; default must remain insert-only and skip conflicts.
- Evidence:
  - MEDIUM confidence proposal for Employees and user references.
  - Source row count is 378; source PK is Emp_Id.
  - Destination is an existing application table; no table creation is proposed.
  - Latest read-only review recorded 369 destination rows.
- Required conversions:
  - Emp_Id → id: numeric to stable text id
  - Emp_Payroll_No → payrollNo: nvarchar to varchar
  - Emp_Name → name: nvarchar to varchar
  - Emp_EmailId → email: nvarchar to varchar
  - BU_Id → businessUnit: requires BU mapping
  - Emp_Status → status: int status dictionary required
- Risks:
  - 378 rows; email may be null or duplicate.
  - Source employee/user identity is not sufficient to create Better Auth accounts.
- Blocking issues:
  - Source has 378 rows versus 369 destination rows.
  - Live destination payroll_no is NOT NULL while source payroll number is nullable.
  - Source status is numeric and its code dictionary was not established.
  - BU/department/designation are numeric identifiers but destination stores text.
  - Destination employee data is used by application actions; automatic updates could alter operational behavior.
  - No Better Auth users, memberships, or roles may be queried or linked.
- Approval: `NOT APPROVED`

### dbo.tblEmployee → public.training

- Recommended action: **NO_SAFE_DESTINATION**
- Source rows: 378; destination rows: not recorded in current review artifact
- Primary-key strategy: Not a standalone mapping; requires training completion source tables and employee matching.
- Foreign-key dependencies: None declared; verify source references before pilot.
- Duplicate/conflict policy: REQUIRES_MANUAL_REVIEW; default must remain insert-only and skip conflicts.
- Evidence:
  - LOW confidence proposal for Training and training notifications.
  - Source row count is 378; source PK is Emp_Id.
  - Destination is an existing application table; no table creation is proposed.
- Required conversions:
  - Emp_Name → employeeName: nvarchar to text
  - Emp_Payroll_No → employeeCode: nvarchar to text
- Risks:
  - Do not create training rows from employee rows.
- Approval: `NOT APPROVED`

### dbo.AuditCategory → null.null

- Recommended action: **NO_SAFE_DESTINATION**
- Source rows: 11; destination rows: not recorded in current review artifact
- Primary-key strategy: No safe destination until audit taxonomy is mapped to observation_type/inspection_type or master.
- Foreign-key dependencies: None declared; verify source references before pilot.
- Duplicate/conflict policy: REQUIRES_MANUAL_REVIEW; default must remain insert-only and skip conflicts.
- Evidence:
  - LOW confidence proposal for Master/reference data.
  - Source row count is 11; source PK is CategoryType_Id.
  - Destination is an existing application table; no table creation is proposed.
- Required conversions:
- Risks:
  - Category taxonomy differs from current app tables.
- Approval: `NOT APPROVED`

### dbo.AuditSubCategory → null.null

- Recommended action: **NO_SAFE_DESTINATION**
- Source rows: 71; destination rows: not recorded in current review artifact
- Primary-key strategy: No safe destination until parent category and semantics are approved.
- Foreign-key dependencies: None declared; verify source references before pilot.
- Duplicate/conflict policy: REQUIRES_MANUAL_REVIEW; default must remain insert-only and skip conflicts.
- Evidence:
  - LOW confidence proposal for Master/reference data.
  - Source row count is 71; source PK is SubCategoryType_Id.
  - Destination is an existing application table; no table creation is proposed.
- Required conversions:
- Risks:
  - Requires parent category mapping.
- Approval: `NOT APPROVED`

### dbo.tblIncidentType → public.master

- Recommended action: **NO_SAFE_DESTINATION**
- Source rows: 25; destination rows: not recorded in current review artifact
- Primary-key strategy: Use generated stable master ids and type=incident_type; do not reuse source numeric id as primary key without collision check.
- Foreign-key dependencies: None declared; verify source references before pilot.
- Duplicate/conflict policy: REQUIRES_MANUAL_REVIEW; default must remain insert-only and skip conflicts.
- Evidence:
  - MEDIUM confidence proposal for Master/reference data.
  - Source row count is 25; source PK is IncType_Id.
  - Destination is an existing application table; no table creation is proposed.
- Required conversions:
  - IncType_Id → key: numeric to text
  - IncType_Name → value: nvarchar to text
  - IncType_Desc → description: nvarchar to text
- Risks:
  - 25 rows; ForHSE/ForSQ flags have no direct master column.
- Approval: `NOT APPROVED`

### dbo.AuditQuestions → null.null

- Recommended action: **NO_SAFE_DESTINATION**
- Source rows: 3408; destination rows: not recorded in current review artifact
- Primary-key strategy: Requires manual mapping to inspection_type or a new approved detail model.
- Foreign-key dependencies: None declared; verify source references before pilot.
- Duplicate/conflict policy: REQUIRES_MANUAL_REVIEW; default must remain insert-only and skip conflicts.
- Evidence:
  - LOW confidence proposal for Inspections.
  - Source row count is 3408; source PK is Question_Id.
  - Destination is an existing application table; no table creation is proposed.
- Required conversions:
- Risks:
  - 3408 rows; no destination question/checklist model identified in current Drizzle schema.
- Approval: `NOT APPROVED`

### dbo.Inspections → public.inspection_type

- Recommended action: **NO_SAFE_DESTINATION**
- Source rows: 29; destination rows: not recorded in current review artifact
- Primary-key strategy: Preserve source Inspection_Id as prefixed text id after collision check.
- Foreign-key dependencies: None declared; verify source references before pilot.
- Duplicate/conflict policy: REQUIRES_MANUAL_REVIEW; default must remain insert-only and skip conflicts.
- Evidence:
  - MEDIUM confidence proposal for Inspections.
  - Source row count is 29; source PK is Inspection_Id.
  - Destination is an existing application table; no table creation is proposed.
- Required conversions:
  - Inspection_Id → id: bigint to stable text id
  - Inspection_Name → name: nvarchar to varchar
  - Inspection_Desc → description: nvarchar to text
  - Threshold → frequency: not compatible; manual decision required
  - State → isActive: bit to boolean
- Risks:
  - Threshold is not a frequency.
  - Category/subcategory references require separate mapping.
- Approval: `NOT APPROVED`

### dbo.AuditInspectionsHeader → public.inspection

- Recommended action: **NO_SAFE_DESTINATION**
- Source rows: 97; destination rows: not recorded in current review artifact
- Primary-key strategy: Do not import until Emp_Id to approved userId mapping exists.
- Foreign-key dependencies: None declared; verify source references before pilot.
- Duplicate/conflict policy: REQUIRES_MANUAL_REVIEW; default must remain insert-only and skip conflicts.
- Evidence:
  - LOW confidence proposal for Inspections.
  - Source row count is 97; source PK is AssignAudit_Id.
  - Destination is an existing application table; no table creation is proposed.
- Required conversions:
  - AssignAudit_Id → id: bigint to stable text id
  - Emp_Id → userId: numeric employee identity to Better Auth UUID; unresolved
  - AuditCompliance → findings: numeric summary to text or structured value
  - CreatedAt → createdAt: datetime to timestamp
- Risks:
  - Required inspectionTypeId and businessUnitId need validated joins.
- Approval: `NOT APPROVED`

### dbo.InspectionAssignment → null.null

- Recommended action: **NO_SAFE_DESTINATION**
- Source rows: 78; destination rows: not recorded in current review artifact
- Primary-key strategy: Requires manual review; no safe one-table destination.
- Foreign-key dependencies: None declared; verify source references before pilot.
- Duplicate/conflict policy: REQUIRES_MANUAL_REVIEW; default must remain insert-only and skip conflicts.
- Evidence:
  - LOW confidence proposal for Inspections.
  - Source row count is 78; source PK is AssignInspection_Id.
  - Destination is an existing application table; no table creation is proposed.
- Required conversions:
- Risks:
  - 78 rows and multiple business-unit/user foreign keys.
- Approval: `NOT APPROVED`

### dbo.tblCourses → public.training

- Recommended action: **NO_SAFE_DESTINATION**
- Source rows: 111; destination rows: not recorded in current review artifact
- Primary-key strategy: Course catalog cannot map directly to training rows because destination training requires employeeName and employeeCode.
- Foreign-key dependencies: None declared; verify source references before pilot.
- Duplicate/conflict policy: REQUIRES_MANUAL_REVIEW; default must remain insert-only and skip conflicts.
- Evidence:
  - LOW confidence proposal for Training and training notifications.
  - Source row count is 111; source PK is CourseId.
  - Destination is an existing application table; no table creation is proposed.
- Required conversions:
  - CourseId → id: bigint to stable text id
  - CourseTitle → courseName: nvarchar to text
  - Description → result: not semantically compatible
  - RecertificationInterval → expiryDate: interval requires employee completion date
- Risks:
  - 111 course rows; needs separate course destination or approved denormalization.
- Approval: `NOT APPROVED`

### dbo.tblJMVehicleDetail → public.vehicle

- Recommended action: **NO_SAFE_DESTINATION**
- Source rows: 54; destination rows: not recorded in current review artifact
- Primary-key strategy: Destination vehicle id is generated identity; match by normalized plate_no, never source numeric id alone.
- Foreign-key dependencies: None declared; verify source references before pilot.
- Duplicate/conflict policy: REQUIRES_MANUAL_REVIEW; default must remain insert-only and skip conflicts.
- Evidence:
  - MEDIUM confidence proposal for Journeys and vehicles.
  - Source row count is 54; source PK is VDId.
  - Destination is an existing application table; no table creation is proposed.
- Required conversions:
  - VehicleRegistrationNo → plate_no: nvarchar to text
  - AllowableLoad → allowable_load: nvarchar to text
  - KMReading → km_reading: nvarchar to text
  - Description → description: nvarchar to text
- Risks:
  - Vehicle table name/row count must be confirmed from source catalog; duplicate plates need review.
- Approval: `NOT APPROVED`

### dbo.ActionItems → null.null

- Recommended action: **NO_SAFE_DESTINATION**
- Source rows: 669; destination rows: not recorded in current review artifact
- Primary-key strategy: Requires manual review; likely action-item/audit history and no direct destination table.
- Foreign-key dependencies: None declared; verify source references before pilot.
- Duplicate/conflict policy: REQUIRES_MANUAL_REVIEW; default must remain insert-only and skip conflicts.
- Evidence:
  - LOW confidence proposal for Other relevant HSE modules.
  - Source row count is 669; source PK is ActionItemId.
  - Destination is an existing application table; no table creation is proposed.
- Required conversions:
- Risks:
  - 669 rows; depends on audits, employees, priorities, statuses and parent objects.
- Approval: `NOT APPROVED`

### dbo.ActionItems_AuditTrail → null.null

- Recommended action: **NO_SAFE_DESTINATION**
- Source rows: 1109; destination rows: not recorded in current review artifact
- Primary-key strategy: Legacy/audit data; retain as archive until audit destination is approved.
- Foreign-key dependencies: None declared; verify source references before pilot.
- Duplicate/conflict policy: REQUIRES_MANUAL_REVIEW; default must remain insert-only and skip conflicts.
- Evidence:
  - LOW confidence proposal for Other relevant HSE modules.
  - Source row count is 1109; source PK is none.
  - Destination is an existing application table; no table creation is proposed.
- Required conversions:
- Risks:
  - 1109 rows; no safe destination in current schema.
- Approval: `NOT APPROVED`

