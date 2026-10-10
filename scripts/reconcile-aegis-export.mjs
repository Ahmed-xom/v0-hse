import fs from "node:fs/promises"
import process from "node:process"
import JSZip from "jszip"
import pg from "pg"

const [zipPath = ".tmp/Aegis_XOM_Export.zip", proposalPath = "config/aegis-table-mapping-proposal.json", reportPath = ".tmp/aegis-full-reconciliation.json"] = process.argv.slice(2)
const proposal = JSON.parse(await fs.readFile(proposalPath, "utf8"))
const zip = await JSZip.loadAsync(await fs.readFile(zipPath), { checkCRC32: true })
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL })
const quote = (value) => `"${String(value).replaceAll('"', '""')}"`
const tables = (await pool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_type='BASE TABLE' AND table_schema NOT IN ('pg_catalog','information_schema')")).rows
const columns = (await pool.query("SELECT table_schema, table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema NOT IN ('pg_catalog','information_schema')")).rows
const live = new Set(tables.map((row) => `${row.table_schema}.${row.table_name}`.toLowerCase()))
const liveColumns = new Map()
for (const column of columns) { const key = `${column.table_schema}.${column.table_name}`.toLowerCase(); liveColumns.set(key, [...(liveColumns.get(key) ?? []), column]) }
const normalized = (value) => String(value ?? "").trim().toLowerCase()
const tableName = (table) => table.sourceTable ?? table.table_name ?? table.name
const sourceSchema = (table) => table.sourceSchema ?? table.schema_name ?? table.schema ?? "dbo"
const sourceRows = async (schema, name) => {
  const entry = Object.keys(zip.files).find((file) => file.replaceAll("\\", "/").endsWith(`table_data/${schema}__${name}.json`))
  if (!entry) return []
  const raw = await zip.file(entry).async("string")
  if (!raw.trim()) return []
  const parsed = JSON.parse(raw)
  return Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" ? [parsed] : []
}
const report = { mode: "read-only-full-reconciliation", generatedAt: new Date().toISOString(), approved: false, writesExecuted: false, schemaChanged: false, authChanged: false, tables: [], summary: {} }
for (const item of proposal.proposedMappings ?? []) {
  const source = `${sourceSchema(item)}.${tableName(item)}`
  const destination = item.destinationTable ? `${item.destinationSchema ?? "public"}.${item.destinationTable}` : null
  const rows = await sourceRows(sourceSchema(item), tableName(item))
  const targetColumns = destination ? (liveColumns.get(destination.toLowerCase()) ?? []) : []
  const mappingTargets = new Set((item.destinationColumnMapping ?? []).map((mapping) => mapping.target).filter(Boolean))
  const missingRequired = targetColumns.filter((column) => column.is_nullable === "NO" && !column.column_default && !mappingTargets.has(column.column_name)).map((column) => column.column_name)
  let targetRows = null
  if (destination && live.has(destination.toLowerCase())) targetRows = Number((await pool.query(`SELECT count(*)::bigint AS count FROM ${quote(destination.split('.')[0])}.${quote(destination.split('.')[1])}`)).rows[0].count)
  const blocked = !destination || !live.has(destination.toLowerCase()) || missingRequired.length > 0 || item.approved !== true
  report.tables.push({ source, destination, classification: destination ? item.status : "NO_SAFE_DESTINATION", sourceRows: rows.length, targetRows, insertCandidates: 0, conflicts: 0, quarantinedRows: rows.length, unresolvedForeignKeys: rows.length, missingRequired, unresolvedReason: blocked ? "Mapping is not approved and requires key/FK/conflict validation." : null, safeToImport: false })
}
const classified = proposal.allSourceTables ?? []
report.summary = { sourceTables: classified.length || proposal.source?.sourceTables || 0, proposedMappingsAnalyzed: report.tables.length, fullyMapped: report.tables.filter((item) => item.safeToImport).length, reviewRequired: report.tables.filter((item) => item.destination && !item.safeToImport).length, noSafeDestination: classified.filter((item) => ["NO_SAFE_DESTINATION", "LEGACY_OR_AUDIT_DATA", "EMPTY_TABLE", "SECURITY_OR_AUTH_EXCLUDED"].includes(item.classification)).length, insertCandidates: 0, conflicts: 0, quarantinedRows: report.tables.reduce((sum, item) => sum + item.quarantinedRows, 0), unresolvedForeignKeys: report.tables.reduce((sum, item) => sum + item.unresolvedForeignKeys, 0) }
await pool.end()
await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
console.log(JSON.stringify({ reportPath, summary: report.summary }, null, 2))
