import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { hashPassword, verifyPassword } from "@better-auth/utils/password"
import { resetPasswordInTransaction } from "../lib/auth/reset-password-transaction.ts"

const route = await readFile(new URL("../app/api/auth/reset-password/route.ts", import.meta.url), "utf8")
const transaction = await readFile(new URL("../lib/auth/reset-password-transaction.ts", import.meta.url), "utf8")
assert.match(transaction, /FOR UPDATE/)
assert.match(transaction, /neon_auth/)
assert.match(transaction, /providerId/)
assert.match(route, /db\.transaction\(async \(tx\)/)


const password = "New-password-for-flow-test-456!"
const oldPassword = "Old-password-for-flow-test-123!"
const passwordHash = await hashPassword(password)

function createTransaction({ token = "valid", updatedRows = 1, consumedRows = 1, errorAt } = {}) {
  const calls = []
  let committed = false
  let rolledBack = false
  const tx = {
    async execute(query) {
      calls.push(query)
      if (errorAt === calls.length) throw new Error("mock database failure")
      if (calls.length === 1) {
        return token === "valid" ? { rows: [{ user_id: "user-id", expires_at: new Date() }] } : { rows: [] }
      }
      if (calls.length === 2) return { rowCount: updatedRows }
      if (calls.length === 3) return { rowCount: consumedRows }
      return { rowCount: 1 }
    },
  }
  return {
    tx,
    calls,
    async run(options) {
      try {
        const result = await resetPasswordInTransaction(tx, options)
        committed = true
        return result
      } catch (error) {
        rolledBack = true
        throw error
      }
    },
    get committed() {
      return committed
    },
    get rolledBack() {
      return rolledBack
    },
  }
}

const baseOptions = {
  tokenHash: "token-hash",
  rawToken: "raw-token",
  signature: "signature",
  passwordHash,
  validSignature: () => true,
}

const success = createTransaction()
const result = await success.run(baseOptions)
assert.equal(result.userId, "user-id")
assert.deepEqual(result, { userId: "user-id", updatedCount: 1, consumedCount: 1 })
assert.equal(success.calls.length, 4)
assert.equal(success.committed, true)
assert.equal(success.rolledBack, false)
assert.equal(success.calls.length, 4)

for (const scenario of [
  { name: "invalid token", options: { token: "invalid" }, message: "invalid reset token" },
  { name: "zero updated rows", options: { updatedRows: 0 }, message: "credential account not found" },
  { name: "database error", options: { errorAt: 2 }, message: "mock database failure" },
  { name: "zero consumed rows", options: { consumedRows: 0 }, message: "reset token already used" },
]) {
  const failure = createTransaction(scenario.options)
  await assert.rejects(failure.run(baseOptions), new RegExp(scenario.message))
  assert.equal(failure.committed, false, `${scenario.name} must not commit`)
  assert.equal(failure.rolledBack, true, `${scenario.name} must roll back`)
}

assert.equal(await verifyPassword(passwordHash, password), true)
assert.equal(await verifyPassword(passwordHash, oldPassword), false)
console.log("Password reset transaction tests passed: lock, rollback, affected rows, errors, and hash verification.")
