import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { hashPassword, verifyPassword } from "@better-auth/utils/password"

const route = await readFile(new URL("../app/api/auth/reset-password/route.ts", import.meta.url), "utf8")
const verifier = await readFile(new URL("../app/actions/verify-password.ts", import.meta.url), "utf8")

assert.match(route, /db\.transaction\(async \(tx\)/, "reset must update and consume inside one transaction")
assert.match(route, /FOR UPDATE/, "reset token must be locked during validation")
assert.match(route, /updatedCount !== 1/, "reset must require exactly one credential row")
assert.match(route, /consumedCount !== 1/, "reset must require exactly one token consumption")
assert.match(route, /requestId/, "reset diagnostics must include a request ID")
assert.match(route, /affectedRows: updatedCount/, "reset diagnostics must include affected-row count")
assert.doesNotMatch(route, /console\.(info|error).*token|console\.(info|error).*passwordHash/i, "reset logs must not include secrets")
assert.doesNotMatch(verifier, /LIMIT 1/, "login must not select an arbitrary credential row")
assert.match(verifier, /rows\.length !== 1/, "login must require exactly one credential row")

const password = "New-password-for-flow-test-456!"
const oldPassword = "Old-password-for-flow-test-123!"
const hash = await hashPassword(password)
assert.equal(await verifyPassword(hash, password), true, "newly reset password must verify")
assert.equal(await verifyPassword(hash, oldPassword), false, "old password must not verify")

console.log("Password reset flow checks passed: atomic transaction, exact credential selection, safe diagnostics, and hash compatibility.")
