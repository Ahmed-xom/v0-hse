import { NextResponse } from "next/server"
import { cookies, headers } from "next/headers"
import { auth } from "@/lib/auth"
import {
  exchangeGoogleDriveCode,
  GOOGLE_DRIVE_STATE_COOKIE,
} from "@/lib/google-drive-oauth"

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const returnedState = requestUrl.searchParams.get("state")
  const oauthError = requestUrl.searchParams.get("error")
  const cookieStore = await cookies()
  const savedState = cookieStore.get(GOOGLE_DRIVE_STATE_COOKIE)?.value
  cookieStore.delete(GOOGLE_DRIVE_STATE_COOKIE)

  if (oauthError || !code || !returnedState || !savedState || returnedState !== savedState) {
    return NextResponse.json({ error: "Google Drive authorization was not completed" }, { status: 400 })
  }

  try {
    const tokenSet = await exchangeGoogleDriveCode(code)
    if (!tokenSet.refresh_token) {
      return NextResponse.json({ error: "Google Drive did not return offline access" }, { status: 502 })
    }

    // The refresh token must be stored in a server-side secret store before production use.
    return NextResponse.json(
      { error: "Authorization succeeded, but server-side token storage is not configured" },
      { status: 503 },
    )
  } catch {
    return NextResponse.json({ error: "Google Drive authorization failed" }, { status: 502 })
  }
}
