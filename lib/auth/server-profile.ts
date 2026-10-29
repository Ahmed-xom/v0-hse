import 'server-only'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import type { AuthUser, UserRole } from '@/lib/auth-context'
import { getUserByEmail } from '@/app/actions/get-user-by-email'
import { getUserJourneyAccess, getUserJourneyApprover } from '@/app/actions/manage-users'

export async function getInitialAuthUser(): Promise<AuthUser | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id || !session.user.email) return null
  const profile = await getUserByEmail(session.user.email)
  if (!profile || profile.id !== session.user.id || profile.banned || profile.status !== 'Active') return null
  const [journeyAccess, journeyApprover] = await Promise.all([getUserJourneyAccess(profile.email), getUserJourneyApprover(profile.email)])
  return { id: profile.id, payrollNumber: profile.payrollNo, name: profile.name, email: profile.email, role: profile.role as UserRole, designation: profile.designation, businessUnit: profile.businessUnit, status: profile.status, journeyAccess, journeyApprover }
}
