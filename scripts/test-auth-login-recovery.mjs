import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import crypto from 'node:crypto'
import ts from 'typescript'
import { betterAuth } from 'better-auth'
import { memoryAdapter } from 'better-auth/adapters/memory'
import { hashPassword, verifyPassword } from '@better-auth/utils/password'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server.js'
import { sql } from 'drizzle-orm'

let completed = false
process.once('beforeExit', () => {
  if (!completed) {
    console.error('FAIL auth regression suite did not finish')
    process.exitCode = 1
  }
})

function load(path, dependencies, env = {}, messages = []) {
  const exports = {}
  const js = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText
  vm.runInNewContext(js, {
    exports, require: name => {
      assert.ok(name in dependencies, `Unexpected import: ${name}`)
      return dependencies[name]
    },
    process: { env }, Date, URL, Promise,
    console: Object.fromEntries(['log', 'info', 'warn', 'error'].map(level => [level, (...args) => messages.push(args)])),
  })
  return exports
}
const loginClient = readFileSync('lib/auth-context.tsx', 'utf8')
assert.doesNotMatch(loginClient, /verifyUserPassword/, 'passwords must not be passed to a development-traced server action')
assert.match(loginClient, /authClient\.signIn\.email\(\{ email: normalizedEmail, password \}\)/, 'Better Auth must remain the mandatory password verifier')
const verify = load('lib/auth/password-compatibility.ts', { bcryptjs: bcrypt, '@better-auth/utils/password': { verifyPassword } }).verifyCompatiblePassword
const { withLegacyCredentialIssuer, selectCredentialAccount } = load('lib/auth/legacy-credential-adapter.ts', {})
assert.equal(typeof selectCredentialAccount, 'function', 'sign-in and preverification need the same credential selector')
const secret = 'Synthetic-offline-auth-test-secret-not-a-real-credential-12345'
const fixtureEmail = 'fixture@example.invalid'
const fixturePassword = 'Synthetic-offline-password-12345!'
const passwordHash = await hashPassword(fixturePassword)
const fixtureId = crypto.randomUUID()
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

for (const values of [
  { providerId: 'credential', accountId: fixtureId, userId: fixtureId },
  { providerId: 'credential', accountId: fixtureEmail, userId: fixtureId },
  { providerId: 'credential', accountId: fixtureId, userId: 'different-user' },
  { providerId: 'credential', accountId: 'different-account', userId: fixtureId },
  { providerId: 'oauth', accountId: fixtureId, userId: fixtureId },
  { providerId: 'credential', accountId: fixtureId, userId: fixtureId, issuer: 'explicit-other-issuer' },
]) {
  const original = { id: fixtureId, email: fixtureEmail, account: [values] }
  const adapter = withLegacyCredentialIssuer({ findOne: async () => original })
  const result = await adapter.findOne({ model: 'user', where: [] })
  const eligible = values.providerId === 'credential' && [fixtureId, fixtureEmail].includes(values.accountId) && values.userId === fixtureId && values.issuer == null
  if (eligible) {
    assert.equal(result.account[0].issuer, 'local:credential')
    assert.equal(result.account[0].accountId, fixtureId)
  } else if (values.providerId === 'credential') {
    assert.equal(result.account.length, 0)
  } else {
    assert.equal(result.account[0].issuer, values.issuer)
  }
  assert.equal(original.account[0].issuer, values.issuer)
  assert.equal(original.account[0].accountId, values.accountId)
}
console.log('PASS legacy issuer compatibility is read-only and rejects foreign identities, OAuth and explicit other issuers')

const bcryptHash = await bcrypt.hash(fixturePassword, 10)
for (const fixture of [
  { name: 'scrypt-uuid', hash: passwordHash, accountId: fixtureId },
  { name: 'bcrypt-legacy-email', hash: bcryptHash, accountId: fixtureEmail },
]) {
for (const mode of ['development', 'production']) {
  const options = load('lib/auth.ts', {
    'node:crypto': crypto,
    'better-auth': { betterAuth: options => options },
    'better-auth/adapters/drizzle': { drizzleAdapter: () => null },
    '@/lib/db': { db: {} },
    '@/lib/db/schema': { user: {}, account: {}, session: {}, verification: {} },
    '@/lib/auth/password-compatibility': { verifyCompatiblePassword: verify },
    '@/lib/auth/legacy-credential-adapter': { withLegacyCredentialIssuer },
  }, { NODE_ENV: mode, BETTER_AUTH_SECRET: secret, V0_RUNTIME_URL: 'https://fixture-preview.invalid', V0_BUILD_URL: 'https://fixture-preview.invalid' }).auth
  const origin = mode === 'production' ? 'https://www.amnkoo.online' : 'https://fixture-preview.invalid'
  const now = new Date()
  const database = {
    user: [{ id: fixtureId, email: fixtureEmail, name: 'Fixture', emailVerified: true, createdAt: now, updatedAt: now }],
    account: [{ id: crypto.randomUUID(), accountId: fixture.accountId, providerId: 'credential', userId: fixtureId, password: fixture.hash, createdAt: now, updatedAt: now }],
    session: [], verification: [],
  }
  const memory = memoryAdapter(database)
  const auth = betterAuth({ ...options, database: options => withLegacyCredentialIssuer(memory(options)), rateLimit: { enabled: false } })
  const context = await auth.$context
  assert.match(context.generateId({ model: 'session' }), uuid, `${mode}: UUID required by the real session schema`)
  async function signIn(password, requestOrigin = origin) {
    return auth.handler(new Request(`${origin}/api/auth/sign-in/email`, { method: 'POST', headers: { 'content-type': 'application/json', origin: requestOrigin }, body: JSON.stringify({ email: fixtureEmail, password }) }))
  }
  assert.equal((await signIn('wrong-password')).status, 401)
  assert.equal(database.session.length, 0)
  assert.equal((await signIn(fixturePassword, 'https://untrusted.invalid')).status, 403)
  const response = await signIn(fixturePassword)
  assert.equal(response.status, 200)
  assert.equal(database.session.length, 1)
  assert.match(database.session[0].id, uuid)
  const cookie = response.headers.getSetCookie().find(value => value.includes('session_token='))
  assert.ok(cookie)
  assert.match(cookie, /HttpOnly/i)
  assert.match(cookie, /Secure/i)
  assert.match(cookie, mode === 'production' ? /SameSite=Lax/i : /SameSite=None/i)
  const headers = { cookie: cookie.split(';')[0], origin }
  assert.equal((await auth.api.getSession({ headers: new Headers(headers) }))?.user.id, fixtureId)
  assert.equal((await auth.api.getSession({ headers: new Headers(headers) }))?.user.id, fixtureId)
  const signOut = await auth.handler(new Request(`${origin}/api/auth/sign-out`, { method: 'POST', headers }))
  assert.equal(signOut.status, 200)
  assert.equal(await auth.api.getSession({ headers: new Headers(headers) }), null)
  assert.equal(database.account[0].password, fixture.hash)
  assert.equal(database.account[0].accountId, fixture.accountId)
  console.log(`PASS ${mode}/${fixture.name}: actual config, UUID session, password rejection, origin rejection, cookie, reload and logout; credentials unchanged`)
}
}

const credentialUser = { id: fixtureId, email: fixtureEmail }
const current = { id: 'current', accountId: fixtureEmail, providerId: 'credential', userId: fixtureId, password: passwordHash, updatedAt: '2026-10-02T00:00:00Z', email: fixtureEmail }
const stale = { ...current, id: 'stale', password: bcryptHash, updatedAt: '2026-10-01T00:00:00Z' }
for (const rows of [[stale, current], [current, stale]]) {
  assert.equal(selectCredentialAccount(credentialUser, rows).id, 'current')
}
assert.equal(selectCredentialAccount(credentialUser, [current, { ...stale, updatedAt: current.updatedAt }]), null)
const messages = []
let credentialRows = [stale, current]
const { verifyUserPassword } = load('app/actions/verify-password.ts', {
  '@/lib/db': { db: { execute: async () => ({ rows: credentialRows }) } },
  'drizzle-orm': { sql },
  '@/lib/auth/password-compatibility': { verifyCompatiblePassword: verify },
  '@/lib/auth/legacy-credential-adapter': { selectCredentialAccount },
  '@/lib/auth/diagnostic': { createAuthDiagnosticId: () => 'offline-correlation', getAuthRuntimeContext: () => ({ mode: 'offline' }) },
}, {}, messages)
assert.equal(await verifyUserPassword(fixtureEmail, fixturePassword), true)
const oldOnlyPassword = 'Offline-stale-password-only-123!'
stale.password = await bcrypt.hash(oldOnlyPassword, 10)
assert.equal(await verifyUserPassword(fixtureEmail, oldOnlyPassword), false)
credentialRows = [current, { ...stale, updatedAt: current.updatedAt }]
assert.equal(await verifyUserPassword(fixtureEmail, fixturePassword), false)
credentialRows = [{ ...current, password: 'invalid-hash' }]
assert.equal(await verifyUserPassword(fixtureEmail, fixturePassword), false)
const diagnosticText = JSON.stringify(messages)
for (const forbidden of [fixturePassword, oldOnlyPassword, passwordHash, bcryptHash]) assert.ok(!diagnosticText.includes(forbidden), 'diagnostics must not contain credentials')
console.log('PASS shared selector: current password only; stale/ambiguous/malformed credentials denied; no password or hash in diagnostics')

async function recoveryCase({ found = true, count = 0, configured = true, sent = true } = {}) {
  let reads = 0
  let attempts = 0
  let committed = 0
  let rollbacks = 0
  const messages = []
  const db = {
    execute: async () => {
      reads++
      return { rows: reads === 1 ? (found ? [{ id: fixtureId, email: fixtureEmail, name: 'Fixture' }] : []) : [{ count }] }
    },
    transaction: async callback => {
      let pending = 0
      try {
        await callback({ execute: async query => { assert.ok(query); pending++; return { rowCount: 1 } } })
        committed += pending
      } catch (error) { rollbacks++; throw error }
    },
  }
  const { POST } = load('app/api/auth/forgot-password/route.ts', {
    'node:crypto': crypto,
    'next/server': { NextRequest, NextResponse },
    '@/lib/db': { db }, 'drizzle-orm': { sql },
    '@/lib/send-email': {
      getEmailConfiguration: () => ({ missing: configured ? undefined : 'SMTP_HOST' }),
      sendEmail: async ({ html }) => {
        attempts++
        assert.match(html, /https:\/\/www\.amnkoo\.online\/reset-password\?token=/)
        assert.doesNotMatch(html, /temporary password/i)
        return { sent }
      },
    },
  }, { NODE_ENV: 'production', BETTER_AUTH_SECRET: secret }, messages)
  const response = await POST(new NextRequest('https://www.amnkoo.online/api/auth/forgot-password', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: fixtureEmail }) }))
  const body = await response.json()
  assert.ok(!JSON.stringify(messages).includes(fixtureEmail))
  assert.ok(!JSON.stringify(body).includes(fixtureId))
  return { status: response.status, body, reads, attempts, committed, rollbacks, messages }
}
const missing = await recoveryCase({ found: false })
assert.equal(missing.status, 200)
assert.equal(missing.attempts, 0)
assert.equal(missing.committed, 0)
assert.match(JSON.stringify(missing.messages), /user_not_found/)
const limited = await recoveryCase({ count: 3 })
assert.deepEqual(limited.body, missing.body)
assert.equal(limited.attempts, 0)
assert.equal(limited.committed, 0)
assert.match(JSON.stringify(limited.messages), /rate_limited/)
const unconfigured = await recoveryCase({ configured: false })
assert.equal(unconfigured.status, 503)
assert.equal(unconfigured.committed, 0)
assert.equal(unconfigured.attempts, 0)
assert.match(JSON.stringify(unconfigured.messages), /smtp_not_configured/)
const rejected = await recoveryCase({ sent: false })
assert.equal(rejected.status, 503)
assert.equal(rejected.attempts, 1)
assert.equal(rejected.committed, 0)
assert.equal(rejected.rollbacks, 1)
const accepted = await recoveryCase()
assert.equal(accepted.status, 200)
assert.equal(accepted.attempts, 1)
assert.equal(accepted.committed, 1)
assert.deepEqual(accepted.body, missing.body)
console.log('PASS recovery route: generic responses, unchanged 3-request limit, missing SMTP fails before writing, SMTP rejection rolls back, accepted message commits')
completed = true
console.log('No external database writes, user creation, account changes or real email delivery performed by these tests.')
