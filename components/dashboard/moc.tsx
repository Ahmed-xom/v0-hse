"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus, Search, RefreshCw, Eye, Edit, Trash2, GitBranch,
  CheckCircle2, Clock, XCircle, ChevronDown, AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, parseISO } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { isAdminRole, isReviewerRole } from "@/lib/auth-roles"
import {
  getMOCs, createMOC, updateMOC, deleteMOC,
  type MOC, type MOCStatus,
} from "@/app/actions/manage-moc"

const MOC_TYPES = [
  'Management of Change',
  'Exemption',
  'Deviation',
  'Temporary Change',
  'Permanent Change',
]

const STATUS_STYLES: Record<string, string> = {
  Draft: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  "Under Review": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Rejected: "bg-red-500/10 text-red-500 border-red-500/20",
  Implemented: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  Closed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  Cancelled: "bg-orange-500/10 text-orange-500 border-orange-500/20",
}

const RISK_STYLES: Record<string, string> = {
  Low: "bg-green-500/10 text-green-600 border-green-500/20",
  Medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  High: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  Critical: "bg-red-500/10 text-red-600 border-red-500/20",
}

type FormData = Omit<MOC, 'id' | 'moc_no' | 'created_at' | 'updated_at'>

const EMPTY_FORM: FormData = {
  moc_type: 'Management of Change', title: '', description: '', reason: '',
  business_unit: '', location: '', initiator: '', initiator_email: '',
  approver: '', approver_email: '', risk_level: 'Medium', status: 'Draft',
  implementation_date: '', review_date: '', expiry_date: '',
  hse_impact: '', environmental_impact: '', operational_impact: '',
  mitigations: '', lessons_learned: '',
}

interface Props { readOnly?: boolean }

export function ManagementOfChange({ readOnly = false }: Props) {
  const { currentUser } = useAuth()
  const isAdmin = isAdminRole(currentUser?.role ?? '', currentUser?.email ?? '')
  const isReviewer = !isAdmin && isReviewerRole(currentUser?.role ?? '')
  const canEdit = !readOnly && (isAdmin || isReviewer)
  const { toast } = useToast()

  const [mocs, setMocs] = useState<MOC[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selected, setSelected] = useState<MOC | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setMocs(await getMOCs())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = mocs.filter(m => {
    const matchSearch = !search ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.moc_no ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (m.initiator ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || m.status === filterStatus
    const matchType = filterType === 'all' || m.moc_type === filterType
    return matchSearch && matchStatus && matchType
  })

  const stats = {
    total: mocs.length,
    underReview: mocs.filter(m => m.status === 'Under Review').length,
    approved: mocs.filter(m => m.status === 'Approved').length,
    implemented: mocs.filter(m => m.status === 'Implemented').length,
  }

  const openCreate = () => { setSelected(null); setForm(EMPTY_FORM); setIsFormOpen(true) }
  const openEdit = (m: MOC) => {
    setSelected(m)
    setForm({
      moc_type: m.moc_type, title: m.title, description: m.description ?? '',
      reason: m.reason ?? '', business_unit: m.business_unit ?? '', location: m.location ?? '',
      initiator: m.initiator ?? '', initiator_email: m.initiator_email ?? '',
      approver: m.approver ?? '', approver_email: m.approver_email ?? '',
      risk_level: m.risk_level, status: m.status,
      implementation_date: m.implementation_date ? m.implementation_date.slice(0, 10) : '',
      review_date: m.review_date ? m.review_date.slice(0, 10) : '',
      expiry_date: m.expiry_date ? m.expiry_date.slice(0, 10) : '',
      hse_impact: m.hse_impact ?? '', environmental_impact: m.environmental_impact ?? '',
      operational_impact: m.operational_impact ?? '', mitigations: m.mitigations ?? '',
      lessons_learned: m.lessons_learned ?? '',
    })
    setIsFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.moc_type) {
      toast({ title: 'Title and type are required', variant: 'destructive' })
      return
    }
    setSaving(true)
    const res = selected ? await updateMOC(selected.id, form) : await createMOC(form)
    setSaving(false)
    if (res.success) {
      toast({ title: selected ? 'MOC updated' : `MOC created${'moc_no' in res ? ` — ${(res as any).moc_no}` : ''}` })
      setIsFormOpen(false)
      load()
    } else {
      toast({ title: 'Failed to save MOC', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    const res = await deleteMOC(id)
    if (res.success) { toast({ title: 'MOC deleted' }); load() }
    else toast({ title: 'Failed to delete', variant: 'destructive' })
  }

  const fmtDate = (d: string | null) => {
    if (!d) return '—'
    try { return format(parseISO(d), 'dd MMM yyyy') } catch { return d }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total MOCs', value: stats.total, icon: GitBranch, color: 'text-primary' },
          { label: 'Under Review', value: stats.underReview, icon: Clock, color: 'text-blue-500' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Implemented', value: stats.implemented, icon: CheckCircle2, color: 'text-teal-500' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search MOCs..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.keys(STATUS_STYLES).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {MOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
          {canEdit && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />New MOC
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>MOC No.</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Initiator</TableHead>
              <TableHead>Review Date</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="py-12 text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="py-12 text-center text-muted-foreground">No MOCs found.</TableCell></TableRow>
            ) : filtered.map(m => (
              <TableRow key={m.id}>
                <TableCell className="font-mono text-xs">{m.moc_no ?? '—'}</TableCell>
                <TableCell className="font-medium max-w-[200px] truncate">{m.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{m.moc_type}</TableCell>
                <TableCell><Badge variant="outline" className={RISK_STYLES[m.risk_level]}>{m.risk_level}</Badge></TableCell>
                <TableCell><Badge variant="outline" className={STATUS_STYLES[m.status]}>{m.status}</Badge></TableCell>
                <TableCell className="text-sm">{m.initiator ?? '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{fmtDate(m.review_date)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{fmtDate(m.expiry_date)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm"><ChevronDown className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setSelected(m); setIsViewOpen(true) }}>
                        <Eye className="mr-2 h-4 w-4" />View
                      </DropdownMenuItem>
                      {canEdit && (
                        <>
                          <DropdownMenuItem onClick={() => openEdit(m)}>
                            <Edit className="mr-2 h-4 w-4" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(m.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />Delete
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

      {/* Create / Edit Dialog */}
      {canEdit && (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selected ? `Edit MOC — ${selected.moc_no}` : 'New Management of Change / Exemption'}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="impact">Impact Assessment</TabsTrigger>
                <TabsTrigger value="actions">Actions & Review</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>MOC Type <span className="text-destructive">*</span></Label>
                    <Select value={form.moc_type} onValueChange={v => setForm(f => ({ ...f, moc_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{MOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Risk Level</Label>
                    <Select value={form.risk_level} onValueChange={v => setForm(f => ({ ...f, risk_level: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{['Low','Medium','High','Critical'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Title <span className="text-destructive">*</span></Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea rows={3} value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the change or exemption..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Reason / Justification</Label>
                  <Textarea rows={2} value={form.reason ?? ''} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Why is this change needed?" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Business Unit</Label>
                    <Input value={form.business_unit ?? ''} onChange={e => setForm(f => ({ ...f, business_unit: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Location</Label>
                    <Input value={form.location ?? ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Initiated By</Label>
                    <Input value={form.initiator ?? ''} onChange={e => setForm(f => ({ ...f, initiator: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Initiator Email</Label>
                    <Input type="email" value={form.initiator_email ?? ''} onChange={e => setForm(f => ({ ...f, initiator_email: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Approver</Label>
                    <Input value={form.approver ?? ''} onChange={e => setForm(f => ({ ...f, approver: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Approver Email</Label>
                    <Input type="email" value={form.approver_email ?? ''} onChange={e => setForm(f => ({ ...f, approver_email: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as MOCStatus }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(STATUS_STYLES).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="impact" className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label>HSE Impact</Label>
                  <Textarea rows={3} value={form.hse_impact ?? ''} onChange={e => setForm(f => ({ ...f, hse_impact: e.target.value }))} placeholder="Describe the impact on health, safety, and environment..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Environmental Impact</Label>
                  <Textarea rows={3} value={form.environmental_impact ?? ''} onChange={e => setForm(f => ({ ...f, environmental_impact: e.target.value }))} placeholder="Describe any environmental impact..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Operational Impact</Label>
                  <Textarea rows={3} value={form.operational_impact ?? ''} onChange={e => setForm(f => ({ ...f, operational_impact: e.target.value }))} placeholder="Describe the impact on operations..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Mitigations / Controls</Label>
                  <Textarea rows={3} value={form.mitigations ?? ''} onChange={e => setForm(f => ({ ...f, mitigations: e.target.value }))} placeholder="List all mitigations and control measures..." />
                </div>
              </TabsContent>

              <TabsContent value="actions" className="space-y-4 pt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Implementation Date</Label>
                    <Input type="date" value={form.implementation_date ?? ''} onChange={e => setForm(f => ({ ...f, implementation_date: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Review Date</Label>
                    <Input type="date" value={form.review_date ?? ''} onChange={e => setForm(f => ({ ...f, review_date: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Expiry Date</Label>
                    <Input type="date" value={form.expiry_date ?? ''} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Lessons Learned</Label>
                  <Textarea rows={4} value={form.lessons_learned ?? ''} onChange={e => setForm(f => ({ ...f, lessons_learned: e.target.value }))} placeholder="Document any lessons learned after implementation..." />
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : selected ? 'Update MOC' : 'Create MOC'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              {selected?.moc_no} — {selected?.title}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className={STATUS_STYLES[selected.status]}>{selected.status}</Badge>
                <Badge variant="outline" className={RISK_STYLES[selected.risk_level]}>{selected.risk_level} Risk</Badge>
                <Badge variant="outline">{selected.moc_type}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {[
                  ['Business Unit', selected.business_unit], ['Location', selected.location],
                  ['Initiated By', selected.initiator], ['Approver', selected.approver],
                  ['Implementation', fmtDate(selected.implementation_date)],
                  ['Review Date', fmtDate(selected.review_date)],
                  ['Expiry Date', fmtDate(selected.expiry_date)],
                ].map(([l, v]) => v && v !== '—' ? (
                  <div key={l as string}><p className="text-xs text-muted-foreground">{l}</p><p className="font-medium">{v}</p></div>
                ) : null)}
              </div>
              {[
                ['Description', selected.description],
                ['Reason / Justification', selected.reason],
                ['HSE Impact', selected.hse_impact],
                ['Environmental Impact', selected.environmental_impact],
                ['Operational Impact', selected.operational_impact],
                ['Mitigations / Controls', selected.mitigations],
                ['Lessons Learned', selected.lessons_learned],
              ].map(([l, v]) => v ? (
                <div key={l as string}>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{l}</p>
                  <p className="whitespace-pre-wrap">{v}</p>
                </div>
              ) : null)}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
