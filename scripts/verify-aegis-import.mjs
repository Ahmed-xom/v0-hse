import fs from "node:fs/promises"
import crypto from "node:crypto"
import process from "node:process"
import JSZip from "jszip"
import pg from "pg"

const { Pool } = pg
const [, , zipPath, reportPath = "aegis-import-report.json", outputPath = "aegis-verification-report.json"] = process.argv
if (!zipPath || !reportPath) throw new Error("Usage: node scripts/verify-aegis-import.mjs <export.zip> <import-report.json> [verification.json]")
const sourceReport = JSON.parse(await fs.readFile(reportPath, "utf8"))
const zip = await JSZip.loadAsync(await fs.readFile(zipPath), { checkCRC32: true })
const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL })
const verification = { readOnly: true, startedAt: new Date().toISOString(), dryRun: sourceReport.dryRun, tables: [], totals: { source: 0, eligible: 0, inserted: 0, skipped: 0, errors: 0, mismatches: 0 } }
for (const table of sourceReport.tables ?? []) {
  const rows = JSON.parse(await zip.file(table.sourceTable).async("string"))
  const [schema, target] = String(table.targetTable).split(".")
  const result = await pool.query("SELECT to_regclass($1) AS relation", [`${schema}.${target}`])
  const relationExists = Boolean(result.rows[0]?.relation)
  const sourceHashes = rows.slice(0, 100).map((row) => crypto.createHash("sha256").update(JSON.stringify(row)).digest("hex"))
  const entry = { ...table, relationExists, sourceSampleHash: crypto.createHash("sha256").update(sourceHashes.join("\n")).digest("hex"), status: relationExists ? "CHECKED" : "TARGET_NOT_FOUND" }
  verification.tables.push(entry)
  for (const key of ["source", "eligible", "inserted", "skipped", "errors"]) verification.totals[key] += Number(table[key] ?? 0)
  if (!relationExists) verification.totals.mismatches++
}
await pool.end()
verification.finishedAt = new Date().toISOString()
await fs.writeFile(outputPath, JSON.stringify(verification, null, 2))
console.log(JSON.stringify({ outputPath, readOnly: true, totals: verification.totals }, null, 2))
