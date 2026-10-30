import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { hashPassword, verifyPassword } from "@better-auth/utils/password"
import { resetPasswordInTransaction } from "../lib/auth/reset-password-transaction.ts"
import { withLegacyCredentialIssuer } from "../lib/auth/legacy-credential-adapter.ts"
import { verifyCompatiblePassword } from "../lib/auth/password-compatibility.ts"
import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"
import { PgDialect } from "drizzle-orm/pg-core"

const route = await readFile(new URL("../app/api/auth/reset-password/route.ts", import.meta.url), "utf8")
const transaction = await readFile(new URL("../lib/auth/reset-password-transaction.ts", import.meta.url), "utf8")
assert.match(transaction, /FOR UPDATE/)
assert.match(transaction, /neon_auth/)
assert.match(transaction, /providerId/)
assert.match(route, /db\.transaction\(async \(tx\)/)


const password = "New-password-for-flow-test-456!"
const oldPassword = "Old-password-for-flow-test-123!"
const passwordHash = await hashPassword(password)

function createTransaction({ token = "valid", updatedRows = 1, consumedRows = 1, returnedHash = passwordHash, errorAt } = {}) {
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
      if (calls.length === 2) return { rowCount: updatedRows, rows: Array.from({ length: updatedRows }, () => ({ password: returnedHash })) }
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
  password,
  validSignature: () => true,
}

const success = createTransaction({ updatedRows: 3 })
const result = await success.run(baseOptions)
assert.equal(result.userId, "user-id")
assert.deepEqual(result, { userId: "user-id", updatedCount: 3, consumedCount: 1 })
assert.equal(success.calls.length, 4)
assert.equal(success.committed, true)
assert.equal(success.rolledBack, false)
assert.equal(success.calls.length, 4)

for (const scenario of [
  { name: "invalid token", options: { token: "invalid" }, message: "invalid reset token" },
  { name: "zero updated rows", options: { updatedRows: 0 }, message: "credential account not found" },
  { name: "mismatched stored hash", options: { returnedHash: await hashPassword(oldPassword) }, message: "credential verification failed" },
  { name: "missing stored hash", options: { returnedHash: null }, message: "credential verification failed" },
  { name: "database error", options: { errorAt: 2 }, message: "mock database failure" },
  { name: "zero consumed rows", options: { consumedRows: 0 }, message: "reset token already used" },
]) {
  const failure = createTransaction(scenario.options)
  await assert.rejects(failure.run(baseOptions), new RegExp(scenario.message))
  assert.equal(failure.committed, false, `${scenario.name} must not commit`)
  assert.equal(failure.rolledBack, true, `${scenario.name} must roll back`)
}

const invalidSignature = createTransaction()
await assert.rejects(invalidSignature.run({ ...baseOptions, validSignature: () => false }), /invalid reset token/)
assert.equal(invalidSignature.calls.length, 1)
const wrongCandidate = createTransaction()
await assert.rejects(wrongCandidate.run({ ...baseOptions, password: oldPassword }), /credential verification failed/)
assert.equal(wrongCandidate.calls.length, 2, 'verification must fail before consuming the token or revoking sessions')
assert.equal(wrongCandidate.rolledBack, true)

assert.equal(await verifyPassword(passwordHash, password), true)
assert.equal(await verifyPassword(passwordHash, oldPassword), false)
console.log("Password reset transaction tests passed: lock, rollback, affected rows, errors, and hash verification.")

const userId = crypto.randomUUID()
const email = 'reset-fixture@example.invalid'
const now = new Date()
const previousHash = await hashPassword(oldPassword)
const otherUserId = crypto.randomUUID()
const database = {
  user: [{ id: userId, email, name: 'Reset fixture', emailVerified: true, createdAt: now, updatedAt: now }],
  account: [
    { id: crypto.randomUUID(), userId, accountId: email, providerId: 'credential', password: previousHash, createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), userId, accountId: email, providerId: 'credential', password: previousHash, createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), userId, accountId: 'oauth-fixture', providerId: 'oauth', password: null, updatedAt: now },
    { id: crypto.randomUUID(), userId: otherUserId, accountId: otherUserId, providerId: 'credential', password: previousHash, updatedAt: now },
  ],
  session: [{ id: crypto.randomUUID(), userId, token: 'offline-existing-session', expiresAt: new Date(Date.now() + 60000), createdAt: now, updatedAt: now }],
  verification: [],
}
const dialect = new PgDialect()
let consumed = false
const isolatedTx = {
  async execute(query) {
    const { sql, params } = dialect.sqlToQuery(query)
    if (sql.startsWith('SELECT')) {
      assert.match(sql, /used_at IS NULL AND expires_at > now\(\) FOR UPDATE/)
      return { rows: consumed ? [] : [{ user_id: userId, expires_at: new Date(Date.now() + 60000) }] }
    }
    if (sql.startsWith('UPDATE neon_auth.')) {
      assert.match(sql, /WHERE "userId" = \$\d+ AND "providerId" = 'credential' RETURNING password/)
      const rows = database.account.filter(row => row.userId === params[1] && row.providerId === 'credential')
      for (const row of rows) { row.password = params[0]; row.updatedAt = new Date() }
      return { rowCount: rows.length, rows: rows.map(row => ({ password: row.password })) }
    }
    if (sql.startsWith('UPDATE public.password_reset_token')) {
      const rowCount = consumed ? 0 : 1
      consumed = true
      return { rowCount }
    }
    if (sql.startsWith('DELETE FROM neon_auth.session')) {
      assert.match(sql, /WHERE "userId" = \$\d+/)
      database.session = database.session.filter(row => row.userId !== params[0])
      return { rowCount: 1 }
    }
    throw new Error('unexpected offline query')
  },
}
const resetResult = await resetPasswordInTransaction(isolatedTx, baseOptions)
assert.equal(resetResult.updatedCount, 2)
assert.equal(database.account[2].password, null, 'OAuth must not be changed')
assert.equal(database.account[3].password, previousHash, 'another user must not be changed')
assert.equal(database.session.length, 0, 'old sessions must be revoked')
await assert.rejects(resetPasswordInTransaction(isolatedTx, baseOptions), /invalid reset token/)
const memory = memoryAdapter(database)
const auth = betterAuth({
  secret: 'offline-reset-test-secret-not-a-project-secret-12345',
  baseURL: 'http://localhost:3000',
  database: options => withLegacyCredentialIssuer(memory(options)),
  emailAndPassword: { enabled: true, password: { verify: verifyCompatiblePassword } },
  advanced: { database: { generateId: 'uuid' } },
  rateLimit: { enabled: false },
  logger: { disabled: true },
})
async function login(candidate) {
  return auth.handler(new Request('http://localhost:3000/api/auth/sign-in/email', {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
    body: JSON.stringify({ email, password: candidate }),
  }))
}
assert.equal((await login(oldPassword)).status, 401)
assert.equal(database.session.length, 0)
const signedIn = await login(password)
assert.equal(signedIn.status, 200)
assert.equal(database.session.length, 1)
assert.ok(signedIn.headers.getSetCookie().some(cookie => cookie.includes('session_token=')))
console.log('PASS offline reset-to-login: SQL scope checked; both legacy duplicates updated; other user/OAuth unchanged; token reuse denied; old password 401; new password 200 and real Better Auth session.')
