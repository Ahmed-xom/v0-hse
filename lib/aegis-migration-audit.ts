import { randomUUID } from "node:crypto"
import { sql } from "drizzle-orm"
import { db } from "@/lib/db"

type MigrationAnalysis = {
  matrix?: Array<Record<string, unknown>>
  columnMapping?: Array<Record<string, unknown>>
  fkGraph?: Array<Record<string, unknown>>
  duplicateAnalysis?: Array<Record<string, unknown>>
  orphanAnalysis?: Array<Record<string, unknown>>
}

export async function findExistingImport(packageSha256: string) { const result = await db.execute(sql`SELECT id, manifest FROM public.aegis_migration_import WHERE package_sha256 = ${packageSha256} LIMIT 1`); const row = (result.rows as Array<{ id?: string; manifest?: { summary?: Record<string, unknown> } }>)[0]; return row?.id ? { importId: row.id, summary: row.manifest?.summary ?? null } : null }

export async function recordReconciliationIssues(importId: string, analysis: MigrationAnalysis) {
  const issues: Array<{ type: string; severity: string; table?: string; details: Record<string, unknown> }> = []
  for (const row of analysis.matrix ?? []) {
    const matchType = String(row.matchType ?? "")
    if (matchType.includes("POSSIBLE") || matchType === "NO_MATCH") {
      issues.push({ type: matchType === "NO_MATCH" ? "UNMAPPED_TABLE" : "AMBIGUOUS_TABLE_MAPPING", severity: matchType === "NO_MATCH" ? "HIGH" : "MEDIUM", table: String(row.sourceTable ?? ""), details: row })
    }
  }
  for (const row of analysis.columnMapping ?? []) {
    if (String(row.mappingType ?? "").includes("NO_CONFIRMED")) issues.push({ type: "UNMAPPED_COLUMN", severity: "MEDIUM", table: String(row.sourceTable ?? ""), details: row })
  }
  for (const row of analysis.duplicateAnalysis ?? []) if (String(row.status).toUpperCase() !== "NOT AVAILABLE") issues.push({ type: "DUPLICATE_REVIEW", severity: "HIGH", details: row })
  for (const row of analysis.orphanAnalysis ?? []) if (String(row.status).toUpperCase() !== "NOT AVAILABLE") issues.push({ type: "ORPHAN_REVIEW", severity: "HIGH", details: row })
  if (!issues.length) return { issueCount: 0 }
  await db.transaction(async (tx) => {
    for (const issue of issues) await tx.execute(sql`INSERT INTO public.aegis_migration_issue (id, import_id, issue_type, severity, source_schema, source_table, details) VALUES (${randomUUID()}, ${importId}, ${issue.type}, ${issue.severity}, ${null}, ${issue.table ?? null}, ${JSON.stringify(issue.details)}::jsonb)`)
  })
  return { issueCount: issues.length }
}

export function migrationAuditSummary(analysis: MigrationAnalysis) {
  const matrix = analysis.matrix ?? []
  return {
    tablesProcessed: matrix.length,
    exactMatches: matrix.filter((row) => String(row.matchType).includes("EXACT")).length,
    possibleMatches: matrix.filter((row) => String(row.matchType).includes("POSSIBLE")).length,
    unmappedTables: matrix.filter((row) => row.matchType === "NO_MATCH").length,
    relationshipsReviewed: analysis.fkGraph?.length ?? 0,
    duplicateStatus: analysis.duplicateAnalysis?.[0]?.status ?? "NOT AVAILABLE",
    orphanStatus: analysis.orphanAnalysis?.[0]?.status ?? "NOT AVAILABLE",
  }
}
