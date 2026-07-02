"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus, Search, RefreshCw, Eye, Edit, Trash2, UserPlus,
  Users, CalendarDays, ChevronDown, CheckCircle2, Clock,
  ClipboardList, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, parseISO } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { isAdminRole, isReviewerRole } from "@/lib/auth-roles"
import {
  getMeetings, getMeetingWithAttendees, createMeeting, updateMeeting,
  deleteMeeting, toggleAttendance,
  type Meeting, type MeetingAttendee, type MeetingStatus, MEETING_TYPES,
} from "@/app/actions/manage-meetings"

const STATUS_COLORS: Record<string, string> = {
  Completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  "In Progress": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Scheduled: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  Cancelled: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
}

type AttendeeRow = { name: string; email: string; role: string; department: string }

const EMPTY_ATTENDEE: AttendeeRow = { name: "", email: "", role: "", department: "" }

type FormData = {
  meeting_type: string
  title: string
  date: string
  location: string
  business_unit: string
  chairperson: string
  chairperson_email: string
  agenda: string
  minutes: string
  action_items: string
  status: MeetingStatus
}

const EMPTY_FORM: FormData = {
  meeting_type: "HSE Committee Meeting",
  title: "",
  date: new Date().toISOString().split("T")[0],
  location: "",
  business_unit: "",
  chairperson: "",
  chairperson_email: "",
  agenda: "",
  minutes: "",
  action_items: "",
  status: "Scheduled",
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start font-normal">
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

interface MeetingsProps {
  readOnly?: boolean
}

export function Meetings({ readOnly = false }: MeetingsProps) {
  const { toast } = useToast()
  const { currentUser } = useAuth()
  const canEdit = !readOnly && (
    isAdminRole(currentUser?.role ?? "", currentUser?.email ?? "") ||
    isReviewerRole(currentUser?.role ?? "")
  )

  const [records, setRecords] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selected, setSelected] = useState<Meeting | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [attendees, setAttendees] = useState<AttendeeRow[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    const data = await getMeetings({ type: filterType, status: filterStatus, search })
    setRecords(data)
    setIsLoading(false)
  }, [filterType, filterStatus, search])

  useEffect(() => { load() }, [load])

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setAttendees([])
    setIsAddOpen(true)
  }

  const openEdit = async (r: Meeting) => {
    const full = await getMeetingWithAttendees(r.id)
    setSelected(full ?? r)
    setForm({
      meeting_type: r.meeting_type,
      title: r.title,
      date: r.date ? new Date(r.date).toISOString().split("T")[0] : "",
      location: r.location ?? "",
      business_unit: r.business_unit ?? "",
      chairperson: r.chairperson ?? "",
      chairperson_email: r.chairperson_email ?? "",
      agenda: r.agenda ?? "",
      minutes: r.minutes ?? "",
      action_items: r.action_items ?? "",
      status: r.status,
    })
    setAttendees(
      (full?.attendees ?? []).map((a) => ({
        name: a.name, email: a.email ?? "", role: a.role ?? "", department: a.department ?? "",
      }))
    )
    setIsEditOpen(true)
  }

  const openView = async (r: Meeting) => {
    const full = await getMeetingWithAttendees(r.id)
    setSelected(full ?? r)
    setIsViewOpen(true)
  }

  const addAttendeeRow = () => setAttendees((a) => [...a, { ...EMPTY_ATTENDEE }])
  const removeAttendeeRow = (i: number) => setAttendees((a) => a.filter((_, idx) => idx !== i))
  const setAttendeeField = (i: number, field: keyof AttendeeRow, val: string) =>
    setAttendees((rows) => rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r))

  const handleSave = async (isEdit: boolean) => {
    if (!form.title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return }
    if (!form.date) { toast({ title: "Date is required", variant: "destructive" }); return }
    setIsSaving(true)
    const validAttendees = attendees.filter((a) => a.name.trim())
    const res = isEdit && selected
      ? await updateMeeting(selected.id, { ...form, updated_at: undefined }, validAttendees)
      : await createMeeting({ ...form, created_by: currentUser?.name }, validAttendees)
    setIsSaving(false)
    if (res.success) {
      toast({ title: isEdit ? "Meeting updated" : "Meeting created" })
      setIsAddOpen(false); setIsEditOpen(false)
      load()
    } else {
      toast({ title: "Error", description: res.error, variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    const res = await deleteMeeting(id)
    if (res.success) { toast({ title: "Meeting deleted" }); load() }
    else toast({ title: "Error", description: res.error, variant: "destructive" })
  }

  // Stats
  const total = records.length
  const scheduled = records.filter((r) => r.status === "Scheduled").length
  const completed = records.filter((r) => r.status === "Completed").length

  const MeetingForm = () => (
    <Tabs defaultValue="details">
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="agenda">Agenda & Minutes</TabsTrigger>
        <TabsTrigger value="attendees">Attendees ({attendees.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-4 mt-4 max-h-[55vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Meeting Type <span className="text-destructive">*</span></Label>
            <Select value={form.meeting_type} onValueChange={(v) => setForm((f) => ({ ...f, meeting_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MEETING_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as MeetingStatus }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["Scheduled", "In Progress", "Completed", "Cancelled"] as MeetingStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Meeting Title <span className="text-destructive">*</span></Label>
          <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Monthly HSE Committee Meeting – July 2025" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <DateField label="Date of Meeting" value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} />
          <div className="space-y-1.5">
            <Label>Location / Venue</Label>
            <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Conference room, site office, etc." />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Business Unit</Label>
            <Input value={form.business_unit} onChange={(e) => setForm((f) => ({ ...f, business_unit: e.target.value }))} placeholder="Business unit" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Chairperson</Label>
            <Input value={form.chairperson} onChange={(e) => setForm((f) => ({ ...f, chairperson: e.target.value }))} placeholder="Meeting chairperson" />
          </div>
          <div className="space-y-1.5">
            <Label>Chairperson Email</Label>
            <Input type="email" value={form.chairperson_email} onChange={(e) => setForm((f) => ({ ...f, chairperson_email: e.target.value }))} placeholder="email@example.com" />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="agenda" className="space-y-4 mt-4 max-h-[55vh] overflow-y-auto pr-1">
        <div className="space-y-1.5">
          <Label>Agenda</Label>
          <Textarea rows={5} value={form.agenda} onChange={(e) => setForm((f) => ({ ...f, agenda: e.target.value }))} placeholder="List agenda items, one per line..." />
        </div>
        <div className="space-y-1.5">
          <Label>Meeting Minutes</Label>
          <Textarea rows={5} value={form.minutes} onChange={(e) => setForm((f) => ({ ...f, minutes: e.target.value }))} placeholder="Minutes of the meeting..." />
        </div>
        <div className="space-y-1.5">
          <Label>Action Items</Label>
          <Textarea rows={4} value={form.action_items} onChange={(e) => setForm((f) => ({ ...f, action_items: e.target.value }))} placeholder="Action items with owners and due dates..." />
        </div>
      </TabsContent>

      <TabsContent value="attendees" className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">{attendees.length} attendee(s)</p>
          <Button variant="outline" size="sm" onClick={addAttendeeRow} className="gap-1.5">
            <UserPlus className="h-3.5 w-3.5" />Add Attendee
          </Button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
          {attendees.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No attendees added yet. Click "Add Attendee" to add.
            </div>
          ) : attendees.map((a, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-end rounded-md border border-border/50 bg-muted/20 p-3">
              <div className="space-y-1">
                <Label className="text-xs">Name <span className="text-destructive">*</span></Label>
                <Input className="h-8 text-sm" value={a.name} onChange={(e) => setAttendeeField(i, "name", e.target.value)} placeholder="Full name" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input className="h-8 text-sm" type="email" value={a.email} onChange={(e) => setAttendeeField(i, "email", e.target.value)} placeholder="email@company.com" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Role / Title</Label>
                <Input className="h-8 text-sm" value={a.role} onChange={(e) => setAttendeeField(i, "role", e.target.value)} placeholder="HSE Manager" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Department</Label>
                <Input className="h-8 text-sm" value={a.department} onChange={(e) => setAttendeeField(i, "department", e.target.value)} placeholder="Department" />
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeAttendeeRow(i)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
        {[
          { label: "Total Meetings", value: total, icon: CalendarDays, color: "text-primary" },
          { label: "Scheduled", value: scheduled, icon: Clock, color: "text-amber-500" },
          { label: "Completed", value: completed, icon: CheckCircle2, color: "text-emerald-500" },
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
          <Input className="pl-8" placeholder="Search meetings..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-52"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {MEETING_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(["Scheduled", "In Progress", "Completed", "Cancelled"] as MeetingStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        {canEdit && (
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" />New Meeting
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
              <TableHead>Date</TableHead>
              <TableHead>Chairperson</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => (
                  <TableCell key={j}><div className="h-4 animate-pulse rounded bg-muted" /></TableCell>
                ))}</TableRow>
              ))
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  No meetings found. {canEdit && 'Click "New Meeting" to create one.'}
                </TableCell>
              </TableRow>
            ) : records.map((r) => (
              <TableRow key={r.id} className="group">
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.ref_no}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.meeting_type}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.date ? format(parseISO(r.date), "dd MMM yyyy") : "—"}
                </TableCell>
                <TableCell className="text-sm">{r.chairperson ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.location ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${STATUS_COLORS[r.status] ?? ""}`}>
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openView(r)}>
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
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>New Meeting</DialogTitle></DialogHeader>
          <MeetingForm />
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={() => handleSave(false)} disabled={isSaving}>
              {isSaving ? "Saving..." : "Create Meeting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Edit Meeting</DialogTitle></DialogHeader>
          <MeetingForm />
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={() => handleSave(true)} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              {selected?.title}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <Tabs defaultValue="details" className="max-h-[70vh] overflow-y-auto">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="agenda">Agenda & Minutes</TabsTrigger>
                <TabsTrigger value="attendees">
                  Attendees ({selected.attendees?.length ?? 0})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-3 mt-4 text-sm">
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="outline" className={STATUS_COLORS[selected.status]}>{selected.status}</Badge>
                  <Badge variant="secondary">{selected.meeting_type}</Badge>
                </div>
                {[
                  ["Ref No", selected.ref_no],
                  ["Date", selected.date ? format(parseISO(selected.date), "dd MMM yyyy, HH:mm") : "—"],
                  ["Location", selected.location],
                  ["Business Unit", selected.business_unit],
                  ["Chairperson", selected.chairperson],
                  ["Chairperson Email", selected.chairperson_email],
                ].map(([l, v]) => v ? (
                  <div key={String(l)} className="flex gap-2">
                    <span className="w-36 shrink-0 text-muted-foreground">{l}</span>
                    <span>{v}</span>
                  </div>
                ) : null)}
              </TabsContent>
              <TabsContent value="agenda" className="space-y-3 mt-4 text-sm">
                {selected.agenda && (
                  <div className="rounded-md bg-muted/40 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Agenda</p>
                    <p className="whitespace-pre-wrap">{selected.agenda}</p>
                  </div>
                )}
                {selected.minutes && (
                  <div className="rounded-md bg-muted/40 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Minutes</p>
                    <p className="whitespace-pre-wrap">{selected.minutes}</p>
                  </div>
                )}
                {selected.action_items && (
                  <div className="rounded-md bg-muted/40 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Action Items</p>
                    <p className="whitespace-pre-wrap">{selected.action_items}</p>
                  </div>
                )}
                {!selected.agenda && !selected.minutes && !selected.action_items && (
                  <p className="text-muted-foreground text-center py-6">No agenda or minutes recorded yet.</p>
                )}
              </TabsContent>
              <TabsContent value="attendees" className="mt-4">
                {(selected.attendees?.length ?? 0) === 0 ? (
                  <p className="text-muted-foreground text-center py-6 text-sm">No attendees recorded.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Department</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selected.attendees!.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium text-sm">{a.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{a.email ?? "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{a.role ?? "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{a.department ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
            {canEdit && selected && (
              <Button onClick={() => { setIsViewOpen(false); openEdit(selected) }}>Edit</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
