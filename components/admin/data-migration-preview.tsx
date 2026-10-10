"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, CheckCircle2, Database, RefreshCw, ShieldCheck, Table2, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Preview = {
  generatedAt: string
  source: { schema: string; table: string; tableCount: number; rowCount: number }
  target: { schema: string; tableCount: number }
  migrationTables: Record<string, number>
  tables: Array<{ sourceTable: string; rowCount: number; matchedTable: string | null; mappingStatus: "partial" | "unmapped" | "no_target"; sourceColumns: number; comparableColumns: number }>
  safety: { readOnly: boolean; writesEnabled: boolean; publicWritesExecuted: boolean; authTablesRead: boolean }
}

const numberFormat = new Intl.NumberFormat("en-US")

function statusLabel(status: Preview["tables"][number]["mappingStatus"]) {
  if (status === "partial") return { label: "Partial mapping", variant: "secondary" as const, icon: CheckCircle2 }
  if (status === "unmapped") return { label: "Needs mapping", variant: "outline" as const, icon: AlertTriangle }
  return { label: "No target", variant: "destructive" as const, icon: XCircle }
}

export function DataMigrationPreview() {
  const [preview, setPreview] = useState<Preview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  async function loadPreview() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/data-migration/preview", { cache: "no-store" })
      if (!response.ok) throw new Error(response.status === 403 ? "Your account is not authorized for this workspace." : "Unable to load the migration preview.")
      setPreview(await response.json())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load the migration preview.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadPreview() }, [])

  const filteredTables = useMemo(() => preview?.tables.filter((table) => filter === "all" || table.mappingStatus === filter) ?? [], [preview, filter])
  const matchedCount = preview?.tables.filter((table) => table.matchedTable).length ?? 0
  const unmatchedCount = preview ? preview.tables.length - matchedCount : 0

  if (loading) return <div className="mt-8 grid gap-4 md:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
  if (error) return <Card className="mt-8 border-destructive/30"><CardHeader><CardTitle>Preview unavailable</CardTitle><CardDescription>{error}</CardDescription></CardHeader><CardContent><Button variant="outline" onClick={() => void loadPreview()}><RefreshCw data-icon="inline-start" />Retry</Button></CardContent></Card>
  if (!preview) return null

  return (
    <div className="mt-8 flex flex-col gap-6">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 text-primary" aria-hidden="true" /><div><p className="font-medium">Read-only preview</p><p className="text-sm text-muted-foreground">No rows were written to public tables. Better Auth tables were not read.</p></div></div>
          <Button variant="outline" size="sm" onClick={() => void loadPreview()}><RefreshCw data-icon="inline-start" />Refresh</Button>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Migration summary">
        {[{ title: "Source rows", value: numberFormat.format(preview.source.rowCount), detail: `${preview.source.tableCount} imported tables`, icon: Database }, { title: "Public tables", value: numberFormat.format(preview.target.tableCount), detail: "Available destinations", icon: Table2 }, { title: "Matched", value: numberFormat.format(matchedCount), detail: "Require explicit mapping validation", icon: CheckCircle2 }, { title: "Unmatched", value: numberFormat.format(unmatchedCount), detail: "Remain outside operational schema", icon: AlertTriangle }].map(({ title, value, detail, icon: Icon }) => <Card key={title}><CardHeader className="pb-2"><Icon className="size-5 text-primary" aria-hidden="true" /><CardDescription className="pt-3">{title}</CardDescription><CardTitle className="text-3xl">{value}</CardTitle></CardHeader><CardContent className="pt-0 text-xs text-muted-foreground">{detail}</CardContent></Card>)}
      </section>

      <Card>
        <CardHeader><CardTitle>Source-to-target coverage</CardTitle><CardDescription>Matching names are informational only; column types, constraints, IDs, and relationships still require review.</CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter source tables">
            {[{ key: "all", label: "All" }, { key: "partial", label: "Partial" }, { key: "unmapped", label: "Needs mapping" }, { key: "no_target", label: "No target" }].map((item) => <Button key={item.key} size="sm" variant={filter === item.key ? "default" : "outline"} onClick={() => setFilter(item.key)}>{item.label}</Button>)}
          </div>
          <div className="max-h-[34rem] overflow-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>Source table</TableHead><TableHead>Rows</TableHead><TableHead>Public candidate</TableHead><TableHead>Columns</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{filteredTables.map((table) => { const status = statusLabel(table.mappingStatus); const Icon = status.icon; return <TableRow key={table.sourceTable}><TableCell className="font-mono text-xs">{table.sourceTable}</TableCell><TableCell>{numberFormat.format(table.rowCount)}</TableCell><TableCell>{table.matchedTable ? <span className="font-mono text-xs">{table.matchedTable}</span> : <span className="text-muted-foreground">—</span>}</TableCell><TableCell>{table.comparableColumns}/{table.sourceColumns}</TableCell><TableCell><Badge variant={status.variant}><Icon data-icon="inline-start" />{status.label}</Badge></TableCell></TableRow> })}</TableBody></Table></div>
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle>Migration ledger</CardTitle><CardDescription>Existing tracking tables are visible for audit readiness; this preview does not create jobs or ledger rows.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(preview.migrationTables).map(([table, count]) => <div key={table} className="rounded-lg border p-4"><p className="font-mono text-xs text-muted-foreground">{table}</p><p className="mt-2 text-2xl font-semibold">{numberFormat.format(count)}</p><p className="text-xs text-muted-foreground">tracked rows</p></div>)}</CardContent></Card>
    </div>
  )
}
