import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const root = path.resolve(import.meta.dirname, '..')
const adminId = '11111111-1111-4111-8111-111111111111'
const readerId = '22222222-2222-4222-8222-222222222222'
let actorId = adminId
let failUpload = false
let failSave = false
let uploadCalls = 0
const blobs = new Map()
const tokenOptions = []
const tables = { users: [], memberships: [], documents: [], folders: [] }
tables.users.push({ id: adminId, name: 'Test Admin', email: 'admin@example.invalid', role: 'ADMIN', banned: false }, { id: readerId, name: 'Test Reader', email: 'reader@example.invalid', role: 'USER', banned: false })
tables.memberships.push({ id: 'ma', userId: adminId, companyId: 'project-1', status: 'Active' }, { id: 'mr', userId: readerId, companyId: 'project-1', status: 'Active' })
const table = (kind, keys) => Object.assign({ kind }, Object.fromEntries(keys.map(key => [key, { key }])))
const user = table('users', ['id', 'name', 'email', 'role', 'banned'])
const companyMembership = table('memberships', ['id', 'userId', 'companyId', 'status'])
const libraryDocument = table('documents', ['id', 'company_id', 'folder_id', 'title', 'category', 'is_public', 'allowed_emails', 'uploaded_by_email', 'blob_pathname'])
const libraryFolder = table('folders', ['id', 'company_id', 'parent_id', 'name'])
const eq = (column, value) => row => row[column.key] === value
const and = (...filters) => row => filters.filter(Boolean).every(filter => filter(row))
const or = (...filters) => row => filters.filter(Boolean).some(filter => filter(row))
const sql = (_parts, value, column) => row => (row[column.key] ?? []).includes(value)

class Query {
  constructor(operation, fields) { this.operation = operation; this.fields = fields; this.filter = () => true }
  from(value) { this.table = value; return this }
  where(filter) { this.filter = filter; return this }
  limit(value) { this.cap = value; return this }
  orderBy() { return this }
  values(value) { this.value = value; return this }
  set(value) { this.value = value; return this }
  onConflictDoNothing() { this.ignoreConflict = true; return this }
  returning(fields) { this.fields = fields; return this }
  then(resolve, reject) { return Promise.resolve().then(() => this.run()).then(resolve, reject) }
  run() {
    const rows = tables[this.table.kind]
    if (failSave && this.operation === 'insert' && this.table === libraryDocument) throw new Error('Simulated database outage')
    let result = []
    if (this.operation === 'insert') {
      if (!rows.some(row => row.id === this.value.id)) { rows.push({ ...this.value }); result = [rows.at(-1)] }
    } else if (this.operation === 'update') {
      result = rows.filter(this.filter); result.forEach(row => Object.assign(row, this.value))
    } else if (this.operation === 'delete') {
      result = rows.filter(this.filter); tables[this.table.kind] = rows.filter(row => !this.filter(row))
    } else { result = rows.filter(this.filter).slice(0, this.cap) }
    return this.fields ? result.map(row => Object.fromEntries(Object.entries(this.fields).map(([name, column]) => [name, row[column.key]]))) : result
  }
}
const db = {
  select: fields => new Query('select', fields),
  insert: table => Object.assign(new Query('insert'), { table }),
  update: table => Object.assign(new Query('update'), { table }),
  delete: table => Object.assign(new Query('delete'), { table }),
}
let handlers
const fakeFetch = async (url, options = {}) => {
  assert.equal(url, '/api/hse-files/upload')
  const request = new Request(`https://project1.test${url}`, options)
  return handlers[options.method](request)
}
const blobClient = {
  async handleUpload(options) {
    const constraints = await options.onBeforeGenerateToken(options.body.payload.pathname, options.body.payload.clientPayload)
    tokenOptions.push(constraints)
    return { type: 'blob.generate-client-token', clientToken: 'test-only-token' }
  },
  async upload(pathname, file, options) {
    uploadCalls++
    const authResponse = await fakeFetch(options.handleUploadUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'blob.generate-client-token', payload: { pathname, clientPayload: options.clientPayload, multipart: options.multipart } }) })
    if (!authResponse.ok) throw new Error((await authResponse.json()).error)
    assert.equal(options.multipart, true)
    assert.equal(options.access, 'public')
    options.onUploadProgress({ percentage: 25 })
    if (failUpload) throw new Error('Network connection interrupted')
    const blob = { pathname, url: `https://test.public.blob.vercel-storage.com/${pathname}`, size: file.size, contentType: file.type || 'application/octet-stream' }
    blobs.set(pathname, blob)
    options.onUploadProgress({ percentage: 100 })
    return blob
  },
}
const mocks = {
  '@/lib/db': { db },
  '@/lib/db/schema': { user, companyMembership },
  '@/lib/db/library-schema': { libraryDocument, libraryFolder },
  '@/lib/auth': { auth: { api: { getSession: async () => actorId ? { user: { id: actorId } } : null } } },
  'next/headers': { headers: async () => new Headers() },
  'next/cache': { revalidatePath() {} },
  'drizzle-orm': { eq, and, or, sql, asc: value => value },
  '@vercel/blob': { head: async pathname => { if (!blobs.has(pathname)) throw new Error('Blob not found'); return blobs.get(pathname) }, del: async pathname => blobs.delete(pathname) },
  '@vercel/blob/client': blobClient,
}
const cache = new Map()
const context = vm.createContext({ console, Buffer, URL, Request, Response, Headers, Error, Date, setTimeout, clearTimeout, process: { env: { BETTER_AUTH_SECRET: 'isolated-test-secret-not-used-by-the-application', BLOB_READ_WRITE_TOKEN: 'isolated-test-store' } }, fetch: fakeFetch })
function load(filename) {
  const full = path.resolve(root, filename)
  if (cache.has(full)) return cache.get(full).exports
  const module = { exports: {} }
  cache.set(full, module)
  const localRequire = name => {
    if (name in mocks) return mocks[name]
    if (name.startsWith('@/')) return load(`${name.slice(2)}.ts`)
    return require(name)
  }
  const source = ts.transpileModule(readFileSync(full, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText
  vm.runInContext(`(function(require,module,exports){${source}\n})`, context, { filename: full })(localRequire, module, module.exports)
  return module.exports
}
handlers = load('app/api/hse-files/upload/route.ts')
const actions = load('app/actions/manage-documents.ts')
const access = load('lib/library-access.ts')
const client = load('lib/library-upload-client.ts')
const policy = load('lib/library-policy.ts')
const download = load('app/api/hse-files/[id]/download/route.ts')
const call = (method, value) => handlers[method](new Request('https://project1.test/api/hse-files/upload', { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(value) }))
const file = { name: 'وثيقة السلامة.txt', type: 'text/plain', size: 34 }

for (const [id, status] of [[null, 401], [readerId, 403]]) {
  actorId = id
  for (const method of ['PUT', 'POST', 'PATCH']) assert.equal((await call(method, {})).status, status, `${method} must reject this actor`)
}
actorId = readerId
assert.equal((await handlers.POST(new Request('https://project1.test/api/hse-files/upload', { method: 'POST', body: new FormData() }))).status, 403)
assert.equal((await actions.uploadFileAction(new FormData())).success, false)
assert.equal((await actions.createDocument({ title: 'Forbidden', category: 'Policy', company_id: 'project-1' })).success, false)
assert.equal((await actions.getLibraryPermissions('project-1')).canManage, false)
assert.equal(policy.isLibraryAdmin('MANAGEMENT'), false)
assert.equal(policy.isLibraryAdmin('MASTER USER'), false)
actorId = adminId
assert.equal((await actions.getLibraryPermissions('project-1')).canManage, true)
assert.equal((await call('PUT', { companyId: 'project-2', fileName: file.name, size: 34 })).status, 403)

const progress = []
const uploaded = await client.uploadLibraryFile(file, 'project-1', value => progress.push(value))
assert.deepEqual(progress, [25, 100])
assert.equal(tokenOptions.at(-1).allowOverwrite, false)
assert.equal(tokenOptions.at(-1).maximumSizeInBytes, file.size)
const metadata = { title: 'Safety document', category: 'Policy', company_id: 'project-1', description: 'Upload test' }
const saved = await client.saveLibraryUpload(uploaded.receipt, metadata)
assert.equal(tables.documents.length, 1)
assert.equal(tables.documents[0].file_name, file.name)
await client.saveLibraryUpload(uploaded.receipt, metadata)
assert.equal(tables.documents.length, 1, 'Retries must not duplicate a saved document')
const downloadResponse = await download.GET(new Request('https://project1.test/download'), { params: Promise.resolve({ id: saved.id }) })
assert.equal(downloadResponse.status, 307)
assert.match(downloadResponse.headers.get('Location'), /download=1/)
assert.equal(blobs.get(tables.documents[0].blob_pathname).size, file.size)
actorId = readerId
assert.equal((await download.GET(new Request('https://project1.test/download'), { params: Promise.resolve({ id: saved.id }) })).status, 307)
assert.equal((await actions.getDocuments('forged-admin@example.invalid', true, 'project-1')).length, 1)
assert.equal((await actions.updateDocument(saved.id, { title: 'Forbidden edit' })).success, false)
assert.equal((await actions.deleteDocument(saved.id)).success, false)
assert.equal((await actions.updateDocumentAccess(saved.id, [], false)).success, false)
actorId = adminId
await actions.updateDocumentAccess(saved.id, [], false)
actorId = readerId
assert.equal((await download.GET(new Request('https://project1.test/download'), { params: Promise.resolve({ id: saved.id }) })).status, 403)
assert.equal((await actions.getDocuments('forged-admin@example.invalid', true, 'project-1')).length, 0)
actorId = adminId
assert.equal((await actions.updateDocument(saved.id, { company_id: 'project-2' })).success, false)
tables.folders.push({ id: 'allowed-folder', company_id: 'project-1', name: 'Safety' }, { id: 'other-company-folder', company_id: 'project-2', name: 'Other' })
assert.equal((await actions.createDocument({ ...metadata, folder_id: 'other-company-folder' })).success, false)
const folderFile = await client.uploadLibraryFile({ ...file, name: 'folder-file.txt' }, 'project-1', () => {})
await client.saveLibraryUpload(folderFile.receipt, { ...metadata, title: 'Folder file', folder_id: 'allowed-folder' })
assert.equal(tables.documents.at(-1).folder_id, 'allowed-folder')
assert.equal((await actions.deleteDocumentFolder('allowed-folder', 'project-1')).success, false)

const before = tables.documents.length
await Promise.all(['a.pdf', 'b.xlsx', 'c.pptx', 'image.webp', 'archive.7z'].map(async name => {
  const result = await client.uploadLibraryFile({ ...file, name }, 'project-1', () => {})
  await client.saveLibraryUpload(result.receipt, { ...metadata, title: name })
}))
assert.equal(tables.documents.length, before + 5)
const large = await client.uploadLibraryFile({ ...file, name: 'large.zip', size: 64 * 1024 * 1024 }, 'project-1', () => {})
await client.saveLibraryUpload(large.receipt, { ...metadata, title: 'Large file' })
assert.equal(tokenOptions.at(-1).maximumSizeInBytes, 64 * 1024 * 1024)
assert.equal((await call('PUT', { companyId: 'project-1', fileName: 'huge.zip', size: policy.BLOB_MAX_FILE_BYTES })).status, 200)
assert.equal((await call('PUT', { companyId: 'project-1', fileName: 'huge.zip', size: policy.BLOB_MAX_FILE_BYTES + 1 })).status, 400)
failUpload = true
await assert.rejects(client.uploadLibraryFile(file, 'project-1', () => {}), /Connection interrupted/)
failUpload = false
const recovered = await client.uploadLibraryFile(file, 'project-1', () => {})
failSave = true
await assert.rejects(client.saveLibraryUpload(recovered.receipt, { ...metadata, title: 'Retry saving' }), /Simulated database outage/)
const callsBeforeRetry = uploadCalls
failSave = false
await client.saveLibraryUpload(recovered.receipt, { ...metadata, title: 'Retry saving' })
assert.equal(uploadCalls, callsBeforeRetry, 'Saving retry must not re-upload bytes')
const beforeTamper = tables.documents.length
assert.equal((await actions.createDocument({ ...metadata, file_url: 'https://attacker.invalid/file' })).success, false)
assert.equal(tables.documents.length, beforeTamper)
const forged = recovered.receipt.slice(0, -2) + 'xx'
assert.equal((await call('POST', { type: 'blob.generate-client-token', payload: { pathname: recovered.pathname, clientPayload: forged, multipart: true } })).status, 403)
assert.equal((await call('POST', { type: 'blob.generate-client-token', payload: { pathname: 'hse-files/project-2/stolen.txt', clientPayload: recovered.receipt, multipart: true } })).status, 403)
assert.match(policy.libraryErrorMessage(new Error('quota exceeded')), /Vercel Blob/)
assert.match(policy.libraryErrorMessage(new Error('429 rate limit')), /rate limited/)
await assert.rejects(access.getAuthorizedLibraryDocument('missing'), /Document not found/)
assert.equal(tables.documents.some(row => row.company_id === 'project-2'), false)
console.log('PASS: isolated Admin upload, direct API 401/403, company/folder scoping, verified metadata, multi-file, download authorization, forged receipts, 64 MB and 5 TB boundary, upload/save failures, retry idempotency, and provider-limit messages. No live database or Blob writes.')
