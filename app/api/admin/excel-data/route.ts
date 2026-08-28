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

    const tableName = request.nextUrl.searchParams.get('table')
    
    if (!tableName || !tableName.startsWith('excel_')) {
      return NextResponse.json(
        { error: "Invalid table name" },
        { status: 400 }
      )
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })

    // Get column names
    const colResult = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName])

    const columns = colResult.rows.map(r => r.column_name).filter(c => c !== 'id' && c !== 'created_at')

    // Get table data (limit to 1000 rows)
    const dataResult = await pool.query(`
      SELECT ${columns.map(c => `"${c}"`).join(', ')}
      FROM "${tableName}"
      LIMIT 1000
    `)

    await pool.end()

    return NextResponse.json({
      columns,
      rows: dataResult.rows
    })
  } catch (error) {
    console.error("[v0] Error fetching Excel data:", error)
    return NextResponse.json(
      { error: "Failed to fetch Excel data" },
      { status: 500 }
    )
  }
}
