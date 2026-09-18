"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import {
  Search, Plus, MoreHorizontal, Route, MapPin,
  CheckCircle2, AlertCircle, Loader2,
  Trash2, Car, CalendarDays, Users, FileText, Download,
  Paperclip, X, ExternalLink,
  Sun, Moon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import {
  getJourneys, getAllJourneys, createJourney, updateJourneyStatus, deleteJourney,
  getVehicles,
  type JourneyRecord, type VehicleRecord,
} from "@/app/actions/manage-journeys"
import { isAdminRole } from "@/lib/auth-roles"
import { getJourneyCutoffSettings } from "@/app/actions/manage-journey-settings"
import * as XLSX from "xlsx"

const VEHICLE_TYPES = ["Car", "Van", "Bus", "Truck", "Motorcycle", "Other"]
const PURPOSES = ["Business Meeting", "Site Visit", "Training", "Delivery", "Client Visit", "Other"]
const STATUSES = ["Planned", "In Progress", "Completed", "Flagged", "Cancelled"]

const statusColors: Record<string, string> = {
  Planned:       "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "In Progress": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Completed:     "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Flagged:       "bg-red-500/20 text-red-400 border-red-500/30",
  Cancelled:     "bg-slate-500/20 text-slate-400 border-slate-500/30",
}

const emptyForm = {
  origin: "", destination: "", purpose: "", vehicleType: "",
  journeyType: "morning", vehiclePlate: "", departureDate: "", departureTime: "",
  estimatedReturn: "", passengers: "1", notes: "",
}

export function JourneyTracker() {
  const { user, activeCompanyId } = useAuth()
  const { toast } = useToast()
  const [nightCutoff, setNightCutoff] = useState({ nightStart: "18:00", nightEnd: "06:00" })

  const [journeys, setJourneys]         = useState<JourneyRecord[]>([])
  const [isFetching, setIsFetching]     = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving]         = useState(false)
  const [form, setForm]                 = useState(emptyForm)

  const [vehicles, setVehicles]             = useState<VehicleRecord[]>([])

  const [attachedFile, setAttachedFile]     = useState<File | null>(null)
  const [isUploading, setIsUploading]       = useState(false)
  const fileInputRef                        = useRef<HTMLInputElement>(null)
  const templateInputRef                   = useRef<HTMLInputElement>(null)
  const [templateRows, setTemplateRows]     = useState<Record<string, unknown>[]>([])
  const [templateErrors, setTemplateErrors] = useState<string[]>([])
  const [isTemplateOpen, setIsTemplateOpen] = useState(false)
  const [isImportingTemplate, setIsImportingTemplate] = useState(false)
  const [journeyTab, setJourneyTab] = useState<"all" | "morning" | "night">("all")
  const [inspection, setInspection] = useState<Record<string, "yes" | "no" | "na">>({})
  const inspectionItems = ["Air Bags", "Air Compressor", "Air Conditioning", "Brakes – Hand Brakes", "Drinking Water / Food", "Defensive Driving Certificate", "Driving License", "Fire Extinguisher", "First Aid Box", "Front & Side Mirrors", "Fuel Level", "Goods / Cargo Manifest", "IVMS / Drive Right", "Jack, Tools, Jack Plates", "Lights & Indicators", "Load Secured", "Oil Level", "Radiator Coolant Level", "Reflective Triangle", "Rollover Bar", "Seat Belts", "Spare Tire", "Tires", "Vehicle License"]
  const weatherHazards = ["Cloudy", "Fog", "High Temperature / Hot", "Low Temperature / Cold", "Rain", "Sand Storm", "Snow", "Storm", "Sunny", "Wind"]
  const roadHazards = ["Black Top", "Clear Visibility", "Dry", "Foggy", "Graded", "Gravel", "High Wind", "Low Visibility", "Mud", "Others", "Poor Visibility", "Sand", "Snow / Ice", "Unpaved", "Wet"]
  const riskFactors = ["Driver condition", "Driver competency", "Vehicle condition", "Route", "Weather", "Road conditions", "Journey duration", "Night driving", "Remote location", "Load", "Other hazards"]
  const [isApprover, setIsApprover] = useState(false)

  const [searchQuery, setSearchQuery]     = useState("")
  const [statusFilter, setStatusFilter]   = useState("all")
  const [purposeFilter, setPurposeFilter] = useState("all")
  const [vehicleFilter, setVehicleFilter] = useState("all")

  const isAdmin = !!user && isAdminRole(user.role, user.email)
  const canReviewJourneys = isAdmin || String(user?.role ?? "").toUpperCase() === "MASTER USER" || Boolean(user?.journeyApprover)

  const fetchJourneys = useCallback(async () => {
    if (!user?.email) return
    setIsFetching(true)
    const res = isAdmin ? await getAllJourneys() : await getJourneys(user.email)
    if (res.success) setJourneys(res.data)
    setIsFetching(false)
  }, [user?.email, isAdmin])

  useEffect(() => {
    if (user?.email) fetchJourneys()
  }, [user?.email, fetchJourneys])

  useEffect(() => {
    getJourneyCutoffSettings(activeCompanyId).then((res) => { if (res.success) setNightCutoff(res.data) })
  }, [activeCompanyId])

  useEffect(() => {
    getVehicles().then((res) => { if (res.success) setVehicles(res.data) })
  }, [])

  const filteredJourneys = useMemo(() => {
    return journeys.filter((j) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        !q ||
        j.origin.toLowerCase().includes(q) ||
        j.destination.toLowerCase().includes(q) ||
        j.purpose.toLowerCase().includes(q) ||
        (j.vehiclePlate ?? "").toLowerCase().includes(q) ||
        j.userName.toLowerCase().includes(q)
      const matchesStatus  = statusFilter  === "all" || j.status      === statusFilter
      const matchesPurpose = purposeFilter === "all" || j.purpose     === purposeFilter
      const matchesVehicle = vehicleFilter === "all" || j.vehicleType === vehicleFilter
  const isNight = j.journeyType === "night" || (j.journeyType == null && (() => { const [hour, minute] = String(j.departureTime).split(":").map(Number); const current = hour * 60 + minute; const start = Number(nightCutoff.nightStart.split(":")[0]) * 60 + Number(nightCutoff.nightStart.split(":")[1]); const end = Number(nightCutoff.nightEnd.split(":")[0]) * 60 + Number(nightCutoff.nightEnd.split(":")[1]); return start > end ? current >= start || current < end : current >= start && current < end })())
      const matchesJourneyTab = journeyTab === "all" || (journeyTab === "night" ? isNight : !isNight)
      return matchesSearch && matchesStatus && matchesPurpose && matchesVehicle && matchesJourneyTab
    })
  }, [journeys, searchQuery, statusFilter, purposeFilter, vehicleFilter, journeyTab, nightCutoff])

  const stats = useMemo(() => ({
    total:      journeys.length,
    planned:    journeys.filter((j) => j.status === "Planned").length,
    inProgress: journeys.filter((j) => j.status === "In Progress").length,
    completed:  journeys.filter((j) => j.status === "Completed").length,
    flagged:    journeys.filter((j) => j.status === "Flagged").length,
    cancelled:  journeys.filter((j) => j.status === "Cancelled").length,
  }), [journeys])

  const handleSubmit = async () => {
    if (!form.origin || !form.destination || !form.vehiclePlate || !form.departureDate || !form.departureTime || !form.purpose) {
      toast({ title: "Required fields missing", description: "Please fill in all required fields.", variant: "destructive" })
      return
    }
    if (!user) return
    setIsSaving(true)

    // Upload attachment if selected
    let attachmentUrl: string | undefined
    let attachmentName: string | undefined
    if (attachedFile) {
      setIsUploading(true)
      const fd = new FormData()
      fd.append('file', attachedFile)
      const uploadRes = await fetch('/api/journey-upload', { method: 'POST', body: fd })
      setIsUploading(false)
      if (!uploadRes.ok) {
        toast({ title: "Upload failed", description: "Could not upload the attachment.", variant: "destructive" })
        setIsSaving(false)
        return
      }
      const uploadData = await uploadRes.json()
      attachmentUrl = uploadData.pathname
      attachmentName = uploadData.name
    }

    const res = await createJourney({
      userEmail:       user.email,
      userName:        user.name,
      origin:          form.origin,
      destination:     form.destination,
      purpose:         form.purpose,
      vehicleType:     form.vehicleType,
      vehiclePlate:    form.vehiclePlate || undefined,
      departureDate:   form.departureDate,
  journeyType:     form.journeyType as "morning" | "night",
  departureTime:   form.departureTime,
  estimatedReturn: form.estimatedReturn || undefined,
      passengers:      parseInt(form.passengers) || 1,
      notes:           form.notes || undefined,
      attachmentUrl,
      attachmentName,
    })
    setIsSaving(false)
    if (res.success) {
      toast({ title: "Journey logged", description: "Your journey has been saved successfully." })
      setIsDialogOpen(false)
      setForm(emptyForm)
      setAttachedFile(null)
      fetchJourneys()
    } else {
      toast({ title: "Error", description: res.error, variant: "destructive" })
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    const res = await updateJourneyStatus(id, status)
    if (res.success) {
      setJourneys((prev) => prev.map((j) => j.id === id ? { ...j, status } : j))
      toast({ title: "Status updated" })
    }
  }

  const handleDelete = async (id: string) => {
    const res = await deleteJourney(id)
    if (res.success) {
      setJourneys((prev) => prev.filter((j) => j.id !== id))
      toast({ title: "Journey deleted" })
    }
  }

  const downloadTemplate = () => {
    const columns = [["Origin", "Destination", "Purpose", "Vehicle Type", "Plate Number", "Date", "Departure Time", "Est. Return", "Passengers", "Notes"]]
    const worksheet = XLSX.utils.aoa_to_sheet(columns)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Journeys")
    XLSX.writeFile(workbook, "journey-tracker-template.xlsx")
  }

  const importTemplate = async (file: File) => {
    setIsImportingTemplate(true)
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })
      const errors: string[] = []
      const validRows = rows.filter((row, index) => {
        const missing = ["Origin", "Destination", "Purpose", "Vehicle Type", "Date", "Departure Time"].filter((field) => !String(row[field] ?? "").trim())
        if (missing.length) { errors.push(`Row ${index + 2}: missing ${missing.join(", ")}`); return false }
        return true
      })
      setTemplateRows(validRows)
      setTemplateErrors(errors)
      setIsTemplateOpen(true)
    } catch {
      toast({ title: "Import failed", description: "Please upload a valid .xlsx journey template.", variant: "destructive" })
    } finally { setIsImportingTemplate(false) }
  }

  const confirmTemplateImport = async () => {
    if (!user || !templateRows.length) return
    setIsImportingTemplate(true)
    let imported = 0
    for (const row of templateRows) {
      const result = await createJourney({ userEmail: user.email, userName: user.name, origin: String(row.Origin), destination: String(row.Destination), purpose: String(row.Purpose), vehicleType: String(row["Vehicle Type"]), vehiclePlate: String(row["Plate Number"] || "") || undefined, departureDate: String(row.Date), departureTime: String(row["Departure Time"]), estimatedReturn: String(row["Est. Return"] || "") || undefined, passengers: Number(row.Passengers) || 1, notes: String(row.Notes || "") || undefined })
      if (result.success) imported++
    }
    setIsImportingTemplate(false); setIsTemplateOpen(false); setTemplateRows([]); setTemplateErrors([]); await fetchJourneys()
    toast({ title: "Template imported", description: `${imported} journey${imported === 1 ? "" : "s"} added.` })
  }

  const exportToExcel = () => {
    const rows = filteredJourneys.map((j) => ({
      ID:               j.id,
      Date:             j.departureDate,
      "Driver/User":    j.userName,
      Origin:           j.origin,
      Destination:      j.destination,
      Purpose:          j.purpose,
      "Vehicle Type":   j.vehicleType,
      "Plate Number":   j.vehiclePlate ?? "",
      "Departure Time": j.departureTime,
      "Est. Return":    j.estimatedReturn ?? "",
      Passengers:       j.passengers,
      Status:           j.status,
      Notes:            j.notes ?? "",
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Journeys")
    XLSX.writeFile(wb, `journeys-${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  return (
    <>
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Route className="h-5 w-5 text-primary" />
                Journey Tracker
              </CardTitle>
              <CardDescription>
                Record and track your journeys safely across all locations
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input ref={templateInputRef} type="file" accept=".xlsx" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void importTemplate(file) }} />
              <Button variant="outline" onClick={downloadTemplate} className="gap-2"><FileText className="h-4 w-4" /> Template</Button>
              <Button variant="outline" onClick={() => templateInputRef.current?.click()} disabled={isImportingTemplate} className="gap-2"><Paperclip className="h-4 w-4" /> {isImportingTemplate ? "Checking..." : "Upload Template"}</Button>
              <Button variant="outline" onClick={exportToExcel}>
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Journey
              </Button>
            </div>
          </div>
        </CardHeader>

  <CardContent className="space-y-6">
  {canReviewJourneys && <div className="flex flex-wrap gap-2 rounded-lg border border-border/50 bg-muted/20 p-2" role="tablist" aria-label="Journey shift">
    <Button type="button" variant={journeyTab === "all" ? "default" : "ghost"} onClick={() => setJourneyTab("all")}>All journeys</Button>
    <Button type="button" variant={journeyTab === "morning" ? "default" : "ghost"} onClick={() => setJourneyTab("morning")} className="gap-2"><Sun className="h-4 w-4" /> Morning journeys</Button>
    <Button type="button" variant={journeyTab === "night" ? "default" : "ghost"} onClick={() => setJourneyTab("night")} className="gap-2"><Moon className="h-4 w-4" /> Night journeys</Button>
    <p className="basis-full text-xs text-muted-foreground">Night journeys follow the active company cutoff ({nightCutoff.nightStart}–{nightCutoff.nightEnd}). Admin and Master users can manage it in settings.</p>
  </div>}
  {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Journeys</p>
            </div>
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.planned}</p>
              <p className="text-xs text-blue-400/80">Planned</p>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-center">
              <p className="text-2xl font-bold text-amber-400">{stats.inProgress}</p>
              <p className="text-xs text-amber-400/80">In Progress</p>
            </div>
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-400">{stats.completed}</p>
              <p className="text-xs text-emerald-400/80">Completed</p>
            </div>
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center">
              <p className="text-2xl font-bold text-red-400">{stats.flagged}</p>
              <p className="text-xs text-red-400/80">Flagged</p>
            </div>
            <div className="rounded-lg border border-slate-500/30 bg-slate-500/10 p-3 text-center">
              <p className="text-2xl font-bold text-slate-400">{stats.cancelled}</p>
              <p className="text-xs text-slate-400/80">Cancelled</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search journeys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={purposeFilter} onValueChange={setPurposeFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="All Purposes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Purposes</SelectItem>
                {PURPOSES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                {VEHICLE_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">ID</TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Driver</TableHead>
                  <TableHead className="text-muted-foreground">Route</TableHead>
                  <TableHead className="text-muted-foreground">Purpose</TableHead>
                  <TableHead className="text-muted-foreground">Vehicle</TableHead>
                  <TableHead className="text-muted-foreground">Passengers</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Attachment</TableHead>
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isFetching ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i} className="border-border/50">
                      {Array.from({ length: 10 }).map((__, j) => (
                        <TableCell key={j}>
                          <div className="h-3 w-full max-w-[100px] animate-pulse rounded bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredJourneys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Route className="h-10 w-10 opacity-30" />
                        <p className="font-medium">No journeys found</p>
                        <p className="text-sm">
                          {searchQuery || statusFilter !== "all" || purposeFilter !== "all" || vehicleFilter !== "all"
                            ? "Try adjusting your filters"
                            : 'Click "New Journey" to log one'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJourneys.map((j) => (
                    <TableRow key={j.id} className="border-border/50">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {j.id.split("-").slice(-1)[0].toUpperCase()}
                      </TableCell>
                      <TableCell className="text-sm">{j.departureDate}</TableCell>
                      <TableCell className="text-sm">{j.userName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <span>{j.origin}</span>
                          <span className="text-muted-foreground">{"→"}</span>
                          <span>{j.destination}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{j.purpose}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Car className="h-3.5 w-3.5 text-muted-foreground" />
                          {j.vehicleType}
                          {j.vehiclePlate && (
                            <span className="text-muted-foreground">· {j.vehiclePlate}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{j.passengers}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${statusColors[j.status] ?? ""}`}>
                          {j.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {j.attachmentUrl ? (
                          <a
                            href={j.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline"
                          >
                            <Paperclip className="h-3 w-3" />
                            <span className="max-w-[120px] truncate">{j.attachmentName ?? "File"}</span>
                            <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {STATUSES.filter((s) => s !== j.status).map((s) => (
                              <DropdownMenuItem key={s} onClick={() => handleStatusChange(j.id, s)}>
                                Mark as {s}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(j.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* New Journey Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setForm(emptyForm); setAttachedFile(null) } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Journey</DialogTitle>
            <DialogDescription>Fill in the details below to log a new journey.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="summary" className="mt-2">
            <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-muted/50 p-1">
              {[['summary','Summary'],['driver','Driver Details'],['resources','Resources'],['journey','Journey'],['vehicle','Vehicle'],['checkin','Check-In'],['attachments','Attachments'],['inspection','Pre-Trip Inspection'],['route','Route Plan'],['changes','Route Changes'],['passengers','Passengers'],['night','Night Driving'],['hazards','Road Hazards'],['emergency','Emergency Contacts'],['risk','Risk Assessment']].map(([value, label]) => <TabsTrigger key={value} value={value} className="text-xs">{label}</TabsTrigger>)}
            </TabsList>
            <TabsContent value="summary" className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Origin <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Departure location"
                    className="pl-8"
                    value={form.origin}
                    onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Destination <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Arrival location"
                    className="pl-8"
                    value={form.destination}
                    onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Journey type <span className="text-destructive">*</span></Label>
              <Select value={form.journeyType} onValueChange={(value) => setForm((current) => ({ ...current, journeyType: value }))}>
                <SelectTrigger><SelectValue placeholder="Select journey type" /></SelectTrigger>
                <SelectContent><SelectItem value="morning">Morning journey</SelectItem><SelectItem value="night">Night journey</SelectItem></SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Purpose <span className="text-destructive">*</span></Label>
              <Select value={form.purpose} onValueChange={(v) => setForm((f) => ({ ...f, purpose: v }))}>
                <SelectTrigger><SelectValue placeholder="Select purpose..." /></SelectTrigger>
                <SelectContent>
                  {PURPOSES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Vehicle <span className="text-destructive">*</span></Label>
              <Select
                value={form.vehiclePlate}
                onValueChange={(plateNo) => {
                  const v = vehicles.find((v) => v.plateNo === plateNo)
                  setForm((f) => ({
                    ...f,
                    vehiclePlate: plateNo,
                    vehicleType: v?.vehicleType ?? "",
                  }))
                }}
              >
                <SelectTrigger>
                  <Car className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select vehicle (plate no.)..." />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.plateNo}>
                      <span className="font-mono font-semibold">{v.plateNo}</span>
                      <span className="ml-2 text-muted-foreground">— {v.vehicleType}</span>
                      {v.allowableLoad && (
                        <span className="ml-1 text-xs text-muted-foreground">({v.allowableLoad})</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.vehicleType && (
                <p className="text-xs text-muted-foreground">
                  Type: <span className="text-foreground">{form.vehicleType}</span>
                  {vehicles.find(v => v.plateNo === form.vehiclePlate)?.allowableLoad &&
                    <> &middot; Load: <span className="text-foreground">{vehicles.find(v => v.plateNo === form.vehiclePlate)?.allowableLoad}</span></>
                  }
                  {vehicles.find(v => v.plateNo === form.vehiclePlate)?.description &&
                    <> &middot; {vehicles.find(v => v.plateNo === form.vehiclePlate)?.description}</>
                  }
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Departure Date <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={form.departureDate}
                  onChange={(e) => setForm((f) => ({ ...f, departureDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Departure Time <span className="text-destructive">*</span></Label>
                <Input
                  type="time"
                  value={form.departureTime}
                  onChange={(e) => setForm((f) => ({ ...f, departureTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Estimated Return</Label>
                <Input
                  type="datetime-local"
                  value={form.estimatedReturn}
                  onChange={(e) => setForm((f) => ({ ...f, estimatedReturn: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>No. of Passengers</Label>
                <div className="relative">
                  <Users className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    className="pl-8"
                    value={form.passengers}
                    onChange={(e) => setForm((f) => ({ ...f, passengers: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <div className="relative">
                <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Textarea
                  placeholder="Any additional information..."
                  className="pl-8"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            </TabsContent>
            {[
              ['driver', 'Driver Details', 'Capture the primary driver, mobile number, licence details, and fitness confirmation.'],
              ['resources', 'Resources', 'Select reusable driver and vehicle master records, then review expiry and readiness status.'],
              ['journey', 'Journey', 'Record journey manager, client, business unit, risk level, and approval status.'],
              ['vehicle', 'Vehicle', 'Review registration, inspection, insurance, load, and vehicle readiness.'],
              ['checkin', 'Check-In Details', 'Track departure check-in, arrival check-in, and overdue check-ins.'],
              ['attachments', 'Attachments', 'Add permits, route documents, approvals, and supporting journey files.'],
              ['inspection', 'Vehicle Pre-Trip Inspection', 'Record brakes, tyres, lights, fluids, seatbelts, and defects before departure.'],
              ['route', 'Route Plan', 'Document the planned route, stops, distances, and expected timing.'],
              ['changes', 'Changes to Route Plan', 'Record route changes, reasons, approver, and revised ETA.'],
              ['passengers', 'Passengers', 'List passenger names, contact details, and seat allocation.'],
              ['night', 'Night Driving', 'Capture night driving controls, fatigue checks, lighting, and additional approval.'],
              ['hazards', 'Road Hazards', 'Record known hazards, controls, weather, and escalation requirements.'],
              ['emergency', 'Emergency Contacts', 'Add emergency contacts, escalation instructions, and response numbers.'],
              ['risk', 'Journey Risk Assessment', 'Evaluate driver, vehicle, route, weather, duration, night driving, remote location, load, and other hazards.'],
            ].map(([value, title, description]) => <TabsContent key={value} value={value} className="space-y-4 py-4"><div className="rounded-lg border border-border/50 bg-muted/20 p-5"><h3 className="font-medium">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{description}</p>{value === 'resources' ? <div className="mt-4 grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Driver</Label><Select><SelectTrigger><SelectValue placeholder="Search driver master" /></SelectTrigger><SelectContent><SelectItem value="driver-1">Select a registered driver</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Vehicle</Label><Select><SelectTrigger><SelectValue placeholder="Search vehicle master" /></SelectTrigger><SelectContent><SelectItem value="vehicle-1">Select a registered vehicle</SelectItem></SelectContent></Select></div><div className="rounded-md border border-border/50 p-3 text-sm text-muted-foreground sm:col-span-2">Selected resource details will populate license, training, registration, RAS expiry, load limit, and KM details.</div></div> : value === 'night' ? <div className="mt-4 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Night Driving Required</Label><Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="yes">YES</SelectItem><SelectItem value="no">NO</SelectItem><SelectItem value="na">N/A</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Approval Status</Label><Select><SelectTrigger><SelectValue placeholder="Select approval" /></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select></div></div><Textarea placeholder="Reason for night driving" /><Textarea placeholder="Facility / Unit Manager Approval" /><Textarea placeholder="Country Manager Approval and comments" /></div> : value === 'hazards' ? <div className="mt-4 space-y-4"><div><Label>Weather Conditions</Label><div className="mt-2 flex flex-wrap gap-2">{weatherHazards.map((hazard) => <label key={hazard} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"><input type="checkbox" />{hazard}</label>)}</div></div><div><Label>Road Conditions</Label><div className="mt-2 flex flex-wrap gap-2">{roadHazards.map((hazard) => <label key={hazard} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"><input type="checkbox" />{hazard}</label>)}</div></div><Textarea placeholder="Hazard comments, severity, and additional control measures" /></div> : value === 'passengers' ? <div className="mt-4 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Input placeholder="Passenger name" /><Input placeholder="Company" /><Input placeholder="Mobile number" /><Input placeholder="Serial number" /></div><Textarea placeholder="Passenger comments" /><Button type="button" variant="outline">Add Passenger</Button></div> : value === 'emergency' ? <div className="mt-4 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Input placeholder="Contact name" /><Input placeholder="Organization" /><Input placeholder="Contact type" /><Input placeholder="Mobile number" /><Input placeholder="Alternative number" /><Input placeholder="Location" /><Input placeholder="Email" /></div><Textarea placeholder="Notes" /><Button type="button" variant="outline">Add Emergency Contact</Button></div> : value === 'risk' ? <div className="mt-4 space-y-4"><div className="grid gap-3 sm:grid-cols-2">{riskFactors.map((factor) => <div key={factor} className="flex items-center justify-between rounded-md border p-3"><span className="text-sm">{factor}</span><Select><SelectTrigger className="ml-3 w-28"><SelectValue placeholder="Rate" /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent></Select></div>)}</div><div className="rounded-md border border-primary/30 bg-primary/5 p-4"><p className="text-sm font-medium">Overall Journey Risk</p><p className="mt-1 text-2xl font-semibold text-primary">Pending assessment</p><p className="mt-1 text-xs text-muted-foreground">Risk matrix can be configured by authorized administrators.</p></div><Textarea placeholder="Risk controls and approval comments" /></div> : value === 'inspection' ? <div className="mt-4 space-y-3"><div className="overflow-x-auto rounded-md border"><table className="w-full text-sm"><thead className="bg-muted/40"><tr><th className="p-3 text-left">Checklist item</th><th className="p-3">Yes</th><th className="p-3">No</th><th className="p-3">N/A</th></tr></thead><tbody>{inspectionItems.map((item) => <tr key={item} className="border-t"><td className="p-3">{item}</td>{(['yes','no','na'] as const).map((choice) => <td key={choice} className="p-3 text-center"><input type="radio" name={`inspection-${item}`} checked={inspection[item] === choice} onChange={() => setInspection((current) => ({ ...current, [item]: choice }))} aria-label={`${item} ${choice}`} /></td>)}</tr>)}</tbody></table></div><Textarea placeholder="Defects and corrective action" /><Textarea placeholder="Inspection comments" /></div> : <Textarea className="mt-4 min-h-28" placeholder={`Enter ${title.toLowerCase()} details...`} />}</div></TabsContent>)}
          </Tabs>

          {/* Attachment */}
          <div className="space-y-1.5 px-1">
            <Label>Attachment</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => setAttachedFile(e.target.files?.[0] ?? null)}
            />
            {attachedFile ? (
              <div className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-3 py-2">
                <Paperclip className="h-4 w-4 shrink-0 text-primary" />
                <span className="flex-1 truncate text-sm">{attachedFile.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(attachedFile.size / 1024).toFixed(0)} KB
                </span>
                <button
                  type="button"
                  onClick={() => { setAttachedFile(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center gap-2 rounded-md border border-dashed border-border/50 bg-muted/20 px-3 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <Paperclip className="h-4 w-4" />
                Click to attach a file (PDF, Word, Excel, Image — max 10 MB)
              </button>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setIsDialogOpen(false); setForm(emptyForm); setAttachedFile(null) }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving || isUploading}>
              {isSaving || isUploading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isUploading ? "Uploading..." : "Saving..."}</>
                : "Log Journey"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTemplateOpen} onOpenChange={setIsTemplateOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>Validate journey template</DialogTitle><DialogDescription>{templateRows.length} valid rows are ready to import. Review the validation results before saving.</DialogDescription></DialogHeader>
          {templateErrors.length > 0 && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><p className="font-medium">Rows not included</p><ul className="mt-1 list-disc pl-5">{templateErrors.slice(0, 8).map((error) => <li key={error}>{error}</li>)}</ul>{templateErrors.length > 8 && <p className="mt-1">And {templateErrors.length - 8} more.</p>}</div>}
          <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">{templateRows.length} journey{templateRows.length === 1 ? "" : "s"} will be created for your account.</div>
          <DialogFooter><Button variant="outline" onClick={() => setIsTemplateOpen(false)}>Cancel</Button><Button onClick={confirmTemplateImport} disabled={!templateRows.length || isImportingTemplate}>{isImportingTemplate ? "Importing..." : "Confirm Import"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
