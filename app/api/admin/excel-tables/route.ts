import { Pool } from 'pg'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const session = await auth.api.getSession({ headers: await headers() })
    const userEmail = session?.user?.email

    if (userEmail !== "xom-it-admin@xomoman.com") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      )
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })

    // Get all Excel tables
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name LIKE 'excel_%'
      ORDER BY table_name
    `)

    // Get table info with row counts and column counts
    const tables = []
    for (const table of result.rows) {
      const countResult = await pool.query(`SELECT count(*) FROM "${table.table_name}"`)
      const colResult = await pool.query(`
        SELECT count(*) FROM information_schema.columns WHERE table_name = $1
      `, [table.table_name])
      
      tables.push({
        name: table.table_name,
        columnCount: parseInt(colResult.rows[0].count),
        rowCount: parseInt(countResult.rows[0].count)
      })
    }

    await pool.end()

    return NextResponse.json({ tables })
  } catch (error) {
    console.error("[v0] Error fetching Excel tables:", error)
    return NextResponse.json(
      { error: "Failed to fetch Excel tables" },
      { status: 500 }
    )
  }
}
