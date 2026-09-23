"use client"

import { useEffect, useState } from "react"
import { Check, ClipboardList, Paperclip, Plus, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { createTicket, getCompanyUsers, getInvoicePermissions, getTickets, setInvoicePermission, updateTicket } from "@/app/actions/manage-trackers"

type Ticket = { id: string; ticketNo: string; subject: string; description?: string; priority: string; status: string; category: string; dueDate?: string }
type User = { id: string; name: string; email: string }
type Permission = { id: string; userId: string; name: string; email: string; permission: string }

const isAdmin = (role?: string) => ["MASTER USER", "ADMIN SYSTEM", "ADMIN", "HSE ADMIN"].includes(String(role).toUpperCase())

export function TicketInvoiceTracker() {
  const { activeCompanyId, user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ subject: "", description: "", priority: "Medium", category: "General", dueDate: "" })
  const [attachments, setAttachments] = useState<File[]>([])
  const [uploadError, setUploadError] = useState("")
  const admin = isAdmin(user?.role)

  const load = async () => {
    if (!activeCompanyId) return
    const [nextTickets, nextUsers] = await Promise.all([getTickets(activeCompanyId), admin ? getCompanyUsers(activeCompanyId) : Promise.resolve([])])
    setTickets(nextTickets)
    setUsers(nextUsers)
    if (admin) setPermissions(await getInvoicePermissions(activeCompanyId))
  }
  useEffect(() => { void load() }, [activeCompanyId, admin])

  const submitTicket = async () => {
    if (!activeCompanyId) return
    setUploadError("")
    const result = await createTicket({ companyId: activeCompanyId, ...form })
    if (!result.success || !result.ticketId) return
    for (const file of attachments) {
      const body = new FormData()
      body.append("ticketId", result.ticketId)
      body.append("file", file)
      const response = await fetch("/api/ticket-attachments", { method: "POST", body })
      if (!response.ok) setUploadError("Ticket created, but one or more attachments could not be uploaded.")
    }
    setAttachments([])
    setForm({ subject: "", description: "", priority: "Medium", category: "General", dueDate: "" })
    setOpen(false)
    await load()
  }

  const changePermission = async (userId: string, permission: "view" | "edit" | "none") => {
    if (!activeCompanyId) return
    await setInvoicePermission({ companyId: activeCompanyId, userId, permission })
    setPermissions(await getInvoicePermissions(activeCompanyId))
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="flex flex-col gap-4 border-b border-border/60 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary"><ClipboardList className="size-5" /><span className="font-mono text-xs uppercase tracking-[0.16em]">XOM operations</span></div>
          <CardTitle>Ticket & invoice tracker</CardTitle>
          <CardDescription>Track requests and give the right people controlled invoice access.</CardDescription>
        </div>
        {admin && <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus data-icon="inline-start" /> New ticket</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Create XOM ticket</DialogTitle></DialogHeader><div className="flex flex-col gap-4"><div className="flex flex-col gap-2"><Label htmlFor="ticket-subject">Subject</Label><Input id="ticket-subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Describe the request" /></div><div className="flex flex-col gap-2"><Label htmlFor="ticket-description">Description</Label><Textarea id="ticket-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Add context for the team" /></div><div className="flex flex-col gap-2"><Label htmlFor="ticket-attachments"><Paperclip data-icon="inline-start" /> Attachments</Label><Input id="ticket-attachments" type="file" multiple onChange={(e) => setAttachments(Array.from(e.target.files ?? []).filter((file) => file.size <= 10 * 1024 * 1024))} /><p className="text-xs text-muted-foreground">Up to 10 MB per file. Attachments are private to authenticated users.</p>{uploadError && <p className="text-xs text-destructive">{uploadError}</p>}</div><div className="grid gap-4 sm:grid-cols-3"><div className="flex flex-col gap-2"><Label>Priority</Label><Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Urgent">Urgent</SelectItem></SelectContent></Select></div><div className="flex flex-col gap-2"><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div><div className="flex flex-col gap-2"><Label htmlFor="ticket-due">Due date</Label><Input id="ticket-due" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div></div></div><DialogFooter><Button onClick={submitTicket} disabled={!form.subject.trim()}>Create ticket</Button></DialogFooter></DialogContent></Dialog>}
      </CardHeader>
      <CardContent className="pt-6"><Tabs defaultValue="tickets"><TabsList><TabsTrigger value="tickets">Tickets <Badge variant="secondary" className="ml-2">{tickets.length}</Badge></TabsTrigger>{admin && <TabsTrigger value="permissions"><ShieldCheck data-icon="inline-start" /> Invoice permissions</TabsTrigger>}</TabsList><TabsContent value="tickets" className="mt-5"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground"><th className="px-3 py-3">Ticket</th><th className="px-3 py-3">Subject</th><th className="px-3 py-3">Priority</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Due</th></tr></thead><tbody>{tickets.map((ticket) => <tr key={ticket.id} className="border-b border-border/60"><td className="px-3 py-4 font-mono text-xs text-primary">{ticket.ticketNo}</td><td className="px-3 py-4"><p className="font-medium">{ticket.subject}</p><p className="text-xs text-muted-foreground">{ticket.category}</p></td><td className="px-3 py-4"><Badge variant={ticket.priority === "Urgent" || ticket.priority === "High" ? "destructive" : "secondary"}>{ticket.priority}</Badge></td><td className="px-3 py-4"><Select value={ticket.status} onValueChange={async (status) => { await updateTicket(ticket.id, { status }); await load() }} disabled={!admin}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Open">Open</SelectItem><SelectItem value="In Progress">In Progress</SelectItem><SelectItem value="Waiting">Waiting</SelectItem><SelectItem value="Resolved">Resolved</SelectItem><SelectItem value="Closed">Closed</SelectItem></SelectContent></Select></td><td className="px-3 py-4 text-muted-foreground">{ticket.dueDate || "—"}</td></tr>)}{tickets.length === 0 && <tr><td colSpan={5} className="px-3 py-10 text-center text-muted-foreground">No tickets for this company yet.</td></tr>}</tbody></table></div></TabsContent>{admin && <TabsContent value="permissions" className="mt-5"><div className="flex flex-col gap-3"><div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">Admins can grant <strong className="text-foreground">View</strong> or <strong className="text-foreground">Edit</strong> access to the invoice tracker. Choose None to remove access.</div>{users.map((member) => { const current = permissions.find((permission) => permission.userId === member.id)?.permission ?? "none"; return <div key={member.id} className="flex flex-col gap-3 rounded-lg border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{member.name || member.email}</p><p className="text-sm text-muted-foreground">{member.email}</p></div><div className="flex items-center gap-3"><Badge variant={current === "edit" ? "default" : current === "view" ? "secondary" : "outline"}>{current === "none" ? "No access" : `${current} access`}</Badge><Select value={current} onValueChange={(value) => void changePermission(member.id, value as "view" | "edit" | "none")}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No access</SelectItem><SelectItem value="view"><Check data-icon="inline-start" /> View</SelectItem><SelectItem value="edit">Edit</SelectItem></SelectContent></Select></div></div> })}</div></TabsContent>}</Tabs></CardContent>
    </Card>
  )
}
