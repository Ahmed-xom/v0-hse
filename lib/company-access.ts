import { headers } from 'next/headers'
import { and, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { company, companyMembership, user } from '@/lib/db/schema'

export async function getAuthorizedCompanyIds() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) return { userId: null, companyIds: [] as string[] }
  const memberships = await db.select({ companyId: companyMembership.companyId })
    .from(companyMembership)
    .innerJoin(company, eq(company.id, companyMembership.companyId))
    .innerJoin(user, eq(user.id, companyMembership.userId))
    .where(and(eq(companyMembership.userId, session.user.id), eq(companyMembership.status, 'Active'), eq(company.status, 'Active'), eq(user.banned, false)))
  return { userId: session.user.id, companyIds: memberships.map(({ companyId }) => companyId) }
}

export async function requireCompanyAccess(companyId?: string) {
  const access = await getAuthorizedCompanyIds()
  if (!access.userId) throw new Error('Unauthorized')
  const selected = companyId ?? (access.companyIds.length === 1 ? access.companyIds[0] : undefined)
  if (!selected || !access.companyIds.includes(selected)) throw new Error('Forbidden or ambiguous company scope')
  return { ...access, companyId: selected }
}
