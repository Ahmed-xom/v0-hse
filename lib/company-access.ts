import { headers } from "next/headers"
import { and, eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { companyMembership } from "@/lib/db/schema"

export async function getAuthorizedCompanyIds() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) return { userId: null, companyIds: [] as string[] }
  const memberships = await db
    .select({ companyId: companyMembership.companyId })
    .from(companyMembership)
    .where(and(eq(companyMembership.userId, session.user.id), eq(companyMembership.status, "Active")))
  return { userId: session.user.id, companyIds: memberships.map(({ companyId }) => companyId) }
}

export async function requireCompanyAccess(companyId?: string) {
  const access = await getAuthorizedCompanyIds()
  if (!access.userId) throw new Error("Unauthorized")
  if (!companyId || !access.companyIds.includes(companyId)) throw new Error("Forbidden company scope")
  return { ...access, companyId }
}

export function isAuthorizedCompany(companyId: string | null | undefined, allowedCompanyIds: string[]) {
  return Boolean(companyId && allowedCompanyIds.includes(companyId))
}
