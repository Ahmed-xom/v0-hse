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
const json = (value: unknown) => (Array.isArray(value) ? value : value && typeof value === "object" ? value : []) as Record<string, unknown>[]
const readJson = async (zip: JSZip, name: string) => { const entry = zip.file(name); if (!entry) throw new Error(`Missing required file: ${name}`); return JSON.parse(await entry.async("string")) }
export async function parseExportPackage(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer, { checkCRC32: true })
  const checksums = (await readJson(zip, files.checksums)) as Record<string, string>
  const manifest = (await readJson(zip, files.manifest)) as Record<string, unknown>
  const packageData: ExportPackage = { database: (await readJson(zip, files.database)) as Record<string, unknown>, tables: json(await readJson(zip, files.tables)), columns: json(await readJson(zip, files.columns)), primaryKeys: json(await readJson(zip, files.primaryKeys)), foreignKeys: json(await readJson(zip, files.foreignKeys)), indexes: json(await readJson(zip, files.indexes)), rowCounts: json(await readJson(zip, files.rowCounts)), manifest, checksums, tableData: {} }
  const entries = Object.values(zip.files).filter((entry) => !entry.dir && entry.name.startsWith("table_data/") && entry.name.endsWith(".json"))
  for (const entry of entries) { const bytes = await entry.async("nodebuffer"); const expected = checksums[entry.name]; const actual = createHash("sha256").update(bytes).digest("hex"); if (!expected || expected.toLowerCase() !== actual) throw new Error(`Checksum mismatch: ${entry.name}`); packageData.tableData[entry.name] = json(JSON.parse(bytes.toString("utf8"))) }
  for (const [key, name] of Object.entries(files)) { if (key === "manifest" || key === "checksums") continue; const entry = zip.file(name); if (!entry) throw new Error(`Missing required file: ${name}`) }
  return packageData
}
export function packageSummary(pkg: ExportPackage) { const rows = pkg.rowCounts.reduce((sum, row) => sum + Number(row.row_count ?? row.count ?? row.records ?? 0), 0); return { tables: pkg.tables.length, populatedTables: pkg.rowCounts.filter((row) => Number(row.row_count ?? row.count ?? 0) > 0).length, emptyTables: pkg.rowCounts.filter((row) => Number(row.row_count ?? row.count ?? 0) === 0).length, columns: pkg.columns.length, rows, primaryKeys: pkg.primaryKeys.length, foreignKeys: pkg.foreignKeys.length, indexes: pkg.indexes.length, dataFiles: Object.keys(pkg.tableData).length } }
export { files }
