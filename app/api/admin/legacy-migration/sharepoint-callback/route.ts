import { NextResponse } from "next/server"
import { start } from "workflow/api"
import { requireAdmin } from "@/lib/admin-auth"
import { getSharePointToken } from "@/lib/sharepoint-connect"
import { inspectLegacyMigration } from "@/workflows/legacy-migration"

const SHARE_URL = "https://falconinvs-my.sharepoint.com/:u:/g/personal/xom-it-admin_xomoman_com/IQBatEkNAXLOR4XRjJDs8ZK-AUA7g8r24ClOhAhmeCPFyGM?e=RObKeG"

export const maxDuration = 30

export async function GET() {
  const session = await requireAdmin()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const token = await getSharePointToken(session.user.id)
  if (!token) {
    return NextResponse.json({ error: "Microsoft authorization is still required." }, { status: 428 })
  }

  const run = await start(inspectLegacyMigration, [{ userId: session.user.id, sharingUrl: SHARE_URL }])
  return NextResponse.json({ status: "authorized", runId: run.runId, statusUrl: `/api/admin/legacy-migration/status?runId=${encodeURIComponent(run.runId)}` }, { status: 202 })
}
