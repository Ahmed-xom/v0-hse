export const LEGACY_MIGRATION_CONTRACT_VERSION = "2026-10-14.1"

export type MigrationClassification =
  | "SAFE_TO_IMPORT"
  | "REVIEW_REQUIRED"
  | "NO_MATCH"
  | "DUPLICATE_SKIP"
  | "MISSING_REFERENCE"

export interface ExportManifestFile {
  path: string
  sha256: string
  sizeBytes: number
  rowCount?: number
  table?: string
}

export interface LegacyExportManifest {
  packageVersion: string
  source: { database: string; server?: string }
  exportedAt: string
  binaries: { included: boolean; externalized?: boolean }
  files: ExportManifestFile[]
}

export interface MigrationIssue {
  sourceTable: string
  sourceKey?: string
  classification: Exclude<MigrationClassification, "SAFE_TO_IMPORT"> 
  code: string
  message: string
}

export interface DryRunSummary {
  contractVersion: string
  packageSha256?: string
  sourceCounts: Record<string, number>
  targetCounts: Record<string, number>
  classifications: Record<MigrationClassification, number>
  issues: MigrationIssue[]
}

export const legacyLibraryMapping = {
  contractVersion: LEGACY_MIGRATION_CONTRACT_VERSION,
  tables: {
    tblLibrary: "public.document",
    tblLibraryHierarchy: "public.document_folder",
    tblLibraryAccess: "review_required_acl",
  },
  rules: [
    "Map folders before documents and reject missing parents or cycles.",
    "Never widen public access from a legacy ACL without review.",
    "Never overwrite an existing target document by default.",
  ],
} as const

export const legacyTrainingMapping = {
  contractVersion: LEGACY_MIGRATION_CONTRACT_VERSION,
  tables: {
    records: "public.training",
    employees: "public.employee",
    courses: "public.course",
    attendance: "review_required_attendance",
    certificates: "review_required_certificate",
    providers: "review_required_provider",
  },
  rules: [
    "Match employees by stable payroll identifier before reviewed identity matching.",
    "Never assign an unmapped record to a default company.",
    "Do not import derived notifications or expiry logs.",
  ],
} as const

export function validateManifest(manifest: unknown): { valid: true; manifest: LegacyExportManifest } | { valid: false; errors: string[] } {
  if (!manifest || typeof manifest !== "object") return { valid: false, errors: ["manifest must be an object"] }
  const value = manifest as Partial<LegacyExportManifest>
  const errors: string[] = []
  if (!value.packageVersion) errors.push("packageVersion is required")
  if (!value.exportedAt || Number.isNaN(Date.parse(value.exportedAt))) errors.push("exportedAt must be an ISO date")
  if (!value.source?.database) errors.push("source.database is required")
  if (!Array.isArray(value.files)) errors.push("files must be an array")
  for (const file of value.files ?? []) {
    if (!file.path || file.path.startsWith("/") || file.path.includes("..")) errors.push(`unsafe file path: ${file.path}`)
    if (!/^[a-f0-9]{64}$/i.test(file.sha256 ?? "")) errors.push(`invalid SHA-256 for ${file.path}`)
    if (!Number.isInteger(file.sizeBytes) || file.sizeBytes < 0) errors.push(`invalid size for ${file.path}`)
  }
  return errors.length ? { valid: false, errors } : { valid: true, manifest: value as LegacyExportManifest }
}

export function emptyDryRunSummary(packageSha256?: string): DryRunSummary {
  return {
    contractVersion: LEGACY_MIGRATION_CONTRACT_VERSION,
    packageSha256,
    sourceCounts: {},
    targetCounts: {},
    classifications: { SAFE_TO_IMPORT: 0, REVIEW_REQUIRED: 0, NO_MATCH: 0, DUPLICATE_SKIP: 0, MISSING_REFERENCE: 0 },
    issues: [],
  }
}

export function addIssue(summary: DryRunSummary, issue: MigrationIssue): DryRunSummary {
  summary.issues.push(issue)
  summary.classifications[issue.classification] += 1
  return summary
}

export function safeRelativePath(path: string): boolean {
  return Boolean(path) && !path.startsWith("/") && !path.includes("..") && !path.includes("\\")
}

export { legacyLibraryMapping as documentLibraryMapping }

export { legacyTrainingMapping as trainingMapping }

export type { LegacyExportManifest as MigrationManifest }

export function validateMigrationManifest(manifest: unknown) {
  return validateManifest(manifest)
}

export function createDryRunSummary(packageSha256?: string) {
  return emptyDryRunSummary(packageSha256)
}

export function recordMigrationIssue(summary: DryRunSummary, issue: MigrationIssue) {
  return addIssue(summary, issue)
}

export function isSafeRelativePath(path: string) {
  return safeRelativePath(path)
}

export const MIGRATION_CONTRACT_VERSION = LEGACY_MIGRATION_CONTRACT_VERSION

export const MIGRATION_CLASSIFICATIONS: MigrationClassification[] = ["SAFE_TO_IMPORT", "REVIEW_REQUIRED", "NO_MATCH", "DUPLICATE_SKIP", "MISSING_REFERENCE"]

export function validateManifestFile(file: unknown): file is ExportManifestFile {
  if (!file || typeof file !== "object") return false
  const value = file as ExportManifestFile
  return safeRelativePath(value.path) && /^[a-f0-9]{64}$/i.test(value.sha256) && Number.isInteger(value.sizeBytes) && value.sizeBytes >= 0
}

export function buildMigrationIssue(code: string, message: string, sourceTable: string, classification: MigrationIssue["classification"], sourceKey?: string): MigrationIssue {
  return { code, message, sourceTable, classification, sourceKey }
}

export function summarizeIssues(issues: MigrationIssue[]) {
  return issues.reduce<Record<string, number>>((result, issue) => {
    result[issue.code] = (result[issue.code] ?? 0) + 1
    return result
  }, {})
}

export function isMigrationReadOnlyContract() {
  return true
}

export const MIGRATION_WRITE_PHASE_REQUIRED = true

export const LEGACY_AUTH_TABLES = ["neon_auth.user", "neon_auth.account", "neon_auth.session", "neon_auth.verification"] as const

export function isExcludedAuthTable(table: string) {
  return LEGACY_AUTH_TABLES.includes(table as (typeof LEGACY_AUTH_TABLES)[number])
}

export const DERIVED_TRAINING_TABLES = ["training_notification", "training_expiry_email_log"] as const

export function isDerivedTrainingTable(table: string) {
  return DERIVED_TRAINING_TABLES.includes(table as (typeof DERIVED_TRAINING_TABLES)[number])
}

export function manifestFilesByTable(manifest: LegacyExportManifest) {
  return manifest.files.filter((file) => Boolean(file.table))
}

export function countManifestRows(manifest: LegacyExportManifest) {
  return manifest.files.reduce((total, file) => total + (file.rowCount ?? 0), 0)
}

export function migrationContractSummary() {
  return { version: LEGACY_MIGRATION_CONTRACT_VERSION, readOnly: true, authExcluded: true, writeApprovalRequired: MIGRATION_WRITE_PHASE_REQUIRED }
}

export const migrationContract = { version: LEGACY_MIGRATION_CONTRACT_VERSION, library: legacyLibraryMapping, training: legacyTrainingMapping }
