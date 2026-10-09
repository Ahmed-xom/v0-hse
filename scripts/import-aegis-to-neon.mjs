import fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import crypto from "node:crypto"
import JSZip from "jszip"
import pg from "pg"

const { Pool } = pg
const args = new Set(process.argv.slice(2))
const value = (flag, fallback) => { const index = process.argv.indexOf(flag); return index >= 0 ? process.argv[index + 1] : fallback }
const zipPath = value("--zip")
const mappingPath = value("--mapping", "config/aegis-table-mapping.json")
const reportPath = value("--report", "aegis-import-report.json")
const checkpointPath = value("--checkpoint", `${reportPath}.checkpoint.json`)
if (!zipPath) throw new Error("Usage: node scripts/import-aegis-to-neon.mjs --zip <export.zip> --mapping <mapping.json> [--dry-run]")
const dryRun = !args.has("--write")
if (!dryRun && !args.has("--confirm-non-production")) throw new Error("Refusing writes without --confirm-non-production.")
if (!dryRun && process.env.NODE_ENV === "production") throw new Error("Refusing writes in production.")
const mapping = JSON.parse(await fs.readFile(mappingPath, "utf8"))
if (!mapping.approved) throw new Error("Mapping plan is not approved.")
const authSchemas = new Set(["neon_auth.user", "neon_auth.account", "neon_auth.session", "neon_auth.verification"])
const approvedMappings = (mapping.tables ?? []).filter((item) => item.status === "APPROVED")
if (!approvedMappings.length) throw new Error("No APPROVED table mappings are available.")
for (const item of approvedMappings) if (authSchemas.has(`${item.targetSchema}.${item.targetTable}`.toLowerCase())) throw new Error("Authentication tables cannot be imported.")
const zip = await JSZip.loadAsync(await fs.readFile(zipPath), { checkCRC32: true })
const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL })
const checkpoint = args.has("--resume") ? JSON.parse(await fs.readFile(checkpointPath, "utf8").catch(() => "{}")) : {}
const report = { dryRun, startedAt: new Date().toISOString(), tables: [], totals: { source: 0, eligible: 0, inserted: 0, skipped: 0, errors: 0 } }
for (const item of approvedMappings) {
  const checkpointKey = `${item.sourceSchema}.${item.sourceTable}`
  if (checkpoint[checkpointKey] === "complete") continue
  const sourceKey = `table_data/${item.sourceSchema}__${item.sourceTable}.json`
  const entry = zip.file(sourceKey)
  if (!entry) throw new Error(`Missing data file: ${sourceKey}`)
  const rows = JSON.parse(await entry.async("string"))
  const sourceColumns = (item.columns ?? []).filter((column) => column.status === "APPROVED" && column.targetColumn)
  const tableReport = { sourceTable: sourceKey, targetTable: `${item.targetSchema}.${item.targetTable}`, source: rows.length, eligible: 0, inserted: 0, skipped: 0, errors: 0 }
  for (const row of rows) {
    report.totals.source++
    const values = sourceColumns.map((column) => row[column.sourceColumn] ?? null)
    if (values.every((value) => value === null)) { tableReport.skipped++; report.totals.skipped++; continue }
    tableReport.eligible++; report.totals.eligible++
    if (dryRun) continue
    const columns = sourceColumns.map((column) => `"${String(column.targetColumn).replaceAll('"', '""')}"`).join(", ")
    const placeholders = values.map((_, index) => `$${index + 1}`).join(", ")
    try {
      const result = await pool.query(`INSERT INTO "${String(item.targetSchema).replaceAll('"', '""')}"."${String(item.targetTable).replaceAll('"', '""')}" (${columns}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`, values)
      if (result.rowCount) { tableReport.inserted++; report.totals.inserted++ } else { tableReport.skipped++; report.totals.skipped++ }
    } catch (error) { tableReport.errors++; report.totals.errors++; tableReport.lastError = error instanceof Error ? error.message : String(error) }
  }
  report.tables.push(tableReport)
  if (!tableReport.errors) { checkpoint[checkpointKey] = "complete"; await fs.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2)) }
}
await pool.end()
report.finishedAt = new Date().toISOString()
await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
console.log(JSON.stringify({ reportPath, dryRun, totals: report.totals }, null, 2))
