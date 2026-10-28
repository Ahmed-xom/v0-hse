import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { NextResponse } from "next/server"

const EXPECTED_BRANCH_ID = "br-cool-resonance-aprkwe4c"

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  try {
    const result = await db.execute(sql`
      SELECT
        current_database() AS current_database,
        current_setting('neon.branch_id', true) AS neon_branch_id
    `)
    const identity = result.rows[0] as {
      current_database: string | null
      neon_branch_id: string | null
    }

    return NextResponse.json({
      current_database: identity.current_database,
      neon_branch_id: identity.neon_branch_id,
      branch_matches: identity.neon_branch_id === EXPECTED_BRANCH_ID,
    })
  } catch {
    return NextResponse.json({ error: "Database identity check failed" }, { status: 503 })
  }
}
