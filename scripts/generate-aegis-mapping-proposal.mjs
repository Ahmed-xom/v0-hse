import fs from 'node:fs/promises'
import JSZipPackage from 'jszip'

const zipPath = process.argv[2] ?? '.tmp/Aegis_XOM_Export.zip'
const proposalPath = process.argv[3] ?? 'config/aegis-table-mapping-proposal.json'
const reportPath = process.argv[4] ?? 'config/aegis-table-mapping-proposal.md'

const zip = await JSZipPackage.loadAsync(await fs.readFile(zipPath), { checkCRC32: true })
const readJson = async (name) => JSON.parse(await zip.file(name).async('string'))
const manifest = await readJson('manifest.json')
const tables = await readJson('tables.json')
const columns = await readJson('columns.json')
const primaryKeys = await readJson('primary_keys.json')
const foreignKeys = await readJson('foreign_keys.json')
const rowCounts = await readJson('row_counts.json')
const files = Object.keys(zip.files)

const normalized = (value) => String(value ?? '').trim().toLowerCase()
const tableName = (table) => table.table_name ?? table.name
const tableSchema = (table) => table.schema_name ?? table.schema ?? 'dbo'
const countFor = (schema, name) => {
  const row = rowCounts.find((item) => normalized(item.table_name ?? item.name) === normalized(name) && normalized(item.schema_name ?? item.schema ?? 'dbo') === normalized(schema))
  return Number(row?.row_count ?? row?.count ?? 0)
}
const columnsFor = (schema, name) => columns.filter((item) => normalized(item.table_name ?? item.name) === normalized(name) && normalized(item.schema_name ?? item.schema ?? 'dbo') === normalized(schema))
const pkFor = (schema, name) => primaryKeys.filter((item) => normalized(item.table_name ?? item.name) === normalized(name) && normalized(item.schema_name ?? item.schema ?? 'dbo') === normalized(schema)).map((item) => item.column_name ?? item.column)
const fkFor = (schema, name) => foreignKeys.filter((item) => normalized(item.table_name ?? item.name) === normalized(name) && normalized(item.schema_name ?? item.schema ?? 'dbo') === normalized(schema))
const source = (name, destination, area, mappings, strategy, order, confidence, review) => ({ sourceSchema: 'dbo', sourceTable: name, destinationSchema: destination ? 'public' : null, destinationTable: destination, businessArea: area, status: destination ? 'PROPOSED_BUSINESS_MAPPING' : 'REQUIRES_MANUAL_REVIEW', approved: false, confidence, sourceRowCount: countFor('dbo', name), sourcePrimaryKey: pkFor('dbo', name), sourceColumns: columnsFor('dbo', name).map((item) => ({ name: item.column_name ?? item.name, type: item.data_type ?? item.type, nullable: item.is_nullable !== false })), destinationColumnMapping: mappings, primaryKeyStrategy: strategy, foreignKeyDependencies: fkFor('dbo', name).map((item) => ({ ...item, note: 'Verify against source FK metadata before approval.' })), importOrder: order, duplicateConflictPolicy: 'REQUIRES_MANUAL_REVIEW; default must remain insert-only and skip conflicts.', dataQualityConcerns: review, manualDecisionRequired: true })

const proposals = [
  source('tblCompany', 'company', 'Companies and business units', [{ source: 'Cmp_Id', target: 'id', conversion: 'numeric to stable text id' }, { source: 'Cmp_Name', target: 'name', conversion: 'nvarchar to text' }, { source: 'Cmp_Code', target: 'code', conversion: 'nvarchar to text' }], 'Preserve source Cmp_Id as prefixed text id; verify collision with existing public.company.', 10, 'HIGH', ['Source has one row; image/blob and tax fields have no current destination.', 'Existing company uniqueness constraints must be checked.']),
  source('tblBusinessUnit', 'business_unit', 'Companies and business units', [{ source: 'BU_Id', target: 'id', conversion: 'numeric to stable text id' }, { source: 'BU_Name', target: 'name', conversion: 'nvarchar to text' }, { source: 'BU_Desc', target: 'description', conversion: 'nvarchar to text' }, { source: 'BU_Under_Id', target: 'parent relationship', conversion: 'requires explicit hierarchy decision' }], 'Preserve source BU_Id as prefixed text id; map companyId only after Cmp_Id/CId relationship is confirmed.', 20, 'MEDIUM', ['BU_Id is numeric and destination companyId is required.', 'Parent hierarchy has no direct destination column.']),
  source('tblEmployee', 'employee', 'Employees and user references', [{ source: 'Emp_Id', target: 'id', conversion: 'numeric to stable text id' }, { source: 'Emp_Payroll_No', target: 'payrollNo', conversion: 'nvarchar to varchar' }, { source: 'Emp_Name', target: 'name', conversion: 'nvarchar to varchar' }, { source: 'Emp_EmailId', target: 'email', conversion: 'nvarchar to varchar' }, { source: 'BU_Id', target: 'businessUnit', conversion: 'requires BU mapping' }, { source: 'Emp_Status', target: 'status', conversion: 'int status dictionary required' }], 'Never target neon_auth.user/account/session. Create/update employee records only after email and role matching is approved.', 30, 'MEDIUM', ['378 rows; email may be null or duplicate.', 'Source employee/user identity is not sufficient to create Better Auth accounts.']),
  source('AuditCategory', null, 'Master/reference data', [], 'No safe destination until audit taxonomy is mapped to observation_type/inspection_type or master.', 40, 'LOW', ['Category taxonomy differs from current app tables.']),
  source('AuditSubCategory', null, 'Master/reference data', [], 'No safe destination until parent category and semantics are approved.', 40, 'LOW', ['Requires parent category mapping.']),
  source('tblIncidentType', 'master', 'Master/reference data', [{ source: 'IncType_Id', target: 'key', conversion: 'numeric to text' }, { source: 'IncType_Name', target: 'value', conversion: 'nvarchar to text' }, { source: 'IncType_Desc', target: 'description', conversion: 'nvarchar to text' }], 'Use generated stable master ids and type=incident_type; do not reuse source numeric id as primary key without collision check.', 40, 'MEDIUM', ['25 rows; ForHSE/ForSQ flags have no direct master column.']),
  source('AuditQuestions', null, 'Inspections', [], 'Requires manual mapping to inspection_type or a new approved detail model.', 50, 'LOW', ['3408 rows; no destination question/checklist model identified in current Drizzle schema.']),
  source('Inspections', 'inspection_type', 'Inspections', [{ source: 'Inspection_Id', target: 'id', conversion: 'bigint to stable text id' }, { source: 'Inspection_Name', target: 'name', conversion: 'nvarchar to varchar' }, { source: 'Inspection_Desc', target: 'description', conversion: 'nvarchar to text' }, { source: 'Threshold', target: 'frequency', conversion: 'not compatible; manual decision required' }, { source: 'State', target: 'isActive', conversion: 'bit to boolean' }], 'Preserve source Inspection_Id as prefixed text id after collision check.', 50, 'MEDIUM', ['Threshold is not a frequency.', 'Category/subcategory references require separate mapping.']),
  source('AuditInspectionsHeader', 'inspection', 'Inspections', [{ source: 'AssignAudit_Id', target: 'id', conversion: 'bigint to stable text id' }, { source: 'Emp_Id', target: 'userId', conversion: 'numeric employee identity to Better Auth UUID; unresolved' }, { source: 'AuditCompliance', target: 'findings', conversion: 'numeric summary to text or structured value' }, { source: 'CreatedAt', target: 'createdAt', conversion: 'datetime to timestamp' }], 'Do not import until Emp_Id to approved userId mapping exists.', 60, 'LOW', ['Required inspectionTypeId and businessUnitId need validated joins.']),
  source('InspectionAssignment', null, 'Inspections', [], 'Requires manual review; no safe one-table destination.', 60, 'LOW', ['78 rows and multiple business-unit/user foreign keys.']),
  source('tblCourses', 'training', 'Training and training notifications', [{ source: 'CourseId', target: 'id', conversion: 'bigint to stable text id' }, { source: 'CourseTitle', target: 'courseName', conversion: 'nvarchar to text' }, { source: 'Description', target: 'result', conversion: 'not semantically compatible' }, { source: 'RecertificationInterval', target: 'expiryDate', conversion: 'interval requires employee completion date' }], 'Course catalog cannot map directly to training rows because destination training requires employeeName and employeeCode.', 80, 'LOW', ['111 course rows; needs separate course destination or approved denormalization.']),
  source('tblEmployee', 'training', 'Training and training notifications', [{ source: 'Emp_Name', target: 'employeeName', conversion: 'nvarchar to text' }, { source: 'Emp_Payroll_No', target: 'employeeCode', conversion: 'nvarchar to text' }], 'Not a standalone mapping; requires training completion source tables and employee matching.', 80, 'LOW', ['Do not create training rows from employee rows.']),
  source('tblJMVehicleDetail', 'vehicle', 'Journeys and vehicles', [{ source: 'VehicleRegistrationNo', target: 'plate_no', conversion: 'nvarchar to text' }, { source: 'AllowableLoad', target: 'allowable_load', conversion: 'nvarchar to text' }, { source: 'KMReading', target: 'km_reading', conversion: 'nvarchar to text' }, { source: 'Description', target: 'description', conversion: 'nvarchar to text' }], 'Destination vehicle id is generated identity; match by normalized plate_no, never source numeric id alone.', 90, 'MEDIUM', ['Vehicle table name/row count must be confirmed from source catalog; duplicate plates need review.']),
  source('ActionItems', null, 'Other relevant HSE modules', [], 'Requires manual review; likely action-item/audit history and no direct destination table.', 100, 'LOW', ['669 rows; depends on audits, employees, priorities, statuses and parent objects.']),
  source('ActionItems_AuditTrail', null, 'Other relevant HSE modules', [], 'Legacy/audit data; retain as archive until audit destination is approved.', 100, 'LOW', ['1109 rows; no safe destination in current schema.']),
]

const sourceNames = new Set(tables.map((table) => `${tableSchema(table)}.${tableName(table)}`))
const mappedNames = new Set(proposals.map((item) => `dbo.${item.sourceTable}`))
const classification = tables.map((table) => {
  const schema = tableSchema(table), name = tableName(table), key = `${schema}.${name}`, rowCount = countFor(schema, name)
  const proposal = proposals.find((item) => item.sourceSchema === schema && item.sourceTable === name)
  const dataFile = files.find((file) => file.replaceAll('\\', '/').endsWith(`table_data/${schema}__${name}.json`))
  if (rowCount === 0) return { sourceSchema: schema, sourceTable: name, rowCount, classification: 'EMPTY_TABLE', reason: 'Source row count is zero.', sourcePrimaryKey: pkFor(schema, name) }
  if (/^(user|login|password|session|role|permission|organization|member|account|token|auth)/i.test(name) || /password|login|credential|security/i.test(name)) return { sourceSchema: schema, sourceTable: name, rowCount, classification: 'SECURITY_OR_AUTH_EXCLUDED', reason: 'Potential identity, credential, permission, or session data; excluded by policy.', sourcePrimaryKey: pkFor(schema, name) }
  if (proposal) return { sourceSchema: schema, sourceTable: name, rowCount, classification: proposal.status, reason: proposal.dataQualityConcerns.join(' '), sourcePrimaryKey: pkFor(schema, name) }
  if (/(history|audittrail|dashboard|router|bulk|xml|import|log|summary|backup)/i.test(name)) return { sourceSchema: schema, sourceTable: name, rowCount, classification: 'LEGACY_OR_AUDIT_DATA', reason: 'Legacy, audit, reporting, import, or infrastructure table without a safe application destination.', sourcePrimaryKey: pkFor(schema, name) }
  return { sourceSchema: schema, sourceTable: name, rowCount, classification: 'NO_SAFE_DESTINATION', reason: 'No explicit approved destination mapping exists.', sourcePrimaryKey: pkFor(schema, name) }
})

const counts = Object.fromEntries(['PROPOSED_BUSINESS_MAPPING','REQUIRES_MANUAL_REVIEW','LEGACY_OR_AUDIT_DATA','EMPTY_TABLE','SECURITY_OR_AUTH_EXCLUDED','NO_SAFE_DESTINATION'].map((key) => [key, classification.filter((item) => item.classification === key).length]))
const sourceCatalog = []
for (const table of tables) {
  const schema = tableSchema(table)
  const name = tableName(table)
  const prefix = `table_data/${schema}__${name}.json`
  const dataFile = files.find((file) => file.replaceAll('\\', '/').endsWith(prefix))
  let representativeValues = []
  if (dataFile) {
    const rawText = await zip.file(dataFile).async('string')
    if (rawText.trim()) {
      const raw = JSON.parse(rawText)
      representativeValues = (Array.isArray(raw) ? raw : [raw]).slice(0, 2)
    }
  }
  sourceCatalog.push({ sourceSchema: schema, sourceTable: name, rowCount: countFor(schema, name), primaryKey: pkFor(schema, name), foreignKeys: fkFor(schema, name), columns: columnsFor(schema, name).map((item) => ({ name: item.column_name ?? item.name, type: item.data_type ?? item.type, nullable: item.is_nullable !== false })), representativeValues })
}

const output = { version: 1, generatedAt: new Date().toISOString(), approved: false, source: { zip: zipPath, database: manifest.database, sourceTables: manifest.tables, sourceRows: manifest.total_rows }, safety: { readOnlyInspectionOnly: true, noImportPerformed: true, noSchemaChanges: true, authTablesExcluded: true, allMappingsApproved: false }, classificationCounts: counts, proposedMappings: proposals, allSourceTables: classification, sourceCatalog }
await fs.writeFile(proposalPath, JSON.stringify(output, null, 2))
const report = `# Aegis_XOM to Neon Mapping Proposal\n\nGenerated: ${output.generatedAt}\n\n**Approval status: NOT APPROVED**\n\nThis report is based on the validated read-only export and current Neon/Drizzle schema. It proposes mappings only; it does not authorize import.\n\n## Source scope\n\n- Database: ${manifest.database}\n- Tables: ${manifest.tables}\n- Rows: ${manifest.total_rows}\n- Columns: 3,665 (from inspection report)\n- ZIP: ${zipPath}\n\n## Classification counts\n\n${Object.entries(counts).map(([key, value]) => `- ${key}: ${value}`).join('\n')}\n\n## Highest-priority review mappings\n\n${proposals.map((item) => `### ${item.sourceTable} → ${item.destinationTable ?? 'No destination'}\n\n- Area: ${item.businessArea}\n- Source rows: ${item.sourceRowCount}\n- Confidence: ${item.confidence}\n- Status: ${item.status}; approved: false\n- PK strategy: ${item.primaryKeyStrategy}\n- Import order: ${item.importOrder}\n- Columns: ${item.destinationColumnMapping.map((mapping) => `${mapping.source} → ${mapping.target} (${mapping.conversion})`).join('; ') || 'No column mapping proposed.'}\n- Concerns: ${item.dataQualityConcerns.join(' ')}\n- Manual decision: required\n`).join('\n')}\n## Safety exclusions\n\nBetter Auth users, accounts, sessions, verification records, organization membership, passwords, auth keys, roles, and permissions are excluded. Existing Neon data, schema, authentication, and production configuration are unchanged.\n\n## Required approval before import\n\nApprove mappings table-by-table only after confirming destination columns, source/destination key strategy, FK order, duplicate policy, null/type conversions, and a dry-run reconciliation report.\n\n## Full classification\n\n| Source table | Rows | Classification |\n|---|---:|---|\n${classification.map((item) => `| ${item.sourceSchema}.${item.sourceTable} | ${item.rowCount} | ${item.classification} |`).join('\n')}\n`
await fs.writeFile(reportPath, report)
console.log(JSON.stringify({ proposalPath, reportPath, counts, proposedMappings: proposals.length }, null, 2))
