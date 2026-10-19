import { NextRequest, NextResponse } from "next/server"
import { getRun } from "workflow/api"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  const session = await requireAdmin()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const runId = request.nextUrl.searchParams.get("runId")
  if (!runId) return NextResponse.json({ error: "Missing runId" }, { status: 400 })
  const run = getRun(runId)
  const status = await run.status
  if (status === "completed") return NextResponse.json({ status, result: await run.returnValue })
  if (status === "failed") return NextResponse.json({ status, error: "Inspection failed" }, { status: 502 })
  return NextResponse.json({ status })
}
