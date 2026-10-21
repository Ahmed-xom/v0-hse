import assert from "node:assert/strict"
import { ALLOWED_TABLES, TARGET_BRANCH_ID, classifyRows, validateAuthorization } from "./execute-aegis-staging-insert.mjs"

const contract = { approved: true, stagingAttestation: { provided: true, branchId: TARGET_BRANCH_ID } }
const authorization = { approved: true, branchId: TARGET_BRANCH_ID, operation: "INSERT", tables: [...ALLOWED_TABLES], production: false, ddl: false, update: false, delete: false }
validateAuthorization({ contract, authorization })
assert.throws(() => validateAuthorization({ contract, authorization, branchId: "wrong-branch" }), /unexpected branch/)
assert.throws(() => validateAuthorization({ contract: { approved: false }, authorization }), /approved mapping contract/)
assert.throws(() => validateAuthorization({ contract, authorization, tables: ["public.users"] }), /table allowlist/)
assert.throws(() => validateAuthorization({ contract, authorization, operation: "UPDATE" }), /operation UPDATE/)
const result = classifyRows([
  { status: "CONFIRMED_EXISTING", NewEmployeeId: "3" },
  { status: "BLOCKED", NewEmployeeId: "" },
])
assert.deepEqual(result.map((item) => item.action), ["skip-existing", "quarantine"])
assert.equal(result[0].reason, "target already exists")
console.log("aegis staging importer safety tests passed")
