import process from "node:process"

export const EXPECTED_STAGING = Object.freeze({
  projectId: "spring-surf-19710398",
  branchId: "br-wispy-hill-apxr32tq",
  branchName: "aegis-pilot-20261009",
})

const API_BASE = "https://console.neon.tech/api/v2"

function fail(code, message) {
  throw Object.assign(new Error(message), { code })
}

function readEndpoint(payload) {
  const endpoint = payload.endpoints?.[0] ?? payload.branch?.endpoints?.[0] ?? payload.endpoint
  if (!endpoint || typeof endpoint !== "object") fail("NEON_IDENTITY_ENDPOINT_MISSING", "Neon did not return endpoint identity.")
  const host = endpoint.host ?? endpoint.hostname
  const databaseName = endpoint.database_name ?? endpoint.databaseName ?? endpoint.database
  if (typeof host !== "string" || typeof databaseName !== "string") fail("NEON_IDENTITY_ENDPOINT_INCOMPLETE", "Neon endpoint identity is incomplete.")
  return { host, databaseName }
}

export async function fetchVerifiedNeonIdentity({ apiKey = process.env.NEON_API_KEY, fetchImpl = fetch, expected = EXPECTED_STAGING } = {}) {
  if (!apiKey) fail("NEON_API_KEY_MISSING", "A Neon API key is required only for the provider identity request.")
  const response = await fetchImpl(`${API_BASE}/projects/${encodeURIComponent(expected.projectId)}/branches/${encodeURIComponent(expected.branchId)}`, {
    method: "GET",
    headers: { accept: "application/json", authorization: `Bearer ${apiKey}` },
  })
  if (!response.ok) fail("NEON_IDENTITY_API_FAILED", `Neon identity request failed with status ${response.status}.`)
  const payload = await response.json()
  const branch = payload.branch ?? payload
  const projectId = branch.project_id ?? branch.projectId ?? payload.project_id ?? payload.projectId
  const branchId = branch.id ?? branch.branch_id ?? branch.branchId
  const branchName = branch.name
  if (projectId !== expected.projectId || branchId !== expected.branchId || branchName !== expected.branchName) fail("NEON_IDENTITY_MISMATCH", "Neon provider identity does not match the expected staging branch.")
  return { projectId, branchId, branchName, ...readEndpoint(payload), verifiedAt: new Date().toISOString(), verificationMethod: "neon-provider-api-v2" }
}

export function assertConnectionMatchesIdentity(connectionString, identity) {
  const url = new URL(connectionString)
  if (!["postgres:", "postgresql:"].includes(url.protocol)) fail("DATABASE_URL_INVALID", "Database URL must use PostgreSQL.")
  if (url.hostname !== identity.host) fail("NEON_CONNECTION_HOST_MISMATCH", "PostgreSQL host does not match Neon provider identity.")
  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ""))
  if (!databaseName || databaseName !== identity.databaseName) fail("NEON_CONNECTION_DATABASE_MISMATCH", "PostgreSQL database does not match Neon provider identity.")
  if (url.searchParams.get("sslmode") !== "verify-full") fail("NEON_CONNECTION_TLS_REQUIRED", "PostgreSQL connection must use sslmode=verify-full.")
  return true
}
