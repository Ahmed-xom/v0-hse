import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { assertConnectionMatchesIdentity, fetchVerifiedNeonIdentity } from "./aegis-neon-identity.mjs"
import { validateConfig } from "./validate-aegis-keyed-readonly.mjs"

const identity = { projectId: "spring-surf-19710398", branchId: "br-wispy-hill-apxr32tq", branchName: "aegis-pilot-20261009", host: "staging.example.test", databaseName: "hse_staging", verifiedAt: "2026-10-21T00:00:00Z", verificationMethod: "neon-provider-api-v2" }
const response = (body, ok = true, status = 200) => ({ ok, status, json: async () => body })

const verified = await fetchVerifiedNeonIdentity({ apiKey: "synthetic-only", expected: identity, fetchImpl: async () => response({ project_id: identity.projectId, branch: { id: identity.branchId, name: identity.branchName }, endpoints: [{ host: identity.host, database_name: identity.databaseName }] }) })
assert.deepEqual({ ...verified, verifiedAt: "fixed-in-test" }, { ...identity, verifiedAt: "fixed-in-test" })
await assert.rejects(() => fetchVerifiedNeonIdentity({ apiKey: "synthetic-only", expected: identity, fetchImpl: async () => response({ project_id: identity.projectId, branch: { id: "br-wrong", name: identity.branchName }, endpoints: [{ host: identity.host, database_name: identity.databaseName }] }) }), (error) => error.code === "NEON_IDENTITY_MISMATCH")
await assert.rejects(() => fetchVerifiedNeonIdentity({ expected: identity, fetchImpl: async () => response({}) }), (error) => error.code === "NEON_API_KEY_MISSING")
await assert.rejects(() => fetchVerifiedNeonIdentity({ apiKey: "synthetic-only", expected: identity, fetchImpl: async () => response({}, false, 503) }), (error) => error.code === "NEON_IDENTITY_API_FAILED")
assert.equal(assertConnectionMatchesIdentity("postgresql://user:pass@staging.example.test/hse_staging?sslmode=verify-full", identity), true)
await assert.rejects(() => Promise.resolve().then(() => assertConnectionMatchesIdentity("postgresql://user:pass@other.example.test/hse_staging?sslmode=verify-full", identity)), (error) => error.code === "NEON_CONNECTION_HOST_MISMATCH")

const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aegis-validator-"))
const contract = { version: "aegis-core-v1", approved: true, tables: Object.fromEntries([["company", "dbo.tblCompany"], ["business_unit", "dbo.tblBusinessUnit"], ["employee", "dbo.tblEmployee"]].map(([table, sourceTable]) => [table, { sourceTable, sourceKey: `${table}_source_key`, targetKey: `${table}_target_key`, normalization: "identity-v1", hmacAlgorithm: "HMAC-SHA256", hmacSecretSource: "AEGIS_KEYED_HASH_SECRET", fkContractVersion: "fk-v1" }])) }
const input = Object.fromEntries(["company", "business_unit", "employee"].map((table) => [table, { sourceCount: 1, keyedHashes: ["a".repeat(64)], contractVersion: "aegis-core-v1", keyDerivation: `${contract.tables[table].sourceKey}->${contract.tables[table].targetKey}:HMAC-SHA256` }]))
const base = { AEGIS_READ_ONLY_CONFIRM: "1", AEGIS_APPROVED_MAPPING_CONTRACT_JSON: path.join(dir, "contract.json"), AEGIS_VERIFIED_STAGING_IDENTITY_JSON: path.join(dir, "identity.json"), AEGIS_KEYED_INPUT_JSON: path.join(dir, "input.json"), AEGIS_KEYED_HASH_SECRET: "synthetic-only", DATABASE_URL_UNPOOLED: "postgresql://user:pass@staging.example.test/hse_staging?sslmode=verify-full" }
await fs.writeFile(base.AEGIS_APPROVED_MAPPING_CONTRACT_JSON, JSON.stringify(contract)); await fs.writeFile(base.AEGIS_VERIFIED_STAGING_IDENTITY_JSON, JSON.stringify(identity)); await fs.writeFile(base.AEGIS_KEYED_INPUT_JSON, JSON.stringify(input))
assert.equal((await validateConfig({})).code, "READ_ONLY_NOT_ENABLED")
assert.equal((await validateConfig({ AEGIS_READ_ONLY_CONFIRM: "1" })).code, "REQUIRED_VALIDATION_INPUT_MISSING")
assert.equal((await validateConfig(base)).identity.branchId, identity.branchId)
await fs.rm(dir, { recursive: true, force: true })
console.log("aegis keyed read-only validator synthetic tests passed")
