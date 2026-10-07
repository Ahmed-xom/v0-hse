"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Row = Record<string, unknown>
export function AuthoritativeMatrix({ report, onExport }: { report: Row; onExport: () => void }) {
  const counts = (report.approval_counts ?? {}) as Row
  const metadata = (report.metadata_availability ?? {}) as Row
  const fields = Array.isArray(report.field_matrix) ? report.field_matrix as Row[] : []
  const lookups = Array.isArray(report.lookup_matrix) ? report.lookup_matrix as Row[] : []
  const relationships = Array.isArray(report.relationship_matrix) ? report.relationship_matrix as Row[] : []
  return <Card className="border-primary/30"><CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle>AUTHORITATIVE MIGRATION MATRIX</CardTitle><CardDescription>Evidence-derived, read-only preview. No operational writes are available.</CardDescription></div><Button variant="outline" size="sm" onClick={onExport}><Download className="mr-2 h-4 w-4" />Export JSON</Button></CardHeader><CardContent className="space-y-5"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{Object.entries(counts).map(([key, value]) => <div key={key} className="rounded-lg border bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{key}</p><p className="mt-1 text-xl font-semibold">{String(value)}</p></div>)}</div><div><h3 className="mb-2 font-medium">Source metadata availability</h3><pre className="max-h-40 overflow-auto rounded-lg border bg-muted/20 p-3 text-xs">{JSON.stringify(metadata, null, 2)}</pre></div><Report title={`Field matrix (${fields.length} fields)`} rows={fields} /><Report title={`Lookup matrix (${lookups.length})`} rows={lookups} /><Report title={`Relationship matrix (${relationships.length})`} rows={relationships} /><div><h3 className="mb-2 font-medium">Unresolved items</h3><ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">{(Array.isArray(report.unresolved_items) ? report.unresolved_items : ["NOT_AVAILABLE_FROM_EXPORT"]).map((item) => <li key={String(item)}>{String(item)}</li>)}</ul></div></CardContent></Card>
}
function Report({ title, rows }: { title: string; rows: Row[] }) { return <details className="rounded-lg border"><summary className="cursor-pointer px-4 py-3 text-sm font-medium">{title}</summary><pre className="max-h-[28rem] overflow-auto border-t bg-muted/10 p-4 text-xs leading-5">{rows.length ? JSON.stringify(rows, null, 2) : "NOT_AVAILABLE_FROM_EXPORT"}</pre></details> }
