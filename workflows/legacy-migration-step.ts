import { getSharePointToken, resolveSharePointDownload } from "@/lib/sharepoint-connect"
import { scanLegacyArchive, type BrowserScanReport } from "@/lib/legacy-archive-scan"

export async function retrieveAndInspectLegacyArchive(input: { userId: string; sharingUrl: string }): Promise<{ report: BrowserScanReport; source: { name: string; bytes: number } }> {
  "use step"
  const token = await getSharePointToken(input.userId)
  if (!token) throw new Error("MICROSOFT_AUTHORIZATION_REQUIRED")
  const file = await resolveSharePointDownload(input.sharingUrl, token)
  const response = await fetch(file.downloadUrl, { cache: "no-store" })
  if (!response.ok) throw new Error(`SHAREPOINT_DOWNLOAD_${response.status}`)
  const archive = Buffer.from(await response.arrayBuffer())
  const report = await scanLegacyArchive(archive, file.name)
  return { report, source: { name: file.name, bytes: archive.byteLength } }
}
