'use server'

import { db } from '@/lib/db'
import { master } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const DEFAULTS = { nightStart: '18:00', nightEnd: '06:00' }
const allowedRoles = new Set(['ADMIN SYSTEM', 'ADMIN', 'HSE ADMIN', 'MASTER USER', 'MANAGEMENT'])

async function authorized() {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = String((session?.user as { role?: string } | undefined)?.role ?? '').toUpperCase()
  return { session, allowed: allowedRoles.has(role) }
}

function validTime(value: string) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(value) }

export async function getJourneyCutoffSettings(companyId?: string | null) {
  if (!companyId) return { success: true, data: DEFAULTS }
  const { session } = await authorized()
  if (!session?.user) return { success: false, data: DEFAULTS, error: 'Authentication required.' }
  try {
    const rows = await db.select().from(master).where(eq(master.type, `journey-cutoff:${companyId}`))
    const values = Object.fromEntries(rows.map((row) => [row.key, row.value]))
    return { success: true, data: { nightStart: values.nightStart || DEFAULTS.nightStart, nightEnd: values.nightEnd || DEFAULTS.nightEnd } }
  } catch (error) {
    console.error('[journey-settings] load failed', error)
    return { success: true, data: DEFAULTS }
  }
}

export async function saveJourneyCutoffSettings(companyId: string, nightStart: string, nightEnd: string) {
  const { session, allowed } = await authorized()
  if (!session?.user || !allowed) return { success: false, error: 'Admin or Master User access required.' }
  if (!companyId || !validTime(nightStart) || !validTime(nightEnd)) return { success: false, error: 'Enter valid HH:mm times.' }
  try {
    for (const [key, value] of [['nightStart', nightStart], ['nightEnd', nightEnd]] as const) {
      const existing = await db.select({ id: master.id }).from(master).where(and(eq(master.type, `journey-cutoff:${companyId}`), eq(master.key, key))).limit(1)
      if (existing[0]) await db.update(master).set({ value, updatedAt: new Date(), isActive: true }).where(eq(master.id, existing[0].id))
      else await db.insert(master).values({ id: `journey-cutoff-${companyId}-${key}`, type: `journey-cutoff:${companyId}`, key, value, description: 'Company journey night cutoff' })
    }
    revalidatePath('/settings')
    revalidatePath('/journey-tracker')
    return { success: true, data: { nightStart, nightEnd } }
  } catch (error: any) {
    console.error('[journey-settings] save failed', error)
    return { success: false, error: error.message }
  }
}

export { DEFAULTS }
