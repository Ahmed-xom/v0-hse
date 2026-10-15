import { headers } from "next/headers"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"

const ADMIN_ROLES = new Set(["ADMIN SYSTEM", "HSE ADMIN", "MASTER USER", "ADMIN", "MANAGEMENT"])

export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  const [record] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1)
  return record?.role && ADMIN_ROLES.has(record.role) ? session : null
}
