import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DatabaseMigrationDashboard } from "@/components/dashboard/database-migration-dashboard"

const adminRoles = new Set(["ADMIN", "ADMIN SYSTEM", "SYSTEM ADMINISTRATOR", "MANAGEMENT", "HSE ADMIN"])

export default async function DatabaseMigrationPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = String((session?.user as unknown as { role?: string } | undefined)?.role || "").toUpperCase()
  if (!session?.user) redirect("/sign-in")
  if (!adminRoles.has(role)) redirect("/")
  return <DatabaseMigrationDashboard />
}
