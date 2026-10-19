import fs from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"
import process from "node:process"
import XLSX from "xlsx"
import pg from "pg"

const { Pool } = pg
const root = path.resolve(process.argv[2] ?? "XOM_Files_Extracted")
const reportPath = path.resolve(process.argv[3] ?? ".tmp/aegis-xom-pilot-verification.json")
const generatedAt = new Date().toISOString()
const sourceRoot = path.join(root, "XOM")
const report = { mode: "read-only-verification", generatedAt, root, writesExecuted: false, schemaChanged: false, sources: {}, conflicts: {}, inspectionRecommendation: null, dryRunPlan: [], errors: [], toolAvailability: { xlsx: true, legacyXls: "xlsx-package" } }

const exists = async (p) => { try { await fs.access(p); return true } catch { return false } }
if (!(await exists(root))) { report.errors.push({ code: "EXTRACTION_MISSING", message: `Extraction directory is unavailable: ${root}` }); await fs.mkdir(path.dirname(reportPath), { recursive: true }); await fs.writeFile(reportPath, JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2)); process.exitCode = 2 }

const sha256 = async (file) => { const h = crypto.createHash("sha256"); h.update(await fs.readFile(file)); return h.digest("hex") }
const files = []
const walk = async (dir) => { for (const entry of await fs.readdir(dir, { withFileTypes: true })) { const p = path.join(dir, entry.name); if (entry.isDirectory()) await walk(p); else files.push(p) } }
await walk(root)
const fileMeta = new Map()
for (const file of files) fileMeta.set(file, { sourceFile: path.relative(root, file), sha256: await sha256(file), bytes: (await fs.stat(file)).size })

const sourceTerms = { Employee: /employee/i, Training: /training/i, Vehicles: /vehicle/i, Observation: /observation/i }
const sourceRows = Object.fromEntries(Object.keys(sourceTerms).map((name) => [name, []]))
const sourceStats = Object.fromEntries(Object.keys(sourceTerms).map((name) => [name, { accepted: 0, rejected: 0, unresolved: 0, exactDuplicates: 0, keySimilarDifferent: 0, records: [] }]))
const keySets = Object.fromEntries(Object.keys(sourceTerms).map((name) => [name, new Map()]))
const rowHashes = Object.fromEntries(Object.keys(sourceTerms).map((name) => [name, new Map()]))
const excelFiles = files.filter((file) => /\.(xlsx|xls)$/i.test(file))
for (const file of excelFiles) {
  let workbook
  try { workbook = XLSX.read(await fs.readFile(file), { type: "buffer", cellDates: false, raw: true }) }
  catch (error) { report.errors.push({ code: "XLS_READ_ERROR", file: path.relative(root, file), message: String(error.message ?? error) }); continue }
  for (const sheetName of workbook.SheetNames) {
    const matched = Object.entries(sourceTerms).find(([, pattern]) => pattern.test(sheetName))
    if (!matched) continue
    const source = matched[0]
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "", raw: true })
    const header = (rows[0] ?? []).map((value) => String(value).trim())
    for (let index = 1; index < rows.length; index++) {
      const values = rows[index] ?? []
      if (!values.some((value) => String(value).trim() !== "")) continue
      const original = Object.fromEntries(header.map((name, column) => [name || `column_${column + 1}`, values[column] ?? ""]))
      const row = { sourceFile: path.relative(root, file), sheet: sheetName, row: index + 1, original, sourceSha256: fileMeta.get(file)?.sha256 }
      sourceRows[source].push(row)
    }
  }
}

const norm = (value) => String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ")
const pick = (row, names) => { const entries = Object.entries(row.original); const hit = entries.find(([name]) => names.some((candidate) => norm(name) === norm(candidate))); return hit?.[1] ?? "" }
const keyFor = (source, row) => {
  if (source === "Employee") return norm(pick(row, ["Payroll No", "Payroll Number", "Employee ID"]))
  if (source === "Training") return [pick(row, ["Employee ID", "Employee Code"]), pick(row, ["Course Title", "Course Name"]), pick(row, ["Completed On", "Completion Date"])].map(norm).join("|")
  if (source === "Vehicles") return [pick(row, ["Vehicle Registration Number", "Registration Number", "VIN", "Vehicle chassis (VIN) number"]), pick(row, ["Vehicle fleet No", "Fleet No"])].map(norm).join("|")
  return [pick(row, ["Date"]), pick(row, ["Observer Payroll", "Observer Employee ID"]), pick(row, ["Description"])].map(norm).join("|")
}
const required = { Employee: [["Payroll No", "Payroll Number", "Employee ID"], ["First Name", "Name"]], Training: [["Employee ID", "Employee Code"], ["Course Title", "Course Name"], ["Completed On", "Completion Date"]], Vehicles: [["Vehicle Registration Number", "Registration Number", "VIN", "Vehicle chassis (VIN) number"], ["Vehicle Type", "Type"]], Observation: [["Date"], ["Description"]] }
for (const [source, rows] of Object.entries(sourceRows)) {
  for (const row of rows) {
    const reasons = []
    for (const candidates of required[source]) if (!String(pick(row, candidates)).trim()) reasons.push(`missing:${candidates.join("|")}`)
    const hash = crypto.createHash("sha256").update(JSON.stringify(row.original)).digest("hex")
    const key = keyFor(source, row)
    const sameHash = rowHashes[source].get(hash) ?? []
    const sameKey = keySets[source].get(key) ?? []
    rowHashes[source].set(hash, [...sameHash, row])
    keySets[source].set(key, [...sameKey, row])
    if (sameHash.length) reasons.push("exact_duplicate")
    else if (sameKey.length && JSON.stringify(sameKey[0].original) !== JSON.stringify(row.original)) reasons.push("same_key_different_record")
    const status = reasons.includes("exact_duplicate") ? "DUPLICATE_SKIP" : reasons.length ? "REVIEW_REQUIRED" : "SAFE_TO_IMPORT"
    sourceStats[source].records.push({ ...row, status, reasons, sourceKey: key, rowSha256: hash })
    sourceStats[source][status === "SAFE_TO_IMPORT" ? "accepted" : status === "DUPLICATE_SKIP" ? "exactDuplicates" : "rejected"]++
    if (reasons.includes("same_key_different_record")) sourceStats[source].keySimilarDifferent++
  }
  sourceStats[source].unresolved = sourceStats[source].records.filter((row) => row.status === "REVIEW_REQUIRED").length
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL })
try {
  const tables = ["employee", "training", "vehicle", "observation", "inspection", "inspection_v2", "business_unit", "company"]
  const schema = {}
  for (const table of tables) {
    const columns = (await pool.query("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position", [table])).rows
    const constraints = (await pool.query("SELECT tc.constraint_name, tc.constraint_type, kcu.column_name FROM information_schema.table_constraints tc LEFT JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema WHERE tc.table_schema='public' AND tc.table_name=$1 ORDER BY tc.constraint_name, kcu.ordinal_position", [table])).rows
    const count = columns.length ? Number((await pool.query(`SELECT count(*)::bigint AS count FROM public."${table}"`)).rows[0].count) : null
    schema[table] = { exists: columns.length > 0, columns, constraints, currentRows: count }
  }
  report.neonReadOnlySchema = schema
} catch (error) { report.errors.push({ code: "NEON_READ_ERROR", message: String(error.message ?? error) }) }
finally { await pool.end() }

report.sources = Object.fromEntries(Object.entries(sourceStats).map(([source, stats]) => [source, { accepted: stats.accepted, rejected: stats.rejected, unresolved: stats.unresolved, exactDuplicates: stats.exactDuplicates, keySimilarDifferent: stats.keySimilarDifferent, records: stats.records }]))
const employee = sourceStats.Employee.records
const emails = new Map(); const payroll = new Map(); const units = new Map()
for (const row of employee) { for (const [label, map, value] of [["payroll", payroll, pick(row, ["Payroll No", "Payroll Number", "Employee ID"])], ["email", emails, pick(row, ["Email", "E-mail"])], ["unit", units, pick(row, ["Business Unit", "Department"])]] ) { const k = norm(value); if (k) map.set(k, [...(map.get(k) ?? []), row]) } }
const conflictReport = (map) => [...map.entries()].filter(([, rows]) => new Set(rows.map((row) => JSON.stringify(row.original))).size > 1).map(([key, rows]) => ({ key, records: rows }))
report.conflicts = { payrollNo: conflictReport(payroll), email: conflictReport(emails), units: conflictReport(units), trainingEmployeeIds: sourceStats.Training.records.filter((row) => !employee.some((candidate) => norm(pick(candidate, ["Payroll No", "Payroll Number", "Employee ID"])) === norm(pick(row, ["Employee ID", "Employee Code"])))).map((row) => ({ sourceFile: row.sourceFile, sheet: row.sheet, row: row.row, employeeId: pick(row, ["Employee ID", "Employee Code"]), status: "MISSING_REFERENCE" })), vehicleKeys: sourceStats.Vehicles.records.filter((row) => !keyFor("Vehicles", row)).map((row) => ({ sourceFile: row.sourceFile, sheet: row.sheet, row: row.row, status: "MISSING_REFERENCE" })), observationUserId: sourceStats.Observation.records.map((row) => ({ sourceFile: row.sourceFile, sheet: row.sheet, row: row.row, observerPayroll: pick(row, ["Observer Payroll", "Observer Employee ID"]), status: employee.some((candidate) => norm(pick(candidate, ["Payroll No", "Payroll Number", "Employee ID"])) === norm(pick(row, ["Observer Payroll", "Observer Employee ID"]))) ? "MATCH_CANDIDATE" : "NO_MATCH" })) }
report.inspectionRecommendation = { recommendation: "REVIEW_REQUIRED: do not select inspection or inspection_v2 automatically", reason: "The source evidence mixes checklist/audit-style fields with observation/action fields; inspection_v2 has richer title/date/location/action/attachment support, but its required fields and user/company relationships need an approved mapping. inspection is smaller and requires userId/type IDs, increasing loss and unresolved-reference risk.", affected: { inspection: ["userId", "inspectionTypeId", "businessUnitId", "findings", "status"], inspection_v2: ["inspection_type", "title", "date", "reference_number", "location", "inspector", "actions", "metrics", "attachments"] } }
report.dryRunPlan = ["Freeze package SHA-256 and mapping version", "Run this verifier and review row-level JSON outputs", "Resolve payroll/email/unit and employee-reference conflicts", "Approve inspection target explicitly", "Create an isolated branch only after separate approval", "Run validation-only staging preview with no production writes", "Require package SHA, report ID, mapping version and explicit import approval before any write"]
await fs.mkdir(path.dirname(reportPath), { recursive: true }); await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
console.log(JSON.stringify({ reportPath, writesExecuted: false, sources: Object.fromEntries(Object.entries(report.sources).map(([key, value]) => [key, { accepted: value.accepted, rejected: value.rejected, unresolved: value.unresolved, exactDuplicates: value.exactDuplicates, keySimilarDifferent: value.keySimilarDifferent }])), errors: report.errors.length }, null, 2))
if (report.errors.length) process.exitCode = 1
