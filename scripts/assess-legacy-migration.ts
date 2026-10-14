import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { addIssue, emptyDryRunSummary, validateManifest, type LegacyExportManifest } from '../lib/legacy-migration-contracts'

function sha256(filePath: string) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

function walk(root: string): string[] {
  if (!existsSync(root)) return []
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

export function assessLegacyPackage(packageDirectory: string) {
  const root = resolve(packageDirectory)
  const manifestPath = join(root, 'manifest.json')
  const summary = emptyDryRunSummary()
  if (!existsSync(manifestPath)) return addIssue(summary, { sourceTable: 'manifest', classification: 'REVIEW_REQUIRED', code: 'MANIFEST_MISSING', message: 'manifest.json is required' })
  let manifest: LegacyExportManifest
  try {
    const parsed = JSON.parse(readFileSync(manifestPath, 'utf8'))
    const validation = validateManifest(parsed)
    if (!validation.valid) return validation.errors.reduce((result, message) => addIssue(result, { sourceTable: 'manifest', classification: 'REVIEW_REQUIRED', code: 'MANIFEST_INVALID', message }), summary)
    manifest = validation.manifest
  } catch {
    return addIssue(summary, { sourceTable: 'manifest', classification: 'REVIEW_REQUIRED', code: 'MANIFEST_UNREADABLE', message: 'manifest.json is not valid JSON' })
  }
  const listed = new Set(manifest.files.map((file) => file.path))
  const actual = walk(root).filter((file) => relative(root, file) !== 'manifest.json')
  for (const file of actual) {
    const path = relative(root, file).replaceAll('\\', '/')
    if (!listed.has(path)) addIssue(summary, { sourceTable: 'package', classification: 'REVIEW_REQUIRED', code: 'UNLISTED_FILE', sourceKey: path, message: 'File is not listed in manifest' })
  }
  for (const file of manifest.files) {
    const path = join(root, file.path)
    if (!existsSync(path)) {
      addIssue(summary, { sourceTable: file.table ?? 'package', classification: 'MISSING_REFERENCE', sourceKey: file.path, code: 'FILE_MISSING', message: 'Manifest file is missing' })
      continue
    }
    if (sha256(path).toLowerCase() !== file.sha256.toLowerCase()) addIssue(summary, { sourceTable: file.table ?? 'package', classification: 'REVIEW_REQUIRED', sourceKey: file.path, code: 'CHECKSUM_MISMATCH', message: 'File checksum does not match manifest' })
    if (file.rowCount !== undefined) summary.sourceCounts[file.table ?? file.path] = file.rowCount
  }
  summary.packageSha256 = sha256(manifestPath)
  return summary
}

if (process.argv[1]?.endsWith('assess-legacy-migration.ts')) {
  const packageDirectory = process.argv[2]
  if (!packageDirectory) throw new Error('Usage: assess-legacy-migration <export-package-directory>')
  process.stdout.write(`${JSON.stringify(assessLegacyPackage(packageDirectory), null, 2)}\n`)
}
