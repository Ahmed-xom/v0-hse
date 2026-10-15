import "server-only"

import { getToken, startAuthorization, UserAuthorizationRequiredError, type ConnectTokenParams } from "@vercel/connect"
import { headers } from "next/headers"

export const SHAREPOINT_CONNECTOR_UID = "microsoft/amnko-sharepoint-migration"
export const SHAREPOINT_SCOPES = ["Files.Read", "Sites.Read.All"]

async function getOrigin() {
  if (process.env.NODE_ENV !== "production" && process.env.V0_RUNTIME_URL) return process.env.V0_RUNTIME_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  const requestHeaders = await headers()
  return `${requestHeaders.get("x-forwarded-proto") ?? "https"}://${requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")}`
}

export function getSharePointTokenParams(userId: string): ConnectTokenParams {
  return { subject: { type: "user", id: userId }, scopes: SHAREPOINT_SCOPES }
}

export async function startSharePointAuthorization(userId: string) {
  return startAuthorization(SHAREPOINT_CONNECTOR_UID, getSharePointTokenParams(userId), {
    callbackUrl: `${await getOrigin()}/api/admin/legacy-migration/sharepoint-callback`,
  })
}

export async function getSharePointToken(userId: string) {
  try {
    return await getToken(SHAREPOINT_CONNECTOR_UID, getSharePointTokenParams(userId))
  } catch (error) {
    if (error instanceof UserAuthorizationRequiredError) return null
    throw error
  }
}

export function encodeShareId(sharingUrl: string) {
  const url = new URL(sharingUrl)
  if (!url.hostname.endsWith(".sharepoint.com")) throw new Error("Only SharePoint sharing links are supported")
  const base64 = Buffer.from(sharingUrl, "utf8").toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")
  return `u!${base64}`
}

export async function resolveSharePointDownload(sharingUrl: string, token: string) {
  const shareId = encodeShareId(sharingUrl)
  const response = await fetch(`https://graph.microsoft.com/v1.0/shares/${shareId}/driveItem`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (!response.ok) throw new Error(`Microsoft Graph returned ${response.status}`)
  const item = await response.json() as { name?: string; "@microsoft.graph.downloadUrl"?: string; file?: unknown }
  if (!item.file || !item["@microsoft.graph.downloadUrl"]) throw new Error("The SharePoint link is not a downloadable file")
  return { name: item.name ?? "legacy-archive.zip", downloadUrl: item["@microsoft.graph.downloadUrl"] }
}
