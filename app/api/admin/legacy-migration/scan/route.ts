import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
import { MAX_ARCHIVE_BYTES, scanErrorMessage, scanLegacyArchive } from "@/lib/legacy-archive-scan"

export const runtime = "nodejs"
export const maxDuration = 60

const ADMIN_ROLES = new Set(["ADMIN", "ADMIN SYSTEM", "SYSTEM ADMINISTRATOR", "MANAGEMENT", "HSE ADMIN", "MASTER USER"])

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const roleResult = await pool.query<{ role: string | null }>('SELECT role FROM neon_auth."user" WHERE id = $1 LIMIT 1', [session.user.id])
  if (!ADMIN_ROLES.has(String(roleResult.rows[0]?.role ?? "").trim().toUpperCase())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const contentLength = Number(request.headers.get("content-length") ?? 0)
  if (contentLength > MAX_ARCHIVE_BYTES + 2_000_000) return NextResponse.json({ error: "Archive exceeds the 100 MB upload limit." }, { status: 413 })
  try {
    const formData = await request.formData()
    const file = formData.get("archive")
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Choose a ZIP archive." }, { status: 400 })
    if (file.size > MAX_ARCHIVE_BYTES) return NextResponse.json({ error: "Archive exceeds the 100 MB upload limit." }, { status: 413 })
    if (!file.name.toLowerCase().endsWith(".zip")) return NextResponse.json({ error: "Only ZIP archives are accepted." }, { status: 415 })
    const report = await scanLegacyArchive(Buffer.from(await file.arrayBuffer()), file.name)
    return NextResponse.json({ report }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("[v0] Legacy archive scan failed", error)
    return NextResponse.json({ error: scanErrorMessage(error) }, { status: 422 })
  }
}

export async function GET() { return NextResponse.json({ maxArchiveBytes: MAX_ARCHIVE_BYTES, readOnly: true }) }
