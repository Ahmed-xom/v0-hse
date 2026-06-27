"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Mail,
  Phone,
  Shield,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Building2,
  Users,
  Download,
  KeyRound,
  Copy,
  Check,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { businessUnits, roles, type User } from "@/lib/users-data"
import { resetUserPassword, getPasswordResetHistory } from "@/app/actions/reset-password"
import { updateUserStatus, updateUserRole, deleteUser, exportUsersToExcel, getUsers, updateUserApprover } from "@/app/actions/manage-users"
import { isAdminRole } from "@/lib/auth-roles"


const roleColors: Record<string, string> = {
  "ADMIN SYSTEM": "bg-red-500/20 text-red-400 border-red-500/30",
  "MANAGEMENT": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "SITE MANAGER": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "SITE MANAGER - Global": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  "HSE ADMIN": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "HSE": "bg-teal-500/20 text-teal-400 border-teal-500/30",
  "HR": "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "MASTER USER": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "USER": "bg-secondary text-muted-foreground border-border",
  "USER - JM": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
}

const statusConfig: Record<User["status"], { label: string; className: string; icon: typeof UserCheck }> = {
  Active: {
    label: "Active",
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    icon: UserCheck,
  },
  Inactive: {
    label: "Inactive",
    className: "bg-muted text-muted-foreground border-border",
    icon: UserX,
  },
}

const ITEMS_PER_PAGE = 15

export function UsersManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [businessUnitFilter, setBusinessUnitFilter] = useState<string>("all")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null)
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
  const [isResetLoading, setIsResetLoading] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState("")
  const [copiedPassword, setCopiedPassword] = useState(false)
  const [resetHistory, setResetHistory] = useState<{ id: string; resetBy: string; resetAt: Date | null; ipAddress: string | null }[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [resetTab, setResetTab] = useState<"reset" | "history">("reset")

  // Clipboard API is blocked in iframes — fall back to execCommand
  const copyToClipboard = (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).catch(() => execCopy(text))
      } else {
        execCopy(text)
      }
    } catch {
      execCopy(text)
    }
  }
  const execCopy = (text: string) => {
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.focus()
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }

  const [customPassword, setCustomPassword] = useState("")
  const [showCustomPassword, setShowCustomPassword] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEditLoading, setIsEditLoading] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: "",
    role: "",
    status: "Active" as "Active" | "Inactive",
    approver: "",
    approverEmail: "",
  })

  const [addApprover, setAddApprover] = useState({ name: "", email: "" })
  const [dbUsers, setDbUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const { toast } = useToast()
  const { user: currentUser } = useAuth()

  // Fetch real users from the database
  useEffect(() => {
    async function fetchUsers() {
      setIsLoadingUsers(true)
      try {
        const result = await getUsers()
        if (result.success && result.data) {
          setDbUsers(result.data as User[])
        } else {
          console.error("[v0] Failed to load users:", result.error)
        }
      } catch (err) {
        console.error("[v0] Error loading users:", err)
      } finally {
        setIsLoadingUsers(false)
      }
    }
    fetchUsers()
  }, [refreshKey])

  const localUsers = dbUsers

  const isAdmin = isAdminRole(currentUser?.role ?? '', currentUser?.email ?? '')

  const filteredUsers = useMemo(() => {
    return localUsers.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.payrollNo.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole = roleFilter === "all" || user.role === roleFilter
      const matchesStatus = statusFilter === "all" || user.status === statusFilter
      const matchesBusinessUnit = businessUnitFilter === "all" || user.businessUnit === businessUnitFilter
      return matchesSearch && matchesRole && matchesStatus && matchesBusinessUnit
    })
  }, [searchQuery, roleFilter, statusFilter, businessUnitFilter, refreshKey, localUsers])



  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredUsers, currentPage])

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value)
    setCurrentPage(1)
  }

  const stats = useMemo(() => ({
    total: localUsers.length,
    active: localUsers.filter((u) => u.status === "Active").length,
    inactive: localUsers.filter((u) => u.status === "Inactive").length,
    management: localUsers.filter((u) => u.role === "MANAGEMENT" || u.role === "SITE MANAGER" || u.role === "SITE MANAGER - Global").length,
    hse: localUsers.filter((u) => u.role === "HSE" || u.role === "HSE ADMIN").length,
  }), [localUsers])

  const handleResetPassword = (user: User) => {
    setResetPasswordUser(user)
    setIsResetPasswordOpen(true)
    setCopiedPassword(false)
    setGeneratedPassword("")
    setCustomPassword("")
    setShowCustomPassword(false)
    setIsResetLoading(false)
    setResetTab("reset")
    setResetHistory([])
    // Fetch history in background
    setIsLoadingHistory(true)
    getPasswordResetHistory(user.id).then((res) => {
      if (res.success) setResetHistory(res.history)
      setIsLoadingHistory(false)
    })
  }

  const confirmResetPassword = async () => {
    if (!resetPasswordUser) return

    // Validate custom password if provided
    if (customPassword && customPassword.length < 8) {
      toast({ title: "Invalid password", description: "Password must be at least 8 characters.", variant: "destructive" })
      return
    }

    setIsResetLoading(true)
    try {
      const result = await resetUserPassword(
        resetPasswordUser.email,
        currentUser?.email,
        customPassword || undefined,
      )

      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to reset password",
          variant: "destructive",
        })
        return
      }

      // Show the new password in the dialog
      setGeneratedPassword(result.temporaryPassword || "")
      setCopiedPassword(false)

      toast({
        title: result.emailSent ? "Password reset — email sent" : "Password reset",
        description: result.emailSent
          ? `New password emailed to ${result.userEmail}`
          : `Password updated in database. ${result.emailError || ""}`,
        variant: result.emailSent ? "default" : "destructive",
      })

      // Refresh history list
      if (resetPasswordUser) {
        getPasswordResetHistory(resetPasswordUser.id).then((res) => {
          if (res.success) setResetHistory(res.history)
        })
      }
    } catch (error) {
      console.error("[reset-password] Error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset password",
        variant: "destructive",
      })
    } finally {
      setIsResetLoading(false)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditFormData({
      name: user.name,
      role: user.role,
      status: user.status,
      approver: user.approver ?? "",
      approverEmail: user.approverEmail ?? "",
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return

    setIsEditLoading(true)
    try {
      // Update status if changed
      if (editFormData.status !== editingUser.status) {
        const statusResult = await updateUserStatus(editingUser.id, editFormData.status)
        if (!statusResult.success) {
          toast({
            title: "Error",
            description: statusResult.error,
            variant: "destructive",
          })
          setIsEditLoading(false)
          return
        }
      }

      // Update role if changed
      if (editFormData.role !== editingUser.role) {
        const roleResult = await updateUserRole(editingUser.id, editFormData.role)
        if (!roleResult.success) {
          toast({
            title: "Error",
            description: roleResult.error,
            variant: "destructive",
          })
          setIsEditLoading(false)
          return
        }
      }

      // Update approver if changed
      if (
        editFormData.approver !== (editingUser.approver ?? "") ||
        editFormData.approverEmail !== (editingUser.approverEmail ?? "")
      ) {
        await updateUserApprover(editingUser.id, editFormData.approver, editFormData.approverEmail)
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      })
      setIsEditDialogOpen(false)
      setRefreshKey(refreshKey + 1)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setIsEditLoading(false)
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return

    try {
      const result = await deleteUser(user.id)
      if (result.success) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        })
        setRefreshKey(refreshKey + 1)
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const handleExportToExcel = async () => {
    try {
      const result = await exportUsersToExcel(localUsers)
      if (result.success && result.data) {
        // Create a blob and download
        const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast({
          title: "Success",
          description: "Users exported to Excel successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to export users",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export users",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="h-5 w-5 text-primary" />
              Team Members
            </CardTitle>
            <CardDescription>Manage {isLoadingUsers ? '...' : localUsers.length} HSE personnel across all business units</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleExportToExcel}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Team Member</DialogTitle>
                  <DialogDescription>
                    Add a new user to the HSE management system.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="payroll">Payroll No</Label>
                      <Input id="payroll" placeholder="L-XXX-0000" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" placeholder="Enter full name" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="email@company.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="designation">Designation</Label>
                    <Input id="designation" placeholder="Job title" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="businessUnit">Business Unit</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {businessUnits.map((unit) => (
                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Approver</Label>
                    <Select
                      value={addApprover.name ? `${addApprover.name}||${addApprover.email}` : "__none__"}
                      onValueChange={(val) => {
                        if (val === "__none__") {
                          setAddApprover({ name: "", email: "" })
                        } else {
                          const [name, email] = val.split("||")
                          setAddApprover({ name, email })
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select approver..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">
                          <span className="text-muted-foreground">None</span>
                        </SelectItem>
                        {dbUsers.map((u) => (
                          <SelectItem key={u.id} value={`${u.name}||${u.email}`}>
                            <div className="flex flex-col">
                              <span className="font-medium">{u.name}</span>
                              <span className="text-xs text-muted-foreground">{u.email}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setIsAddUserOpen(false); setAddApprover({ name: "", email: "" }) }}>
                    Cancel
                  </Button>
                  <Button onClick={() => { setIsAddUserOpen(false); setAddApprover({ name: "", email: "" }) }}>Add User</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
            <p className="text-sm text-muted-foreground">Inactive</p>
            <p className="text-2xl font-bold text-muted-foreground">{stats.inactive}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
            <p className="text-sm text-muted-foreground">Management</p>
            <p className="text-2xl font-bold text-purple-400">{stats.management}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
            <p className="text-sm text-muted-foreground">HSE Staff</p>
            <p className="text-2xl font-bold text-teal-400">{stats.hse}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, designation, or payroll no..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={businessUnitFilter} onValueChange={handleFilterChange(setBusinessUnitFilter)}>
              <SelectTrigger className="w-[180px]">
                <Building2 className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Business Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                {businessUnits.map((unit) => (
                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={handleFilterChange(setRoleFilter)}>
              <SelectTrigger className="w-[160px]">
                <Shield className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleFilterChange(setStatusFilter)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold">Employee</TableHead>
                <TableHead className="font-semibold hidden sm:table-cell">Payroll No</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
                <TableHead className="hidden font-semibold lg:table-cell">Business Unit</TableHead>
                <TableHead className="hidden font-semibold xl:table-cell">Designation</TableHead>
                <TableHead className="hidden font-semibold xl:table-cell">Approver</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="w-[50px]">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingUsers ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-border/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                        <div className="flex flex-col gap-1.5">
                          <div className="h-3.5 w-32 bg-muted animate-pulse rounded" />
                          <div className="h-3 w-44 bg-muted animate-pulse rounded" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell"><div className="h-3 w-24 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-5 w-20 bg-muted animate-pulse rounded-full" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><div className="h-3 w-28 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell className="hidden xl:table-cell"><div className="h-3 w-40 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-5 w-16 bg-muted animate-pulse rounded-full" /></TableCell>
                    <TableCell><div className="h-8 w-8 bg-muted animate-pulse rounded" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="h-8 w-8 opacity-40" />
                      <p className="text-sm font-medium">No users found</p>
                      <p className="text-xs">Try adjusting your search or filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedUsers.map((user) => {
                const StatusIcon = statusConfig[user.status]?.icon ?? UserCheck
                return (
                  <TableRow key={user.id} className="border-border/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/20 text-primary text-sm">
                            {user.name
                              .split(" ")
                              .slice(0, 2)
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{user.name}</span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[180px]">{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="font-mono text-xs text-muted-foreground">{user.payrollNo}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${roleColors[user.role] || roleColors["USER"]}`}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">{user.businessUnit}</span>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <span className="text-sm text-muted-foreground truncate max-w-[200px] block">{user.designation}</span>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {user.approver ? (
                        <div className="flex flex-col max-w-[180px]">
                          <span className="text-sm truncate">{user.approver}</span>
                          <span className="text-xs text-muted-foreground truncate">{user.approverEmail}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/50 italic">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`gap-1 text-xs ${statusConfig[user.status].className}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig[user.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Phone className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                                <KeyRound className="mr-2 h-4 w-4" />
                                Reset Password
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {user.status === 'Active' ? 'Deactivate' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoadingUsers
              ? "Loading users..."
              : filteredUsers.length === 0
              ? "No users found"
              : `Showing ${((currentPage - 1) * ITEMS_PER_PAGE) + 1} to ${Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of ${filteredUsers.length} users${filteredUsers.length !== localUsers.length ? ` (filtered from ${localUsers.length})` : ""}`
            }
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Reset User Password
            </DialogTitle>
            <DialogDescription>
              Generate or set a new password for this user. The password will be saved to the database and sent to their email.
            </DialogDescription>
          </DialogHeader>
          {resetPasswordUser && (
            <div className="space-y-4 py-2">
              {/* User card */}
              <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/20 text-primary text-sm">
                      {resetPasswordUser.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium leading-none">{resetPasswordUser.name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{resetPasswordUser.email}</p>
                    <Badge variant="outline" className={`mt-1 text-xs ${roleColors[resetPasswordUser.role] || roleColors["USER"]}`}>
                      {resetPasswordUser.role}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Tab switcher */}
              <div className="flex gap-1 rounded-lg border border-border/50 bg-muted/30 p-1">
                <button
                  type="button"
                  onClick={() => setResetTab("reset")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    resetTab === "reset" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Reset Password
                </button>
                <button
                  type="button"
                  onClick={() => setResetTab("history")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    resetTab === "history" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  History {resetHistory.length > 0 && <span className="ml-1 text-xs text-muted-foreground">({resetHistory.length})</span>}
                </button>
              </div>

              {/* Reset tab */}
              {resetTab === "reset" && (
                <div className="space-y-3">
                  {!generatedPassword ? (
                    <>
                      <div className="flex items-center justify-between">
                        <Label>Password</Label>
                        <button
                          type="button"
                          className="text-xs text-primary underline"
                          onClick={() => { setShowCustomPassword((v) => !v); setCustomPassword("") }}
                        >
                          {showCustomPassword ? "Auto-generate instead" : "Set custom password"}
                        </button>
                      </div>
                      {showCustomPassword ? (
                        <Input
                          type="text"
                          placeholder="Enter new password (min. 8 chars)"
                          value={customPassword}
                          onChange={(e) => setCustomPassword(e.target.value)}
                          className="font-mono"
                        />
                      ) : (
                        <p className="rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                          A secure random password will be generated and saved to the database.
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        The new password will be saved to the database and emailed to <strong>{resetPasswordUser.email}</strong>.
                      </p>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Label>New Password — copy before closing</Label>
                      <div className="flex items-center gap-2">
                        <Input value={generatedPassword} readOnly className="font-mono" />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => { copyToClipboard(generatedPassword); setCopiedPassword(true); setTimeout(() => setCopiedPassword(false), 2000) }}
                        >
                          {copiedPassword ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-emerald-500">Password saved to database successfully.</p>
                    </div>
                  )}
                </div>
              )}

              {/* History tab */}
              {resetTab === "history" && (
                <div className="space-y-2">
                  {isLoadingHistory ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">Loading history...</p>
                  ) : resetHistory.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">No password resets recorded for this user.</p>
                  ) : (
                    <div className="max-h-[220px] overflow-y-auto rounded-lg border border-border/50">
                      {resetHistory.map((h, i) => (
                        <div key={h.id} className={`flex items-start justify-between gap-3 px-4 py-3 text-sm ${i !== 0 ? "border-t border-border/40" : ""}`}>
                          <div className="min-w-0">
                            <p className="font-medium">Reset by <span className="text-primary">{h.resetBy}</span></p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              IP: {h.ipAddress || "unknown"}
                            </p>
                          </div>
                          <p className="shrink-0 text-xs text-muted-foreground">
                            {h.resetAt ? new Date(h.resetAt).toLocaleString() : "—"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setIsResetPasswordOpen(false); setGeneratedPassword(""); setCustomPassword(""); setShowCustomPassword(false) }}
              disabled={isResetLoading}
            >
              {generatedPassword ? "Close" : "Cancel"}
            </Button>
            {resetTab === "reset" && !generatedPassword && (
              <Button onClick={confirmResetPassword} disabled={isResetLoading}>
                {isResetLoading ? "Resetting..." : showCustomPassword ? "Set Password" : "Generate & Reset"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit User
            </DialogTitle>
            <DialogDescription>
              Update user role and status information.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {editingUser.name
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{editingUser.name}</p>
                    <p className="text-sm text-muted-foreground">{editingUser.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid gap-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select value={editFormData.role} onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}>
                    <SelectTrigger id="edit-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={editFormData.status} onValueChange={(value) => setEditFormData({ ...editFormData, status: value as "Active" | "Inactive" })}>
                    <SelectTrigger id="edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Approver</Label>
                  <Select
                    value={editFormData.approver ? `${editFormData.approver}||${editFormData.approverEmail}` : "__none__"}
                    onValueChange={(val) => {
                      if (val === "__none__") {
                        setEditFormData({ ...editFormData, approver: "", approverEmail: "" })
                      } else {
                        const [name, email] = val.split("||")
                        setEditFormData({ ...editFormData, approver: name, approverEmail: email })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select approver..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        <span className="text-muted-foreground">None</span>
                      </SelectItem>
                      {dbUsers.map((u) => (
                        <SelectItem key={u.id} value={`${u.name}||${u.email}`}>
                          <div className="flex flex-col">
                            <span className="font-medium">{u.name}</span>
                            <span className="text-xs text-muted-foreground">{u.email}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isEditLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isEditLoading}>
              {isEditLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
