import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"

const ADMIN_ROLES = new Set(["ADMIN", "ADMIN SYSTEM", "SYSTEM ADMINISTRATOR", "MANAGEMENT", "HSE ADMIN", "MASTER USER"])

function isAdmin(role: unknown) {
  return ADMIN_ROLES.has(String(role ?? "").trim().toUpperCase())
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const roleResult = await pool.query<{ role: string | null }>('SELECT role FROM neon_auth."user" WHERE id = $1 LIMIT 1', [session.user.id])
  if (!isAdmin(roleResult.rows[0]?.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const client = await pool.connect()
  try {
    const [sourceTables, publicTables, targetColumns, migrationCounts] = await Promise.all([
      client.query<{ source_table: string; row_count: string; sample_keys: string[] }>(`\n        SELECT r.source_table, count(*)::bigint AS row_count,\n          COALESCE((\n            SELECT array_agg(key ORDER BY key)\n            FROM (\n              SELECT DISTINCT jsonb_object_keys(s.data) AS key\n              FROM aegis_import.source_rows s\n              WHERE s.source_table = r.source_table\n            ) keys\n          ), ARRAY[]::text[]) AS sample_keys\n        FROM aegis_import.source_rows r\n        GROUP BY r.source_table\n        ORDER BY count(*) DESC, r.source_table\n      `),
      client.query<{ table_name: string }>(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `),
      client.query<{ table_name: string; column_name: string }>(`
        SELECT table_name, column_name FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
      `),
      client.query<{ table_name: string; count: string }>(`
        SELECT 'aegis_migration_import' AS table_name, count(*)::bigint FROM public.aegis_migration_import
        UNION ALL SELECT 'aegis_migration_mapping', count(*)::bigint FROM public.aegis_migration_mapping
        UNION ALL SELECT 'aegis_migration_record', count(*)::bigint FROM public.aegis_migration_record
        UNION ALL SELECT 'aegis_migration_issue', count(*)::bigint FROM public.aegis_migration_issue
      `),
    ])

    const targetSet = new Set(publicTables.rows.map((row) => row.table_name))
    const columnsByTable = new Map<string, Set<string>>()
    for (const row of targetColumns.rows) {
      if (!columnsByTable.has(row.table_name)) columnsByTable.set(row.table_name, new Set())
      columnsByTable.get(row.table_name)?.add(row.column_name.toLowerCase())
    }

    const tables = sourceTables.rows.map((row) => {
      const normalized = row.source_table.replace(/^dbo__/, "").replace(/^tbl/i, "").replace(/[^a-zA-Z0-9]+(.)/g, (_, character) => String(character).toUpperCase())
      const candidate = normalized.charAt(0).toLowerCase() + normalized.slice(1)
      const matchedTable = targetSet.has(candidate) ? candidate : targetSet.has(row.source_table.toLowerCase()) ? row.source_table.toLowerCase() : null
      const targetColumnSet = matchedTable ? columnsByTable.get(matchedTable) ?? new Set<string>() : new Set<string>()
      const comparableKeys = row.sample_keys.filter((key) => targetColumnSet.has(key.toLowerCase()))
      return {
        sourceTable: row.source_table,
        rowCount: Number(row.row_count),
        matchedTable,
        mappingStatus: matchedTable ? comparableKeys.length > 0 ? "partial" : "unmapped" : "no_target",
        sourceColumns: row.sample_keys.length,
        comparableColumns: comparableKeys.length,
      }
    })

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      source: { schema: "aegis_import", table: "source_rows", tableCount: tables.length, rowCount: tables.reduce((sum, table) => sum + table.rowCount, 0) },
      target: { schema: "public", tableCount: publicTables.rowCount },
      migrationTables: Object.fromEntries(migrationCounts.rows.map((row) => [row.table_name, Number(row.count)])),
      tables,
      safety: { readOnly: true, writesEnabled: false, publicWritesExecuted: false, authTablesRead: false },
    })
  } finally {
    client.release()
  }
}

export const dynamic = "force-dynamic"
