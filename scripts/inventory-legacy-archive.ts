import { createHash } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { basename, isAbsolute, relative, resolve, sep } from "node:path"
import JSZip from "jszip"
import { addIssue, emptyDryRunSummary, safeRelativePath, type DryRunSummary } from "../lib/legacy-migration-contracts"

type ArchiveEntry = { path: string; sizeBytes: number; sha256?: string; kind: "file" | "directory" }

type InventoryReport = DryRunSummary & {
  archivePath: string
  extractedTo: string
  entries: ArchiveEntry[]
  detected: { manifests: string[]; databaseExports: string[]; metadata: string[]; attachments: string[]; training: string[] }
  duplicateFiles: Array<{ sha256: string; paths: string[] }>
}

const databaseNames = /(^|[/\\])(manifest|schema|database|tables?|rows?|export|sql|csv|xlsx|json)([/\\]|$)/i
const metadataNames = /(library|document|folder|hierarchy|acl|access|metadata)/i
const trainingNames = /(training|course|attendance|certificate|employee|expiry)/i
const attachmentNames = /(attachment|document|file|upload|blob)/i

function sha256(data: Buffer) {
  return createHash("sha256").update(data).digest("hex")
}

function safeArchivePath(name: string) {
  const normalized = name.replaceAll("\\", "/")
  return safeRelativePath(normalized) && !isAbsolute(normalized) && !normalized.split("/").includes("")
}

function classify(path: string) {
  const lower = path.toLowerCase()
  if (lower.endsWith("manifest.json")) return "manifest"
  if (databaseNames.test(path)) return "database"
  if (trainingNames.test(path)) return "training"
  if (metadataNames.test(path)) return "metadata"
  if (attachmentNames.test(path)) return "attachment"
  return "other"
}

export async function inventoryLegacyArchive(archivePath: string, outputDirectory = "./migration-review") {
  const absoluteArchive = resolve(archivePath)
  const archive = await JSZip.loadAsync(await readFile(absoluteArchive), { createFolders: false, checkCRC32: true })
  const extractedTo = resolve(outputDirectory, basename(absoluteArchive, ".zip"))
  await mkdir(extractedTo, { recursive: true })
  const summary = emptyDryRunSummary()
  const entries: ArchiveEntry[] = []
  const detected = { manifests: [] as string[], databaseExports: [] as string[], metadata: [] as string[], attachments: [] as string[], training: [] as string[] }
  const hashes = new Map<string, string[]>()

  for (const [name, entry] of Object.entries(archive.files)) {
    const normalized = name.replaceAll("\\", "/")
    if (!safeArchivePath(normalized)) {
      addIssue(summary, { sourceTable: "archive", sourceKey: name, classification: "REVIEW_REQUIRED", code: "UNSAFE_ARCHIVE_PATH", message: "Archive entry is outside the extraction root" })
      continue
    }
    if (entry.dir) {
      entries.push({ path: normalized, sizeBytes: 0, kind: "directory" })
      continue
    }
    const data = await entry.async("nodebuffer")
    const digest = sha256(data)
    const target = resolve(extractedTo, normalized)
    const rel = relative(extractedTo, target)
    if (rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
      addIssue(summary, { sourceTable: "archive", sourceKey: normalized, classification: "REVIEW_REQUIRED", code: "EXTRACTION_ESCAPE", message: "Archive entry would escape the extraction root" })
      continue
    }
    await mkdir(resolve(target, ".."), { recursive: true })
    await writeFile(target, data, { flag: "wx" }).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "EEXIST") throw error
    })
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
  }

  for (const [digest, paths] of hashes) {
    if (paths.length > 1) {
      summary.classifications.DUPLICATE_SKIP += paths.length - 1
      summary.issues.push({ sourceTable: "archive", sourceKey: digest, classification: "DUPLICATE_SKIP", code: "DUPLICATE_FILE_CONTENT", message: `${paths.length} files share this SHA-256: ${paths.join(", ")}` })
    }
  }
  summary.sourceCounts.archiveEntries = entries.length
  summary.sourceCounts.files = entries.filter((entry) => entry.kind === "file").length
  summary.sourceCounts.directories = entries.filter((entry) => entry.kind === "directory").length
  summary.sourceCounts.attachments = detected.attachments.length
  summary.sourceCounts.trainingCandidates = detected.training.length
  summary.sourceCounts.metadataCandidates = detected.metadata.length
  const report: InventoryReport = { ...summary, archivePath: absoluteArchive, extractedTo, entries, detected, duplicateFiles: [...hashes].filter(([, paths]) => paths.length > 1).map(([digest, paths]) => ({ sha256: digest, paths })) }
  await writeFile(resolve(outputDirectory, "legacy-migration-dry-run.json"), JSON.stringify(report, null, 2))
  return report
}

if (process.argv[1]?.endsWith("inventory-legacy-archive.ts")) {
  const args = process.argv.slice(2).filter((argument) => argument !== "--")
  const archivePath = args[0]
  if (!archivePath) throw new Error("Usage: pnpm inventory:legacy -- C:\\path\\XOM_Files.zip [output-directory]")
  inventoryLegacyArchive(archivePath, args[1]).then((report) => process.stdout.write(`${JSON.stringify(report, null, 2)}\n`))
}

type _ArchivePathGuard = ReturnType<typeof safeArchivePath>
void (0 as unknown as _ArchivePathGuard)
