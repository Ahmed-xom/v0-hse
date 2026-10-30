'use server'

import { randomUUID } from 'node:crypto'
import { and, asc, eq, or, sql } from 'drizzle-orm'
import { del } from '@vercel/blob'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { libraryDocument, libraryFolder } from '@/lib/db/library-schema'
import { getAuthorizedLibraryDocument, requireLibraryAdmin, requireLibraryCompany, requireLibraryFolder, requireLibraryUser } from '@/lib/library-access'
import { isLibraryAdmin, libraryErrorMessage } from '@/lib/library-policy'
import { libraryBlobToken, verifiedLibraryBlob } from '@/lib/library-upload'

export interface HSEDocument {
  id: string
  doc_no: string | null
  title: string
  category: string
  sub_category: string | null
  description: string | null
  version: string
  status: string
  file_url: string | null
  file_name: string | null
  file_size: string | null
  file_type: string | null
  blob_pathname: string | null
  business_unit: string | null
  owner: string | null
  owner_email: string | null
  uploaded_by: string | null
  uploaded_by_email: string | null
  review_date: string | null
  expiry_date: string | null
  tags: string[]
  is_public: boolean
  allowed_emails: string[]
  folder_id: string | null
  created_at: string
  updated_at: string
  company_id?: string | null
}

export interface DocumentFolder {
  id: string
  company_id: string
  parent_id: string | null
  name: string
  description: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

const optionalText = z.string().trim().nullish().transform(value => value || null)
const optionalDate = optionalText.refine(value => !value || !Number.isNaN(Date.parse(value)), 'Invalid date')
const documentInput = z.object({
  title: z.string().trim().min(1, 'Title is required').max(500),
  category: z.string().trim().min(1).max(200),
  sub_category: optionalText, description: optionalText,
  version: z.string().trim().min(1).max(100).default('1.0'),
  status: z.enum(['Active', 'Under Review', 'Superseded', 'Archived']).default('Active'),
  business_unit: optionalText, owner: optionalText, owner_email: optionalText,
  review_date: optionalDate, expiry_date: optionalDate,
  tags: z.array(z.string().trim().min(1).max(200)).default([]),
  is_public: z.boolean().default(true),
  allowed_emails: z.array(z.email().transform(value => value.toLowerCase())).default([]),
  folder_id: optionalText,
  company_id: z.string().trim().min(1, 'Select a company'),
})

function documentResult(row: typeof libraryDocument.$inferSelect): HSEDocument {
  return { ...row, tags: row.tags ?? [], allowed_emails: row.allowed_emails ?? [], is_public: row.is_public ?? false, created_at: row.created_at ?? '', updated_at: row.updated_at ?? '' }
}

function folderResult(row: typeof libraryFolder.$inferSelect): DocumentFolder {
  return { ...row, created_at: row.created_at ?? '', updated_at: row.updated_at ?? '' }
}

function errorResult(error: unknown) {
  return { success: false as const, error: error instanceof z.ZodError ? error.issues.map(issue => issue.message).join('; ') : libraryErrorMessage(error) }
}

function cleanFolderName(value: unknown) {
  return String(value ?? '').replace(/[\\/<>:"|?*\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim()
}

export async function getLibraryPermissions(companyId: string | null) {
  try {
    const actor = await requireLibraryUser()
    if (!companyId) return { canManage: false }
    await requireLibraryCompany(actor, companyId)
    return { canManage: isLibraryAdmin(actor.role) }
  } catch { return { canManage: false } }
}

export async function getDocumentFolders(_userEmail: string, companyId: string): Promise<DocumentFolder[]> {
  const actor = await requireLibraryUser()
  await requireLibraryCompany(actor, companyId)
  return (await db.select().from(libraryFolder).where(eq(libraryFolder.company_id, companyId)).orderBy(asc(libraryFolder.name))).map(folderResult)
}

export async function createDocumentFolder(companyId: string, parentId: string | null, name: string, description?: string) {
  try {
    const actor = await requireLibraryAdmin(companyId)
    await requireLibraryFolder(companyId, parentId)
    const cleanName = cleanFolderName(name)
    if (!cleanName || cleanName.length > 120) throw new Error('Folder name must contain 1–120 characters')
    const [folder] = await db.insert(libraryFolder).values({ id: `folder-${randomUUID()}`, company_id: companyId, parent_id: parentId || null, name: cleanName, description: description?.trim() || null, created_by: actor.id }).returning()
    revalidatePath('/')
    return { success: true as const, folder: folderResult(folder) }
  } catch (error) { return errorResult(error) }
}

export async function renameDocumentFolder(id: string, companyId: string, name: string) {
  try {
    await requireLibraryAdmin(companyId)
    const cleanName = cleanFolderName(name)
    if (!cleanName || cleanName.length > 120) throw new Error('Folder name must contain 1–120 characters')
    const changed = await db.update(libraryFolder).set({ name: cleanName, updated_at: new Date().toISOString() }).where(and(eq(libraryFolder.id, id), eq(libraryFolder.company_id, companyId))).returning({ id: libraryFolder.id })
    if (!changed.length) throw new Error('Folder not found')
    revalidatePath('/')
    return { success: true }
  } catch (error) { return errorResult(error) }
}

export async function deleteDocumentFolder(id: string, companyId: string) {
  try {
    await requireLibraryAdmin(companyId)
    const children = await db.select({ id: libraryFolder.id }).from(libraryFolder).where(eq(libraryFolder.parent_id, id)).limit(1)
    const files = await db.select({ id: libraryDocument.id }).from(libraryDocument).where(eq(libraryDocument.folder_id, id)).limit(1)
    if (children.length || files.length) throw new Error('Folder is not empty. Move its contents before deleting it.')
    await db.delete(libraryFolder).where(and(eq(libraryFolder.id, id), eq(libraryFolder.company_id, companyId)))
    revalidatePath('/')
    return { success: true }
  } catch (error) { return errorResult(error) }
}

export async function getDocuments(_userEmail?: string, _isAdmin?: boolean, companyId?: string | null): Promise<HSEDocument[]> {
  const actor = await requireLibraryUser()
  if (!companyId) return []
  await requireLibraryCompany(actor, companyId)
  const visibility = isLibraryAdmin(actor.role) ? undefined : or(eq(libraryDocument.is_public, true), sql`${actor.email.toLowerCase()} = ANY(${libraryDocument.allowed_emails})`)
  const rows = await db.select().from(libraryDocument).where(and(eq(libraryDocument.company_id, companyId), visibility)).orderBy(asc(libraryDocument.category), asc(libraryDocument.title))
  return rows.map(documentResult)
}

export async function createDocument(data: Partial<HSEDocument> & { title: string; category: string }, uploadReceipt?: string): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const actor = await requireLibraryAdmin(data.company_id)
    const metadata = documentInput.parse(data)
    await requireLibraryCompany(actor, metadata.company_id)
    await requireLibraryFolder(metadata.company_id, metadata.folder_id)
    if (!uploadReceipt && (data.file_url || data.blob_pathname)) throw new Error('A verified upload is required')
    const file = uploadReceipt ? await verifiedLibraryBlob(uploadReceipt, actor, metadata.company_id) : null
    const id = file?.id ?? randomUUID()
    const now = new Date().toISOString()
    const [created] = await db.insert(libraryDocument).values({
      ...metadata, ...file, id, doc_no: `DOC-${new Date().getFullYear()}-${id}`,
      uploaded_by: actor.name, uploaded_by_email: actor.email, created_at: now, updated_at: now,
    }).onConflictDoNothing({ target: libraryDocument.id }).returning({ id: libraryDocument.id })
    if (!created) {
      const [existing] = await db.select({ id: libraryDocument.id }).from(libraryDocument).where(and(eq(libraryDocument.id, id), eq(libraryDocument.company_id, metadata.company_id), eq(libraryDocument.uploaded_by_email, actor.email))).limit(1)
      if (!existing) throw new Error('Could not confirm the saved document')
    }
    revalidatePath('/')
    return { success: true, id }
  } catch (error) { return errorResult(error) }
}

export async function updateDocument(id: string, data: Partial<HSEDocument>, uploadReceipt?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { actor, document } = await getAuthorizedLibraryDocument(id, true)
    if (data.company_id && data.company_id !== document.company_id) throw new Error('Moving documents between companies is not allowed')
    const metadata = documentInput.parse({ ...document, ...data, company_id: document.company_id })
    await requireLibraryFolder(metadata.company_id, metadata.folder_id)
    if (!uploadReceipt && ((data.file_url !== undefined && data.file_url !== document.file_url) || (data.blob_pathname !== undefined && data.blob_pathname !== document.blob_pathname))) throw new Error('A verified upload is required to replace a file')
    const file = uploadReceipt ? await verifiedLibraryBlob(uploadReceipt, actor, metadata.company_id) : null
    const replacement = file ? { file_url: file.file_url, blob_pathname: file.blob_pathname, file_name: file.file_name, file_type: file.file_type, file_size: file.file_size } : {}
    await db.update(libraryDocument).set({ ...metadata, ...replacement, updated_at: new Date().toISOString() }).where(and(eq(libraryDocument.id, id), eq(libraryDocument.company_id, metadata.company_id)))
    revalidatePath('/')
    return { success: true }
  } catch (error) { return errorResult(error) }
}

export async function deleteDocument(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { document } = await getAuthorizedLibraryDocument(id, true)
    // Legacy/imported blobs can be shared. Only remove this library's new, uniquely owned blobs.
    if (document.blob_pathname && /^hse-files\/[^/]+\/[^/]+\/[0-9a-f-]{36}\//i.test(document.blob_pathname)) {
      const references = await db.select({ id: libraryDocument.id }).from(libraryDocument).where(eq(libraryDocument.blob_pathname, document.blob_pathname)).limit(2)
      if (references.length === 1) await del(document.blob_pathname, { token: libraryBlobToken() })
    }
    await db.delete(libraryDocument).where(and(eq(libraryDocument.id, id), eq(libraryDocument.company_id, document.company_id!)))
    revalidatePath('/')
    return { success: true }
  } catch (error) { return errorResult(error) }
}

export async function updateDocumentAccess(id: string, allowedEmails: string[], isPublic: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const { document } = await getAuthorizedLibraryDocument(id, true)
    const emails = z.array(z.email().transform(email => email.toLowerCase())).parse(allowedEmails)
    const visible = z.boolean().parse(isPublic)
    await db.update(libraryDocument).set({ allowed_emails: emails, is_public: visible, updated_at: new Date().toISOString() }).where(and(eq(libraryDocument.id, id), eq(libraryDocument.company_id, document.company_id!)))
    revalidatePath('/')
    return { success: true }
  } catch (error) { return errorResult(error) }
}

export async function getAllUserEmails(): Promise<{ name: string; email: string }[]> {
  await requireLibraryAdmin()
  const rows = await db.select({ name: user.name, email: user.email }).from(user).where(eq(user.banned, false)).orderBy(asc(user.name))
  return rows.map(row => ({ name: row.name ?? row.email, email: row.email }))
}

export async function uploadFileAction(_formData: FormData): Promise<{ success: boolean; url?: string; pathname?: string; error?: string }> {
  try {
    await requireLibraryAdmin()
    return { success: false, error: 'Use the library direct-upload flow, which supports large files without sending file bodies through a Server Action.' }
  } catch (error) { return errorResult(error) }
}
