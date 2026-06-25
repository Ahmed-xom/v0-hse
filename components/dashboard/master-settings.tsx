"use client"

import { useState, useEffect } from "react"
import {
  Settings,
  Shield,
  ClipboardCheck,
  Search,
  Users,
  Grid3X3,
  GraduationCap,
  Eye,
  CheckSquare,
  Award,
  AlertTriangle,
  Truck,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  ArrowLeft,
  Database,
  Layers,
  Mail,
  RefreshCw,
  UserCheck,
  ShieldCheck,
} from "lucide-react"
import { getReviewersApprovers, updateReviewerApproverStatus, addReviewerApprover, type ReviewerApproverUser } from "@/app/actions/get-reviewers-approvers"
import { getUsers } from "@/app/actions/manage-users"
import type { User } from "@/lib/users-data"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { masterCategories, getTotalMasterItems, getTotalSections, type MasterSection } from "@/lib/masters-data"

const iconMap: Record<string, React.ReactNode> = {
  settings: <Settings className="h-5 w-5" />,
  shield: <Shield className="h-5 w-5" />,
  "clipboard-check": <ClipboardCheck className="h-5 w-5" />,
  search: <Search className="h-5 w-5" />,
  users: <Users className="h-5 w-5" />,
  grid: <Grid3X3 className="h-5 w-5" />,
  "graduation-cap": <GraduationCap className="h-5 w-5" />,
  eye: <Eye className="h-5 w-5" />,
  "check-square": <CheckSquare className="h-5 w-5" />,
  award: <Award className="h-5 w-5" />,
  "alert-triangle": <AlertTriangle className="h-5 w-5" />,
  truck: <Truck className="h-5 w-5" />,
}

export function MasterSettings() {
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSection, setSelectedSection] = useState<MasterSection | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // Reviewer/Approver real data state
  const [raUsers, setRaUsers] = useState<ReviewerApproverUser[]>([])
  const [raLoading, setRaLoading] = useState(false)
  const [raSearch, setRaSearch] = useState("")

  // All users for the "Add New" dropdown
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [newEntryUser, setNewEntryUser] = useState("")
  const [newEntryRole, setNewEntryRole] = useState<"REVIEWER" | "APPROVER">("REVIEWER")
  const [newEntryName, setNewEntryName] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const currentCategory = masterCategories.find((c) => c.id === selectedCategory)

  // Load real reviewer/approver users when that section is opened
  useEffect(() => {
    if (selectedSection?.id === "reviewer-approver") {
      setRaLoading(true)
      getReviewersApprovers()
        .then((res) => {
          if (res.success) setRaUsers(res.users)
          else toast({ title: "Error loading users", description: res.error, variant: "destructive" })
        })
        .finally(() => setRaLoading(false))
    }
  }, [selectedSection])

  // Load all users when the Add dialog opens for reviewer-approver section
  useEffect(() => {
    if (isAddDialogOpen && selectedSection?.id === "reviewer-approver" && allUsers.length === 0) {
      getUsers().then((res) => {
        if (res.success) {
          const sorted = [...(res.data as User[])].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
          setAllUsers(sorted)
        }
      })
    }
    if (!isAddDialogOpen) {
      setNewEntryUser("")
      setNewEntryName("")
      setNewEntryRole("REVIEWER")
    }
  }, [isAddDialogOpen])

  const filteredCategories = masterCategories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleSaveReviewerApprover = async () => {
    if (!newEntryUser) {
      toast({ title: "Select a user", description: "Please select a user from the dropdown.", variant: "destructive" })
      return
    }
    const [, , id] = newEntryUser.split("||")
    const resolvedUser = allUsers.find((u) => u.id === id)
    const userId = id || resolvedUser?.id
    const name = newEntryName.trim() || resolvedUser?.name || ""
    if (!userId) {
      toast({ title: "User not found", description: "Could not resolve user ID.", variant: "destructive" })
      return
    }
    setIsSaving(true)
    try {
      const result = await addReviewerApprover(userId, newEntryRole)
      if (!result.success) {
        toast({ title: "Error", description: result.error, variant: "destructive" })
        return
      }
      toast({ title: "Saved", description: `${name} added as ${newEntryRole}.` })
      setIsAddDialogOpen(false)
      // Refresh the reviewer/approver list
      const res = await getReviewersApprovers()
      if (res.success) setRaUsers(res.users)
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleBackToCategories = () => {
    setSelectedCategory(null)
    setSelectedSection(null)
  }

  const handleBackToSections = () => {
    setSelectedSection(null)
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="border-b border-border/50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {(selectedCategory || selectedSection) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={selectedSection ? handleBackToSections : handleBackToCategories}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <CardTitle className="text-xl font-semibold text-foreground">
                {selectedSection
                  ? selectedSection.name
                  : selectedCategory
                  ? currentCategory?.name
                  : "Master Settings"}
              </CardTitle>
              <CardDescription>
                {selectedSection
                  ? selectedSection.description
                  : selectedCategory
                  ? `Manage ${currentCategory?.name.toLowerCase()} configurations`
                  : "Configure system master data and settings"}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!selectedCategory && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4" />
                  <span>{masterCategories.length} Categories</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Database className="h-4 w-4" />
                  <span>{getTotalSections()} Sections</span>
                </div>
              </div>
            )}
            {selectedSection && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add New {selectedSection.name}</DialogTitle>
                    <DialogDescription>
                      Create a new entry in {selectedSection.name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {selectedSection?.id === "reviewer-approver" ? (
                      <>
                        <div className="grid gap-2">
                          <Label htmlFor="user-dropdown">Select User</Label>
                          <Select
                            value={newEntryUser}
                            onValueChange={(val) => {
                              setNewEntryUser(val)
                              const [name] = val.split("||")
                              setNewEntryName(name)
                            }}
                          >
                            <SelectTrigger id="user-dropdown">
                              <SelectValue placeholder="Select a user..." />
                            </SelectTrigger>
                            <SelectContent>
                              {allUsers.map((u) => (
                                <SelectItem key={u.id} value={`${u.name}||${u.email}||${u.id}`}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{u.name}</span>
                                    <span className="text-xs text-muted-foreground">{u.email}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="entry-name">Name</Label>
                          <Input
                            id="entry-name"
                            placeholder="Enter name"
                            value={newEntryName}
                            onChange={(e) => setNewEntryName(e.target.value)}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" placeholder="Enter name" />
                      </div>
                    )}
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" placeholder="Enter description" rows={3} />
                    </div>
                    {selectedSection?.id === "reviewer-approver" ? (
                      <div className="grid gap-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={newEntryRole} onValueChange={(v) => setNewEntryRole(v as "REVIEWER" | "APPROVER")}>
                          <SelectTrigger id="role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="REVIEWER">Reviewer</SelectItem>
                            <SelectItem value="APPROVER">Approver</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select defaultValue="active">
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSaving}>
                      Cancel
                    </Button>
                    <Button
                      onClick={selectedSection?.id === "reviewer-approver" ? handleSaveReviewerApprover : () => setIsAddDialogOpen(false)}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        {!selectedSection && (
          <div className="mt-4">
            <Input
              placeholder={selectedCategory ? "Search sections..." : "Search categories..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm bg-background/50"
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {!selectedCategory ? (
          // Categories Grid View
          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="group flex flex-col items-start gap-3 rounded-lg border border-border/50 bg-background/50 p-4 text-left transition-all hover:border-primary/50 hover:bg-background"
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {iconMap[category.icon]}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {category.items.length} sections
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {category.items.slice(0, 3).map((item) => (
                    <Badge key={item.id} variant="secondary" className="text-xs">
                      {item.name}
                    </Badge>
                  ))}
                  {category.items.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{category.items.length - 3} more
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : !selectedSection ? (
          // Sections List View
          <ScrollArea className="h-[600px]">
            <div className="divide-y divide-border/50">
              {currentCategory?.items
                .filter((item) =>
                  item.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedSection(item)}
                    className="group flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Database className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{item.itemCount} items</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                ))}
            </div>
          </ScrollArea>
        ) : selectedSection.id === "reviewer-approver" ? (
          // ── Real Reviewer / Approver section ──────────────────────────────
          <div className="p-6">
            {/* stats row */}
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Total",     value: raUsers.length,                                      icon: <Users className="h-4 w-4" /> },
                { label: "Approvers", value: raUsers.filter((u) => u.role === "APPROVER").length,  icon: <ShieldCheck className="h-4 w-4" /> },
                { label: "Reviewers", value: raUsers.filter((u) => u.role === "REVIEWER").length,  icon: <UserCheck className="h-4 w-4" /> },
                { label: "Active",    value: raUsers.filter((u) => u.status === "active").length,  icon: <Eye className="h-4 w-4" /> },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold leading-none">{s.value}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* search + refresh */}
            <div className="mb-4 flex items-center gap-2">
              <Input
                placeholder="Search by name or email..."
                value={raSearch}
                onChange={(e) => setRaSearch(e.target.value)}
                className="max-w-sm bg-background/50"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setRaLoading(true)
                  getReviewersApprovers()
                    .then((res) => { if (res.success) setRaUsers(res.users) })
                    .finally(() => setRaLoading(false))
                }}
              >
                <RefreshCw className={`h-4 w-4 ${raLoading ? "animate-spin" : ""}`} />
              </Button>
              <p className="ml-auto text-sm text-muted-foreground">{raUsers.length} users</p>
            </div>

            {raLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : (
              <div className="rounded-lg border border-border/50 overflow-hidden">
                {/* table header */}
                <div className="grid grid-cols-12 gap-4 border-b border-border/50 bg-muted/30 px-4 py-3 text-sm font-medium text-muted-foreground">
                  <div className="col-span-4">Name</div>
                  <div className="col-span-4">Email</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>

                {/* rows */}
                <div className="divide-y divide-border/50">
                  {raUsers
                    .filter((u) =>
                      u.name.toLowerCase().includes(raSearch.toLowerCase()) ||
                      u.email.toLowerCase().includes(raSearch.toLowerCase())
                    )
                    .map((u) => (
                      <div key={u.id} className="grid grid-cols-12 items-center gap-4 px-4 py-3">
                        {/* name + avatar */}
                        <div className="col-span-4 flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </div>
                          <span className="font-medium text-foreground truncate">{u.name}</span>
                        </div>

                        {/* email */}
                        <div className="col-span-4 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{u.email}</span>
                        </div>

                        {/* role badge */}
                        <div className="col-span-2">
                          <Badge
                            className={
                              u.role === "APPROVER"
                                ? "bg-primary/15 text-primary border-primary/30"
                                : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                            }
                            variant="outline"
                          >
                            {u.role === "APPROVER" ? (
                              <ShieldCheck className="mr-1 h-3 w-3" />
                            ) : (
                              <UserCheck className="mr-1 h-3 w-3" />
                            )}
                            {u.role}
                          </Badge>
                        </div>

                        {/* status badge */}
                        <div className="col-span-1">
                          <Badge
                            variant="outline"
                            className={
                              u.status === "active"
                                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"
                                : "border-amber-500/50 bg-amber-500/10 text-amber-500"
                            }
                          >
                            {u.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        {/* actions */}
                        <div className="col-span-1 flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={async () => {
                                  const newStatus = u.status === "active" ? "inactive" : "active"
                                  const res = await updateReviewerApproverStatus(u.id, newStatus)
                                  if (res.success) {
                                    setRaUsers((prev) =>
                                      prev.map((x) => x.id === u.id ? { ...x, status: newStatus } : x)
                                    )
                                    toast({ title: "Status updated", description: `${u.name} marked as ${newStatus}` })
                                  }
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Toggle Status
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}

                  {raUsers.length === 0 && (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      No reviewer or approver users found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          // ── Generic mock detail view (all other sections) ─────────────────
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search items..."
                  className="w-64 bg-background/50"
                />
                <Select defaultValue="all">
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedSection.itemCount} total items
              </p>
            </div>
            <div className="rounded-lg border border-border/50">
              <div className="grid grid-cols-12 gap-4 border-b border-border/50 bg-muted/30 p-3 text-sm font-medium text-muted-foreground">
                <div className="col-span-4">Name</div>
                <div className="col-span-4">Description</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div className="divide-y divide-border/50">
                {Array.from({ length: Math.min(10, selectedSection.itemCount) }).map((_, index) => (
                  <div key={index} className="grid grid-cols-12 items-center gap-4 p-3">
                    <div className="col-span-4">
                      <p className="font-medium text-foreground">
                        {selectedSection.name} Item {index + 1}
                      </p>
                    </div>
                    <div className="col-span-4">
                      <p className="text-sm text-muted-foreground">
                        Sample description for item {index + 1}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <Badge
                        variant={index % 5 === 0 ? "outline" : "default"}
                        className={
                          index % 5 === 0
                            ? "border-amber-500/50 text-amber-500"
                            : "bg-emerald-500/10 text-emerald-500"
                        }
                      >
                        {index % 5 === 0 ? "Inactive" : "Active"}
                      </Badge>
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {selectedSection.itemCount > 10 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing 1-10 of {selectedSection.itemCount} items
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
