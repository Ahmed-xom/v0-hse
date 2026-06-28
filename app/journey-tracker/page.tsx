"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { useAuth } from "@/lib/auth-context"
import {
  Loader2, Shield, Route, MapPin, Clock, CheckCircle2,
  AlertCircle, Plus, Trash2, MoreHorizontal, Car,
  CalendarDays, Users, FileText,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useToast } from "@/hooks/use-toast"
import {
  getJourneys, createJourney, updateJourneyStatus, deleteJourney,
  type JourneyRecord,
} from "@/app/actions/manage-journeys"

const VEHICLE_TYPES = ["Car", "Van", "Bus", "Truck", "Motorcycle", "Other"]
const PURPOSES = ["Business Meeting", "Site Visit", "Training", "Delivery", "Client Visit", "Other"]
const STATUSES = ["Planned", "In Progress", "Completed", "Flagged", "Cancelled"]

const statusColors: Record<string, string> = {
  Planned:      "bg-blue-500/10 text-blue-400 border-blue-500/30",
  "In Progress":"bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  Completed:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  Flagged:      "bg-destructive/10 text-destructive border-destructive/30",
  Cancelled:    "bg-muted text-muted-foreground border-border",
}

const emptyForm = {
  origin: "", destination: "", purpose: "", vehicleType: "",
  vehiclePlate: "", departureDate: "", departureTime: "",
  estimatedReturn: "", passengers: "1", notes: "",
}

export default function JourneyTrackerPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [journeys, setJourneys] = useState<JourneyRecord[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (!isLoading && !user) router.push("/sign-in")
    if (!isLoading && user && !user.journeyAccess) router.push("/")
  }, [user, isLoading, router])

  const fetchJourneys = useCallback(async () => {
    if (!user?.email) return
    setIsFetching(true)
    const res = await getJourneys(user.email)
    if (res.success) setJourneys(res.data)
    setIsFetching(false)
  }, [user?.email])

  useEffect(() => {
    if (user?.journeyAccess) fetchJourneys()
  }, [user?.journeyAccess, fetchJourneys])

  const handleSubmit = async () => {
    if (!form.origin || !form.destination || !form.vehicleType || !form.departureDate || !form.departureTime || !form.purpose) {
      toast({ title: "Required fields missing", description: "Please fill in all required fields.", variant: "destructive" })
      return
    }
    if (!user) return
    setIsSaving(true)
    const res = await createJourney({
      userEmail: user.email,
      userName: user.name,
      origin: form.origin,
      destination: form.destination,
      purpose: form.purpose,
      vehicleType: form.vehicleType,
      vehiclePlate: form.vehiclePlate || undefined,
      departureDate: form.departureDate,
      departureTime: form.departureTime,
      estimatedReturn: form.estimatedReturn || undefined,
      passengers: parseInt(form.passengers) || 1,
      notes: form.notes || undefined,
    })
    setIsSaving(false)
    if (res.success) {
      toast({ title: "Journey logged", description: "Your journey has been saved successfully." })
      setIsDialogOpen(false)
      setForm(emptyForm)
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary">
            <Shield className="h-9 w-9 text-primary-foreground" />
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!user || !user.journeyAccess) return null

  const counts = {
    total:      journeys.length,
    inProgress: journeys.filter((j) => j.status === "In Progress").length,
    completed:  journeys.filter((j) => j.status === "Completed").length,
    flagged:    journeys.filter((j) => j.status === "Flagged").length,
  }

  const stats = [
    { label: "Total Journeys",  value: counts.total,      icon: Route,         color: "text-primary" },
    { label: "In Progress",     value: counts.inProgress, icon: Clock,         color: "text-yellow-500" },
    { label: "Completed",       value: counts.completed,  icon: CheckCircle2,  color: "text-emerald-500" },
    { label: "Flagged",         value: counts.flagged,    icon: AlertCircle,   color: "text-destructive" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Journey Tracker</h1>
              <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                <Route className="mr-1 h-3 w-3" />
                Active
              </Badge>
            </div>
            <p className="mt-1 text-muted-foreground">Track and manage your journeys safely.</p>
          </div>
          <Button className="mt-4 gap-2 sm:mt-0" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            New Journey
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table / Empty state */}
        <Card>
          {isFetching ? (
            <CardContent className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          ) : journeys.length === 0 ? (
            <CardContent className="flex flex-col items-center gap-4 py-20">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-semibold">No journeys yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Click &ldquo;New Journey&rdquo; to log your first journey record.
                </p>
              </div>
              <Button variant="outline" className="gap-2" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                New Journey
              </Button>
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Departure</TableHead>
                    <TableHead>Est. Return</TableHead>
                    <TableHead>Passengers</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journeys.map((j) => (
                    <TableRow key={j.id}>
                      <TableCell>
                        <div className="flex items-center gap-1 font-medium">
                          <span>{j.origin}</span>
                          <span className="text-muted-foreground">→</span>
                          <span>{j.destination}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{j.purpose}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Car className="h-3.5 w-3.5 text-muted-foreground" />
                          {j.vehicleType}
                          {j.vehiclePlate && <span className="text-muted-foreground">· {j.vehiclePlate}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                          {j.departureDate} {j.departureTime}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{j.estimatedReturn || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {j.passengers}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${statusColors[j.status] ?? ""}`}>
                          {j.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </main>

      {/* New Journey Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setForm(emptyForm) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Journey</DialogTitle>
            <DialogDescription>Fill in the details below to log a new journey.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Route */}
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

            {/* Purpose */}
            <div className="space-y-1.5">
              <Label>Purpose <span className="text-destructive">*</span></Label>
              <Select value={form.purpose} onValueChange={(v) => setForm((f) => ({ ...f, purpose: v }))}>
                <SelectTrigger><SelectValue placeholder="Select purpose..." /></SelectTrigger>
                <SelectContent>
                  {PURPOSES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Vehicle */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Vehicle Type <span className="text-destructive">*</span></Label>
                <Select value={form.vehicleType} onValueChange={(v) => setForm((f) => ({ ...f, vehicleType: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select vehicle..." /></SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Plate Number</Label>
                <div className="relative">
                  <Car className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g. ABC 1234"
                    className="pl-8"
                    value={form.vehiclePlate}
                    onChange={(e) => setForm((f) => ({ ...f, vehiclePlate: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Date / Time */}
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

            {/* Return / Passengers */}
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

            {/* Notes */}
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

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); setForm(emptyForm) }} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Log Journey"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
