"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus, Search, RefreshCw, Eye, Edit, Trash2, Shield,
  AlertTriangle, CheckCircle2, Clock, XCircle, ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  getPermits, createPermit, updatePermit, deletePermit,
  type PermitToWork, type PTWStatus,
} from "@/app/actions/manage-ptw"

const PERMIT_TYPES = [
  'Hot Work', 'Cold Work', 'Confined Space Entry', 'Working at Height',
  'Electrical Isolation', 'Excavation', 'Lifting Operations',
  'Radiation Work', 'Chemical Handling', 'General Work',
]

const PPE_OPTIONS = [
  'Hard Hat', 'Safety Glasses', 'Safety Boots', 'High-Vis Vest',
  'Gloves', 'Full Face Shield', 'Respirator', 'Ear Protection',
  'Safety Harness', 'Fire-Resistant Clothing', 'Chemical Suit',
]

const STATUS_STYLES: Record<string, string> = {
  Draft: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  "Pending Approval": "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Approved: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Suspended: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  Closed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  Cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
}

const PRIORITY_STYLES: Record<string, string> = {
  Low: "bg-green-500/10 text-green-600 border-green-500/20",
  Medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  High: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  Critical: "bg-red-500/10 text-red-600 border-red-500/20",
}

type FormData = Omit<PermitToWork, 'id' | 'permit_no' | 'created_at' | 'updated_at'>

const EMPTY_FORM: FormData = {
  permit_type: 'General Work', title: '', work_description: '',
  location: '', business_unit: '', work_start: '', work_end: '',
  requested_by: '', requested_by_email: '', approved_by: '', approved_by_email: '',
  status: 'Draft', priority: 'Medium', hazards: '', precautions: '', ppe_required: [],
  isolations_required: false, hot_work: false, confined_space: false,
  working_at_height: false, electrical_work: false, excavation: false,
  lifting_operations: false, contractor: '', contractor_supervisor: '', close_reason: '',
}

interface Props { readOnly?: boolean }

export function PermitToWork({ readOnly = false }: Props) {
  const { currentUser } = useAuth()
  const isAdmin = isAdminRole(currentUser?.role ?? '', currentUser?.email ?? '')
  const isReviewer = !isAdmin && isReviewerRole(currentUser?.role ?? '')
  const canEdit = !readOnly && (isAdmin || isReviewer)
  const { toast } = useToast()

  const [permits, setPermits] = useState<PermitToWork[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selected, setSelected] = useState<PermitToWork | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setPermits(await getPermits())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = permits.filter(p => {
    const matchSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.permit_no ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.requested_by ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.location ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    const matchType = filterType === 'all' || p.permit_type === filterType
    return matchSearch && matchStatus && matchType
  })

  // Stats
  const stats = {
    total: permits.length,
    active: permits.filter(p => p.status === 'Active').length,
    pending: permits.filter(p => p.status === 'Pending Approval').length,
    closed: permits.filter(p => p.status === 'Closed').length,
  }

  const openCreate = () => { setSelected(null); setForm(EMPTY_FORM); setIsFormOpen(true) }
  const openEdit = (p: PermitToWork) => {
    setSelected(p)
    setForm({
      permit_type: p.permit_type, title: p.title, work_description: p.work_description ?? '',
      location: p.location ?? '', business_unit: p.business_unit ?? '',
      work_start: p.work_start ? p.work_start.slice(0, 16) : '',
      work_end: p.work_end ? p.work_end.slice(0, 16) : '',
      requested_by: p.requested_by ?? '', requested_by_email: p.requested_by_email ?? '',
      approved_by: p.approved_by ?? '', approved_by_email: p.approved_by_email ?? '',
      status: p.status, priority: p.priority, hazards: p.hazards ?? '',
      precautions: p.precautions ?? '', ppe_required: p.ppe_required ?? [],
      isolations_required: p.isolations_required, hot_work: p.hot_work,
      confined_space: p.confined_space, working_at_height: p.working_at_height,
      electrical_work: p.electrical_work, excavation: p.excavation,
      lifting_operations: p.lifting_operations, contractor: p.contractor ?? '',
      contractor_supervisor: p.contractor_supervisor ?? '', close_reason: p.close_reason ?? '',
    })
    setIsFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.permit_type) {
      toast({ title: 'Title and permit type are required', variant: 'destructive' })
      return
    }
    setSaving(true)
    const res = selected
      ? await updatePermit(selected.id, form)
      : await createPermit(form)
    setSaving(false)
    if (res.success) {
      toast({ title: selected ? 'Permit updated' : `Permit created${'permit_no' in res ? ` — ${(res as any).permit_no}` : ''}` })
      setIsFormOpen(false)
      load()
    } else {
      toast({ title: 'Failed to save permit', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    const res = await deletePermit(id)
    if (res.success) { toast({ title: 'Permit deleted' }); load() }
    else toast({ title: 'Failed to delete', variant: 'destructive' })
  }

  const togglePPE = (item: string) => {
    setForm(f => ({
      ...f,
      ppe_required: f.ppe_required.includes(item)
        ? f.ppe_required.filter(p => p !== item)
        : [...f.ppe_required, item],
    }))
  }

  const fmtDate = (d: string | null) => {
    if (!d) return '—'
    try { return format(parseISO(d), 'dd MMM yyyy HH:mm') } catch { return d }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Permits', value: stats.total, icon: Shield, color: 'text-primary' },
          { label: 'Active', value: stats.active, icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Pending Approval', value: stats.pending, icon: Clock, color: 'text-amber-500' },
          { label: 'Closed', value: stats.closed, icon: XCircle, color: 'text-zinc-400' },
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
            <Input placeholder="Search permits..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {['Draft','Pending Approval','Approved','Active','Suspended','Closed','Cancelled'].map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {PERMIT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
          {canEdit && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />New Permit
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Permit No.</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Work Start</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="py-12 text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="py-12 text-center text-muted-foreground">No permits found.</TableCell></TableRow>
            ) : filtered.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.permit_no ?? '—'}</TableCell>
                <TableCell className="font-medium max-w-[200px] truncate">{p.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.permit_type}</TableCell>
                <TableCell><Badge variant="outline" className={STATUS_STYLES[p.status]}>{p.status}</Badge></TableCell>
                <TableCell><Badge variant="outline" className={PRIORITY_STYLES[p.priority]}>{p.priority}</Badge></TableCell>
                <TableCell className="text-sm">{p.requested_by ?? '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{fmtDate(p.work_start)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.location ?? '—'}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm"><ChevronDown className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setSelected(p); setIsViewOpen(true) }}>
                        <Eye className="mr-2 h-4 w-4" />View
                      </DropdownMenuItem>
                      {canEdit && (
                        <>
                          <DropdownMenuItem onClick={() => openEdit(p)}>
                            <Edit className="mr-2 h-4 w-4" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(p.id)}>
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
              <DialogTitle>{selected ? `Edit Permit — ${selected.permit_no}` : 'New Permit to Work'}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="hazards">Hazards & PPE</TabsTrigger>
                <TabsTrigger value="special">Special Works</TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Permit Type <span className="text-destructive">*</span></Label>
                    <Select value={form.permit_type} onValueChange={v => setForm(f => ({ ...f, permit_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PERMIT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Priority</Label>
                    <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{['Low','Medium','High','Critical'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Title <span className="text-destructive">*</span></Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief title of the work activity" />
                </div>
                <div className="space-y-1.5">
                  <Label>Work Description</Label>
                  <Textarea rows={3} value={form.work_description ?? ''} onChange={e => setForm(f => ({ ...f, work_description: e.target.value }))} placeholder="Detailed description of the work to be performed..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Location</Label>
                    <Input value={form.location ?? ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Business Unit</Label>
                    <Input value={form.business_unit ?? ''} onChange={e => setForm(f => ({ ...f, business_unit: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Work Start</Label>
                    <Input type="datetime-local" value={form.work_start ?? ''} onChange={e => setForm(f => ({ ...f, work_start: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Work End</Label>
                    <Input type="datetime-local" value={form.work_end ?? ''} onChange={e => setForm(f => ({ ...f, work_end: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Requested By</Label>
                    <Input value={form.requested_by ?? ''} onChange={e => setForm(f => ({ ...f, requested_by: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Requestor Email</Label>
                    <Input type="email" value={form.requested_by_email ?? ''} onChange={e => setForm(f => ({ ...f, requested_by_email: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Approved By</Label>
                    <Input value={form.approved_by ?? ''} onChange={e => setForm(f => ({ ...f, approved_by: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Approver Email</Label>
                    <Input type="email" value={form.approved_by_email ?? ''} onChange={e => setForm(f => ({ ...f, approved_by_email: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Contractor</Label>
                    <Input value={form.contractor ?? ''} onChange={e => setForm(f => ({ ...f, contractor: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contractor Supervisor</Label>
                    <Input value={form.contractor_supervisor ?? ''} onChange={e => setForm(f => ({ ...f, contractor_supervisor: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as PTWStatus }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Draft','Pending Approval','Approved','Active','Suspended','Closed','Cancelled'].map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(form.status === 'Closed' || form.status === 'Cancelled') && (
                  <div className="space-y-1.5">
                    <Label>Close / Cancel Reason</Label>
                    <Textarea rows={2} value={form.close_reason ?? ''} onChange={e => setForm(f => ({ ...f, close_reason: e.target.value }))} />
                  </div>
                )}
              </TabsContent>

              {/* Hazards & PPE Tab */}
              <TabsContent value="hazards" className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label>Identified Hazards</Label>
                  <Textarea rows={3} value={form.hazards ?? ''} onChange={e => setForm(f => ({ ...f, hazards: e.target.value }))} placeholder="List all identified hazards..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Precautions / Controls</Label>
                  <Textarea rows={3} value={form.precautions ?? ''} onChange={e => setForm(f => ({ ...f, precautions: e.target.value }))} placeholder="List all precautions and control measures..." />
                </div>
                <div className="space-y-2">
                  <Label>Required PPE</Label>
                  <div className="grid grid-cols-2 gap-2 rounded-lg border p-3 sm:grid-cols-3">
                    {PPE_OPTIONS.map(item => (
                      <div key={item} className="flex items-center gap-2">
                        <Checkbox
                          id={`ppe-${item}`}
                          checked={form.ppe_required.includes(item)}
                          onCheckedChange={() => togglePPE(item)}
                        />
                        <Label htmlFor={`ppe-${item}`} className="cursor-pointer text-sm font-normal">{item}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Special Works Tab */}
              <TabsContent value="special" className="space-y-3 pt-4">
                <p className="text-sm text-muted-foreground">Select all special work categories that apply to this permit.</p>
                <div className="grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2">
                  {[
                    { key: 'hot_work', label: 'Hot Work' },
                    { key: 'confined_space', label: 'Confined Space Entry' },
                    { key: 'working_at_height', label: 'Working at Height' },
                    { key: 'electrical_work', label: 'Electrical Isolation Work' },
                    { key: 'excavation', label: 'Excavation' },
                    { key: 'lifting_operations', label: 'Lifting Operations' },
                    { key: 'isolations_required', label: 'Isolations Required' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2 rounded-md border p-3">
                      <Checkbox
                        id={key}
                        checked={!!form[key as keyof FormData]}
                        onCheckedChange={v => setForm(f => ({ ...f, [key]: !!v }))}
                      />
                      <Label htmlFor={key} className="cursor-pointer font-medium">{label}</Label>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : selected ? 'Update Permit' : 'Create Permit'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {selected?.permit_no} — {selected?.title}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className={STATUS_STYLES[selected.status]}>{selected.status}</Badge>
                <Badge variant="outline" className={PRIORITY_STYLES[selected.priority]}>{selected.priority}</Badge>
                <Badge variant="outline">{selected.permit_type}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {[
                  ['Location', selected.location],
                  ['Business Unit', selected.business_unit],
                  ['Work Start', fmtDate(selected.work_start)],
                  ['Work End', fmtDate(selected.work_end)],
                  ['Requested By', selected.requested_by],
                  ['Approved By', selected.approved_by],
                  ['Contractor', selected.contractor],
                  ['Contractor Supervisor', selected.contractor_supervisor],
                ].map(([l, v]) => v ? (
                  <div key={l as string}>
                    <p className="text-xs text-muted-foreground">{l}</p>
                    <p className="font-medium">{v}</p>
                  </div>
                ) : null)}
              </div>
              {selected.work_description && (
                <div><p className="text-xs font-semibold text-muted-foreground mb-1">Work Description</p><p className="whitespace-pre-wrap">{selected.work_description}</p></div>
              )}
              {selected.hazards && (
                <div><p className="text-xs font-semibold text-muted-foreground mb-1">Identified Hazards</p><p className="whitespace-pre-wrap">{selected.hazards}</p></div>
              )}
              {selected.precautions && (
                <div><p className="text-xs font-semibold text-muted-foreground mb-1">Precautions / Controls</p><p className="whitespace-pre-wrap">{selected.precautions}</p></div>
              )}
              {selected.ppe_required?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Required PPE</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.ppe_required.map(p => <Badge key={p} variant="secondary">{p}</Badge>)}
                  </div>
                </div>
              )}
              {/* Special works */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Special Work Categories</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'hot_work', label: 'Hot Work' },
                    { key: 'confined_space', label: 'Confined Space' },
                    { key: 'working_at_height', label: 'Working at Height' },
                    { key: 'electrical_work', label: 'Electrical Work' },
                    { key: 'excavation', label: 'Excavation' },
                    { key: 'lifting_operations', label: 'Lifting Operations' },
                    { key: 'isolations_required', label: 'Isolations Required' },
                  ].filter(({ key }) => selected[key as keyof PermitToWork]).map(({ label }) => (
                    <Badge key={label} variant="outline" className="border-amber-500/30 text-amber-600">
                      <AlertTriangle className="mr-1 h-3 w-3" />{label}
                    </Badge>
                  ))}
                  {!['hot_work','confined_space','working_at_height','electrical_work','excavation','lifting_operations','isolations_required'].some(k => selected[k as keyof PermitToWork]) && (
                    <span className="text-muted-foreground">None</span>
                  )}
                </div>
              </div>
              {selected.close_reason && (
                <div><p className="text-xs font-semibold text-muted-foreground mb-1">Close / Cancel Reason</p><p>{selected.close_reason}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
