import fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"

export const TARGET_BRANCH_ID = "br-wispy-hill-apxr32tq"
export const ALLOWED_TABLES = new Set(["public.company", "public.business_unit", "public.employee"])
const CSV_PATH = "reports/aegis-crosswalk-final.csv"
const CONTRACT_PATH = "config/aegis-core-mapping-contract-draft.json"

const fail = (message) => { throw new Error(`Aegis import blocked: ${message}`) }
const parseCsv = (text) => {
  const lines = text.trim().split(/\r?\n/)
  if (!lines.length) return []
  const parseLine = (line) => line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map((cell) => cell.replace(/^\"|\"$/g, "").replaceAll('""', '"'))
  const headers = parseLine(lines[0])
  return lines.slice(1).filter(Boolean).map((line) => Object.fromEntries(parseLine(line).map((value, i) => [headers[i], value])))
}

export function validateAuthorization({ contract, authorization, branchId = TARGET_BRANCH_ID, tables = [...ALLOWED_TABLES], operation = "INSERT" }) {
  if (branchId !== TARGET_BRANCH_ID) fail(`unexpected branch ${branchId}`)
  if (operation !== "INSERT") fail(`operation ${operation} is not allowed`)
  if (!tables.every((table) => ALLOWED_TABLES.has(table)) || tables.length !== ALLOWED_TABLES.size) fail("table allowlist mismatch")
  if (!contract || contract.approved !== true) fail("approved mapping contract is required")
  if (!contract.stagingAttestation?.provided || contract.stagingAttestation.branchId !== TARGET_BRANCH_ID) fail("trusted staging attestation is required")
  if (!authorization?.approved || authorization.branchId !== TARGET_BRANCH_ID || authorization.operation !== "INSERT") fail("trusted operational authorization is required")
  if (!Array.isArray(authorization.tables) || authorization.tables.length !== ALLOWED_TABLES.size || !authorization.tables.every((table) => ALLOWED_TABLES.has(table))) fail("operational table scope is invalid")
  if (authorization.production === true || authorization.ddl === true || authorization.update === true || authorization.delete === true) fail("unsafe permissions present")
  return true
}

export function classifyRows(rows) {
  return rows.map((row) => {
    const status = row.status || row.match_status
    const ready = status === "CONFIRMED_EXISTING" || status === "confirmed" || status === "confirmed_match"
    const targetId = row.NewEmployeeId || row.NewBusinessUnitId || row.NewCompanyId || row.target_employee_id
    return { row, action: ready && targetId ? "skip-existing" : "quarantine", reason: ready ? "target already exists" : "identity or relationship is not proven" }
  })
}

export async function loadLocalPlan(root = process.cwd()) {
  const [csv, contractText] = await Promise.all([
    fs.readFile(path.join(root, CSV_PATH), "utf8"),
    fs.readFile(path.join(root, CONTRACT_PATH), "utf8"),
  ])
  return { rows: parseCsv(csv), contract: JSON.parse(contractText) }
}

export async function main({ root = process.cwd(), execute = process.argv.includes("--execute"), db = null } = {}) {
  const { rows, contract } = await loadLocalPlan(root)
  const authorization = process.env.AEGIS_IMPORT_AUTHORIZATION ? JSON.parse(process.env.AEGIS_IMPORT_AUTHORIZATION) : null
  validateAuthorization({ contract, authorization })
  if (!execute) return { mode: "authorized-dry-run", inserted: 0, skipped: rows.length, quarantined: 0 }
  if (!db) fail("database client is required for execution")
  const identity = await db.query("SELECT current_database() AS database_name, current_setting('server_version') AS server_version")
  if (!identity?.rows?.[0]?.database_name) fail("staging database identity could not be verified")
  const classified = classifyRows(rows)
  const result = { inserted: 0, skipped: 0, quarantined: 0, errors: [] }
  for (const item of classified) {
    if (item.action === "quarantine") { result.quarantined++; continue }
    // The final crosswalk contains only existing, confirmed links; never synthesize INSERT values.
    result.skipped++
  }
  return { ...result, database: identity.rows[0].database_name }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error.message); process.exitCode = 1 })
}
