"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Upload,
  X,
  Calendar,
  User,
  MapPin,
  Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { businessUnits } from "@/lib/users-data"
import {
  observations,
  observationCategories,
  positions,
  locations,
  actionItemTypes,
  type Observation,
  type ActionItem,
  type ObservationType,
  type Priority,
  type ObservationStatus,
} from "@/lib/observations-data"

const statusColors: Record<ObservationStatus, string> = {
  "Open": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "In Progress": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Closed": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Overdue": "bg-red-500/20 text-red-400 border-red-500/30",
  "NoA": "bg-slate-500/20 text-slate-400 border-slate-500/30",
  "Approval Pending": "bg-purple-500/20 text-purple-400 border-purple-500/30",
}

const typeColors: Record<ObservationType, string> = {
  "Safe": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Unsafe": "bg-red-500/20 text-red-400 border-red-500/30",
  "At Risk": "bg-amber-500/20 text-amber-400 border-amber-500/30",
}

const priorityColors: Record<Priority, string> = {
  "High": "bg-red-500/20 text-red-400 border-red-500/30",
  "Medium": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Low": "bg-blue-500/20 text-blue-400 border-blue-500/30",
}

export function BehaviourObservations() {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [businessUnitFilter, setBusinessUnitFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isNewObservationOpen, setIsNewObservationOpen] = useState(false)
  const [isViewObservationOpen, setIsViewObservationOpen] = useState(false)
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()
  const itemsPerPage = 10

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    businessUnit: "",
    position: "",
    location: "",
    nearMiss: "no",
    description: "",
    observationType: "",
    category: "",
    correctiveActions: "",
  })

  const [actionItems, setActionItems] = useState<Partial<ActionItem>[]>([])
  const [attachments, setAttachments] = useState<File[]>([])

  // Stats
  const stats = useMemo(() => ({
    total: observations.length,
    safe: observations.filter((o) => o.observationType === "Safe").length,
    unsafe: observations.filter((o) => o.observationType === "Unsafe").length,
    atRisk: observations.filter((o) => o.observationType === "At Risk").length,
    nearMiss: observations.filter((o) => o.nearMiss).length,
    open: observations.filter((o) => o.status === "Open" || o.status === "In Progress").length,
  }), [])

  // Filter observations
  const filteredObservations = useMemo(() => {
    return observations.filter((obs) => {
      const matchesSearch =
        (obs.number?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        obs.observer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obs.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obs.category.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType = typeFilter === "all" || obs.observationType === typeFilter
      const matchesStatus = statusFilter === "all" || obs.status === statusFilter
      const matchesBU = businessUnitFilter === "all" || obs.businessUnit === businessUnitFilter

      return matchesSearch && matchesType && matchesStatus && matchesBU
    })
  }, [searchQuery, typeFilter, statusFilter, businessUnitFilter])

  const totalPages = Math.ceil(filteredObservations.length / itemsPerPage)
  const paginatedObservations = filteredObservations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleAddActionItem = () => {
    setActionItems([
      ...actionItems,
      {
        id: `ACT-${Date.now()}`,
        type: "",
        action: "",
        actionParty: "",
        approver: "",
        priority: "Medium",
        raisedDate: new Date().toISOString().split("T")[0],
        targetDate: "",
        status: "Open",
        attachments: [],
      },
    ])
  }

  const handleRemoveActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index))
  }

  const handleActionItemChange = (index: number, field: string, value: string) => {
    const updated = [...actionItems]
    updated[index] = { ...updated[index], [field]: value }
    setActionItems(updated)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && attachments.length + files.length <= 5) {
      setAttachments([...attachments, ...Array.from(files)])
    } else {
      toast({
        title: "Maximum files reached",
        description: "You can only upload up to 5 files.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!formData.date || !formData.businessUnit || !formData.position || !formData.location || !formData.description || !formData.observationType || !formData.category) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Observation Submitted",
      description: "Your behaviour observation has been recorded successfully.",
    })
    setIsNewObservationOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      businessUnit: "",
      position: "",
      location: "",
      nearMiss: "no",
      description: "",
      observationType: "",
      category: "",
      correctiveActions: "",
    })
    setActionItems([])
    setAttachments([])
  }

  const handleViewObservation = (obs: Observation) => {
    setSelectedObservation(obs)
    setIsViewObservationOpen(true)
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Eye className="h-5 w-5 text-primary" />
              Behaviour Observations
            </CardTitle>
            <CardDescription>
              Record and track safety observations across all business units
            </CardDescription>
          </div>
          <Button onClick={() => setIsNewObservationOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Observation
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Observations</p>
          </div>
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats.safe}</p>
            <p className="text-xs text-emerald-400/80">Safe</p>
          </div>
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{stats.unsafe}</p>
            <p className="text-xs text-red-400/80">Unsafe</p>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{stats.atRisk}</p>
            <p className="text-xs text-amber-400/80">At Risk</p>
          </div>
          <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 text-center">
            <p className="text-2xl font-bold text-purple-400">{stats.nearMiss}</p>
            <p className="text-xs text-purple-400/80">Near Miss</p>
          </div>
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.open}</p>
            <p className="text-xs text-blue-400/80">Open Items</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search observations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Safe">Safe</SelectItem>
              <SelectItem value="Unsafe">Unsafe</SelectItem>
              <SelectItem value="At Risk">At Risk</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Select value={businessUnitFilter} onValueChange={setBusinessUnitFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Business Unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Units</SelectItem>
              {businessUnits.map((bu) => (
                <SelectItem key={bu} value={bu}>
                  {bu}
                </SelectItem>
              ))}
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
                <TableHead className="text-muted-foreground">Observer</TableHead>
                <TableHead className="text-muted-foreground">Location</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Category</TableHead>
                <TableHead className="text-muted-foreground">Near Miss</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-right text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedObservations.map((obs) => (
                <TableRow key={obs.id} className="border-border/50">
                  <TableCell className="font-medium">{obs.number || obs.id}</TableCell>
                  <TableCell>{new Date(obs.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{obs.observer}</p>
                      <p className="text-xs text-muted-foreground">{obs.businessUnit}</p>
                    </div>
                  </TableCell>
                  <TableCell>{obs.location}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={typeColors[obs.observationType]}>
                      {obs.observationType}
                    </Badge>
                  </TableCell>
                  <TableCell>{obs.category}</TableCell>
                  <TableCell>
                    {obs.nearMiss ? (
                      <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        Yes
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[obs.status]}>
                      {obs.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewObservation(obs)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
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

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredObservations.length)} of{" "}
            {filteredObservations.length} observations
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* New Observation Dialog */}
      <Dialog open={isNewObservationOpen} onOpenChange={setIsNewObservationOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              New Behaviour Observation
            </DialogTitle>
            <DialogDescription>
              Record a new safety observation. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Observation Details */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                Observation Details
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessUnit">Business Unit *</Label>
                  <Select
                    value={formData.businessUnit}
                    onValueChange={(v) => setFormData({ ...formData, businessUnit: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Business Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessUnits.map((bu) => (
                        <SelectItem key={bu} value={bu}>
                          {bu}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observer">Observer *</Label>
                  <Input
                    id="observer"
                    value={user?.name || ""}
                    readOnly
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position *</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(v) => setFormData({ ...formData, position: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Position" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((pos) => (
                        <SelectItem key={pos} value={pos}>
                          {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(v) => setFormData({ ...formData, location: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nearMiss">Near Miss *</Label>
                  <Select
                    value={formData.nearMiss}
                    onValueChange={(v) => setFormData({ ...formData, nearMiss: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Attachments (Max 5 files)</Label>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {file.name}
                      <button onClick={() => handleRemoveAttachment(index)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("file-upload")?.click()}
                    disabled={attachments.length >= 5}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Add File(s)
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what was observed..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="observationType">Observation Type *</Label>
                  <Select
                    value={formData.observationType}
                    onValueChange={(v) => setFormData({ ...formData, observationType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Safe">Safe</SelectItem>
                      <SelectItem value="Unsafe">Unsafe</SelectItem>
                      <SelectItem value="At Risk">At Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {observationCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Action Taken */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Action Taken
              </h3>
              <div className="space-y-2">
                <Label htmlFor="correctiveActions">
                  Description of Corrective Actions Taken (If Observation Unsafe) *
                </Label>
                <Textarea
                  id="correctiveActions"
                  placeholder="Describe the corrective actions taken..."
                  value={formData.correctiveActions}
                  onChange={(e) => setFormData({ ...formData, correctiveActions: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Action Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Action Items
                </h3>
                <Button variant="outline" size="sm" onClick={handleAddActionItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Action Item
                </Button>
              </div>

              {actionItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No action items added. Click &quot;Add Action Item&quot; to create one.
                </p>
              ) : (
                <div className="space-y-4">
                  {actionItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Action Item #{index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveActionItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Action Item Type *</Label>
                          <Select
                            value={item.type || ""}
                            onValueChange={(v) => handleActionItemChange(index, "type", v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                              {actionItemTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Priority *</Label>
                          <Select
                            value={item.priority || "Medium"}
                            onValueChange={(v) => handleActionItemChange(index, "priority", v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="Low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label>Action *</Label>
                          <Textarea
                            placeholder="Describe the action to be taken..."
                            value={item.action || ""}
                            onChange={(e) => handleActionItemChange(index, "action", e.target.value)}
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Action Party *</Label>
                          <Input
                            placeholder="Enter action party"
                            value={item.actionParty || ""}
                            onChange={(e) => handleActionItemChange(index, "actionParty", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Approver</Label>
                          <Input
                            placeholder="Enter approver"
                            value={item.approver || ""}
                            onChange={(e) => handleActionItemChange(index, "approver", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Raised Date *</Label>
                          <Input
                            type="date"
                            value={item.raisedDate || ""}
                            onChange={(e) => handleActionItemChange(index, "raisedDate", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Target Date *</Label>
                          <Input
                            type="date"
                            value={item.targetDate || ""}
                            onChange={(e) => handleActionItemChange(index, "targetDate", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Status *</Label>
                          <Select
                            value={item.status || "Open"}
                            onValueChange={(v) => handleActionItemChange(index, "status", v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Open">Open</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewObservationOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Submit Observation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Observation Dialog */}
      <Dialog open={isViewObservationOpen} onOpenChange={setIsViewObservationOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Observation Details - {selectedObservation?.id}
            </DialogTitle>
          </DialogHeader>

          {selectedObservation && (
            <div className="space-y-6 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Date:</strong> {new Date(selectedObservation.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Business Unit:</strong> {selectedObservation.businessUnit}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Observer:</strong> {selectedObservation.observer}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Location:</strong> {selectedObservation.location}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={typeColors[selectedObservation.observationType]}>
                  {selectedObservation.observationType}
                </Badge>
                <Badge variant="outline">{selectedObservation.category}</Badge>
                <Badge variant="outline" className={statusColors[selectedObservation.status]}>
                  {selectedObservation.status}
                </Badge>
                {selectedObservation.nearMiss && (
                  <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    Near Miss
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedObservation.description}</p>
              </div>

              {selectedObservation.correctiveActions && (
                <div className="space-y-2">
                  <h4 className="font-medium">Corrective Actions Taken</h4>
                  <p className="text-sm text-muted-foreground">{selectedObservation.correctiveActions}</p>
                </div>
              )}

              {selectedObservation.actionItems.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Action Items</h4>
                  <div className="rounded-lg border border-border/50 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50">
                          <TableHead>Type</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Party</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Target</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedObservation.actionItems.map((item) => (
                          <TableRow key={item.id} className="border-border/50">
                            <TableCell className="text-xs">{item.type}</TableCell>
                            <TableCell className="text-xs max-w-[200px] truncate">{item.action}</TableCell>
                            <TableCell className="text-xs">{item.actionParty}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={priorityColors[item.priority]}>
                                {item.priority}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{new Date(item.targetDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={statusColors[item.status]}>
                                {item.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewObservationOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
