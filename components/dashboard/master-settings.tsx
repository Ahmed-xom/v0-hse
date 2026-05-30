"use client"

import { useState } from "react"
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
} from "lucide-react"
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSection, setSelectedSection] = useState<MasterSection | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const currentCategory = masterCategories.find((c) => c.id === selectedCategory)

  const filteredCategories = masterCategories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

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
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" placeholder="Enter name" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" placeholder="Enter description" rows={3} />
                    </div>
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
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsAddDialogOpen(false)}>Save</Button>
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
        ) : (
          // Section Detail View with Sample Items
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
