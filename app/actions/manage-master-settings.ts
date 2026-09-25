'use server'

import { and, asc, eq, ilike, or } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { masterValue } from '@/lib/db/schema'
import { getMasterSection } from '@/lib/master-registry'

const ADMIN_ROLES = new Set(['ADMIN SYSTEM', 'ADMIN', 'HSE ADMIN', 'MASTER USER', 'MANAGEMENT'])

async function getActor() {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = String((session?.user as { role?: string } | undefined)?.role ?? '').toUpperCase()
  return { session, canManage: Boolean(session?.user && ADMIN_ROLES.has(role)) }
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

export async function addMasterItem(data: { sectionId: string; name: string; description?: string; companyId?: string | null }) {
  const { session, canManage } = await getActor()
  if (!session?.user || !canManage) return { success: false as const, error: 'Admin or Master User access required.' }
  const section = getMasterSection(data.sectionId)
  const name = clean(data.name)
  if (!section || section.source !== 'master_value') return { success: false as const, error: 'This section uses a dedicated editor.' }
  if (!name) return { success: false as const, error: 'Item name is required.' }
  const duplicate = await db.select({ id: masterValue.id }).from(masterValue).where(and(eq(masterValue.sectionKey, data.sectionId), eq(masterValue.name, name), data.companyId ? eq(masterValue.companyId, data.companyId) : eq(masterValue.companyId, ''))).limit(1)
  if (duplicate.length) return { success: false as const, error: 'An item with this name already exists.' }
  const id = crypto.randomUUID()
  const [created] = await db.insert(masterValue).values({ id, sectionKey: data.sectionId, companyId: data.companyId || null, name, description: clean(data.description) || null }).returning()
  revalidatePath('/settings')
  return { success: true as const, data: created }
}

export async function updateMasterItem(id: string, data: { name?: string; description?: string; isActive?: boolean }) {
  const { session, canManage } = await getActor()
  if (!session?.user || !canManage) return { success: false as const, error: 'Admin or Master User access required.' }
  const updates: Partial<typeof masterValue.$inferInsert> = { updatedAt: new Date() }
  if (data.name !== undefined) { const name = clean(data.name); if (!name) return { success: false as const, error: 'Item name is required.' }; updates.name = name }
  if (data.description !== undefined) updates.description = clean(data.description) || null
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
