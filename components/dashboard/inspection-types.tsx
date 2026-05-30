"use client"

import { useState } from "react"
import { Search, ClipboardList, Plus, MoreHorizontal, Edit, Trash2, Eye, FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { inspectionTypes, categoryConfig, type InspectionType } from "@/lib/inspection-types-data"

export function InspectionTypes() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedInspection, setSelectedInspection] = useState<InspectionType | null>(null)

  const filteredTypes = inspectionTypes.filter((type) => {
    const matchesSearch =
      type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || type.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categoryCounts = {
    all: inspectionTypes.length,
    safety: inspectionTypes.filter((t) => t.category === "safety").length,
    equipment: inspectionTypes.filter((t) => t.category === "equipment").length,
    compliance: inspectionTypes.filter((t) => t.category === "compliance").length,
    environmental: inspectionTypes.filter((t) => t.category === "environmental").length,
    general: inspectionTypes.filter((t) => t.category === "general").length,
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Inspection Types
            </CardTitle>
            <CardDescription>Catalog of available inspection templates and checklists</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Inspection Type
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Inspection Type</DialogTitle>
                <DialogDescription>
                  Create a new inspection template for your organization.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Inspection Name</Label>
                  <Input id="name" placeholder="Enter inspection name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="environmental">Environmental</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Enter detailed description of the inspection..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddDialogOpen(false)}>
                  Create Inspection Type
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          <div className="rounded-lg border border-border/50 bg-secondary/30 p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{categoryCounts.all}</div>
            <div className="text-xs text-muted-foreground">Total Types</div>
          </div>
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{categoryCounts.safety}</div>
            <div className="text-xs text-red-400/70">Safety</div>
          </div>
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{categoryCounts.equipment}</div>
            <div className="text-xs text-blue-400/70">Equipment</div>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-center">
            <div className="text-2xl font-bold text-amber-400">{categoryCounts.compliance}</div>
            <div className="text-xs text-amber-400/70">Compliance</div>
          </div>
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{categoryCounts.environmental}</div>
            <div className="text-xs text-green-400/70">Environmental</div>
          </div>
          <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">{categoryCounts.general}</div>
            <div className="text-xs text-purple-400/70">General</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search inspection types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories ({categoryCounts.all})</SelectItem>
              <SelectItem value="safety">Safety ({categoryCounts.safety})</SelectItem>
              <SelectItem value="equipment">Equipment ({categoryCounts.equipment})</SelectItem>
              <SelectItem value="compliance">Compliance ({categoryCounts.compliance})</SelectItem>
              <SelectItem value="environmental">Environmental ({categoryCounts.environmental})</SelectItem>
              <SelectItem value="general">General ({categoryCounts.general})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 bg-secondary/30 hover:bg-secondary/30">
                <TableHead className="text-muted-foreground">ID</TableHead>
                <TableHead className="text-muted-foreground">Inspection Name</TableHead>
                <TableHead className="text-muted-foreground">Category</TableHead>
                <TableHead className="text-muted-foreground">Description</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTypes.map((type) => (
                <TableRow key={type.id} className="group border-border/50 transition-colors hover:bg-secondary/20">
                  <TableCell className="font-mono text-sm text-muted-foreground">{type.id}</TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{type.name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={categoryConfig[type.category].color}
                    >
                      {categoryConfig[type.category].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-md truncate text-sm text-muted-foreground" title={type.description}>
                      {type.description || "No description provided"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedInspection(type)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="mr-2 h-4 w-4" />
                          Start Inspection
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
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

        {filteredTypes.length === 0 && (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No inspection types found matching your criteria
          </div>
        )}

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredTypes.length} of {inspectionTypes.length} inspection types
        </div>
      </CardContent>

      {/* Detail Dialog */}
      <Dialog open={!!selectedInspection} onOpenChange={() => setSelectedInspection(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              {selectedInspection?.name}
            </DialogTitle>
            <DialogDescription>
              Inspection Type Details
            </DialogDescription>
          </DialogHeader>
          {selectedInspection && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">ID:</div>
                <code className="rounded bg-secondary px-2 py-1 text-sm">{selectedInspection.id}</code>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">Category:</div>
                <Badge 
                  variant="outline" 
                  className={categoryConfig[selectedInspection.category].color}
                >
                  {categoryConfig[selectedInspection.category].label}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Description:</div>
                <p className="rounded-lg border border-border/50 bg-secondary/30 p-4 text-sm leading-relaxed">
                  {selectedInspection.description || "No description provided"}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedInspection(null)}>
              Close
            </Button>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Start Inspection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
