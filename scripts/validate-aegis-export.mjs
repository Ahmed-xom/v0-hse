import fs from "node:fs/promises"
import crypto from "node:crypto"
import process from "node:process"
import JSZip from "jszip"

const zipPath = process.argv[2] ?? ".tmp/Aegis_XOM_Export.zip"
const reportPath = process.argv[3] ?? ".tmp/aegis-export-validation.json"
const zip = await JSZip.loadAsync(await fs.readFile(zipPath), { checkCRC32: true })
const entries = Object.keys(zip.files)
const names = entries.map((name) => name.replaceAll("\\", "/"))
const readJson = async (name) => JSON.parse(await zip.file(name).async("string"))
const manifest = await readJson("manifest.json")
const tables = await readJson("tables.json")
const rowCounts = await readJson("row_counts.json")
const columns = await readJson("columns.json")
const primaryKeys = await readJson("primary_keys.json")
const foreignKeys = await readJson("foreign_keys.json")
const normalized = (value) => String(value ?? "").trim().toLowerCase()
const tableName = (table) => table.table_name ?? table.name
const schemaName = (table) => table.schema_name ?? table.schema ?? "dbo"
const countFor = (schema, name) => Number(rowCounts.find((item) => normalized(item.table_name ?? item.name) === normalized(name) && normalized(item.schema_name ?? item.schema ?? "dbo") === normalized(schema))?.row_count ?? 0)
const dataFiles = names.filter((name) => name.startsWith("table_data/") && name.endsWith(".json"))
const errors = []
const warnings = []
const files = []
let parsedRows = 0
for (const table of tables) {
  const schema = schemaName(table), name = tableName(table)
  const entryName = dataFiles.find((entry) => entry.endsWith(`table_data/${schema}__${name}.json`))
  if (!entryName) { errors.push(`Missing data file for ${schema}.${name}`); continue }
  const actualEntryName = entries.find((entry) => entry.replaceAll("\\", "/") === entryName)
  const raw = await zip.file(actualEntryName).async("string")
  try {
    const parsed = raw.trim() ? JSON.parse(raw) : []
    const rows = Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" ? [parsed] : []
    const expected = countFor(schema, name)
    if (rows.length !== expected) errors.push(`Row count mismatch for ${schema}.${name}: metadata=${expected}, parsed=${rows.length}`)
    parsedRows += rows.length
    files.push({ entry: entryName, bytes: Buffer.byteLength(raw), rows: rows.length, sha256: crypto.createHash("sha256").update(raw).digest("hex"), jsonShape: Array.isArray(parsed) ? "array" : "singleton-object" })
  } catch (error) { errors.push(`Invalid JSON ${entryName}: ${error instanceof Error ? error.message : String(error)}`) }
}
const report = { generatedAt: new Date().toISOString(), zipPath, manifest: { database: manifest.database, format: manifest.format, sourceTables: manifest.tables, sourceRows: manifest.total_rows }, counts: { tables: tables.length, dataFiles: dataFiles.length, columns: columns.length, primaryKeys: primaryKeys.length, foreignKeys: foreignKeys.length, parsedRows }, errors, warnings, files, valid: errors.length === 0 }
await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
console.log(JSON.stringify({ reportPath, valid: report.valid, counts: report.counts, errors: errors.length }, null, 2))
if (!report.valid) process.exitCode = 1
