import fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import JSZip from "jszip"
import pg from "pg"

const { Pool } = pg
const [, , zipPath, outputPath = "config/aegis-table-mapping.generated.json"] = process.argv
if (!zipPath) throw new Error("Usage: node scripts/plan-aegis-import.mjs <export.zip> [mapping.json]")
const buffer = await fs.readFile(zipPath)
const zip = await JSZip.loadAsync(buffer, { checkCRC32: true })
const read = async (name) => JSON.parse(await zip.file(name).async("string"))
const tables = await read("tables.json")
const columns = await read("columns.json")
const primaryKeys = await read("primary_keys.json")
const neonPool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL })
const tablesResult = await neonPool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ('neon_auth','pg_catalog','information_schema')")
const columnsResult = await neonPool.query("SELECT table_schema, table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema NOT IN ('neon_auth','pg_catalog','information_schema') ORDER BY table_schema, table_name, ordinal_position")
await neonPool.end()
const neonTables = new Map(tablesResult.rows.map((row) => [`${row.table_schema}.${row.table_name}`.toLowerCase(), row]))
const neonColumns = new Map()
for (const row of columnsResult.rows) { const key = `${row.table_schema}.${row.table_name}`.toLowerCase(); if (!neonColumns.has(key)) neonColumns.set(key, []); neonColumns.get(key).push(row) }
const mappings = tables.map((source) => {
  const sourceSchema = String(source.schema_name ?? source.schema ?? "dbo")
  const sourceTable = String(source.table_name ?? source.name ?? "")
  const exactKey = `public.${sourceTable}`.toLowerCase()
  const target = neonTables.get(exactKey)
  const sourceCols = columns.filter((column) => String(column.schema_name ?? column.schema ?? "dbo") === sourceSchema && String(column.table_name ?? column.table ?? "") === sourceTable)
  const targetCols = target ? neonColumns.get(exactKey) ?? [] : []
  const targetByName = new Map(targetCols.map((column) => [String(column.column_name).toLowerCase(), column]))
  const columnMappings = sourceCols.map((column) => { const sourceColumn = String(column.column_name ?? column.name ?? ""); const match = targetByName.get(sourceColumn.toLowerCase()); return { sourceColumn, targetColumn: match?.column_name ?? null, conversion: match ? "IDENTITY" : "NO_MATCH", status: match ? "REVIEW_REQUIRED" : "NO_MATCH" } })
  const primaryKey = primaryKeys.filter((key) => String(key.schema_name ?? key.schema ?? "dbo") === sourceSchema && String(key.table_name ?? key.table ?? "") === sourceTable).map((key) => String(key.column_name ?? key.column ?? ""))
  return { sourceSchema, sourceTable, targetSchema: target ? "public" : null, targetTable: target?.table_name ?? null, status: target ? "REVIEW_REQUIRED" : "NO_MATCH", conversion: target ? "IDENTITY" : "NONE", keyStrategy: primaryKey.length ? "SOURCE_PRIMARY_KEY" : "NO_STABLE_KEY", conflictPolicy: "INSERT_ONLY_SKIP_CONFLICT", sourcePrimaryKey: primaryKey, columns: columnMappings }
})
const report = { version: 1, source: { export: path.basename(zipPath) }, approved: false, generatedAt: new Date().toISOString(), safety: { authSchemasExcluded: true, destructiveOperations: false, automaticTableCreation: false }, tables: mappings }
await fs.mkdir(path.dirname(outputPath), { recursive: true })
await fs.writeFile(outputPath, JSON.stringify(report, null, 2))
console.log(JSON.stringify({ outputPath, sourceTables: mappings.length, exactTargetCandidates: mappings.filter((mapping) => mapping.targetTable).length, noMatch: mappings.filter((mapping) => mapping.status === "NO_MATCH").length }, null, 2))
