"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Plus, Search, Filter, MoreHorizontal,
  Eye, Edit, Trash2, AlertTriangle, CheckCircle,
  Clock, XCircle, Download, ChevronLeft, ChevronRight,
  ShieldAlert, Activity, TrendingDown, Users,
} from "lucide-react"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { isAdminRole, isReviewerRole } from "@/lib/auth-roles"
import {
  getIncidents, createIncident, updateIncident, deleteIncident,
  type Incident,
} from "@/app/actions/manage-incidents"

// ── Constants ──────────────────────────────────────────────────────────────

const INCIDENT_TYPES = [
  "Lost Time Injury (LTI)",
  "Medical Treatment Case (MTC)",
  "First Aid Case (FAC)",
  "Near Miss",
  "Property Damage",
  "Environmental Incident",
  "High Potential Incident",
  "Fatality",
]

const SEVERITY_LEVELS = ["Minor", "Moderate", "Serious", "Critical", "Fatality"]

const INJURY_TYPES = [
  "Fracture", "Laceration", "Burn", "Sprain / Strain",
  "Eye Injury", "Chemical Exposure", "Electrical Shock",
  "Crush Injury", "Head Injury", "Other",
]

const STATUSES = ["Open", "Under Investigation", "Closed", "Cancelled"]

const PAGE_SIZE = 10

// ── Helpers ─────────────────────────────────────────────────────────────────

function severityColor(s: string) {
  switch (s) {
    case "Minor":    return "bg-blue-500/10 text-blue-400 border-blue-500/30"
    case "Moderate": return "bg-amber-500/10 text-amber-400 border-amber-500/30"
    case "Serious":  return "bg-orange-500/10 text-orange-400 border-orange-500/30"
    case "Critical": return "bg-red-500/10 text-red-400 border-red-500/30"
    case "Fatality": return "bg-red-900/20 text-red-300 border-red-700/40"
    default:         return "bg-secondary/40 text-muted-foreground border-border/50"
  }
}

function statusIcon(s: string) {
  switch (s) {
    case "Open":               return <AlertTriangle className="h-3 w-3" />
    case "Under Investigation":return <Clock className="h-3 w-3" />
    case "Closed":             return <CheckCircle className="h-3 w-3" />
    case "Cancelled":          return <XCircle className="h-3 w-3" />
    default: return null
  }
}

function statusColor(s: string) {
  switch (s) {
    case "Open":               return "bg-red-500/10 text-red-400 border-red-500/30"
    case "Under Investigation":return "bg-amber-500/10 text-amber-400 border-amber-500/30"
    case "Closed":             return "bg-green-500/10 text-green-400 border-green-500/30"
    case "Cancelled":          return "bg-secondary/40 text-muted-foreground border-border/50"
    default:                   return "bg-secondary/40 text-muted-foreground border-border/50"
  }
}

const EMPTY_FORM = {
  title: "",
  incidentType: "",
  severity: "Minor",
  date: new Date().toISOString().slice(0, 16),
  location: "",
  businessUnit: "",
  reportedBy: "",
  reportedByEmail: "",
  injuredPerson: "",
  injuryType: "",
  description: "",
  immediateAction: "",
  rootCause: "",
  correctiveAction: "",
  lostTimeDays: 0,
  nearMiss: false,
  status: "Open",
}

// ── Component ────────────────────────────────────────────────────────────────

export function IncidentManagement() {
  const { currentUser } = useAuth()
  const { toast } = useToast()
  const isAdmin = isAdminRole(currentUser?.role ?? "", currentUser?.email ?? "")
  const isReviewer = isReviewerRole(currentUser?.role ?? "")
  const canEdit = isAdmin || isReviewer

  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterSeverity, setFilterSeverity] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [page, setPage] = useState(1)

  const [showForm, setShowForm] = useState(false)
  const [showView, setShowView] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [selected, setSelected] = useState<Incident | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // ── Fetch ──────────────────────────────────────────────────────────────

  const fetchIncidents = async () => {
    setLoading(true)
    const data = await getIncidents()
    setIncidents(data)
    setLoading(false)
  }

  useEffect(() => { fetchIncidents() }, [])

  // ── Filtered / paged data ──────────────────────────────────────────────

  const filtered = useMemo(() => {
    return incidents.filter((i) => {
      const q = search.toLowerCase()
      const matchSearch = !q || [i.referenceNo, i.title, i.reportedBy ?? "", i.location ?? "", i.businessUnit ?? ""]
        .some((v) => v.toLowerCase().includes(q))
      const matchType     = filterType     === "all" || i.incidentType === filterType
      const matchSeverity = filterSeverity === "all" || i.severity     === filterSeverity
      const matchStatus   = filterStatus   === "all" || i.status       === filterStatus
      return matchSearch && matchType && matchSeverity && matchStatus
    })
  }, [incidents, search, filterType, filterSeverity, filterStatus])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── KPI stats ─────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const open         = incidents.filter((i) => i.status === "Open").length
    const lti          = incidents.filter((i) => i.incidentType.includes("LTI")).length
    const nearMisses   = incidents.filter((i) => i.nearMiss).length
    const lostDays     = incidents.reduce((sum, i) => sum + (i.lostTimeDays ?? 0), 0)
    return { open, lti, nearMisses, lostDays }
  }, [incidents])

  // ── Handlers ──────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      reportedBy: currentUser?.name ?? "",
      reportedByEmail: currentUser?.email ?? "",
    })
    setIsEditing(false)
    setSelected(null)
    setShowForm(true)
  }

  const openEdit = (inc: Incident) => {
    setForm({
      title:           inc.title,
      incidentType:    inc.incidentType,
      severity:        inc.severity,
      date:            new Date(inc.date).toISOString().slice(0, 16),
      location:        inc.location ?? "",
      businessUnit:    inc.businessUnit ?? "",
      reportedBy:      inc.reportedBy ?? "",
      reportedByEmail: inc.reportedByEmail ?? "",
      injuredPerson:   inc.injuredPerson ?? "",
      injuryType:      inc.injuryType ?? "",
      description:     inc.description ?? "",
      immediateAction: inc.immediateAction ?? "",
      rootCause:       inc.rootCause ?? "",
      correctiveAction:inc.correctiveAction ?? "",
      lostTimeDays:    inc.lostTimeDays ?? 0,
      nearMiss:        inc.nearMiss,
      status:          inc.status,
    })
    setIsEditing(true)
    setSelected(inc)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.incidentType || !form.date) {
      toast({ title: "Validation", description: "Title, type and date are required.", variant: "destructive" })
      return
    }
    setSaving(true)
    if (isEditing && selected) {
      const res = await updateIncident(selected.id, {
        ...form,
        lostTimeDays: Number(form.lostTimeDays),
      })
      if (res.success) {
        toast({ title: "Incident updated" })
        setShowForm(false)
        fetchIncidents()
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" })
      }
    } else {
      const res = await createIncident({
        ...form,
        lostTimeDays: Number(form.lostTimeDays),
      })
      if (res.success) {
        toast({ title: "Incident reported", description: `Reference: ${res.referenceNo}` })
        setShowForm(false)
        fetchIncidents()
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" })
      }
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!selected) return
    setSaving(true)
    const res = await deleteIncident(selected.id)
    if (res.success) {
      toast({ title: "Incident deleted" })
      setShowDelete(false)
      setSelected(null)
      fetchIncidents()
    } else {
      toast({ title: "Error", description: res.error, variant: "destructive" })
    }
    setSaving(false)
  }

  const handleExport = () => {
    const rows = filtered.map((i) => ({
      "Reference No":     i.referenceNo,
      "Title":            i.title,
      "Type":             i.incidentType,
      "Severity":         i.severity,
      "Status":           i.status,
      "Date":             new Date(i.date).toLocaleDateString(),
      "Location":         i.location ?? "",
      "Business Unit":    i.businessUnit ?? "",
      "Reported By":      i.reportedBy ?? "",
      "Injured Person":   i.injuredPerson ?? "",
      "Injury Type":      i.injuryType ?? "",
      "Lost Time Days":   i.lostTimeDays,
      "Near Miss":        i.nearMiss ? "Yes" : "No",
      "Description":      i.description ?? "",
      "Immediate Action": i.immediateAction ?? "",
      "Root Cause":       i.rootCause ?? "",
      "Corrective Action":i.correctiveAction ?? "",
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Incidents")
    XLSX.writeFile(wb, `Incidents_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const f = (key: string, val: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* KPI Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Open Incidents</p>
              <p className="text-2xl font-bold">{stats.open}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <ShieldAlert className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">LTI Count (YTD)</p>
              <p className="text-2xl font-bold">{stats.lti}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Activity className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Near Misses</p>
              <p className="text-2xl font-bold">{stats.nearMisses}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <TrendingDown className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lost Days (Total)</p>
              <p className="text-2xl font-bold">{stats.lostDays}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Incident Register
              </CardTitle>
              <CardDescription>
                {filtered.length} incident{filtered.length !== 1 ? "s" : ""} found
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                <Download className="h-4 w-4" /> Export
              </Button>
              <Button size="sm" onClick={openCreate} className="gap-2">
                <Plus className="h-4 w-4" /> Report Incident
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by reference, title, location..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-52">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {INCIDENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterSeverity} onValueChange={(v) => { setFilterSeverity(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {SEVERITY_LEVELS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-md border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Reference</TableHead>
                  <TableHead className="text-muted-foreground">Title</TableHead>
                  <TableHead className="text-muted-foreground">Type</TableHead>
                  <TableHead className="text-muted-foreground">Severity</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Location</TableHead>
                  <TableHead className="text-muted-foreground">Reported By</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-border/50">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 w-full animate-pulse rounded bg-secondary/50" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                      {incidents.length === 0 ? "No incidents recorded yet." : "No incidents match your filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((inc) => (
                    <TableRow key={inc.id} className="border-border/50 hover:bg-secondary/20">
                      <TableCell className="font-mono text-xs text-primary">{inc.referenceNo}</TableCell>
                      <TableCell className="max-w-[180px] truncate font-medium">{inc.title}</TableCell>
                      <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground">{inc.incidentType}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${severityColor(inc.severity)}`}>
                          {inc.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 text-xs ${statusColor(inc.status)}`}>
                          {statusIcon(inc.status)}
                          {inc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(inc.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate text-sm text-muted-foreground">
                        {inc.location ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate text-sm text-muted-foreground">
                        {inc.reportedBy ?? "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelected(inc); setShowView(true) }}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            {canEdit && (
                              <>
                                <DropdownMenuItem onClick={() => openEdit(inc)}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => { setSelected(inc); setShowDelete(true) }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2">{page} / {totalPages}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── View Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={showView} onOpenChange={setShowView}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="font-mono text-sm text-primary">{selected?.referenceNo}</span>
              <span>— {selected?.title}</span>
            </DialogTitle>
            <DialogDescription>Incident details</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={severityColor(selected.severity)}>{selected.severity}</Badge>
                <Badge variant="outline" className={`gap-1 ${statusColor(selected.status)}`}>
                  {statusIcon(selected.status)} {selected.status}
                </Badge>
                {selected.nearMiss && <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">Near Miss</Badge>}
              </div>
              <Separator />
              <div className="grid gap-3 sm:grid-cols-2">
                <div><p className="text-xs text-muted-foreground">Incident Type</p><p className="font-medium">{selected.incidentType}</p></div>
                <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{new Date(selected.date).toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Location</p><p className="font-medium">{selected.location ?? "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Business Unit</p><p className="font-medium">{selected.businessUnit ?? "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Reported By</p><p className="font-medium">{selected.reportedBy ?? "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Lost Time Days</p><p className="font-medium">{selected.lostTimeDays ?? 0}</p></div>
                {selected.injuredPerson && <div><p className="text-xs text-muted-foreground">Injured Person</p><p className="font-medium">{selected.injuredPerson}</p></div>}
                {selected.injuryType && <div><p className="text-xs text-muted-foreground">Injury Type</p><p className="font-medium">{selected.injuryType}</p></div>}
              </div>
              {selected.description && (<><Separator /><div><p className="text-xs text-muted-foreground mb-1">Description</p><p className="leading-relaxed">{selected.description}</p></div></>)}
              {selected.immediateAction && (<div><p className="text-xs text-muted-foreground mb-1">Immediate Action Taken</p><p className="leading-relaxed">{selected.immediateAction}</p></div>)}
              {selected.rootCause && (<div><p className="text-xs text-muted-foreground mb-1">Root Cause</p><p className="leading-relaxed">{selected.rootCause}</p></div>)}
              {selected.correctiveAction && (<div><p className="text-xs text-muted-foreground mb-1">Corrective Action</p><p className="leading-relaxed">{selected.correctiveAction}</p></div>)}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowView(false)}>Close</Button>
            {canEdit && selected && (
              <Button onClick={() => { setShowView(false); openEdit(selected) }}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create / Edit Form Dialog ────────────────────────────────────── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Incident" : "Report New Incident"}</DialogTitle>
            <DialogDescription>
              {isEditing ? `Editing ${selected?.referenceNo}` : "Complete the form to log a new incident."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="inc-title">Title <span className="text-destructive">*</span></Label>
              <Input id="inc-title" placeholder="Brief description of the incident" value={form.title} onChange={(e) => f("title", e.target.value)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Type */}
              <div className="space-y-1.5">
                <Label>Incident Type <span className="text-destructive">*</span></Label>
                <Select value={form.incidentType} onValueChange={(v) => f("incidentType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{INCIDENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {/* Severity */}
              <div className="space-y-1.5">
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={(v) => f("severity", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SEVERITY_LEVELS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {/* Date */}
              <div className="space-y-1.5">
                <Label htmlFor="inc-date">Date & Time <span className="text-destructive">*</span></Label>
                <Input id="inc-date" type="datetime-local" value={form.date} onChange={(e) => f("date", e.target.value)} />
              </div>
              {/* Status (edit only) */}
              {isEditing && (
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => f("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              {/* Location */}
              <div className="space-y-1.5">
                <Label htmlFor="inc-loc">Location</Label>
                <Input id="inc-loc" placeholder="Site / area" value={form.location} onChange={(e) => f("location", e.target.value)} />
              </div>
              {/* Business Unit */}
              <div className="space-y-1.5">
                <Label htmlFor="inc-bu">Business Unit</Label>
                <Input id="inc-bu" placeholder="Department / BU" value={form.businessUnit} onChange={(e) => f("businessUnit", e.target.value)} />
              </div>
              {/* Reported By */}
              <div className="space-y-1.5">
                <Label htmlFor="inc-rb">Reported By</Label>
                <Input id="inc-rb" placeholder="Name" value={form.reportedBy} onChange={(e) => f("reportedBy", e.target.value)} />
              </div>
              {/* Injured Person */}
              <div className="space-y-1.5">
                <Label htmlFor="inc-ip">Injured Person</Label>
                <Input id="inc-ip" placeholder="Name (if applicable)" value={form.injuredPerson} onChange={(e) => f("injuredPerson", e.target.value)} />
              </div>
              {/* Injury Type */}
              <div className="space-y-1.5">
                <Label>Injury Type</Label>
                <Select value={form.injuryType} onValueChange={(v) => f("injuryType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select injury type" /></SelectTrigger>
                  <SelectContent>{INJURY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {/* Lost Time Days */}
              <div className="space-y-1.5">
                <Label htmlFor="inc-ltd">Lost Time Days</Label>
                <Input id="inc-ltd" type="number" min={0} value={form.lostTimeDays} onChange={(e) => f("lostTimeDays", parseInt(e.target.value) || 0)} />
              </div>
            </div>

            {/* Near Miss Toggle */}
            <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/20 p-3">
              <input
                id="near-miss"
                type="checkbox"
                checked={form.nearMiss}
                onChange={(e) => f("nearMiss", e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <Label htmlFor="near-miss" className="cursor-pointer font-normal">
                This incident is a <strong>Near Miss</strong>
              </Label>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="inc-desc">Description</Label>
              <Textarea id="inc-desc" rows={3} placeholder="Describe what happened..." value={form.description} onChange={(e) => f("description", e.target.value)} />
            </div>
            {/* Immediate Action */}
            <div className="space-y-1.5">
              <Label htmlFor="inc-ia">Immediate Action Taken</Label>
              <Textarea id="inc-ia" rows={2} placeholder="Actions taken immediately after the incident..." value={form.immediateAction} onChange={(e) => f("immediateAction", e.target.value)} />
            </div>
            {/* Root Cause */}
            <div className="space-y-1.5">
              <Label htmlFor="inc-rc">Root Cause</Label>
              <Textarea id="inc-rc" rows={2} placeholder="Root cause analysis..." value={form.rootCause} onChange={(e) => f("rootCause", e.target.value)} />
            </div>
            {/* Corrective Action */}
            <div className="space-y-1.5">
              <Label htmlFor="inc-ca">Corrective Action</Label>
              <Textarea id="inc-ca" rows={2} placeholder="Long-term corrective actions..." value={form.correctiveAction} onChange={(e) => f("correctiveAction", e.target.value)} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Update Incident" : "Report Incident"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ────────────────────────────────────────── */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Incident</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selected?.referenceNo}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDelete(false)} disabled={saving}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
