import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getSharePointToken, resolveSharePointDownload } from "@/lib/sharepoint-connect"

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sharingUrl = request.nextUrl.searchParams.get("url")
  if (!sharingUrl) return NextResponse.json({ error: "Missing SharePoint URL" }, { status: 400 })

  try {
    const token = await getSharePointToken(session.user.id)
    if (!token) return NextResponse.json({ error: "Microsoft authorization required" }, { status: 428 })
    const file = await resolveSharePointDownload(sharingUrl, token)
    const fileResponse = await fetch(file.downloadUrl, { cache: "no-store" })
    if (!fileResponse.ok || !fileResponse.body) return NextResponse.json({ error: "SharePoint download failed" }, { status: 502 })

    return new NextResponse(fileResponse.body, {
      headers: {
        "Content-Type": fileResponse.headers.get("content-type") ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[v0] SharePoint migration download failed", error)
    return NextResponse.json({ error: "Unable to access SharePoint archive" }, { status: 502 })
  }
}
