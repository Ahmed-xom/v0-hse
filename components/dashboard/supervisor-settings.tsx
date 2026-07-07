"use client"

import { useEffect, useState, useTransition } from "react"
import { UserCheck, Trash2, Send, Plus, Search, Loader2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  getAllSupervisorAssignments,
  setSupervisorForUser,
  removeSupervisorAssignment,
  getEmployeesForAssignment,
  sendTrainingExpiryEmails,
} from "@/app/actions/supervisor-training-notify"

type Assignment = {
  id: string
  userEmail: string
  userName: string
  supervisorEmail: string
  supervisorName: string
}

type Employee = {
  id: string
  name: string
  email: string
  designation: string
  businessUnit: string
}

export function SupervisorSettings() {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  // Form state
  const [selectedUser, setSelectedUser] = useState("")
  const [supervisorEmail, setSupervisorEmail] = useState("")
  const [supervisorName, setSupervisorName] = useState("")
  const [sending3m, setSending3m] = useState(false)
  const [sending1m, setSending1m] = useState(false)

  useEffect(() => {
    Promise.all([getAllSupervisorAssignments(), getEmployeesForAssignment()]).then(
      ([asgn, emps]) => {
        if (asgn.success) setAssignments(asgn.data)
        setEmployees(emps)
        setLoading(false)
      }
    )
  }, [])

  const selectedEmployee = employees.find(e => e.email === selectedUser)

  const handleAdd = () => {
    if (!selectedUser || !supervisorEmail) {
      toast({ title: "Required fields missing", description: "Select a user and enter supervisor email.", variant: "destructive" })
      return
    }
    if (!supervisorEmail.includes("@")) {
      toast({ title: "Invalid email", description: "Please enter a valid supervisor email.", variant: "destructive" })
      return
    }
    startTransition(async () => {
      const res = await setSupervisorForUser({
        userEmail: selectedUser,
        userName: selectedEmployee?.name ?? selectedUser,
        supervisorEmail,
        supervisorName: supervisorName || supervisorEmail,
      })
      if (res.success) {
        const { data } = await getAllSupervisorAssignments()
        setAssignments(data)
        setSelectedUser("")
        setSupervisorEmail("")
        setSupervisorName("")
        toast({ title: "Assignment saved", description: "Supervisor assigned successfully." })
      } else {
        toast({ title: "Error", description: res.error ?? "Failed to save assignment.", variant: "destructive" })
      }
    })
  }

  const handleRemove = (id: string, userName: string) => {
    startTransition(async () => {
      const res = await removeSupervisorAssignment(id)
      if (res.success) {
        setAssignments(prev => prev.filter(a => a.id !== id))
        toast({ title: "Assignment removed", description: `Supervisor removed for ${userName}.` })
      } else {
        toast({ title: "Error", description: res.error ?? "Failed to remove.", variant: "destructive" })
      }
    })
  }

  const handleSendEmails = async (alertType: "3month" | "1month") => {
    if (alertType === "3month") setSending3m(true)
    else setSending1m(true)

    const res = await sendTrainingExpiryEmails(alertType)

    if (alertType === "3month") setSending3m(false)
    else setSending1m(false)

    if (res.success) {
      const label = alertType === "3month" ? "3-month" : "1-month"
      toast({
        title: `${label} alerts sent`,
        description: res.emailsSent > 0
          ? `${res.emailsSent} email(s) sent covering ${res.recordsFound} training record(s).`
          : `No new alerts to send — all supervisors are up to date.`,
      })
    } else {
      toast({ title: "Error sending emails", description: res.error ?? "Unknown error.", variant: "destructive" })
    }
  }

  const filtered = assignments.filter(a =>
    a.userName.toLowerCase().includes(search.toLowerCase()) ||
    a.userEmail.toLowerCase().includes(search.toLowerCase()) ||
    a.supervisorName.toLowerCase().includes(search.toLowerCase()) ||
    a.supervisorEmail.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">

      {/* Send Email Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4 text-primary" />
            Training Expiry Email Alerts
          </CardTitle>
          <CardDescription>
            Send training expiry warnings to supervisors. Emails are sent from{" "}
            <span className="font-medium text-foreground">hsesystem.xom@outlook.com</span>.
            Each record is only emailed once per alert type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleSendEmails("3month")}
              disabled={sending3m || sending1m}
            >
              {sending3m ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send 3-Month Expiry Alerts
            </Button>
            <Button
              className="gap-2 bg-red-600 hover:bg-red-700 text-white"
              onClick={() => handleSendEmails("1month")}
              disabled={sending3m || sending1m}
            >
              {sending1m ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send 1-Month Expiry Alerts
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            3-month alerts target training expiring in 60–90 days. 1-month alerts target training expiring within 30 days.
            Admins and assigned supervisors both receive the notifications.
          </p>
        </CardContent>
      </Card>

      {/* Add Supervisor Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCheck className="h-4 w-4 text-primary" />
            Assign Supervisor to User
          </CardTitle>
          <CardDescription>
            Assign a supervisor to an employee. The supervisor will receive training expiry emails for that employee.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Employee</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.email} value={emp.email}>
                      {emp.name} {emp.designation ? `(${emp.designation})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Supervisor Email</Label>
              <Input
                placeholder="supervisor@xomoman.com"
                value={supervisorEmail}
                onChange={e => setSupervisorEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Supervisor Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                placeholder="Full name..."
                value={supervisorName}
                onChange={e => setSupervisorName(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAdd} disabled={isPending} className="w-full gap-2">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Assignment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Current Assignments</CardTitle>
              <CardDescription>{assignments.length} supervisor assignment{assignments.length !== 1 ? "s" : ""}</CardDescription>
            </div>
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-8"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {search ? "No assignments match your search." : "No supervisor assignments yet. Add one above."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Employee Email</TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Supervisor Email</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.userName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{a.userEmail}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <UserCheck className="h-3 w-3" />
                        {a.supervisorName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{a.supervisorEmail}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemove(a.id, a.userName)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
