import { NextResponse } from "next/server"
import { cookies, headers } from "next/headers"
import { auth } from "@/lib/auth"
import {
  createGoogleDriveAuthorization,
  GOOGLE_DRIVE_STATE_COOKIE,
} from "@/lib/google-drive-oauth"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { state, url } = createGoogleDriveAuthorization()
    const cookieStore = await cookies()
    cookieStore.set(GOOGLE_DRIVE_STATE_COOKIE, state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/api/google-drive",
      maxAge: 600,
    })
    return NextResponse.redirect(url)
  } catch {
    return NextResponse.json({ error: "Google Drive authorization is not configured" }, { status: 503 })
  }
}
