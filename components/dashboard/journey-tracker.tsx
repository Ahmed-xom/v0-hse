"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import {
  Search, Plus, MoreHorizontal, Route, MapPin,
  CheckCircle2, AlertCircle, Loader2,
  Trash2, Car, CalendarDays, Users, FileText, Download,
  Paperclip, X, ExternalLink,
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
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import {
  getJourneys, getAllJourneys, createJourney, updateJourneyStatus, deleteJourney,
  getVehicles,
  type JourneyRecord, type VehicleRecord,
} from "@/app/actions/manage-journeys"
import { isAdminRole } from "@/lib/auth-roles"
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
  vehiclePlate: "", departureDate: "", departureTime: "",
  estimatedReturn: "", passengers: "1", notes: "",
}

export function JourneyTracker() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [journeys, setJourneys]         = useState<JourneyRecord[]>([])
  const [isFetching, setIsFetching]     = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving]         = useState(false)
  const [form, setForm]                 = useState(emptyForm)

  const [vehicles, setVehicles]             = useState<VehicleRecord[]>([])

  const [attachedFile, setAttachedFile]     = useState<File | null>(null)
  const [isUploading, setIsUploading]       = useState(false)
  const fileInputRef                        = useRef<HTMLInputElement>(null)

  const [searchQuery, setSearchQuery]     = useState("")
  const [statusFilter, setStatusFilter]   = useState("all")
  const [purposeFilter, setPurposeFilter] = useState("all")
  const [vehicleFilter, setVehicleFilter] = useState("all")

  const isAdmin = !!user && isAdminRole(user.role, user.email)

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
      return matchesSearch && matchesStatus && matchesPurpose && matchesVehicle
    })
  }, [journeys, searchQuery, statusFilter, purposeFilter, vehicleFilter])

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
            <div className="flex items-center gap-2">
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

          <div className="grid gap-4 py-2">
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
          </div>

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
    </>
  )
}
