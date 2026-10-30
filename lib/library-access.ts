import { headers } from 'next/headers'
import { and, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { companyMembership, user } from '@/lib/db/schema'
import { libraryDocument, libraryFolder } from '@/lib/db/library-schema'
import { isLibraryAdmin } from '@/lib/library-policy'

export class LibraryAccessError extends Error {
  constructor(message: string, public status = 403) { super(message) }
}

export async function requireLibraryUser(requestHeaders?: Headers) {
  const session = await auth.api.getSession({ headers: requestHeaders ?? await headers() })
  if (!session?.user?.id) throw new LibraryAccessError('Authentication required / يجب تسجيل الدخول', 401)
  const [actor] = await db.select({ id: user.id, name: user.name, email: user.email, role: user.role, banned: user.banned })
    .from(user).where(eq(user.id, session.user.id)).limit(1)
  if (!actor || actor.banned) throw new LibraryAccessError('Account is not authorized')
  return actor
}

export type LibraryActor = Awaited<ReturnType<typeof requireLibraryUser>>

export async function requireLibraryCompany(actor: LibraryActor, companyId: string) {
  if (!companyId?.trim()) throw new LibraryAccessError('Select a company / اختر الشركة', 400)
  if (actor.role?.trim().toUpperCase() === 'ADMIN SYSTEM') return
  const [membership] = await db.select({ id: companyMembership.id }).from(companyMembership)
    .where(and(eq(companyMembership.userId, actor.id), eq(companyMembership.companyId, companyId), eq(companyMembership.status, 'Active'))).limit(1)
  if (!membership) throw new LibraryAccessError('Company access denied / لا تملك صلاحية لهذه الشركة')
}

export async function requireLibraryAdmin(companyId?: string | null, requestHeaders?: Headers) {
  const actor = await requireLibraryUser(requestHeaders)
  if (!isLibraryAdmin(actor.role)) throw new LibraryAccessError('Admin only / هذه العملية للمدير فقط')
  if (companyId) await requireLibraryCompany(actor, companyId)
  return actor
}

export async function requireLibraryFolder(companyId: string, folderId?: string | null) {
  if (!folderId) return
  const [folder] = await db.select({ id: libraryFolder.id }).from(libraryFolder)
    .where(and(eq(libraryFolder.id, folderId), eq(libraryFolder.company_id, companyId))).limit(1)
  if (!folder) throw new LibraryAccessError('Destination folder not found in this company', 400)
}

export async function getAuthorizedLibraryDocument(id: string, manage = false, requestHeaders?: Headers) {
  const actor = manage ? await requireLibraryAdmin(undefined, requestHeaders) : await requireLibraryUser(requestHeaders)
  const [document] = await db.select().from(libraryDocument).where(eq(libraryDocument.id, id)).limit(1)
  if (!document) throw new LibraryAccessError('Document not found', 404)
  if (!document.company_id) throw new LibraryAccessError('Document has no authorized company')
  await requireLibraryCompany(actor, document.company_id)
  const allowed = document.is_public || isLibraryAdmin(actor.role) || (document.allowed_emails ?? []).some(email => email.toLowerCase() === actor.email.toLowerCase())
  if (!manage && !allowed) throw new LibraryAccessError('Document access denied')
  return { actor, document }
}
