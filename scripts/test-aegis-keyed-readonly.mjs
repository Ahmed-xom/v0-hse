import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { validateConfig } from "./validate-aegis-keyed-readonly.mjs"

const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aegis-validator-"))
const contract = {
  version: "aegis-core-v1", approved: true,
  tables: Object.fromEntries([
    ["company", "dbo.tblCompany"], ["business_unit", "dbo.tblBusinessUnit"], ["employee", "dbo.tblEmployee"],
  ].map(([table, sourceTable]) => [table, { sourceTable, sourceKey: `${table}_source_key`, targetKey: `${table}_target_key`, normalization: "identity-v1", hmacAlgorithm: "HMAC-SHA256", hmacSecretSource: "AEGIS_KEYED_HASH_SECRET", fkContractVersion: "fk-v1" }])),
}
const input = Object.fromEntries(["company", "business_unit", "employee"].map((table) => [table, { sourceCount: 1, keyedHashes: ["a".repeat(64)], contractVersion: "aegis-core-v1", keyDerivation: `${contract.tables[table].sourceKey}->${contract.tables[table].targetKey}:HMAC-SHA256` }]))
const identity = { projectId: "project-1", branchId: "branch-1", host: "staging.example.test", databaseName: "hse_staging", verifiedAt: "2026-10-21T00:00:00Z", verificationMethod: "trusted-provider-attestation" }
const base = { ["AEGIS_READ_ONLY_CONFIRM"]: "1", AEGIS_APPROVED_MAPPING_CONTRACT_JSON: path.join(dir, "contract.json"), AEGIS_VERIFIED_STAGING_IDENTITY_JSON: path.join(dir, "identity.json"), AEGIS_KEYED_INPUT_JSON: path.join(dir, "input.json"), AEGIS_KEYED_HASH_SECRET: "synthetic-only", DATABASE_URL_UNPOOLED: "postgresql://user:pass@staging.example.test/db?sslmode=verify-full" }
await fs.writeFile(base.AEGIS_APPROVED_MAPPING_CONTRACT_JSON, JSON.stringify(contract))
await fs.writeFile(base.AEGIS_VERIFIED_STAGING_IDENTITY_JSON, JSON.stringify(identity))
await fs.writeFile(base.AEGIS_KEYED_INPUT_JSON, JSON.stringify(input))

assert.equal((await validateConfig({})).code, "READ_ONLY_NOT_ENABLED")
assert.equal((await validateConfig({ AEGIS_READ_ONLY_CONFIRM: "1" })).code, "REQUIRED_VALIDATION_INPUT_MISSING")
assert.equal((await validateConfig({ ...base, AEGIS_STAGING_CONFIRMED: "1" })).identity.branchId, "branch-1")
await fs.writeFile(base.AEGIS_KEYED_INPUT_JSON, JSON.stringify({ ...input, extra: true }))
await assert.rejects(() => validateConfig(base), (error) => error.code === "keyed input_UNKNOWN_FIELDS")
await fs.rm(dir, { recursive: true, force: true })
console.log("aegis keyed read-only validator synthetic tests passed")
