"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus, Search, Filter, RefreshCw, Eye, Edit, Trash2,
  ClipboardCheck, Building2, ShieldCheck, MapPin, Download,
  ChevronDown, CheckCircle2, Clock, AlertCircle, XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, parseISO } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { isAdminRole, isReviewerRole } from "@/lib/auth-roles"
import {
  getInspections, createInspection, updateInspection, deleteInspection,
  type Inspection, type InspectionType, type InspectionStatus, type InspectionPriority,
} from "@/app/actions/manage-inspections"

const INSPECTION_TYPES: InspectionType[] = [
  "Management Visit", "Audit", "HSE Inspection", "Site Inspection",
]
const STATUSES: InspectionStatus[] = [
  "Scheduled", "In Progress", "Completed", "Overdue", "Cancelled",
]
const PRIORITIES: InspectionPriority[] = ["Low", "Medium", "High", "Critical"]

const TYPE_ICONS: Record<string, React.ReactNode> = {
  "Management Visit": <Building2 className="h-3.5 w-3.5" />,
  "Audit": <ClipboardCheck className="h-3.5 w-3.5" />,
  "HSE Inspection": <ShieldCheck className="h-3.5 w-3.5" />,
  "Site Inspection": <MapPin className="h-3.5 w-3.5" />,
}

const STATUS_COLORS: Record<string, string> = {
  Completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  "In Progress": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Scheduled: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  Overdue: "bg-red-500/10 text-red-400 border-red-500/20",
  Cancelled: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
}

const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-slate-500/10 text-slate-400",
  Medium: "bg-amber-500/10 text-amber-500",
  High: "bg-orange-500/10 text-orange-500",
  Critical: "bg-red-500/10 text-red-400",
}

type FormData = {
  inspection_type: InspectionType
  title: string
  location: string
  business_unit: string
  inspector_name: string
  inspector_email: string
  date: string
  scheduled_date: string
  status: InspectionStatus
  findings: string
  recommendations: string
  action_required: string
  action_owner: string
  action_due_date: string
  priority: InspectionPriority
  total_findings: string
  critical_findings: string
  completion_rate: string
}

const EMPTY_FORM: FormData = {
  inspection_type: "Management Visit",
  title: "",
  location: "",
  business_unit: "",
  inspector_name: "",
  inspector_email: "",
  date: new Date().toISOString().split("T")[0],
  scheduled_date: "",
  status: "Scheduled",
  findings: "",
  recommendations: "",
  action_required: "",
  action_owner: "",
  action_due_date: "",
  priority: "Medium",
  total_findings: "0",
  critical_findings: "0",
  completion_rate: "0",
}

function DatePickerField({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            {value ? format(parseISO(value), "dd MMM yyyy") : <span className="text-muted-foreground">Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ? parseISO(value) : undefined}
            onSelect={(d) => onChange(d ? format(d, "yyyy-MM-dd") : "")}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

interface InspectionReportsProps {
  readOnly?: boolean
}

export function InspectionReports({ readOnly = false }: InspectionReportsProps) {
  const { toast } = useToast()
  const { currentUser } = useAuth()
  const canEdit = !readOnly && (
    isAdminRole(currentUser?.role ?? "", currentUser?.email ?? "") ||
    isReviewerRole(currentUser?.role ?? "")
  )

  const [records, setRecords] = useState<Inspection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selected, setSelected] = useState<Inspection | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    const data = await getInspections({ type: filterType, status: filterStatus, search })
    setRecords(data)
    setIsLoading(false)
  }, [filterType, filterStatus, search])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setForm(EMPTY_FORM); setIsAddOpen(true) }
  const openEdit = (r: Inspection) => {
    setSelected(r)
    setForm({
      inspection_type: r.inspection_type,
      title: r.title,
      location: r.location ?? "",
      business_unit: r.business_unit ?? "",
      inspector_name: r.inspector_name ?? "",
      inspector_email: r.inspector_email ?? "",
      date: r.date ? new Date(r.date).toISOString().split("T")[0] : "",
      scheduled_date: r.scheduled_date ? new Date(r.scheduled_date).toISOString().split("T")[0] : "",
      status: r.status,
      findings: r.findings ?? "",
      recommendations: r.recommendations ?? "",
      action_required: r.action_required ?? "",
      action_owner: r.action_owner ?? "",
      action_due_date: r.action_due_date ? new Date(r.action_due_date).toISOString().split("T")[0] : "",
      priority: r.priority,
      total_findings: String(r.total_findings),
      critical_findings: String(r.critical_findings),
      completion_rate: String(r.completion_rate),
    })
    setIsEditOpen(true)
  }

  const handleSave = async (isEdit: boolean) => {
    if (!form.title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return }
    setIsSaving(true)
    const payload = {
      ...form,
      total_findings: Number(form.total_findings),
      critical_findings: Number(form.critical_findings),
      completion_rate: Number(form.completion_rate),
      date: form.date || new Date().toISOString(),
      scheduled_date: form.scheduled_date || undefined,
      action_due_date: form.action_due_date || undefined,
      created_by: currentUser?.name,
    }
    const res = isEdit && selected
      ? await updateInspection(selected.id, payload)
      : await createInspection(payload)
    setIsSaving(false)
    if (res.success) {
      toast({ title: isEdit ? "Inspection updated" : "Inspection created" })
      setIsAddOpen(false); setIsEditOpen(false)
      load()
    } else {
      toast({ title: "Error", description: res.error, variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    const res = await deleteInspection(id)
    if (res.success) { toast({ title: "Inspection deleted" }); load() }
    else toast({ title: "Error", description: res.error, variant: "destructive" })
  }

  // Stats
  const total = records.length
  const completed = records.filter((r) => r.status === "Completed").length
  const overdue = records.filter((r) => r.status === "Overdue").length
  const managementVisits = records.filter((r) => r.inspection_type === "Management Visit").length
  const audits = records.filter((r) => r.inspection_type === "Audit").length

  const f = (v: string) => (
    <div className="space-y-1.5">
      {v}
    </div>
  )

  const FormBody = ({ d, set }: { d: FormData; set: React.Dispatch<React.SetStateAction<FormData>> }) => (
    <div className="grid gap-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Inspection Type <span className="text-destructive">*</span></Label>
          <Select value={d.inspection_type} onValueChange={(v) => set((f) => ({ ...f, inspection_type: v as InspectionType }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{INSPECTION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={d.priority} onValueChange={(v) => set((f) => ({ ...f, priority: v as InspectionPriority }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Title <span className="text-destructive">*</span></Label>
        <Input value={d.title} onChange={(e) => set((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Q1 Management Visit – Duqm Site" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Location</Label>
          <Input value={d.location} onChange={(e) => set((f) => ({ ...f, location: e.target.value }))} placeholder="Site / Location" />
        </div>
        <div className="space-y-1.5">
          <Label>Business Unit</Label>
          <Input value={d.business_unit} onChange={(e) => set((f) => ({ ...f, business_unit: e.target.value }))} placeholder="Business unit" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Inspector</Label>
          <Input value={d.inspector_name} onChange={(e) => set((f) => ({ ...f, inspector_name: e.target.value }))} placeholder="Inspector name" />
        </div>
        <div className="space-y-1.5">
          <Label>Inspector Email</Label>
          <Input type="email" value={d.inspector_email} onChange={(e) => set((f) => ({ ...f, inspector_email: e.target.value }))} placeholder="email@example.com" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <DatePickerField label="Inspection Date" value={d.date} onChange={(v) => set((f) => ({ ...f, date: v }))} />
        <DatePickerField label="Scheduled Date" value={d.scheduled_date} onChange={(v) => set((f) => ({ ...f, scheduled_date: v }))} />
      </div>
      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select value={d.status} onValueChange={(v) => set((f) => ({ ...f, status: v as InspectionStatus }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Total Findings</Label>
          <Input type="number" min={0} value={d.total_findings} onChange={(e) => set((f) => ({ ...f, total_findings: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Critical Findings</Label>
          <Input type="number" min={0} value={d.critical_findings} onChange={(e) => set((f) => ({ ...f, critical_findings: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Completion %</Label>
          <Input type="number" min={0} max={100} value={d.completion_rate} onChange={(e) => set((f) => ({ ...f, completion_rate: e.target.value }))} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Findings</Label>
        <Textarea rows={3} value={d.findings} onChange={(e) => set((f) => ({ ...f, findings: e.target.value }))} placeholder="Describe inspection findings..." />
      </div>
      <div className="space-y-1.5">
        <Label>Recommendations</Label>
        <Textarea rows={3} value={d.recommendations} onChange={(e) => set((f) => ({ ...f, recommendations: e.target.value }))} placeholder="Corrective actions and recommendations..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Action Required</Label>
          <Input value={d.action_required} onChange={(e) => set((f) => ({ ...f, action_required: e.target.value }))} placeholder="Action required" />
        </div>
        <div className="space-y-1.5">
          <Label>Action Owner</Label>
          <Input value={d.action_owner} onChange={(e) => set((f) => ({ ...f, action_owner: e.target.value }))} placeholder="Responsible person" />
        </div>
      </div>
      <DatePickerField label="Action Due Date" value={d.action_due_date} onChange={(v) => set((f) => ({ ...f, action_due_date: v }))} />
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Total", value: total, icon: ClipboardCheck, color: "text-primary" },
          { label: "Completed", value: completed, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Overdue", value: overdue, icon: AlertCircle, color: "text-red-400" },
          { label: "Mgmt Visits", value: managementVisits, icon: Building2, color: "text-blue-500" },
          { label: "Audits", value: audits, icon: ClipboardCheck, color: "text-amber-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-border/50 bg-card/50">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
              <Icon className={`h-6 w-6 ${color} opacity-70`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search inspections..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {INSPECTION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        {canEdit && (
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" />New Inspection
          </Button>
        )}
      </div>

      {/* Table */}
      <Card className="border-border/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref / Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Inspector</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Findings</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><div className="h-4 w-full animate-pulse rounded bg-muted" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  No inspections found. {canEdit && "Click \"New Inspection\" to create one."}
                </TableCell>
              </TableRow>
            ) : records.map((r) => (
              <TableRow key={r.id} className="group">
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.ref_no} {r.location ? `· ${r.location}` : ""}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {TYPE_ICONS[r.inspection_type]}
                    {r.inspection_type}
                  </div>
                </TableCell>
                <TableCell className="text-sm">{r.inspector_name ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.date ? format(parseISO(r.date), "dd MMM yyyy") : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${STATUS_COLORS[r.status] ?? ""}`}>
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`text-xs ${PRIORITY_COLORS[r.priority] ?? ""}`}>
                    {r.priority}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  <span className="text-foreground">{r.total_findings}</span>
                  {r.critical_findings > 0 && (
                    <span className="ml-1 text-xs text-red-400">({r.critical_findings} critical)</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setSelected(r); setIsViewOpen(true) }}>
                        <Eye className="mr-2 h-4 w-4" />View
                      </DropdownMenuItem>
                      {canEdit && (
                        <>
                          <DropdownMenuItem onClick={() => openEdit(r)}>
                            <Edit className="mr-2 h-4 w-4" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(r.id)}>
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
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>New Inspection</DialogTitle></DialogHeader>
          <FormBody d={form} set={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={() => handleSave(false)} disabled={isSaving}>
              {isSaving ? "Saving..." : "Create Inspection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Inspection</DialogTitle></DialogHeader>
          <FormBody d={form} set={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={() => handleSave(true)} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selected && TYPE_ICONS[selected.inspection_type]}
              {selected?.title}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm max-h-[70vh] overflow-y-auto pr-1">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={STATUS_COLORS[selected.status]}>{selected.status}</Badge>
                <Badge variant="secondary" className={PRIORITY_COLORS[selected.priority]}>{selected.priority}</Badge>
                <Badge variant="secondary">{selected.inspection_type}</Badge>
              </div>
              {[
                ["Ref No", selected.ref_no],
                ["Location", selected.location],
                ["Business Unit", selected.business_unit],
                ["Inspector", selected.inspector_name],
                ["Date", selected.date ? format(parseISO(selected.date), "dd MMM yyyy") : "—"],
                ["Scheduled Date", selected.scheduled_date ? format(parseISO(selected.scheduled_date), "dd MMM yyyy") : "—"],
                ["Total Findings", selected.total_findings],
                ["Critical Findings", selected.critical_findings],
                ["Completion", `${selected.completion_rate}%`],
                ["Action Owner", selected.action_owner],
                ["Action Due", selected.action_due_date ? format(parseISO(selected.action_due_date), "dd MMM yyyy") : "—"],
              ].map(([label, val]) => val ? (
                <div key={String(label)} className="flex gap-2">
                  <span className="w-36 shrink-0 text-muted-foreground">{label}</span>
                  <span>{val}</span>
                </div>
              ) : null)}
              {selected.findings && <div className="rounded-md bg-muted/40 p-3"><p className="text-xs font-medium text-muted-foreground mb-1">Findings</p><p>{selected.findings}</p></div>}
              {selected.recommendations && <div className="rounded-md bg-muted/40 p-3"><p className="text-xs font-medium text-muted-foreground mb-1">Recommendations</p><p>{selected.recommendations}</p></div>}
              {selected.action_required && <div className="rounded-md bg-muted/40 p-3"><p className="text-xs font-medium text-muted-foreground mb-1">Action Required</p><p>{selected.action_required}</p></div>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
            {canEdit && selected && <Button onClick={() => { setIsViewOpen(false); openEdit(selected) }}>Edit</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
