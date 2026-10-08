import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { eq } from "drizzle-orm"
import { ArrowLeft, CheckCircle2, Database, FileSpreadsheet, ListChecks, PlayCircle, Server, ShieldCheck } from "lucide-react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"

const ADMIN_ROLES = new Set([
  "ADMIN",
  "ADMIN SYSTEM",
  "SYSTEM ADMINISTRATOR",
  "MANAGEMENT",
  "HSE ADMIN",
  "MASTER USER",
])

function LoginRequired() {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
        <section className="w-full rounded-2xl border border-border bg-card p-8 text-center shadow-sm sm:p-12" aria-labelledby="login-required-title">
          <ShieldCheck className="mx-auto size-12 text-primary" aria-hidden="true" />
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-primary">Restricted workspace</p>
          <h1 id="login-required-title" className="mt-3 text-balance text-3xl font-semibold tracking-tight">Administrator Login Required</h1>
          <p className="mx-auto mt-4 max-w-xl leading-6 text-muted-foreground">
            This migration center is available only to authorized administrator roles. Sign in with an authorized administrator account to continue.
          </p>
          <Link href="/sign-in?callbackUrl=%2Fadmin%2Fdata-migration" className="mt-8 inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Go to Sign in
          </Link>
        </section>
      </div>
    </main>
  )
}

function AccessDenied() {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
        <section className="w-full rounded-2xl border border-destructive/30 bg-card p-8 text-center shadow-sm sm:p-12" aria-labelledby="access-denied-title">
          <ShieldCheck className="mx-auto size-12 text-destructive" aria-hidden="true" />
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-destructive">Restricted workspace</p>
          <h1 id="access-denied-title" className="mt-3 text-balance text-3xl font-semibold tracking-tight">Access Denied</h1>
          <p className="mx-auto mt-4 max-w-xl leading-6 text-muted-foreground">
            Your account is authenticated, but its role is not authorized for this center.
          </p>
          <Link href="/" className="mt-8 inline-flex items-center justify-center rounded-md border border-border px-5 py-3 text-sm font-medium transition-colors hover:bg-muted">
            Return to Dashboard
          </Link>
        </section>
      </div>
    </main>
  )
}

const sections = [
  { title: "Source Database", detail: "Aegis XOM read-only export", icon: Server },
  { title: "Target Database", detail: "AMNKO HSE PostgreSQL", icon: Database },
  { title: "Migration Status", detail: "Ready for review · Not started", icon: CheckCircle2 },
  { title: "Tables", detail: "Awaiting validated source package", icon: FileSpreadsheet },
  { title: "Records", detail: "No records processed", icon: ListChecks },
  { title: "Migration Actions", detail: "Execution remains disabled", icon: PlayCircle },
]

function MigrationWorkspace({ email }: { email: string }) {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Dashboard
        </Link>

        <header className="mt-10 flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">HSE Database Migration Center</p>
            <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">Database Migration</h1>
            <p className="mt-4 max-w-2xl text-pretty leading-6 text-muted-foreground">A controlled workspace for reviewing source data before any operational migration is considered.</p>
          </div>
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
            <p className="font-medium text-primary">Migration tools are ready.</p>
            <p className="mt-1 text-muted-foreground">No migration has been started.</p>
          </div>
        </header>

        <section className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm" aria-labelledby="administrator-status-title">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Administrator status</p>
              <h2 id="administrator-status-title" className="mt-2 text-xl font-semibold">Administrator</h2>
              <p className="mt-1 text-sm text-muted-foreground">{email}</p>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary sm:self-auto">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Authorized
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-label="Migration dashboard">
          {sections.map(({ title, detail, icon: Icon }) => (
            <article key={title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <Icon className="size-5 text-primary" aria-hidden="true" />
              <h2 className="mt-5 text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
            </article>
          ))}
        </section>

        <footer className="mt-8 rounded-xl border border-border bg-muted/30 p-6 text-sm leading-6 text-muted-foreground">
          This page is a review-only workspace. It does not execute migrations, modify the source database, or write to operational HSE records.
        </footer>
      </div>
    </main>
  )
}

export default async function DataMigrationPage() {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })

  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent("/admin/data-migration")}`)
  }

  const [currentUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  const role = String(currentUser?.role ?? "").trim().toUpperCase()

  if (!ADMIN_ROLES.has(role)) return <AccessDenied />

  return <MigrationWorkspace email={session.user.email} />
}

export const metadata = {
  title: "Database Migration | AMNKO HSE",
  description: "Controlled HSE database migration review workspace.",
}
