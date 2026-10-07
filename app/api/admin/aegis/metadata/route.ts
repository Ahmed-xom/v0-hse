import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { readAegisMetadata } from "@/lib/aegis-metadata"

const adminRoles = new Set(["ADMIN", "ADMIN SYSTEM", "SYSTEM ADMINISTRATOR", "MANAGEMENT", "HSE ADMIN", "MASTER USER"])

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = String((session?.user as unknown as { role?: string } | undefined)?.role || "").toUpperCase()
  if (!session?.user || !adminRoles.has(role)) return null
  return session.user
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  try {
    const metadata = await readAegisMetadata()
    return new NextResponse(JSON.stringify(metadata, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="Aegis_XOM_Metadata.json"',
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[aegis-metadata] SQL Server metadata export failed", error instanceof Error ? error.message : "unknown error")
    return NextResponse.json({ error: "Unable to connect to the SQL Server metadata source." }, { status: 502 })
  }
}
