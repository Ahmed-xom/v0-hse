import fs from "node:fs/promises"
import process from "node:process"
import JSZip from "jszip"

const zipPath = process.argv[2] ?? "XOM_Files.zip"
const contractPath = process.argv[3] ?? "config/aegis-core-mapping-contract-draft.json"
const allowed = new Map([
  ["dbo.tblCompany", { key: "Cmp_Id", target: "public.company.id" }],
  ["dbo.tblBusinessUnit", { key: "BU_Id", target: "public.business_unit.id" }],
  ["dbo.tblEmployee", { key: "Emp_Id", target: "public.employee.id" }],
])
const contract = JSON.parse(await fs.readFile(contractPath, "utf8"))
if (contract.approved !== false) throw new Error("Safety gate: draft contract must remain approved:false")
if ((contract.mappings ?? []).some((item) => item.approved !== false || item.quarantineDecision?.writeAllowed !== false)) throw new Error("Safety gate: mapping/write gate changed")
const zip = await JSZip.loadAsync(await fs.readFile(zipPath), { checkCRC32: true })
const normalizeZipPath = (name) => name.replaceAll("\\", "/").replace(/^\.\//, "")
const entriesByNormalizedPath = new Map(Object.keys(zip.files).map((actualName) => [normalizeZipPath(actualName), actualName]))
const names = [...entriesByNormalizedPath.keys()]
const readJsonEntry = async (normalizedName) => {
  const actualName = entriesByNormalizedPath.get(normalizeZipPath(normalizedName))
  if (!actualName) return null
  return JSON.parse(await zip.files[actualName].async("string"))
}
const metadata = {}
for (const file of ["tables.json", "row_counts.json", "primary_keys.json", "foreign_keys.json"]) metadata[file] = await readJsonEntry(file)
const rowsFor = async (source) => {
  const [schema, table] = source.split(".")
  const normalizedName = `table_data/${schema}__${table}.json`
  if (!entriesByNormalizedPath.has(normalizedName)) return { source, status: "blocked", reason: "export data file not found" }
  const parsed = await readJsonEntry(normalizedName)
  const rows = Array.isArray(parsed) ? parsed : [parsed]
  return { source, rows }
}
const result = { zipPath, writeAllowed: false, archiveEntryCount: names.length, metadata: { tables: Array.isArray(metadata["tables.json"]), rowCounts: Array.isArray(metadata["row_counts.json"]), primaryKeys: Array.isArray(metadata["primary_keys.json"]), foreignKeys: Array.isArray(metadata["foreign_keys.json"]) }, tables: [] }
for (const [source, spec] of allowed) {
  const data = await rowsFor(source)
  if (data.status) { result.tables.push(data); continue }
  const seen = new Map(), duplicates = [], nullKeys = [], payrollNulls = [], eligible = []
  for (const row of data.rows) {
    const rawKey = row?.[spec.key]
    const key = rawKey === null || rawKey === undefined || String(rawKey).trim() === "" ? null : String(rawKey)
    if (key === null) nullKeys.push(row)
    else if (seen.has(key)) duplicates.push({ key, firstRow: seen.get(key), duplicateRow: row })
    else seen.set(key, row)
    if (source === "dbo.tblEmployee" && (row?.Emp_Payroll_No === null || row?.Emp_Payroll_No === undefined || String(row.Emp_Payroll_No).trim() === "")) payrollNulls.push(row)
  }
  const quarantined = source === "dbo.tblCompany" || source === "dbo.tblEmployee" ? "identity-conflicts-and-existing-uniqueness-conflicts" : "unresolved-company-or-parent-fk"
  for (const row of data.rows) if (!nullKeys.includes(row) && !duplicates.some((item) => item.duplicateRow === row) && !(source === "dbo.tblEmployee" && payrollNulls.includes(row))) eligible.push(row)
  const [schema, table] = source.split(".")
  const tableMeta = (metadata["tables.json"] ?? []).find((item) => item.schema_name === schema && item.table_name === table)
  const rowCountMeta = (metadata["row_counts.json"] ?? []).find((item) => item.schema_name === schema && item.table_name === table)
  const sourcePrimaryKeys = (metadata["primary_keys.json"] ?? []).filter((item) => item.schema_name === schema && item.table_name === table).sort((a, b) => a.column_order - b.column_order).map((item) => item.column_name)
  const sourceForeignKeys = (metadata["foreign_keys.json"] ?? []).filter((item) => item.source_schema === schema && item.source_table === table)
  result.tables.push({ source, target: spec.target, candidateKey: spec.key, metadata: { tableFound: Boolean(tableMeta), declaredRows: tableMeta?.row_count ?? null, rowCountMatchesData: rowCountMeta?.row_count === data.rows.length, primaryKeys: sourcePrimaryKeys, foreignKeyCount: sourceForeignKeys.length }, sourceRows: data.rows.length, distinctNonNullKeys: seen.size, duplicateKeyCount: duplicates.length, nullKeyCount: nullKeys.length, payrollNullCount: payrollNulls.length, eligibleByLocalKeyChecks: eligible.length, quarantine: { policy: "skip", reason: quarantined }, relationshipChecks: sourceForeignKeys.length ? "source FK evidence loaded; target relationship mapping not proven" : "no source FK evidence", status: "local-preflight-only" })
}
console.log(JSON.stringify(result, null, 2))
