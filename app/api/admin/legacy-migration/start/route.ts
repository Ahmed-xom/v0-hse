import { NextRequest, NextResponse } from "next/server"
import { start } from "workflow/api"
import { requireAdmin } from "@/lib/admin-auth"
import { inspectLegacyMigration } from "@/workflows/legacy-migration"

export const maxDuration = 30

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => null) as { sharingUrl?: string } | null
  if (!body?.sharingUrl) return NextResponse.json({ error: "Missing SharePoint URL" }, { status: 400 })
  try { new URL(body.sharingUrl) } catch { return NextResponse.json({ error: "Invalid SharePoint URL" }, { status: 400 }) }

  const run = await start(inspectLegacyMigration, [{ userId: session.user.id, sharingUrl: body.sharingUrl }])
  return NextResponse.json({ runId: run.runId }, { status: 202 })
}
