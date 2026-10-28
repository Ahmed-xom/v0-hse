import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

const expectedBranchId = "br-cool-resonance-aprkwe4c"

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const result = await pool.query(
    "SELECT current_database() AS current_database, current_setting('neon.branch_id', true) AS neon_branch_id",
  )
  const { current_database, neon_branch_id } = result.rows[0]

  return NextResponse.json({
    current_database,
    neon_branch_id,
    expected_branch_id: expectedBranchId,
    branch_matches: neon_branch_id === expectedBranchId,
  })
}
