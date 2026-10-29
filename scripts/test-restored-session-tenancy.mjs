import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import vm from 'node:vm'
import ts from 'typescript'
import { betterAuth } from 'better-auth'
import { memoryAdapter } from 'better-auth/adapters/memory'
import { hashPassword } from '@better-auth/utils/password'
import bcrypt from 'bcryptjs'

const require = createRequire(import.meta.url)
const source = path => readFileSync(resolve(path), 'utf8')
let passed = 0
function check(name, fn) { if (process.env.RESTORED_TEST_FILTER && !name.includes(process.env.RESTORED_TEST_FILTER)) return Promise.resolve(); return Promise.resolve().then(fn).then(() => { passed++; console.log(`PASS ${name}`) }) }
function load(path, dependencies) {
  const exports = {}
  const js = ts.transpileModule(source(path), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText
  vm.runInNewContext(js, { exports, require: name => { if (!(name in dependencies)) throw new Error(`Forbidden test import: ${name}`); return dependencies[name] }, console: { error() {}, log() {} }, Date, Math, Promise, process: { env: {} } }, { timeout: 1000 })
  return exports
}
function initializer(name, context) {
  const text = source('lib/auth-context.tsx')
  const file = ts.createSourceFile('auth-context.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let expression
  function visit(node) { if (ts.isVariableDeclaration(node) && node.name.getText(file) === name) expression = node.initializer?.getText(file); ts.forEachChild(node, visit) }
  visit(file)
  assert.ok(expression)
  const js = ts.transpileModule(`globalThis.run = ${expression}`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
  const sandbox = vm.createContext(context)
  vm.runInContext(js, sandbox)
  return sandbox.run
}
const compatible = load('lib/auth/password-compatibility.ts', { bcryptjs: bcrypt, '@better-auth/utils/password': await import('@better-auth/utils/password') }).verifyCompatiblePassword
const password = 'Synthetic-offline-test-only-123!'
const scryptHash = await hashPassword(password)
const bcryptHash = await bcrypt.hash(password, 10)
for (const [format, hash] of [['scrypt', scryptHash], ['bcrypt', bcryptHash]]) {
  await check(`${format} compatibility without rewriting credentials`, async () => {
    assert.equal(await compatible({ hash, password }), true)
    assert.equal(await compatible({ hash, password: 'wrong' }), false)
  })
}
await check('malformed hashes fail closed', async () => { assert.equal(await compatible({ hash: 'invalid', password }), false) })

for (const [format, hash] of [['scrypt', scryptHash], ['bcrypt', bcryptHash]]) {
  await check(`real Better Auth ${format} sign-in, cookie, reload and sign-out in memory`, async () => {
    const now = new Date()
    const database = { user: [], account: [], session: [], verification: [] }
    const auth = betterAuth({ database: memoryAdapter(database), secret: 'Synthetic-memory-test-secret-not-project-secret-12345', baseURL: 'https://fixture.invalid', trustedOrigins: ['https://fixture.invalid'], emailAndPassword: { enabled: true, password: { verify: compatible } }, session: { expiresIn: 604800, updateAge: 0 }, advanced: { defaultCookieAttributes: { sameSite: 'lax', secure: true, httpOnly: true } }, rateLimit: { enabled: false } })
    const created = await auth.api.signUpEmail({ body: { email: 'fixture@example.invalid', name: 'Fixture', password } })
    assert.equal(database.account.length, 1)
    database.account[0].password = hash
    const signin = await auth.handler(new Request('https://fixture.invalid/api/auth/sign-in/email', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://fixture.invalid' }, body: JSON.stringify({ email: 'fixture@example.invalid', password }) }))
    assert.equal(signin.status, 200)
    const cookies = signin.headers.getSetCookie()
    const cookie = cookies.find(value => value.includes('session_token='))
    assert.ok(cookie)
    assert.match(cookie, /HttpOnly/i)
    assert.match(cookie, /Secure/i)
    assert.match(cookie, /SameSite=Lax/i)
    const headers = new Headers({ cookie: cookie.split(';')[0], origin: 'https://fixture.invalid' })
    const first = await auth.api.getSession({ headers })
    assert.equal(first?.user.id, created.user.id)
    const reload = await auth.api.getSession({ headers: new Headers(headers) })
    assert.equal(reload?.session.id, first.session.id)
    const signout = await auth.handler(new Request('https://fixture.invalid/api/auth/sign-out', { method: 'POST', headers }))
    assert.equal(signout.status, 200)
    assert.equal(await auth.api.getSession({ headers }), null)
    assert.equal(database.account[0].password, hash)
  })
}

const profile = { id: 'fixture-user', email: 'fixture@example.invalid', status: 'Active', banned: false, name: 'Fixture', payrollNo: 'TEST', role: 'USER', designation: '', businessUnit: '' }
async function loginCase(options = {}) {
  const calls = []
  let exposed = false
  const run = initializer('login', {
    verifyUserPassword: async () => { calls.push('verify'); return options.wrong ? false : true },
    authClient: { signIn: { email: async () => { calls.push('signIn'); return { error: options.error ?? null } } }, getSession: async () => { calls.push('session'); return { error: null, data: options.missing ? null : { user: { id: 'fixture-user', email: options.mismatch ? 'other@example.invalid' : profile.email }, session: { userId: 'fixture-user' } } } }, signOut: async () => { calls.push('signOut'); return { error: null } } },
    getUserByEmail: async () => { calls.push('profile'); return { ...profile, banned: options.banned ?? false } },
    getUserJourneyAccess: async () => false, getUserJourneyApprover: async () => false,
    setUser: () => { exposed = true; calls.push('expose') }, createUpcomingMeetingReminders: async () => {},
  })
  const result = await run(profile.email, password)
  return { result, calls, exposed }
}
await check('client login establishes and verifies server session before exposing identity', async () => {
  const actual = await loginCase()
  assert.equal(actual.result.success, true)
  assert.deepEqual(actual.calls.slice(0, 5), ['verify', 'signIn', 'session', 'profile', 'expose'])
  assert.equal(actual.exposed, true)
  assert.equal(source('lib/auth-context.tsx').includes('localStorage'), false)
})
for (const options of [{ wrong: true }, { error: { message: 'failure' } }, { missing: true }, { mismatch: true }, { banned: true }]) {
  await check(`client rejects ${Object.keys(options)[0]} without exposing identity`, async () => { const actual = await loginCase(options); assert.equal(actual.result.success, false); assert.equal(actual.exposed, false) })
}
await check('client logout revokes server session before clearing identity', async () => {
  const calls = []
  await initializer('logout', { authClient: { signOut: async () => { calls.push('revoke'); return { error: null } } }, setUser: () => calls.push('clear'), setActiveCompanyIdState() {} })()
  assert.deepEqual(calls, ['revoke', 'clear'])
})

const column = (table, name) => `${table}.${name}`
const tables = Object.fromEntries(['company', 'companyMembership', 'user', 'training'].map(table => [table, new Proxy({}, { get: (_, name) => column(table, name) })]))
const operators = { and: (...args) => ({ op: 'and', args }), or: (...args) => ({ op: 'or', args }), eq: (a, b) => ({ op: 'eq', a, b }), desc: x => x, ilike: (a, b) => ({ op: 'ilike', a, b }), sql: (strings, ...values) => ({ strings, values }) }
function matches(condition, row) {
  if (!condition) return true
  if (condition.op === 'and') return condition.args.every(c => matches(c, row))
  if (condition.op === 'or') return condition.args.some(c => matches(c, row))
  const value = x => typeof x === 'string' && x in row ? row[x] : x
  if (condition.op === 'eq') return value(condition.a) === value(condition.b)
  if (condition.op === 'ilike') return String(value(condition.a)).toLowerCase().includes(condition.b.replaceAll('%', '').toLowerCase())
  throw new Error('Unsupported fixture predicate')
}
const memberships = [
  { 'companyMembership.companyId': 'A', 'companyMembership.userId': 'fixture-user', 'companyMembership.status': 'Active', 'company.status': 'Active', 'user.banned': false, companyId: 'A' },
  { 'companyMembership.companyId': 'B', 'companyMembership.userId': 'other-user', 'companyMembership.status': 'Active', 'company.status': 'Active', 'user.banned': false, companyId: 'B' },
  { 'companyMembership.companyId': 'C', 'companyMembership.userId': 'fixture-user', 'companyMembership.status': 'Inactive', 'company.status': 'Active', 'user.banned': false, companyId: 'C' },
]
let currentSession = { user: { id: 'fixture-user', email: profile.email } }
const sessionDependency = { api: { getSession: async () => currentSession } }
const headerDependency = { headers: async () => new Headers() }
const access = load('lib/company-access.ts', { 'next/headers': headerDependency, 'drizzle-orm': operators, '@/lib/auth': { auth: sessionDependency }, '@/lib/db/schema': tables, '@/lib/db': { db: { select: () => ({ from: () => { const builder = { innerJoin: () => builder, where: async condition => memberships.filter(row => matches(condition, row)) }; return builder } }) } } })
await check('company membership is bound to server identity and active status', async () => { assert.deepEqual(Array.from((await access.getAuthorizedCompanyIds()).companyIds), ['A']); await assert.rejects(access.requireCompanyAccess('B')); await assert.rejects(access.requireCompanyAccess('C')) })
await check('anonymous membership access fails closed', async () => { currentSession = null; await assert.rejects(access.requireCompanyAccess('A')); currentSession = { user: { id: 'fixture-user', email: profile.email } } })
let dataCalls = 0
let written
const records = [{ id: 'record-A', companyId: 'A', employeeName: 'Own company' }, { id: 'record-B', companyId: 'B', employeeName: 'Other company' }]
const dataDB = {
  select: () => ({ from: () => ({ where: condition => ({ orderBy: async () => { dataCalls++; return records.filter(row => matches(condition, { ...row, 'training.companyId': row.companyId, 'training.id': row.id })) } }) }) }),
  insert: () => ({ values: value => { dataCalls++; written = value; const chain = { then: done => Promise.resolve().then(done), onConflictDoNothing: () => chain, returning: async () => [{ id: value.id }] }; return chain } }),
  update: () => ({ set: () => ({ where: condition => ({ returning: async () => { dataCalls++; return records.filter(row => matches(condition, { 'training.companyId': row.companyId, 'training.id': row.id })) } }) }) }),
  delete: () => ({ where: condition => ({ returning: async () => { dataCalls++; return records.filter(row => matches(condition, { 'training.companyId': row.companyId, 'training.id': row.id })) } }) }),
}
const training = load('app/actions/manage-training.ts', { 'drizzle-orm': operators, '@/lib/db': { db: dataDB }, '@/lib/db/schema': tables, '@/lib/company-access': access, 'next/cache': { revalidatePath() {} } })
await check('training reads cannot return another company records', async () => { const result = await training.getTrainingRecords(undefined, 'A'); assert.equal(result.success, true); assert.deepEqual(Array.from(result.data, row => row.id), ['record-A']) })
await check('training updates and deletes require both record ID and company', async () => { assert.equal((await training.updateTrainingRecord('record-B', { companyId: 'A', status: 'Completed' })).success, false); assert.equal((await training.deleteTrainingRecord('record-B', 'A')).success, false) })
await check('training writes inject validated company scope', async () => { assert.equal((await training.createTrainingRecord({ employeeName: 'Own company', employeeCode: 'TEST', courseName: 'Test', status: 'Pending', companyId: 'A' })).success, true); assert.equal(written.companyId, 'A') })
await check('all six training operations reject foreign company before any data call', async () => {
  const before = dataCalls
  const input = { employeeName: 'Fixture', employeeCode: 'TEST', courseName: 'Test', status: 'Pending', companyId: 'B' }
  for (const result of [await training.getTrainingRecords(undefined, 'B'), await training.createTrainingRecord(input), await training.updateTrainingRecord('record-B', input), await training.deleteTrainingRecord('record-B', 'B'), await training.bulkCreateMatrixRecords([input], 'B'), await training.importTrainingRecords([input], 'B')]) assert.equal(result.success, false)
  assert.equal(dataCalls, before)
})
await check('remaining: spoofed actorEmail cannot authenticate company or user actions', async () => {
  currentSession = null
  let forbiddenCalls = 0
  const dependencies = { crypto: require('node:crypto'), '@/lib/db/schema': tables, '@/lib/db': { pool: { query: () => { forbiddenCalls++; throw new Error('Forbidden data access') } }, db: { execute: () => { forbiddenCalls++; throw new Error('Forbidden data access') } } }, '@/lib/auth': { auth: sessionDependency }, 'next/headers': headerDependency, 'next/cache': { revalidatePath() {} }, 'drizzle-orm': operators, bcryptjs: bcrypt, '@/lib/company-access': access }
  const companies = load('app/actions/companies.ts', dependencies)
  const users = load('app/actions/manage-users.ts', dependencies)
  assert.equal((await companies.listCompanies('fake-admin@example.invalid')).length, 0)
  assert.equal((await users.getUsers('fake-admin@example.invalid', 'B')).success, false)
  assert.equal((await users.updateUserStatus('target', 'Inactive')).success, false)
  assert.equal(forbiddenCalls, 0)
})
await check('remaining: reload restores identity only from an active matching server session', async () => {
  let currentProfile = profile
  const serverProfile = load('lib/auth/server-profile.ts', { 'server-only': {}, 'next/headers': headerDependency, '@/lib/auth': { auth: sessionDependency }, '@/app/actions/get-user-by-email': { getUserByEmail: async () => currentProfile }, '@/app/actions/manage-users': { getUserJourneyAccess: async () => false, getUserJourneyApprover: async () => false } })
  currentSession = null
  assert.equal(await serverProfile.getInitialAuthUser(), null)
  currentSession = { user: { id: profile.id, email: profile.email } }
  assert.equal((await serverProfile.getInitialAuthUser()).id, profile.id)
  currentProfile = { ...profile, banned: true }
  assert.equal(await serverProfile.getInitialAuthUser(), null)
  currentProfile = { ...profile, id: 'other-user' }
  assert.equal(await serverProfile.getInitialAuthUser(), null)
})
console.log(`${passed} restored session and company-isolation checks passed; no external database, SQL execution, real credentials, or stored user data used.`)
