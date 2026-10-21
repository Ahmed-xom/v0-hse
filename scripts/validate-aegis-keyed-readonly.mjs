import process from "node:process"
import fs from "node:fs/promises"
import crypto from "node:crypto"
import pg from "pg"
import { assertConnectionMatchesIdentity, fetchVerifiedNeonIdentity } from "./aegis-neon-identity.mjs"

const { Client } = pg
const ENABLE = "AEGIS_READ_ONLY_CONFIRM"
const INPUT = "AEGIS_KEYED_INPUT_JSON"
const CONTRACT = "AEGIS_APPROVED_MAPPING_CONTRACT_JSON"
const IDENTITY = "AEGIS_VERIFIED_STAGING_IDENTITY_JSON"
const HASH_SECRET = "AEGIS_KEYED_HASH_SECRET"
const MAP_VERSION = "aegis-core-v1"
const TABLES = Object.freeze({
  company: { relation: 'public."company"', source: "dbo.tblCompany" },
  business_unit: { relation: 'public."business_unit"', source: "dbo.tblBusinessUnit" },
  employee: { relation: 'public."employee"', source: "dbo.tblEmployee" },
})
const forbidden = /\b(insert|update|delete|merge|alter|create|drop|truncate|grant|revoke|copy|call|do|execute|comment|vacuum|refresh|neon_auth)\b/i
const safeError = (code) => ({ code, status: "stopped" })
const fail = (code, message) => { throw Object.assign(new Error(message), { code }) }

function parseStrictJson(raw, label) {
  let value
  try { value = JSON.parse(raw) } catch { fail(`${label}_INVALID_JSON`, `${label} is not valid JSON.`) }
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label}_INVALID_SCHEMA`, `${label} must be an object.`)
  return value
}

function assertExactKeys(value, allowed, label) {
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key))
  if (unknown.length) fail(`${label}_UNKNOWN_FIELDS`, `${label} contains unsupported fields.`)
}

function validateContract(contract) {
  assertExactKeys(contract, ["version", "approved", "tables"], "mapping contract")
  if (contract.version !== MAP_VERSION || contract.approved !== true || !contract.tables || typeof contract.tables !== "object") fail("MAPPING_CONTRACT_NOT_APPROVED", "The mapping contract must be approved and use the expected version.")
  for (const [table, config] of Object.entries(TABLES)) {
    const item = contract.tables[table]
    if (!item || typeof item !== "object") fail("MAPPING_CONTRACT_INCOMPLETE", `Approved mapping contract is missing ${table}.`)
    assertExactKeys(item, ["sourceTable", "sourceKey", "targetKey", "normalization", "hmacAlgorithm", "hmacSecretSource", "fkContractVersion"], `${table} mapping contract`)
    if (item.sourceTable !== config.source || !item.sourceKey || !item.targetKey || !item.normalization || item.hmacAlgorithm !== "HMAC-SHA256" || item.hmacSecretSource !== "AEGIS_KEYED_HASH_SECRET" || !item.fkContractVersion) fail("MAPPING_CONTRACT_INVALID", `${table} mapping contract is incomplete or mismatched.`)
  }
}

function validateIdentity(identity, connectionString) {
  assertExactKeys(identity, ["projectId", "branchId", "branchName", "host", "databaseName", "verifiedAt", "verificationMethod"], "staging identity")
  if (identity.projectId !== "spring-surf-19710398" || identity.branchId !== "br-wispy-hill-apxr32tq" || identity.branchName !== "aegis-pilot-20261009" || identity.verificationMethod !== "neon-provider-api-v2") fail("STAGING_IDENTITY_UNVERIFIED", "A verified Neon provider identity is required.")
  assertConnectionMatchesIdentity(connectionString, identity)
}

function validateInput(input, contract) {
  const allowedTables = Object.keys(TABLES)
  assertExactKeys(input, allowedTables, "keyed input")
  for (const table of allowedTables) {
    const item = input[table]
    if (!item || typeof item !== "object") fail("KEYED_INPUT_INCOMPLETE", `${table} keyed input is missing.`)
    assertExactKeys(item, ["sourceCount", "keyedHashes", "contractVersion", "keyDerivation"], `${table} keyed input`)
    const config = contract.tables[table]
    if (item.contractVersion !== MAP_VERSION || item.keyDerivation !== `${config.sourceKey}->${config.targetKey}:HMAC-SHA256`) fail("KEYED_INPUT_CONTRACT_MISMATCH", `${table} keyed input does not match the approved contract.`)
    if (!Number.isSafeInteger(item.sourceCount) || item.sourceCount < 0 || !Array.isArray(item.keyedHashes) || item.keyedHashes.length !== item.sourceCount || item.keyedHashes.some((v) => typeof v !== "string" || !/^[0-9a-f]{64}$/.test(v))) fail("KEYED_INPUT_INVALID", `${table} input count or keyed hash schema is invalid.`)
  }
}

function validateSql(sql, table) {
  if (forbidden.test(sql) || !/^WITH[\s\S]+SELECT[\s\S]*FROM public\./i.test(sql) || !sql.includes(TABLES[table].relation) || /neon_auth/i.test(sql)) fail("QUERY_ALLOWLIST_FAILED", `${table} query failed the fixed allowlist.`)
}

export async function validateConfig(env = process.env) {
  if (env[ENABLE] !== "1") return safeError("READ_ONLY_NOT_ENABLED")
  if (!env[CONTRACT] || !env[IDENTITY] || !env[INPUT] || !env[HASH_SECRET]) return safeError("REQUIRED_VALIDATION_INPUT_MISSING")
  if (!env.DATABASE_URL_UNPOOLED && !env.DATABASE_URL) return safeError("DATABASE_URL_MISSING")
  const connectionString = env.DATABASE_URL_UNPOOLED || env.DATABASE_URL
  if (/\b(prod|production|live)\b/i.test(connectionString)) return safeError("PRODUCTION_DATABASE_REJECTED")
  const contract = parseStrictJson(await fs.readFile(env[CONTRACT], "utf8"), "mapping contract")
  validateContract(contract)
  const identity = parseStrictJson(await fs.readFile(env[IDENTITY], "utf8"), "staging identity")
  validateIdentity(identity, connectionString)
  const input = parseStrictJson(await fs.readFile(env[INPUT], "utf8"), "keyed input")
  validateInput(input, contract)
  return { contract, identity, input, connectionString }
}

async function main() {
  let config
  try { config = await validateConfig() } catch (error) {
    console.error(JSON.stringify(safeError(error.code || "VALIDATION_INPUT_REJECTED")))
    process.exitCode = 2
    return
  }
  const client = new Client({ connectionString: config.connectionString, ssl: { rejectUnauthorized: true }, application_name: "aegis-keyed-readonly-validator" })
  const result = { mode: "keyed-read-only", writesExecuted: false, schemaChanged: false, personalDataOutput: false, hashesOutput: false, tables: {} }
  try {
    await client.connect()
    await client.query("BEGIN READ ONLY")
    await client.query("SET LOCAL statement_timeout = '30s'")
    const identity = await client.query("SELECT current_database() AS database_name, current_setting('transaction_read_only') AS transaction_read_only")
    if (identity.rows[0]?.transaction_read_only !== "on" || !identity.rows[0]?.database_name || /prod|production|live/i.test(identity.rows[0].database_name)) fail("READ_ONLY_DATABASE_CHECK_FAILED", "Database identity or read-only state could not be verified.")
    for (const table of Object.keys(TABLES)) {
      const sql = `WITH source_keys AS (SELECT unnest($1::text[]) AS keyed_hash), target_keys AS (SELECT encode(hmac(${config.contract.tables[table].targetKey}::text, $2, 'sha256'), 'hex') AS keyed_hash FROM ${TABLES[table].relation} WHERE ${config.contract.tables[table].targetKey} IS NOT NULL), matched AS (SELECT s.keyed_hash FROM source_keys s INNER JOIN target_keys t USING (keyed_hash)) SELECT (SELECT count(*) FROM source_keys)::int AS source_count, (SELECT count(*) FROM target_keys)::int AS target_count, (SELECT count(*) FROM matched)::int AS matched_count`
      validateSql(sql, table)
      result.tables[table] = { status: "validated", ...(await client.query(sql, [config.input[table].keyedHashes, process.env[HASH_SECRET]])).rows[0], orphan_count: null }
    }
    await client.query("ROLLBACK")
  } catch { try { await client.query("ROLLBACK") } catch {} result.status = "stopped"; result.reason = "READ_ONLY_VALIDATION_FAILED"; process.exitCode = 4 } finally { await client.end().catch(() => {}) }
  console.log(JSON.stringify(result, null, 2))
}

if (import.meta.url === `file://${process.argv[1]}`) await main()
