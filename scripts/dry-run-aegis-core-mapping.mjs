import fs from "node:fs/promises"
import process from "node:process"
import JSZip from "jszip"
import pg from "pg"

const { Pool } = pg
const [zipPath, reviewPath, reportPath = ".tmp/aegis-core-dry-run.json"] = process.argv.slice(2)
if (!zipPath || !reviewPath) throw new Error("Usage: node scripts/dry-run-aegis-core-mapping.mjs <export.zip> <review.json> [report.json]")

const review = JSON.parse(await fs.readFile(reviewPath, "utf8"))
if (review.approved) throw new Error("The review file must remain unapproved for this dry-run.")
const zip = await JSZip.loadAsync(await fs.readFile(zipPath), { checkCRC32: true })
const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL })
const quote = (value) => `"${String(value).replaceAll('"', '""')}"`
const result = { mode: "read-only-dry-run", generatedAt: new Date().toISOString(), approved: false, writesExecuted: false, schemaChanged: false, authChanged: false, mappings: [] }

for (const mapping of review.mappings) {
  const [sourceSchema, sourceTable] = mapping.source.split(".")
  const [targetSchema, targetTable] = mapping.destination.split(".")
  const dataEntry = Object.keys(zip.files).find((name) => name.replaceAll("\\", "/").endsWith(`table_data/${sourceSchema}__${sourceTable}.json`))
  if (!dataEntry) throw new Error(`Missing source data file for ${mapping.source}`)
  const raw = await zip.file(dataEntry).async("string")
  const parsed = raw.trim() ? JSON.parse(raw) : []
  const sourceRows = Array.isArray(parsed) ? parsed : parsed.rows ?? parsed.data ?? []
  const targetColumns = (await pool.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2 ORDER BY ordinal_position", [targetSchema, targetTable])).rows
  const targetColumnSet = new Set(targetColumns.map((column) => column.column_name))
  const missingTargets = mapping.columnMapping.filter((column) => column.destination && !targetColumnSet.has(column.destination)).map((column) => column.destination)
  const targetCount = targetColumns.length ? Number((await pool.query(`SELECT count(*)::bigint AS count FROM ${quote(targetSchema)}.${quote(targetTable)}`)).rows[0].count) : null
  const usableColumns = mapping.columnMapping.filter((column) => column.destination && targetColumnSet.has(column.destination) && column.status !== "BLOCKED")
  const nonEmptyRows = sourceRows.filter((row) => usableColumns.some((column) => row[column.source] !== null && row[column.source] !== undefined && String(row[column.source]).trim() !== ""))
  result.mappings.push({ source: mapping.source, destination: mapping.destination, sourceRows: sourceRows.length, targetRows: targetCount, targetColumns: targetColumns.map((column) => ({ name: column.column_name, type: column.data_type, nullable: column.is_nullable === "YES" })), missingTargets, blockedColumns: mapping.columnMapping.filter((column) => column.status === "BLOCKED").map((column) => column.source), unmappedColumns: mapping.columnMapping.filter((column) => column.status === "UNMAPPED").map((column) => column.source), candidateRows: nonEmptyRows.length, eligibleRows: 0, quarantinedRows: sourceRows.length, status: missingTargets.length ? "BLOCKED" : "REVIEW_REQUIRED", reasons: mapping.blockingIssues })
}
await pool.end()
result.summary = { mappings: result.mappings.length, blocked: result.mappings.filter((item) => item.status === "BLOCKED").length, reviewRequired: result.mappings.filter((item) => item.status === "REVIEW_REQUIRED").length, eligibleRows: 0, quarantinedRows: result.mappings.reduce((sum, item) => sum + item.quarantinedRows, 0) }
await fs.writeFile(reportPath, JSON.stringify(result, null, 2))
console.log(JSON.stringify({ reportPath, summary: result.summary }, null, 2))
