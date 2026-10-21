import process from "node:process"
import fs from "node:fs/promises"
import pg from "pg"

const { Client } = pg
const ENABLE = "AEGIS_READ_ONLY_CONFIRM"
const STAGING = "AEGIS_STAGING_CONFIRMED"
const HASH_SECRET = "AEGIS_KEYED_HASH_SECRET"
const INPUT = "AEGIS_KEYED_INPUT_JSON"
const TABLES = ["company", "business_unit", "employee"]
const forbidden = /\b(insert|update|delete|merge|alter|create|drop|truncate|grant|revoke|copy|call|do|execute|neon_auth)\b/i

const stop = (code, reason, details = {}) => ({ code, status: "stopped", reason, ...details })

if (process.env[ENABLE] !== "1") {
  console.error(JSON.stringify(stop("READ_ONLY_NOT_ENABLED", `Set ${ENABLE}=1 explicitly to enable validation. No connection was attempted.`), null, 2))
  process.exitCode = 2
  process.exit()
}
if (process.env[STAGING] !== "1") {
  console.error(JSON.stringify(stop("STAGING_NOT_CONFIRMED", `Set ${STAGING}=1 only after confirming the DATABASE_URL points to an unprotected non-production staging branch. No connection was attempted.`), null, 2))
  process.exitCode = 2
  process.exit()
}
if (!process.env[HASH_SECRET]) {
  console.error(JSON.stringify(stop("HASH_SECRET_MISSING", `Set ${HASH_SECRET} at runtime. It is never printed and is not persisted.`), null, 2))
  process.exitCode = 2
  process.exit()
}
if (!process.env[INPUT]) {
  console.error(JSON.stringify(stop("KEYED_INPUT_MISSING", `Set ${INPUT} to a local JSON file containing only keyed hashes and source aggregates. No source rows or PII are accepted.`), null, 2))
  process.exitCode = 2
  process.exit()
}

const input = JSON.parse(await fs.readFile(process.env[INPUT], "utf8"))
const expected = Object.fromEntries(TABLES.map((table) => [table, input[table] ?? null]))
const result = { mode: "keyed-read-only", writesExecuted: false, schemaChanged: false, personalDataOutput: false, hashesOutput: false, tables: {} }

for (const table of TABLES) {
  const item = expected[table]
  if (!item || item.keyStrategyConfirmed !== true) {
    result.tables[table] = stop("KEY_OR_TRANSFORMATION_UNCONFIRMED", "Stable key and transformation contract must be explicitly confirmed for this table before validation.")
  } else if (!Array.isArray(item.keyedHashes) || item.keyedHashes.some((value) => typeof value !== "string" || value.length < 16)) {
    result.tables[table] = stop("INVALID_KEYED_INPUT", "Input must contain keyed hashes only; raw identifiers are not accepted.")
  }
}

if (Object.values(result.tables).some((item) => item.status === "stopped")) {
  console.log(JSON.stringify(result, null, 2))
  process.exitCode = 3
  process.exit()
}

const client = new Client({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL, application_name: "aegis-keyed-readonly-validator" })
try {
  await client.connect()
  await client.query("BEGIN READ ONLY")
  await client.query("SET LOCAL statement_timeout = '30s'")
  const identity = await client.query("SELECT current_database() AS database_name, current_setting('transaction_read_only') AS transaction_read_only")
  const databaseName = String(identity.rows[0]?.database_name ?? "").toLowerCase()
  if (!databaseName || /prod|production|live/.test(databaseName) || identity.rows[0]?.transaction_read_only !== "on") {
    throw new Error("STAGING_OR_READ_ONLY_CHECK_FAILED")
  }

  const queries = {
    company: { table: 'public."company"', key: '"id"' },
    business_unit: { table: 'public."business_unit"', key: '"id"' },
    employee: { table: 'public."employee"', key: '"id"' },
  }
  for (const table of TABLES) {
    const { table: relation, key } = queries[table]
    const sql = `WITH source_keys AS (SELECT unnest($1::text[]) AS keyed_hash), target_keys AS (SELECT encode(hmac(${key}::text, $2, 'sha256'), 'hex') AS keyed_hash FROM ${relation} WHERE ${key} IS NOT NULL), matched AS (SELECT s.keyed_hash FROM source_keys s INNER JOIN target_keys t USING (keyed_hash)), source_dupes AS (SELECT keyed_hash FROM source_keys GROUP BY keyed_hash HAVING count(*) > 1), target_dupes AS (SELECT keyed_hash FROM target_keys GROUP BY keyed_hash HAVING count(*) > 1) SELECT (SELECT count(*) FROM source_keys)::int AS source_count, (SELECT count(*) FROM target_keys)::int AS target_count, (SELECT count(*) FROM matched)::int AS matched_count, (SELECT count(*) FROM source_keys s LEFT JOIN matched m USING (keyed_hash) WHERE m.keyed_hash IS NULL)::int AS source_only_count, (SELECT count(*) FROM target_keys t LEFT JOIN matched m USING (keyed_hash) WHERE m.keyed_hash IS NULL)::int AS target_only_count, (SELECT count(*) FROM source_dupes)::int AS source_duplicate_key_count, (SELECT count(*) FROM target_dupes)::int AS target_duplicate_key_count, (SELECT count(*) FROM source_keys WHERE keyed_hash IS NULL OR keyed_hash = '')::int AS source_null_key_count, (SELECT count(*) FROM target_keys WHERE keyed_hash IS NULL OR keyed_hash = '')::int AS target_null_key_count`
    if (forbidden.test(sql) || !/^WITH[\s\S]+SELECT[\s\S]*FROM public\./i.test(sql) || /neon_auth/i.test(sql)) throw new Error(`QUERY_ALLOWLIST_FAILED:${table}`)
    const row = (await client.query(sql, [item.keyedHashes, process.env[HASH_SECRET]])).rows[0]
    result.tables[table] = { status: "validated", ...row, orphan_count: null, note: "Only aggregate counts returned; FK orphan validation requires an approved non-PII FK hash input and target relationship contract." }
  }
  await client.query("ROLLBACK")
} catch (error) {
  try { await client.query("ROLLBACK") } catch {}
  result.status = "stopped"
  result.reason = String(error?.message ?? error)
  process.exitCode = 4
} finally {
  await client.end().catch(() => {})
}

console.log(JSON.stringify(result, null, 2))
