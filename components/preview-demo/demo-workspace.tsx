import { LockKeyhole, ShieldCheck } from "lucide-react"
import { DemoDocumentLibrary } from "@/components/preview-demo/demo-document-library"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DEMO_PAGE_PATHS, type DemoPagePath } from "@/lib/preview-demo"
import { demoPageTitles, demoSections, demoSectionsForPage, type DemoSection } from "@/lib/preview-demo-data"

function DemoSectionTable({ section }: { section: DemoSection }) {
  return (
    <section id={section.id} className="scroll-mt-6" aria-label={section.title}>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>{section.title}</CardTitle>
            <Badge variant="secondary">DEMO DATA</Badge>
          </div>
          <CardDescription>{section.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>Fictional examples only · Not connected to operational data</TableCaption>
            <TableHeader><TableRow>{section.columns.map(column => <TableHead key={column}>{column}</TableHead>)}</TableRow></TableHeader>
            <TableBody>{section.rows.map(row => (
              <TableRow key={row[0]}>{row.map((cell, index) => <TableCell key={index}>{cell}</TableCell>)}</TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Read-only preview · Changes and downloads are unavailable.</p>
        </CardFooter>
      </Card>
    </section>
  )
}

function DemoRestrictedPage({ view }: { view: DemoPagePath }) {
  const migration = view.startsWith("/admin/")
  return (
    <Card>
      <CardHeader>
        <CardTitle>{migration ? "Operational controls remain protected" : "Authentication remains unchanged"}</CardTitle>
        <CardDescription>{migration ? "Migration tools are not mounted in this gallery. No source scans, database previews or migrations run." : "The original sign-in and recovery pages are preserved. Authentication requests cannot run in the read-only gallery."}</CardDescription>
      </CardHeader>
      <CardContent>
        <fieldset disabled className="flex max-w-lg flex-col gap-4 rounded-lg border border-border p-5">
          <legend className="px-2 text-sm font-medium">DEMO DATA · Design sample only</legend>
          <label className="flex flex-col gap-2 text-sm">
            {migration ? "Source" : "Email"}
            <input className="rounded-md border border-input bg-background px-3 py-2 text-foreground" value={migration ? "Demo source — not connected" : "visitor@example.invalid"} readOnly type={migration ? "text" : "email"} />
          </label>
          <Button disabled variant="outline">{migration ? "Migration disabled" : "Sign-in / recovery disabled"}</Button>
        </fieldset>
      </CardContent>
      <CardFooter><p className="text-sm text-muted-foreground">This is a safe design substitute, not a functional copy of the protected tool.</p></CardFooter>
    </Card>
  )
}

export function DemoWorkspace({ view }: { view: DemoPagePath }) {
  const sections = demoSectionsForPage(view)
  return (
    <div dir="ltr" className="min-h-screen bg-background font-sans text-foreground" data-preview-demo="true">
      <a href="#demo-main" className="sr-only focus:not-sr-only focus:block focus:p-4">Skip to content</a>
      <header className="border-b border-border bg-card text-card-foreground">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <a href="/" className="flex items-center gap-3" aria-label="AMNKO HSE demo home">
            <ShieldCheck className="size-8 text-primary" aria-hidden="true" />
            <div className="flex flex-col"><strong className="text-lg tracking-tight">AMNKO HSE</strong><span className="text-sm text-muted-foreground">Safety · Compliance · Excellence</span></div>
          </a>
          <div className="flex flex-wrap items-center gap-3"><Badge variant="outline">PREVIEW ONLY</Badge><Badge>DEMO DATA</Badge><span className="text-sm text-muted-foreground">No user session</span></div>
        </div>
      </header>
      <div className="flex flex-col lg:flex-row">
        <aside className="max-h-48 overflow-y-auto border-b border-border bg-card p-5 text-card-foreground lg:max-h-none lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0">
          <nav aria-label="Demo sections" className="flex flex-col gap-4">
            <p className="text-sm font-semibold">Operations workspace</p>
            <div className="flex flex-wrap gap-1 lg:flex-col">
              <a href="/#kpi-cards" className="rounded-md px-3 py-2 text-sm hover:bg-muted">Performance Overview</a>
              {demoSections.map(section => <a key={section.id} href={`/#${section.id}`} className="rounded-md px-3 py-2 text-sm hover:bg-muted">{section.title}</a>)}
            </div>
            <p className="text-sm font-semibold">Page gallery</p>
            <div className="flex flex-wrap gap-1 lg:flex-col">{DEMO_PAGE_PATHS.filter(path => path !== "/").map(path => (
              <a key={path} href={path} aria-current={view === path ? "page" : undefined} className="rounded-md px-3 py-2 text-sm hover:bg-muted aria-[current=page]:bg-muted aria-[current=page]:font-semibold">{demoPageTitles[path]}</a>
            ))}</div>
          </nav>
        </aside>
        <main id="demo-main" className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
          <Alert>
            <LockKeyhole aria-hidden="true" />
            <AlertTitle>معاينة للقراءة فقط · PREVIEW DEMO MODE</AlertTitle>
            <AlertDescription>بيانات خيالية فقط — لا اتصال بالموظفين أو الحوادث أو الرواتب أو المستندات الحقيقية. جميع طلبات البيانات وعمليات الكتابة محجوبة في هذه المعاينة.</AlertDescription>
          </Alert>
          <div className="flex flex-col gap-2">
            <p className="font-mono text-sm uppercase tracking-wider text-primary">Isolated interface gallery</p>
            <h1 className="text-balance text-3xl font-semibold tracking-tight">{demoPageTitles[view]}</h1>
            <p className="text-pretty text-sm leading-6 text-muted-foreground">Review the interface structure with static examples. Live components and data-fetching providers are intentionally not mounted.</p>
          </div>
          {view === "/" && <section id="kpi-cards" aria-label="Performance Overview" className="grid scroll-mt-6 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[["Demo incidents", "2"], ["Demo inspections", "2"], ["Demo courses", "2"], ["Demo journeys", "2"]].map(([label, value]) => <Card key={label}><CardHeader><CardDescription>{label}</CardDescription><CardTitle>{value}</CardTitle></CardHeader><CardContent><Badge variant="outline">DEMO DATA</Badge></CardContent></Card>)}
          </section>}
          {sections.map(section => section.id === "document-library"
            ? <DemoDocumentLibrary key={section.id} linkedLibrary={view.startsWith("/admin/")} />
            : <DemoSectionTable key={section.id} section={section} />)}
          {sections.length === 0 && <DemoRestrictedPage view={view} />}
          <footer className="border-t border-border py-5 text-sm text-muted-foreground">AMNKO HSE · Temporary Preview gallery · No database or storage access</footer>
        </main>
      </div>
    </div>
  )
}
