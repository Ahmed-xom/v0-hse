import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { DatabaseMigrationDashboard } from "@/components/dashboard/database-migration-dashboard"
import { eq } from "drizzle-orm"

const adminRoles = new Set(["ADMIN", "ADMIN SYSTEM", "SYSTEM ADMINISTRATOR", "MANAGEMENT", "HSE ADMIN"])

export default async function DatabaseMigrationPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const [currentUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)
  const role = String(currentUser?.role ?? "").trim().toUpperCase()

  if (!adminRoles.has(role)) redirect("/")
  return <DatabaseMigrationDashboard />
}
