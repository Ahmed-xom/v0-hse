import { randomUUID } from "node:crypto"

export function createAuthDiagnosticId() {
  return randomUUID()
}

export function getAuthRuntimeContext() {
  let database: { host?: string; database?: string } = {}
  try {
    const url = new URL(process.env.DATABASE_URL || "")
    database = { host: url.hostname, database: url.pathname.replace(/^\//, "") || undefined }
  } catch {
    database = { host: "unparseable" }
  }

  return {
    vercelEnv: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA || "unknown",
    deploymentUrl: process.env.VERCEL_URL || "unknown",
    database,
  }
}
