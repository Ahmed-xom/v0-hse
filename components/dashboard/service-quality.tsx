'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Star,
  Plus,
  Search,
  Download,
  RefreshCw,
  Pencil,
  Trash2,
  Eye,
  MoreHorizontal,
  ClipboardList,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import {
  getServiceQualityReports,
  createServiceQualityReport,
  updateServiceQualityReport,
  deleteServiceQualityReport,
  type ServiceQualityReport,
  type ServiceQualityFormData,
  type ServiceQualityStatus,
  type ServiceQualityPriority,
} from '@/app/actions/manage-service-quality'
import { SERVICE_CATEGORIES } from '@/lib/hse-constants'

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUSES: ServiceQualityStatus[] = ['Open', 'In Progress', 'Closed', 'Cancelled']
const PRIORITIES: ServiceQualityPriority[] = ['Low', 'Medium', 'High', 'Critical']

const EMPTY_FORM: ServiceQualityFormData = {
  report_date: new Date().toISOString().split('T')[0],
  period: '',
  business_unit: '',
  contractor: '',
  service_category: '',
  title: '',
  description: '',
  findings: '',
  recommendations: '',
  action_required: '',
  action_owner: '',
  action_due_date: '',
  rating: undefined,
  status: 'Open',
  priority: 'Medium',
  reported_by: '',
  reported_by_email: '',
}

// ── Badge helpers ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Open: 'bg-warning/15 text-warning border-warning/30',
    'In Progress': 'bg-blue-500/15 text-blue-600 border-blue-400/30',
    Closed: 'bg-success/15 text-success border-success/30',
    Cancelled: 'bg-muted text-muted-foreground border-border',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${map[status] ?? 'bg-secondary text-secondary-foreground border-border'}`}>
      {status}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    Low: 'bg-success/15 text-success border-success/30',
    Medium: 'bg-warning/15 text-warning border-warning/30',
    High: 'bg-destructive/15 text-destructive border-destructive/30',
    Critical: 'bg-destructive text-destructive-foreground border-destructive',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${map[priority] ?? 'bg-secondary text-secondary-foreground border-border'}`}>
      {priority}
    </span>
  )
}

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs text-muted-foreground">—</span>
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  )
}

// ── Export CSV ────────────────────────────────────────────────────────────────
function exportToCSV(rows: ServiceQualityReport[]) {
  const headers = ['Ref No', 'Date', 'Period', 'Business Unit', 'Contractor', 'Category', 'Title', 'Status', 'Priority', 'Rating', 'Reported By', 'Action Owner', 'Action Due']
  const csv = [
    headers.join(','),
    ...rows.map((r) =>
      [
        r.ref_no ?? '',
        r.report_date ? new Date(r.report_date).toLocaleDateString('en-GB') : '',
        r.period ?? '',
        r.business_unit ?? '',
        r.contractor ?? '',
        r.service_category,
        r.title,
        r.status,
        r.priority,
        r.rating ?? '',
        r.reported_by ?? '',
        r.action_owner ?? '',
        r.action_due_date ? new Date(r.action_due_date).toLocaleDateString('en-GB') : '',
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','),
    ),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `service-quality-reports-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Form Dialog ───────────────────────────────────────────────────────────────
function ReportFormDialog({
  open,
  onClose,
  editRecord,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  editRecord?: ServiceQualityReport
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [form, setForm] = useState<ServiceQualityFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editRecord) {
      setForm({
        report_date: editRecord.report_date ? editRecord.report_date.split('T')[0] : new Date().toISOString().split('T')[0],
        period: editRecord.period ?? '',
        business_unit: editRecord.business_unit ?? '',
        contractor: editRecord.contractor ?? '',
        service_category: editRecord.service_category,
        title: editRecord.title,
        description: editRecord.description ?? '',
        findings: editRecord.findings ?? '',
        recommendations: editRecord.recommendations ?? '',
        action_required: editRecord.action_required ?? '',
        action_owner: editRecord.action_owner ?? '',
        action_due_date: editRecord.action_due_date ? editRecord.action_due_date.split('T')[0] : '',
        rating: editRecord.rating ?? undefined,
        status: editRecord.status,
        priority: editRecord.priority,
        reported_by: editRecord.reported_by ?? '',
        reported_by_email: editRecord.reported_by_email ?? '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [editRecord, open])

  const set = (key: keyof ServiceQualityFormData, value: any) =>
    setForm((f) => ({ ...f, [key]: value }))

  async function handleSubmit() {
    if (!form.service_category || !form.title || !form.report_date) {
      toast({ title: 'Required fields missing', description: 'Category, title, and date are required.', variant: 'destructive' })
      return
    }
    setSaving(true)
    const result = editRecord
      ? await updateServiceQualityReport(editRecord.id, form)
      : await createServiceQualityReport(form)
    setSaving(false)
    if (result.success) {
      toast({ title: editRecord ? 'Report updated' : 'Report created' })
      onSaved()
      onClose()
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editRecord ? 'Edit Service Quality Report' : 'New Service Quality Report'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Report Date <span className="text-destructive">*</span></Label>
              <Input type="date" value={form.report_date} onChange={(e) => set('report_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Period (e.g. Q1 2025)</Label>
              <Input placeholder="e.g. Q1 2025" value={form.period} onChange={(e) => set('period', e.target.value)} />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Service Category <span className="text-destructive">*</span></Label>
              <Select value={form.service_category} onValueChange={(v) => set('service_category', v)}>
                <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                <SelectContent>
                  {SERVICE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Contractor / Vendor</Label>
              <Input placeholder="Contractor name" value={form.contractor} onChange={(e) => set('contractor', e.target.value)} />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Business Unit</Label>
              <Input placeholder="Business unit" value={form.business_unit} onChange={(e) => set('business_unit', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Service Rating (1–5)</Label>
              <Select
                value={form.rating ? String(form.rating) : ''}
                onValueChange={(v) => set('rating', v ? Number(v) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rating..." />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {'★'.repeat(n)}{'☆'.repeat(5 - n)} — {['Poor', 'Fair', 'Average', 'Good', 'Excellent'][n - 1]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label>Report Title <span className="text-destructive">*</span></Label>
            <Input placeholder="Brief title for this report" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea placeholder="Describe the service quality issue or evaluation..." rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>

          {/* Findings */}
          <div className="space-y-1.5">
            <Label>Findings</Label>
            <Textarea placeholder="Key findings from the evaluation..." rows={2} value={form.findings} onChange={(e) => set('findings', e.target.value)} />
          </div>

          {/* Recommendations */}
          <div className="space-y-1.5">
            <Label>Recommendations</Label>
            <Textarea placeholder="Recommended improvements or actions..." rows={2} value={form.recommendations} onChange={(e) => set('recommendations', e.target.value)} />
          </div>

          {/* Action Required */}
          <div className="space-y-1.5">
            <Label>Action Required</Label>
            <Textarea placeholder="Specific actions to be taken..." rows={2} value={form.action_required} onChange={(e) => set('action_required', e.target.value)} />
          </div>

          {/* Action Owner + Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Action Owner</Label>
              <Input placeholder="Responsible person/team" value={form.action_owner} onChange={(e) => set('action_owner', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Action Due Date</Label>
              <Input type="date" value={form.action_due_date} onChange={(e) => set('action_due_date', e.target.value)} />
            </div>
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v as ServiceQualityStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => set('priority', v as ServiceQualityPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Reported By */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Reported By</Label>
              <Input placeholder="Your name" value={form.reported_by} onChange={(e) => set('reported_by', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Reported By Email</Label>
              <Input type="email" placeholder="email@xomoman.com" value={form.reported_by_email} onChange={(e) => set('reported_by_email', e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : editRecord ? 'Save Changes' : 'Create Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── View Dialog ───────────────────────────────────────────────────────────────
function ViewDialog({ report, onClose }: { report: ServiceQualityReport; onClose: () => void }) {
  const fmt = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  function Row({ label, value }: { label: string; value?: string | null | number }) {
    if (!value && value !== 0) return null
    return (
      <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border/50 last:border-0">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="col-span-2 text-sm font-medium break-words">{String(value)}</span>
      </div>
    )
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            {report.title}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">{report.ref_no}</p>
        </DialogHeader>
        <div className="space-y-1 py-2">
          <Row label="Report Date" value={fmt(report.report_date)} />
          <Row label="Period" value={report.period} />
          <Row label="Business Unit" value={report.business_unit} />
          <Row label="Contractor" value={report.contractor} />
          <Row label="Service Category" value={report.service_category} />
          <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Rating</span>
            <div className="col-span-2"><StarRating rating={report.rating} /></div>
          </div>
          <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Status</span>
            <div className="col-span-2"><StatusBadge status={report.status} /></div>
          </div>
          <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Priority</span>
            <div className="col-span-2"><PriorityBadge priority={report.priority} /></div>
          </div>
          <Row label="Description" value={report.description} />
          <Row label="Findings" value={report.findings} />
          <Row label="Recommendations" value={report.recommendations} />
          <Row label="Action Required" value={report.action_required} />
          <Row label="Action Owner" value={report.action_owner} />
          <Row label="Action Due Date" value={fmt(report.action_due_date)} />
          <Row label="Reported By" value={report.reported_by} />
          <Row label="Reported By Email" value={report.reported_by_email} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export function ServiceQuality({ readOnly = false }: { readOnly?: boolean }) {
  const { toast } = useToast()
  const [records, setRecords] = useState<ServiceQualityReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')

  // Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<ServiceQualityReport | undefined>()
  const [viewRecord, setViewRecord] = useState<ServiceQualityReport | undefined>()

  const load = useCallback(async () => {
    setIsRefreshing(true)
    const res = await getServiceQualityReports({
      status: filterStatus,
      category: filterCategory,
      priority: filterPriority,
      search: search || undefined,
    })
    if (res.success && res.data) setRecords(res.data)
    setIsLoading(false)
    setIsRefreshing(false)
  }, [filterStatus, filterCategory, filterPriority, search])

  useEffect(() => { load() }, [load])

  function openCreate() { setEditRecord(undefined); setIsFormOpen(true) }
  function openEdit(r: ServiceQualityReport) { setEditRecord(r); setIsFormOpen(true) }

  async function handleDelete(id: string) {
    const res = await deleteServiceQualityReport(id)
    if (res.success) { toast({ title: 'Report deleted' }); load() }
    else toast({ title: 'Error', description: res.error, variant: 'destructive' })
  }

  // Stats
  const open = records.filter((r) => r.status === 'Open').length
  const inProgress = records.filter((r) => r.status === 'In Progress').length
  const closed = records.filter((r) => r.status === 'Closed').length
  const avgRating =
    records.filter((r) => r.rating).length > 0
      ? (records.filter((r) => r.rating).reduce((s, r) => s + (r.rating ?? 0), 0) /
          records.filter((r) => r.rating).length).toFixed(1)
      : '—'

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="space-y-4 pt-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Reports', value: records.length, color: 'text-foreground' },
          { label: 'Open', value: open, color: 'text-warning' },
          { label: 'In Progress', value: inProgress, color: 'text-blue-600' },
          { label: 'Avg Rating', value: avgRating, color: 'text-yellow-500' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold tracking-tight ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Card */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Service Quality Reports
              </CardTitle>
              <CardDescription>Track and manage service quality evaluations and contractor performance</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportToCSV(records)}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={load} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {!readOnly && (
                <Button size="sm" className="gap-1.5" onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  New Report
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title, contractor, unit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {SERVICE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No service quality reports found.</p>
              {!readOnly && (
                <Button size="sm" variant="outline" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Report
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border/50">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">Ref No</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Title</TableHead>
                    <TableHead className="text-xs">Contractor</TableHead>
                    <TableHead className="text-xs">Rating</TableHead>
                    <TableHead className="text-xs">Priority</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Action Owner</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/20">
                      <TableCell className="text-xs font-mono text-muted-foreground">{r.ref_no ?? '—'}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {r.report_date ? new Date(r.report_date).toLocaleDateString('en-GB') : '—'}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-xs">{r.service_category}</Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-[180px] truncate font-medium">{r.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.contractor ?? '—'}</TableCell>
                      <TableCell><StarRating rating={r.rating} /></TableCell>
                      <TableCell><PriorityBadge priority={r.priority} /></TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.action_owner ?? '—'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewRecord(r)}>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                            {!readOnly && (
                              <>
                                <DropdownMenuItem onClick={() => openEdit(r)}>
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDelete(r.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      {isFormOpen && (
        <ReportFormDialog
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          editRecord={editRecord}
          onSaved={load}
        />
      )}

      {/* View Dialog */}
      {viewRecord && <ViewDialog report={viewRecord} onClose={() => setViewRecord(undefined)} />}
    </div>
  )
}
