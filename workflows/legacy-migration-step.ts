import { createHash } from "node:crypto"
import JSZip from "jszip"
import { put } from "@vercel/blob"
import { getSharePointToken, resolveSharePointDownload } from "@/lib/sharepoint-connect"
import { scanLegacyArchive, type BrowserScanReport, MAX_ARCHIVE_BYTES, MAX_ENTRY_BYTES, MAX_TOTAL_UNCOMPRESSED_BYTES } from "@/lib/legacy-archive-scan"

function safeStoragePath(path: string) {
  const normalized = path.replaceAll("\\\\", "/")
  return normalized && !normalized.startsWith("/") && !normalized.split("/").includes("..")
}

export type StoredArchiveFile = { path: string; pathname: string; sha256: string; bytes: number }
export type LegacyTransferResult = { report: BrowserScanReport; source: { name: string; bytes: number }; stored: StoredArchiveFile[]; failed: Array<{ path: string; error: string }> }

export async function retrieveAndInspectLegacyArchive(input: { userId: string; sharingUrl: string }): Promise<LegacyTransferResult> {
  "use step"
  const token = await getSharePointToken(input.userId)
  if (!token) throw new Error("MICROSOFT_AUTHORIZATION_REQUIRED")
  const file = await resolveSharePointDownload(input.sharingUrl, token)
  const response = await fetch(file.downloadUrl, { cache: "no-store" })
  if (!response.ok) throw new Error(`SHAREPOINT_DOWNLOAD_${response.status}`)
  const archive = Buffer.from(await response.arrayBuffer())
  if (archive.byteLength > MAX_ARCHIVE_BYTES) throw new Error("ARCHIVE_TOO_LARGE")
  const report = await scanLegacyArchive(archive, file.name)
  const zip = await JSZip.loadAsync(archive, { createFolders: false, checkCRC32: true })
  const stored: StoredArchiveFile[] = []
  const failed: Array<{ path: string; error: string }> = []
  const seen = new Set<string>()
  let totalBytes = 0
  for (const [name, entry] of Object.entries(zip.files)) {
    const path = name.replaceAll("\\\\", "/")
    if (entry.dir || !safeStoragePath(path)) continue
    try {
      const data = await entry.async("nodebuffer")
      if (data.byteLength > MAX_ENTRY_BYTES) throw new Error("ENTRY_TOO_LARGE")
      totalBytes += data.byteLength
      if (totalBytes > MAX_TOTAL_UNCOMPRESSED_BYTES) throw new Error("ARCHIVE_UNCOMPRESSED_LIMIT")
      const sha256 = createHash("sha256").update(data).digest("hex")
      if (seen.has(sha256)) continue
      seen.add(sha256)
      const pathname = `preview-migrations/xom-files/${path}`
      const blob = await put(pathname, data, { access: "private", addRandomSuffix: false, allowOverwrite: false, contentType: "application/octet-stream" })
      stored.push({ path, pathname: blob.pathname, sha256, bytes: data.byteLength })
    } catch (error) {
      failed.push({ path, error: error instanceof Error ? error.message : "STORAGE_FAILED" })
    }
  }
  return { report, source: { name: file.name, bytes: archive.byteLength }, stored, failed }
}
