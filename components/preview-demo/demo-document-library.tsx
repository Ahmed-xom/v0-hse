import { FolderOpen, LockKeyhole } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function DemoDocumentLibrary({ linkedLibrary = false }: { linkedLibrary?: boolean }) {
  const summary = linkedLibrary
    ? ["Total documents", "Search results", "Public preview available"]
    : ["Active", "Expired", "Expiring in 30 days", "Missing file / expiry"]

  return (
    <section id="document-library" aria-label="Document Library" className="scroll-mt-6" data-inventory-status="unavailable">
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-primary/10 text-foreground">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>{linkedLibrary ? "AMNKO HSE Library" : "View Library"}</CardTitle>
            <Badge variant="outline">Read-only · Inventory unavailable</Badge>
          </div>
          <CardDescription>Total documents: Unknown · No authorized inventory loaded</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 pt-6">
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Document audit summary">
            {summary.map(label => (
              <div key={label} className="flex flex-col gap-1 rounded-md border border-border p-4">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="font-medium">Unavailable</dd>
              </div>
            ))}
          </dl>
          <FieldGroup>
            <Field data-disabled>
              <FieldLabel htmlFor="demo-document-search">Search documents</FieldLabel>
              <Input id="demo-document-search" type="search" disabled placeholder="Search title, file, category, owner, or document number" aria-describedby="demo-inventory-reason" />
            </Field>
            {!linkedLibrary && <div className="flex flex-wrap gap-3">
              {["Category", "Status", "Expiry"].map(label => (
                <Field key={label} data-disabled className="min-w-36 flex-1">
                  <FieldLabel htmlFor={`demo-document-${label.toLowerCase()}`}>{label}</FieldLabel>
                  <select id={`demo-document-${label.toLowerCase()}`} disabled aria-describedby="demo-inventory-reason" className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50">
                    <option>Unavailable</option>
                  </select>
                </Field>
              ))}
            </div>}
          </FieldGroup>
          <div className="flex items-center gap-2 border-b border-border pb-4 text-sm" aria-label="Folder breadcrumbs">
            <FolderOpen className="size-4 text-primary" aria-hidden="true" />
            <span>Library</span><span className="text-muted-foreground">/ Folder inventory unavailable</span>
          </div>
          {linkedLibrary && <Table aria-label="Linked documents">
            <TableCaption>Document records and files have not been loaded or verified.</TableCaption>
            <TableHeader><TableRow>{["Document name", "Type", "Status", "Created"].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
            <TableBody />
          </Table>}
          <Empty role="status" className="min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon"><LockKeyhole aria-hidden="true" /></EmptyMedia>
              <EmptyTitle>Document inventory unavailable in safe demo mode</EmptyTitle>
              <EmptyDescription id="demo-inventory-reason">The original library uses company-scoped document records and protected file storage. This demo has no authorized session or approved demo files, so it does not query these sources or expose document metadata, folders, or file links.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2 border-t border-border pt-5">
          <p className="text-sm text-muted-foreground">Verified, authorized demo files shown: 0. The real library total is unknown, not zero.</p>
          <p className="text-sm text-muted-foreground">Search, filters and pagination are unavailable until an authorized inventory is provided. File previews and downloads are hidden.</p>
        </CardFooter>
      </Card>
    </section>
  )
}
