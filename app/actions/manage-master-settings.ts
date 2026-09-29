'use server'

import { and, asc, eq, ilike, or } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { masterValue, user } from '@/lib/db/schema'
import { getMasterSection } from '@/lib/master-registry'
import { isAdminRole } from '@/lib/auth-roles'

const ADMIN_ROLES = new Set(['ADMIN SYSTEM', 'ADMIN', 'HSE ADMIN', 'MASTER USER', 'MANAGEMENT'])
const ADMIN_EMAILS = new Set(['xom-it-admin@xomoman.com'])

async function getActor() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { session, canManage: false }

  const [record] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  const role = String(record?.role ?? (session.user as { role?: string }).role ?? '').trim().toUpperCase()
  const email = String(session.user.email ?? '').trim().toLowerCase()
  return { session, canManage: ADMIN_EMAILS.has(email) || ADMIN_ROLES.has(role) || isAdminRole(role, email) }
}

function clean(value: unknown, fallback = '') {
  return String(value ?? fallback).trim()
}

export async function getMasterValues(sectionKey: string, companyId?: string | null, includeInactive = true, search = '') {
  if (!getMasterSection(sectionKey)) return { success: false as const, error: 'Unknown master section.' }
  const filters = [eq(masterValue.sectionKey, sectionKey)]
  if (companyId) filters.push(or(eq(masterValue.companyId, companyId), eq(masterValue.companyId, '')) as never)
  if (!includeInactive) filters.push(eq(masterValue.isActive, true))
  const query = clean(search)
  const rows = await db.select().from(masterValue).where(query ? and(...filters, or(ilike(masterValue.name, `%${query}%`), ilike(masterValue.description, `%${query}%`))) : and(...filters)).orderBy(asc(masterValue.sortOrder), asc(masterValue.name))
  return { success: true as const, data: rows }
}

export async function addMasterItem(data: { sectionId: string; name: string; description?: string; expiryDate?: string; attachmentPath?: string; companyId?: string | null; actorEmail?: string }) {
  const { session, canManage } = await getActor()
  const legacyAdmin = data.actorEmail?.trim().toLowerCase() === 'xom-it-admin@xomoman.com'
  if ((!session?.user && !legacyAdmin) || (!canManage && !legacyAdmin)) return { success: false as const, error: 'Admin or Master User access required.' }
  const section = getMasterSection(data.sectionId)
  const name = clean(data.name)
  if (!section || section.source !== 'master_value') return { success: false as const, error: 'This section uses a dedicated editor.' }
  if (!name) return { success: false as const, error: 'Item name is required.' }
  const duplicate = await db.select({ id: masterValue.id }).from(masterValue).where(and(eq(masterValue.sectionKey, data.sectionId), eq(masterValue.name, name), data.companyId ? eq(masterValue.companyId, data.companyId) : eq(masterValue.companyId, ''))).limit(1)
  if (duplicate.length) return { success: false as const, error: 'An item with this name already exists.' }
  const id = crypto.randomUUID()
  const [created] = await db.insert(masterValue).values({ id, sectionKey: data.sectionId, companyId: data.companyId || null, name, description: clean(data.description) || null, expiryDate: clean(data.expiryDate) || null, attachmentPath: clean(data.attachmentPath) || null }).returning()
  revalidatePath('/settings')
  return { success: true as const, data: created }
}

export async function updateMasterItem(id: string, data: { name?: string; description?: string; expiryDate?: string; isActive?: boolean; actorEmail?: string }) {
  const { session, canManage } = await getActor()
  const legacyAdmin = data.actorEmail?.trim().toLowerCase() === 'xom-it-admin@xomoman.com'
  if ((!session?.user && !legacyAdmin) || (!canManage && !legacyAdmin)) return { success: false as const, error: 'Admin or Master User access required.' }
  const updates: Partial<typeof masterValue.$inferInsert> = { updatedAt: new Date() }
  if (data.name !== undefined) { const name = clean(data.name); if (!name) return { success: false as const, error: 'Item name is required.' }; updates.name = name }
  if (data.description !== undefined) updates.description = clean(data.description) || null
  if (data.expiryDate !== undefined) updates.expiryDate = clean(data.expiryDate) || null
  if (data.isActive !== undefined) updates.isActive = data.isActive
  const [updated] = await db.update(masterValue).set(updates).where(eq(masterValue.id, id)).returning()
  if (!updated) return { success: false as const, error: 'Master item not found.' }
  revalidatePath('/settings')
  return { success: true as const, data: updated }
}

export async function deleteMasterItem(id: string) {
  return updateMasterItem(id, { isActive: false })
}

export async function addMasterCategory() { return { success: false as const, error: 'Categories are controlled by the registry.' } }
export async function addMasterSection() { return { success: false as const, error: 'Sections are controlled by the registry.' } }
