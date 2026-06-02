"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Clock,
  DollarSign,
  RefreshCw,
  GraduationCap,
  Stethoscope,
  Wrench,
  FileCheck,
  Settings2,
  Building,
  Eye,
  Copy,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { courses, courseCategories, currencies, type Course, type CourseCategory, type Currency } from "@/lib/courses-data"

const categoryColors: Record<CourseCategory, string> = {
  "HSE": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Medical": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Maintenance": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "License": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Operation": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Management System Training": "bg-rose-500/20 text-rose-400 border-rose-500/30",
}

const categoryIcons: Record<CourseCategory, React.ReactNode> = {
  "HSE": <GraduationCap className="h-4 w-4" />,
  "Medical": <Stethoscope className="h-4 w-4" />,
  "Maintenance": <Wrench className="h-4 w-4" />,
  "License": <FileCheck className="h-4 w-4" />,
  "Operation": <Settings2 className="h-4 w-4" />,
  "Management System Training": <Building className="h-4 w-4" />,
}

export function CoursesManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [currencyFilter, setCurrencyFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false)
  const [isViewCourseOpen, setIsViewCourseOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [newCourse, setNewCourse] = useState({
    title: "",
    category: "HSE" as CourseCategory,
    shortTitle: "",
    cost: 0,
    currency: "OMR" as Currency,
    description: "",
    durationDays: 0,
    durationHours: 0,
    recertificationMonths: 0,
  })
  const { toast } = useToast()
  const { user: currentUser } = useAuth()

  const isAdmin = currentUser?.role === "ADMIN SYSTEM" || currentUser?.role === "MASTER USER"
  const itemsPerPage = 15

  // Stats
  const stats = useMemo(() => ({
    total: courses.length,
    hse: courses.filter((c) => c.category === "HSE").length,
    medical: courses.filter((c) => c.category === "Medical").length,
    maintenance: courses.filter((c) => c.category === "Maintenance").length,
    license: courses.filter((c) => c.category === "License").length,
    operation: courses.filter((c) => c.category === "Operation").length,
    free: courses.filter((c) => c.cost === 0).length,
  }), [])

  // Filter courses
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.shortTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = categoryFilter === "all" || course.category === categoryFilter
      const matchesCurrency = currencyFilter === "all" || course.currency === currencyFilter

      return matchesSearch && matchesCategory && matchesCurrency
    })
  }, [searchQuery, categoryFilter, currencyFilter])

  // Pagination
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage)
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleAddCourse = () => {
    const duration = `0 Years, 0 Months, ${newCourse.durationDays} Days, ${newCourse.durationHours} Hours`
    const recertification = newCourse.recertificationMonths > 0 ? `${newCourse.recertificationMonths} Months` : "0 Months"
    
    toast({
      title: "Course Added",
      description: `${newCourse.title} has been added successfully.`,
    })
    setIsAddCourseOpen(false)
    setNewCourse({
      title: "",
      category: "HSE",
      shortTitle: "",
      cost: 0,
      currency: "OMR",
      description: "",
      durationDays: 0,
      durationHours: 0,
      recertificationMonths: 0,
    })
  }

  const handleViewCourse = (course: Course) => {
    setSelectedCourse(course)
    setIsViewCourseOpen(true)
  }

  const handleDuplicateCourse = (course: Course) => {
    setNewCourse({
      title: `${course.title} (Copy)`,
      category: course.category,
      shortTitle: course.shortTitle,
      cost: course.cost,
      currency: course.currency,
      description: course.description,
      durationDays: 0,
      durationHours: 0,
      recertificationMonths: 0,
    })
    setIsAddCourseOpen(true)
    toast({
      title: "Course Duplicated",
      description: "Edit the course details and save.",
    })
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="h-5 w-5 text-primary" />
              Training Courses
            </CardTitle>
            <CardDescription>
              Manage training courses and certifications
            </CardDescription>
          </div>
          {isAdmin && (
            <Button onClick={() => setIsAddCourseOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Course
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Courses</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats.hse}</p>
            <p className="text-xs text-muted-foreground">HSE</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.medical}</p>
            <p className="text-xs text-muted-foreground">Medical</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{stats.maintenance}</p>
            <p className="text-xs text-muted-foreground">Maintenance</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold text-purple-400">{stats.license}</p>
            <p className="text-xs text-muted-foreground">License</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold text-cyan-400">{stats.operation}</p>
            <p className="text-xs text-muted-foreground">Operation</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold text-slate-400">{stats.free}</p>
            <p className="text-xs text-muted-foreground">Free Courses</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1) }}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {courseCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={currencyFilter} onValueChange={(v) => { setCurrencyFilter(v); setCurrentPage(1) }}>
              <SelectTrigger className="w-[120px]">
                <DollarSign className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {currencies.map((cur) => (
                  <SelectItem key={cur} value={cur}>{cur}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Course Title</TableHead>
                <TableHead>Short Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Recertification</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCourses.map((course) => (
                <TableRow key={course.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="max-w-[250px]">
                      <p className="font-medium truncate">{course.title}</p>
                      {course.description && (
                        <p className="text-xs text-muted-foreground truncate">{course.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-2 py-1 text-xs">{course.shortTitle}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`gap-1 ${categoryColors[course.category]}`}>
                      {categoryIcons[course.category]}
                      {course.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {course.cost > 0 ? (
                      <span className="font-medium">{course.cost} {course.currency}</span>
                    ) : (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Free</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {course.duration.replace("0 Years, 0 Months, ", "").replace(", 0 Hours", "").replace("0 Days, ", "")}
                    </div>
                  </TableCell>
                  <TableCell>
                    {course.recertificationInterval !== "0 Months" ? (
                      <div className="flex items-center gap-1 text-sm">
                        <RefreshCw className="h-3 w-3 text-primary" />
                        {course.recertificationInterval}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewCourse(course)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {isAdmin && (
                          <>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Course
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateCourse(course)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
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
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCourses.length)} of {filteredCourses.length} courses
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Add Course Dialog */}
      <Dialog open={isAddCourseOpen} onOpenChange={setIsAddCourseOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add New Course
            </DialogTitle>
            <DialogDescription>
              Create a new training course or certification
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                value={newCourse.title}
                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                placeholder="Enter course title"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="shortTitle">Short Title / Code *</Label>
                <Input
                  id="shortTitle"
                  value={newCourse.shortTitle}
                  onChange={(e) => setNewCourse({ ...newCourse, shortTitle: e.target.value })}
                  placeholder="e.g., PDO AHAF"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={newCourse.category}
                  onValueChange={(v) => setNewCourse({ ...newCourse, category: v as CourseCategory })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {courseCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  value={newCourse.cost}
                  onChange={(e) => setNewCourse({ ...newCourse, cost: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={newCourse.currency}
                  onValueChange={(v) => setNewCourse({ ...newCourse, currency: v as Currency })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((cur) => (
                      <SelectItem key={cur} value={cur}>{cur}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newCourse.description}
                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                placeholder="Enter course description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="durationDays">Duration (Days)</Label>
                <Input
                  id="durationDays"
                  type="number"
                  min="0"
                  value={newCourse.durationDays}
                  onChange={(e) => setNewCourse({ ...newCourse, durationDays: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="durationHours">Duration (Hours)</Label>
                <Input
                  id="durationHours"
                  type="number"
                  min="0"
                  value={newCourse.durationHours}
                  onChange={(e) => setNewCourse({ ...newCourse, durationHours: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="recertification">Recertification Interval (Months)</Label>
              <Input
                id="recertification"
                type="number"
                min="0"
                value={newCourse.recertificationMonths}
                onChange={(e) => setNewCourse({ ...newCourse, recertificationMonths: Number(e.target.value) })}
                placeholder="0 for no recertification"
              />
              <p className="text-xs text-muted-foreground">Enter 0 if no recertification is required</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCourseOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCourse} disabled={!newCourse.title || !newCourse.shortTitle}>
              Add Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Course Dialog */}
      <Dialog open={isViewCourseOpen} onOpenChange={setIsViewCourseOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Course Details
            </DialogTitle>
          </DialogHeader>
          {selectedCourse && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedCourse.title}</h3>
                <code className="rounded bg-muted px-2 py-1 text-sm">{selectedCourse.shortTitle}</code>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`gap-1 ${categoryColors[selectedCourse.category]}`}>
                  {categoryIcons[selectedCourse.category]}
                  {selectedCourse.category}
                </Badge>
                {selectedCourse.cost > 0 ? (
                  <Badge variant="outline">{selectedCourse.cost} {selectedCourse.currency}</Badge>
                ) : (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Free</Badge>
                )}
              </div>
              {selectedCourse.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="text-sm mt-1">{selectedCourse.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Duration</Label>
                  <p className="text-sm mt-1 flex items-center gap-1">
                    <Clock className="h-4 w-4 text-primary" />
                    {selectedCourse.duration}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Recertification</Label>
                  <p className="text-sm mt-1 flex items-center gap-1">
                    <RefreshCw className="h-4 w-4 text-primary" />
                    {selectedCourse.recertificationInterval !== "0 Months" 
                      ? selectedCourse.recertificationInterval 
                      : "Not Required"}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Created At</Label>
                <p className="text-sm mt-1">{selectedCourse.createdAt}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewCourseOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
