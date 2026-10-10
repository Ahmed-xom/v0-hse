import JSZip from "jszip"
import { createHash } from "node:crypto"

export type ExportPackage = {
  database: Record<string, unknown>
  tables: Record<string, unknown>[]
  columns: Record<string, unknown>[]
  primaryKeys: Record<string, unknown>[]
  foreignKeys: Record<string, unknown>[]
  indexes: Record<string, unknown>[]
  rowCounts: Record<string, unknown>[]
  manifest: Record<string, unknown>
  checksums: Record<string, string>
  tableData: Record<string, Record<string, unknown>[]>
}

const files = { database: "database_metadata.json", tables: "tables.json", columns: "columns.json", primaryKeys: "primary_keys.json", foreignKeys: "foreign_keys.json", indexes: "indexes.json", rowCounts: "row_counts.json", manifest: "manifest.json", checksums: "checksums.json" } as const
const metadataFiles = new Set<string>(Object.values(files))
const jsonArray = (value: unknown, name: string) => {
  if (!Array.isArray(value)) throw new Error(`${name} must contain a JSON array.`)
  return value as Record<string, unknown>[]
}
const jsonObject = (value: unknown, name: string) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${name} must contain a JSON object.`)
  return value as Record<string, unknown>
}
const readJson = async (zip: JSZip, name: string) => {
  const entry = zip.file(name)
  if (!entry) throw new Error(`Missing required file: ${name}`)
  try { return JSON.parse(await entry.async("string")) as unknown } catch { throw new Error(`Invalid JSON: ${name}`) }
}
const safeTablePath = (name: string) => /^table_data\/[A-Za-z0-9_.-]+__[A-Za-z0-9_.-]+\.json$/.test(name) && !name.includes("..")
const tableKey = (row: Record<string, unknown>) => `${String(row.schema_name ?? row.schema ?? "dbo")}__${String(row.table_name ?? row.name ?? "")}`
const declaredCount = (manifest: Record<string, unknown>, key: string) => Number((manifest[key] as number | undefined) ?? NaN)

export async function parseExportPackage(buffer: Buffer): Promise<ExportPackage> {
  const zip = await JSZip.loadAsync(buffer, { checkCRC32: true })
  const entries = Object.values(zip.files).filter((entry) => !entry.dir)
  for (const entry of entries) if (entry.name.startsWith("/") || entry.name.includes("..") || entry.name.includes("\\")) throw new Error(`Unsafe archive path: ${entry.name}`)
  const checksums = jsonObject(await readJson(zip, files.checksums), files.checksums) as Record<string, string>
  const manifest = jsonObject(await readJson(zip, files.manifest), files.manifest)
  const database = jsonObject(await readJson(zip, files.database), files.database)
  const tables = jsonArray(await readJson(zip, files.tables), files.tables)
  const columns = jsonArray(await readJson(zip, files.columns), files.columns)
  const primaryKeys = jsonArray(await readJson(zip, files.primaryKeys), files.primaryKeys)
  const foreignKeys = jsonArray(await readJson(zip, files.foreignKeys), files.foreignKeys)
  const indexes = jsonArray(await readJson(zip, files.indexes), files.indexes)
  const rowCounts = jsonArray(await readJson(zip, files.rowCounts), files.rowCounts)
  const packageData: ExportPackage = { database, tables, columns, primaryKeys, foreignKeys, indexes, rowCounts, manifest, checksums, tableData: {} }
  for (const [name, expected] of Object.entries(checksums)) {
    if (!name || name === "checksums.json" || name.includes("..") || name.includes("\\")) continue
    const entry = zip.file(name)
    if (!entry) throw new Error(`Checksum file references missing entry: ${name}`)
    const actual = createHash("sha256").update(await entry.async("nodebuffer")).digest("hex")
    if (typeof expected !== "string" || expected.toLowerCase() !== actual) throw new Error(`Checksum mismatch: ${name}`)
  }
  const dataEntries = entries.filter((entry) => entry.name.startsWith("table_data/") && entry.name.endsWith(".json"))
  const tableKeys = new Set(tables.map(tableKey))
  for (const entry of dataEntries) {
    if (!safeTablePath(entry.name)) throw new Error(`Unsafe table data path: ${entry.name}`)
    const expected = checksums[entry.name]
    if (!expected) throw new Error(`Missing checksum: ${entry.name}`)
    const bytes = await entry.async("nodebuffer")
    if (expected.toLowerCase() !== createHash("sha256").update(bytes).digest("hex")) throw new Error(`Checksum mismatch: ${entry.name}`)
    const data = jsonArray(JSON.parse(bytes.toString("utf8")), entry.name)
    packageData.tableData[entry.name] = data
    const key = entry.name.slice("table_data/".length, -".json".length)
    if (!tableKeys.has(key)) throw new Error(`Data file has no table metadata: ${entry.name}`)
  }
  for (const table of tables) {
    const key = tableKey(table)
    const path = `table_data/${key}.json`
    if (!zip.file(path)) throw new Error(`Missing table data file: ${path}`)
    const expected = Number(table.row_count ?? table.count ?? 0)
    const actual = packageData.tableData[path]?.length ?? 0
    if (Number.isFinite(expected) && expected !== actual) throw new Error(`Row count mismatch for ${key}: metadata=${expected}, exported=${actual}`)
  }
  for (const entry of dataEntries) if (!tableKeys.has(entry.name.slice(11, -5))) throw new Error(`Unexpected table data file: ${entry.name}`)
  const declaredTables = declaredCount(manifest, "tables")
  if (Number.isFinite(declaredTables) && declaredTables !== tables.length) throw new Error(`Manifest table count mismatch: ${declaredTables} != ${tables.length}`)
  const declaredDataFiles = declaredCount(manifest, "data_files")
  if (Number.isFinite(declaredDataFiles) && declaredDataFiles !== dataEntries.length) throw new Error(`Manifest data file count mismatch: ${declaredDataFiles} != ${dataEntries.length}`)
  const checksumNames = new Set(Object.keys(checksums))
  for (const entry of entries) if (!metadataFiles.has(entry.name) && !checksumNames.has(entry.name)) throw new Error(`Archive entry is not declared by checksums: ${entry.name}`)
  return packageData
}

export function packageSummary(pkg: ExportPackage) {
  const rows = pkg.rowCounts.reduce((sum, row) => sum + Number(row.row_count ?? row.count ?? row.records ?? 0), 0)
  return { tables: pkg.tables.length, populatedTables: pkg.rowCounts.filter((row) => Number(row.row_count ?? row.count ?? 0) > 0).length, emptyTables: pkg.rowCounts.filter((row) => Number(row.row_count ?? row.count ?? 0) === 0).length, columns: pkg.columns.length, rows, primaryKeys: pkg.primaryKeys.length, foreignKeys: pkg.foreignKeys.length, indexes: pkg.indexes.length, dataFiles: Object.keys(pkg.tableData).length }
}

export { files }

export function packageFileNames() { return [...Object.values(files)] }
