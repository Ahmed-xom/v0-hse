import { createHash } from "node:crypto"
import JSZip from "jszip"
import { addIssue, emptyDryRunSummary, safeRelativePath, type DryRunSummary } from "./legacy-migration-contracts"

export const MAX_ARCHIVE_BYTES = 100 * 1024 * 1024
export const MAX_ENTRIES = 10_000
export const MAX_ENTRY_BYTES = 50 * 1024 * 1024
export const MAX_TOTAL_UNCOMPRESSED_BYTES = 500 * 1024 * 1024

type ArchiveEntry = { path: string; sizeBytes: number; sha256?: string; kind: "file" | "directory" }
export type BrowserScanReport = DryRunSummary & {
  sourceName: string
  sourceBytes: number
  entries: ArchiveEntry[]
  folders: string[]
  detected: { manifests: string[]; databaseExports: string[]; metadata: string[]; attachments: string[]; training: string[] }
  duplicateFiles: Array<{ sha256: string; paths: string[] }>
  companyMappingCandidates: string[]
  scannedAt: string
}

const databaseNames = /(^|[/\\])(manifest|schema|database|tables?|rows?|export|sql|csv|xlsx|json)([/\\]|$)/i
const metadataNames = /(library|document|folder|hierarchy|acl|access|metadata)/i
const trainingNames = /(training|course|attendance|certificate|employee|expiry)/i
const attachmentNames = /(attachment|document|file|upload|blob)/i

function classify(path: string) {
  if (path.toLowerCase().endsWith("manifest.json")) return "manifest"
  if (databaseNames.test(path)) return "database"
  if (trainingNames.test(path)) return "training"
  if (metadataNames.test(path)) return "metadata"
  if (attachmentNames.test(path)) return "attachment"
  return "other"
}

function safeArchivePath(name: string) {
  const normalized = name.replaceAll("\\", "/")
  return safeRelativePath(normalized) && !normalized.startsWith("/") && !normalized.split("/").includes("..")
}

export async function scanLegacyArchive(buffer: Buffer, sourceName: string): Promise<BrowserScanReport> {
  if (buffer.byteLength > MAX_ARCHIVE_BYTES) throw new Error("ARCHIVE_TOO_LARGE")
  const archive = await JSZip.loadAsync(buffer, { createFolders: false, checkCRC32: true })
  const names = Object.keys(archive.files)
  if (names.length > MAX_ENTRIES) throw new Error("TOO_MANY_ENTRIES")
  const summary = emptyDryRunSummary()
  const entries: ArchiveEntry[] = []
  const folders = new Set<string>()
  const detected = { manifests: [] as string[], databaseExports: [] as string[], metadata: [] as string[], attachments: [] as string[], training: [] as string[] }
  const hashes = new Map<string, string[]>()
  const companyMappingCandidates = new Set<string>()
  let totalBytes = 0

  for (const [name, entry] of Object.entries(archive.files)) {
    const normalized = name.replaceAll("\\", "/")
    if (!safeArchivePath(normalized)) {
      addIssue(summary, { sourceTable: "archive", sourceKey: name, classification: "REVIEW_REQUIRED", code: "UNSAFE_ARCHIVE_PATH", message: "Archive entry is outside the extraction root" })
      continue
    }
    if (entry.dir) {
      folders.add(normalized.replace(/\/$/, ""))
      entries.push({ path: normalized, sizeBytes: 0, kind: "directory" })
      continue
    }
    const data = await entry.async("nodebuffer")
    if (data.byteLength > MAX_ENTRY_BYTES) throw new Error("ENTRY_TOO_LARGE")
    totalBytes += data.byteLength
    if (totalBytes > MAX_TOTAL_UNCOMPRESSED_BYTES) throw new Error("ARCHIVE_UNCOMPRESSED_LIMIT")
    const digest = createHash("sha256").update(data).digest("hex")
    entries.push({ path: normalized, sizeBytes: data.byteLength, sha256: digest, kind: "file" })
    const paths = hashes.get(digest) ?? []
    paths.push(normalized)
    hashes.set(digest, paths)
    const category = classify(normalized)
    if (category === "manifest") detected.manifests.push(normalized)
    if (category === "database") detected.databaseExports.push(normalized)
    if (category === "metadata") detected.metadata.push(normalized)
    if (category === "attachment") detected.attachments.push(normalized)
    if (category === "training") detected.training.push(normalized)
    if (/(xom|llc|oman|company|business|unit)/i.test(normalized)) companyMappingCandidates.add(normalized)
  }

  for (const [digest, paths] of hashes) {
    if (paths.length > 1) {
      summary.classifications.DUPLICATE_SKIP += paths.length - 1
      addIssue(summary, { sourceTable: "archive", sourceKey: digest, classification: "DUPLICATE_SKIP", code: "DUPLICATE_FILE_CONTENT", message: `${paths.length} files share this SHA-256` })
    }
  }
  summary.sourceCounts.archiveEntries = entries.length
  summary.sourceCounts.files = entries.filter((entry) => entry.kind === "file").length
  summary.sourceCounts.directories = entries.filter((entry) => entry.kind === "directory").length
  summary.sourceCounts.attachments = detected.attachments.length
  summary.sourceCounts.trainingCandidates = detected.training.length
  summary.sourceCounts.metadataCandidates = detected.metadata.length
  return { ...summary, sourceName, sourceBytes: buffer.byteLength, entries, folders: [...folders], detected, duplicateFiles: [...hashes].filter(([, paths]) => paths.length > 1).map(([sha256, paths]) => ({ sha256, paths })), companyMappingCandidates: [...companyMappingCandidates], scannedAt: new Date().toISOString() }
}

export function scanErrorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "SCAN_FAILED"
  return ({ ARCHIVE_TOO_LARGE: "Archive exceeds the 100 MB upload limit.", TOO_MANY_ENTRIES: "Archive exceeds the 10,000-entry safety limit.", ENTRY_TOO_LARGE: "An archive entry exceeds the 50 MB safety limit.", ARCHIVE_UNCOMPRESSED_LIMIT: "Archive exceeds the 500 MB decompression safety limit.", UNSAFE_ARCHIVE_PATH: "Archive contains an unsafe path." } as Record<string, string>)[code] ?? "The archive could not be scanned."
}

