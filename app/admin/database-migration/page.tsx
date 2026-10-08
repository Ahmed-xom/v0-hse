import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { DatabaseMigrationDashboard } from "@/components/dashboard/database-migration-dashboard"

const ADMIN_ROLES = new Set([
  "ADMIN",
  "ADMIN SYSTEM",
  "SYSTEM ADMINISTRATOR",
  "MANAGEMENT",
  "HSE ADMIN",
  "MASTER USER",
])

export default async function DatabaseMigrationPage() {
  const requestHeaders = await headers()

  const session = await auth.api.getSession({
    headers: requestHeaders,
  })

  if (!session?.user?.id) {
    redirect(
      `/sign-in?callbackUrl=${encodeURIComponent(
        "/admin/database-migration"
      )}`
    )
  }

  const [currentUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  const role = String(currentUser?.role ?? "")
    .trim()
    .toUpperCase()

  if (!ADMIN_ROLES.has(role)) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-xl border p-8 text-center">
          <h1 className="mb-3 text-2xl font-semibold">Access Denied</h1>
          <p className="mb-4 text-muted-foreground">
            Your account does not have permission to access Database Migration.
          </p>
          <p className="text-sm text-muted-foreground">
            Current role: {role || "No role assigned"}
          </p>
        </div>
      </main>
    )
  }

  return <DatabaseMigrationDashboard />
}
