import { randomBytes } from "node:crypto"

export const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly"
export const GOOGLE_DRIVE_STATE_COOKIE = "google_drive_oauth_state"
export const GOOGLE_DRIVE_CALLBACK_PATH = "/api/google-drive/callback"

const getRequiredEnv = (name: "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET") => {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

export const getGoogleDriveRedirectUri = () => {
  const configured = process.env.GOOGLE_DRIVE_REDIRECT_URI
  if (configured) return configured

  const baseUrl = process.env.BETTER_AUTH_URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL || "http://localhost:3000")

  return new URL(GOOGLE_DRIVE_CALLBACK_PATH, baseUrl).toString()
}

export const createGoogleDriveAuthorization = () => {
  const state = randomBytes(32).toString("base64url")
  const params = new URLSearchParams({
    client_id: getRequiredEnv("GOOGLE_CLIENT_ID"),
    redirect_uri: getGoogleDriveRedirectUri(),
    response_type: "code",
    scope: GOOGLE_DRIVE_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  })

  return {
    state,
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  }
}

export const exchangeGoogleDriveCode = async (code: string) => {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getRequiredEnv("GOOGLE_CLIENT_ID"),
      client_secret: getRequiredEnv("GOOGLE_CLIENT_SECRET"),
      redirect_uri: getGoogleDriveRedirectUri(),
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  })

  if (!response.ok) throw new Error("Google OAuth token exchange failed")
  return response.json() as Promise<{
    access_token: string
    expires_in: number
    refresh_token?: string
    scope: string
    token_type: string
  }>
}
