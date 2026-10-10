import Link from "next/link"
import { ArrowLeft, ShieldCheck } from "lucide-react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
import { DataMigrationPreview } from "@/components/admin/data-migration-preview"

const ADMIN_ROLES = new Set(["ADMIN", "ADMIN SYSTEM", "SYSTEM ADMINISTRATOR", "MANAGEMENT", "HSE ADMIN", "MASTER USER"])

export default async function DataMigrationPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in?callbackUrl=%2Fadmin%2Fdata-migration")

  const roleResult = await pool.query<{ role: string | null }>('SELECT role FROM neon_auth."user" WHERE id = $1 LIMIT 1', [session.user.id])
  const role = String(roleResult.rows[0]?.role ?? "").trim().toUpperCase()
  if (!ADMIN_ROLES.has(role)) redirect("/")

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-10">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Dashboard
        </Link>
        <header className="mt-10 border-b border-border pb-8">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-primary/10 p-3"><ShieldCheck className="size-6 text-primary" aria-hidden="true" /></div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Admin · Controlled workspace</p>
              <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">Data Migration Preview</h1>
              <p className="mt-4 max-w-3xl text-pretty leading-6 text-muted-foreground">Inspect the imported Aegis source rows and prepare explicit mappings without copying JSON into operational HSE tables.</p>
            </div>
          </div>
        </header>
        <DataMigrationPreview />
      </div>
    </main>
  )
}
