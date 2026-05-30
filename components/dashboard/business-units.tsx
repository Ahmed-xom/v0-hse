"use client"

import { useState } from "react"
import {
  Building2,
  Search,
  Plus,
  MoreHorizontal,
  Mail,
  Edit,
  Trash2,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Users,
  GraduationCap,
  Wrench,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Progress } from "@/components/ui/progress"
import { businessUnitsData, type BusinessUnit } from "@/lib/business-units-data"

export function BusinessUnits() {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const filteredUnits = businessUnitsData.filter((unit) => {
    const matchesSearch =
      unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === "all" || unit.type === typeFilter
    const matchesStatus = statusFilter === "all" || unit.status === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  const activeUnits = businessUnitsData.filter((u) => u.status === "Active").length
  const groupCount = businessUnitsData.filter((u) => u.type === "Group").length
  const businessUnitCount = businessUnitsData.filter((u) => u.type === "Business Unit").length
  const avgTrainingCompliance = Math.round(
    businessUnitsData
      .filter((u) => u.trainingCompliance !== null)
      .reduce((sum, u) => sum + (u.trainingCompliance || 0), 0) /
      businessUnitsData.filter((u) => u.trainingCompliance !== null).length
  )
  const avgEquipmentCompliance = Math.round(
    businessUnitsData
      .filter((u) => u.equipmentCompliance !== null)
      .reduce((sum, u) => sum + (u.equipmentCompliance || 0), 0) /
      businessUnitsData.filter((u) => u.equipmentCompliance !== null).length
  )

  const getComplianceColor = (value: number | null) => {
    if (value === null) return "text-muted-foreground"
    if (value >= 90) return "text-emerald-400"
    if (value >= 75) return "text-amber-400"
    return "text-red-400"
  }

  const getComplianceProgressColor = (value: number | null) => {
    if (value === null) return "bg-muted"
    if (value >= 90) return "bg-emerald-500"
    if (value >= 75) return "bg-amber-500"
    return "bg-red-500"
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-foreground">Business Units</CardTitle>
              <p className="text-sm text-muted-foreground">
                Organizational structure and compliance
              </p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Unit
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Add Business Unit</DialogTitle>
                <DialogDescription>
                  Create a new business unit or group in the organization.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="unit-name">Unit Name</Label>
                  <Input id="unit-name" placeholder="Enter unit name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="unit-type">Type</Label>
                    <Select>
                      <SelectTrigger id="unit-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="group">Group</SelectItem>
                        <SelectItem value="business-unit">Business Unit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="parent-unit">Parent Unit</Label>
                    <Select>
                      <SelectTrigger id="parent-unit">
                        <SelectValue placeholder="Select parent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="xom-oman">XOM Oman</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit-email">Email</Label>
                  <Input id="unit-email" type="email" placeholder="unit@company.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit-description">Description</Label>
                  <Textarea
                    id="unit-description"
                    placeholder="Describe the business unit..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddDialogOpen(false)}>Create Unit</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="rounded-lg border border-border/50 bg-background/50 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span className="text-xs font-medium">Total Units</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{businessUnitsData.length}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/50 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-medium">Active</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-400">{activeUnits}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/50 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium">Groups</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{groupCount}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/50 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <GraduationCap className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-medium">Avg Training</span>
            </div>
            <p className={`mt-2 text-2xl font-bold ${getComplianceColor(avgTrainingCompliance)}`}>
              {avgTrainingCompliance}%
            </p>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/50 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wrench className="h-4 w-4 text-orange-400" />
              <span className="text-xs font-medium">Avg Equipment</span>
            </div>
            <p className={`mt-2 text-2xl font-bold ${getComplianceColor(avgEquipmentCompliance)}`}>
              {avgEquipmentCompliance}%
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search units..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Group">Group</SelectItem>
              <SelectItem value="Business Unit">Business Unit</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Unit Name</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Parent</TableHead>
                <TableHead className="text-muted-foreground hidden lg:table-cell">Training</TableHead>
                <TableHead className="text-muted-foreground hidden lg:table-cell">Equipment</TableHead>
                <TableHead className="text-muted-foreground hidden xl:table-cell">Description</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnits.map((unit) => (
                <TableRow
                  key={unit.id}
                  className="border-border/50 hover:bg-muted/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        unit.type === "Group" ? "bg-primary/20" : "bg-blue-500/20"
                      }`}>
                        <Building2 className={`h-4 w-4 ${
                          unit.type === "Group" ? "text-primary" : "text-blue-400"
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{unit.name}</p>
                        {unit.email && (
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {unit.email.split(";")[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        unit.type === "Group"
                          ? "border-primary/50 text-primary bg-primary/10"
                          : "border-blue-500/50 text-blue-400 bg-blue-500/10"
                      }
                    >
                      {unit.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <ChevronRight className="h-3 w-3" />
                      <span className="text-sm">{unit.underName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {unit.trainingCompliance !== null ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${getComplianceColor(unit.trainingCompliance)}`}>
                            {unit.trainingCompliance}%
                          </span>
                        </div>
                        <Progress
                          value={unit.trainingCompliance}
                          className="h-1.5 bg-muted"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {unit.equipmentCompliance !== null ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${getComplianceColor(unit.equipmentCompliance)}`}>
                            {unit.equipmentCompliance}%
                          </span>
                        </div>
                        <Progress
                          value={unit.equipmentCompliance}
                          className="h-1.5 bg-muted"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {unit.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    {unit.status === "Active" ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                        <XCircle className="mr-1 h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border">
                        <DropdownMenuItem className="gap-2">
                          <Edit className="h-4 w-4" />
                          Edit Unit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Mail className="h-4 w-4" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Users className="h-4 w-4" />
                          View Members
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem className="gap-2 text-red-400 focus:text-red-400">
                          <Trash2 className="h-4 w-4" />
                          Delete Unit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Created Info */}
        <div className="text-xs text-muted-foreground">
          Last updated by SYSTEM ADMIN on 13-Jul-2024
        </div>
      </CardContent>
    </Card>
  )
}
