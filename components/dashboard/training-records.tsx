"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  GraduationCap,
  Calendar,
  User,
  Award,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Download,
  FileText,
  BookOpen,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  trainingRecords,
  courseCategories,
  type TrainingRecord,
  type TrainingStatus,
  type TrainingResult,
} from "@/lib/training-records-data"
import { courses } from "@/lib/courses-data"
import { employees } from "@/lib/employees-data"

const statusColors: Record<TrainingStatus, string> = {
  APPEAR: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  SCHEDULED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  CANCELLED: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  "NO SHOW": "bg-red-500/20 text-red-400 border-red-500/30",
}

const resultColors: Record<TrainingResult, string> = {
  PASSED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  FAILED: "bg-red-500/20 text-red-400 border-red-500/30",
  PENDING: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  INCOMPLETE: "bg-orange-500/20 text-orange-400 border-orange-500/30",
}

const resultIcons: Record<TrainingResult, React.ReactNode> = {
  PASSED: <CheckCircle className="h-3.5 w-3.5" />,
  FAILED: <XCircle className="h-3.5 w-3.5" />,
  PENDING: <Clock className="h-3.5 w-3.5" />,
  INCOMPLETE: <AlertTriangle className="h-3.5 w-3.5" />,
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function TrainingRecords() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [resultFilter, setResultFilter] = useState<string>("all")
  const [courseFilter, setCourseFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false)
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<TrainingRecord | null>(null)
  const { toast } = useToast()
  const { user: currentUser } = useAuth()

  const isAdmin = currentUser?.role === "ADMIN SYSTEM" || currentUser?.role === "MASTER USER"
  const itemsPerPage = 15

  // Get unique courses from records
  const uniqueCourses = useMemo(() => {
    const coursesSet = new Set<string>()
    trainingRecords.forEach((record) => coursesSet.add(record.courseName))
    return Array.from(coursesSet).sort()
  }, [])

  // Calculate stats
  const stats = useMemo(() => ({
    total: trainingRecords.length,
    passed: trainingRecords.filter((r) => r.result === "PASSED").length,
    failed: trainingRecords.filter((r) => r.result === "FAILED").length,
    scheduled: trainingRecords.filter((r) => r.status === "SCHEDULED").length,
    expiringSoon: trainingRecords.filter((r) => {
      if (!r.expiryDate) return false
      const expiry = new Date(r.expiryDate)
      const now = new Date()
      const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry > 0 && daysUntilExpiry <= 90
    }).length,
  }), [])

  // Filter records
  const filteredRecords = useMemo(() => {
    return trainingRecords.filter((record) => {
      const matchesSearch =
        record.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.courseCode.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || record.status === statusFilter
      const matchesResult = resultFilter === "all" || record.result === resultFilter
      const matchesCourse = courseFilter === "all" || record.courseName === courseFilter

      return matchesSearch && matchesStatus && matchesResult && matchesCourse
    })
  }, [searchQuery, statusFilter, resultFilter, courseFilter])

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleViewDetails = (record: TrainingRecord) => {
    setSelectedRecord(record)
    setIsViewDetailsOpen(true)
  }

  const handleAddRecord = () => {
    toast({
      title: "Training Record Added",
      description: "The training record has been successfully added.",
    })
    setIsAddRecordOpen(false)
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Training Records</CardTitle>
              <p className="text-sm text-muted-foreground">
                Employee training and certification history
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1">
              <Download className="h-4 w-4" />
              Export
            </Button>
            {isAdmin && (
              <Button size="sm" className="gap-1" onClick={() => setIsAddRecordOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Record
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Records</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-emerald-500/10 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats.passed}</p>
            <p className="text-xs text-muted-foreground">Passed</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-red-500/10 p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-blue-500/10 p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.scheduled}</p>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-amber-500/10 p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{stats.expiringSoon}</p>
            <p className="text-xs text-muted-foreground">Expiring Soon</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by employee, ID, or course..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={courseFilter}
            onValueChange={(value) => {
              setCourseFilter(value)
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <BookOpen className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {uniqueCourses.slice(0, 20).map((course) => (
                <SelectItem key={course} value={course}>
                  {course.length > 30 ? course.substring(0, 30) + "..." : course}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={resultFilter}
            onValueChange={(value) => {
              setResultFilter(value)
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-[140px]">
              <Award className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Results</SelectItem>
              <SelectItem value="PASSED">Passed</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="INCOMPLETE">Incomplete</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value)
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="APPEAR">Appeared</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="NO SHOW">No Show</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No training records found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.employeeName}</p>
                        <p className="text-xs text-muted-foreground">{record.employeeId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{record.courseName.length > 35 ? record.courseName.substring(0, 35) + "..." : record.courseName}</p>
                        <p className="text-xs text-muted-foreground">{record.courseCode}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[record.status]}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`gap-1 ${resultColors[record.result]}`}>
                        {resultIcons[record.result]}
                        {record.result}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(record.completedDate)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {record.expiryDate ? (
                        <span className={
                          new Date(record.expiryDate) < new Date()
                            ? "text-red-400"
                            : new Date(record.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                            ? "text-amber-400"
                            : "text-muted-foreground"
                        }>
                          {formatDate(record.expiryDate)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
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
                          <DropdownMenuItem onClick={() => handleViewDetails(record)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            View Certificate
                          </DropdownMenuItem>
                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Record
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-400">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of{" "}
            {filteredRecords.length} records
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
              Page {currentPage} of {totalPages || 1}
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

      {/* Add Record Dialog */}
      <Dialog open={isAddRecordOpen} onOpenChange={setIsAddRecordOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Add Training Record
            </DialogTitle>
            <DialogDescription>
              Add a new training record for an employee
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.slice(0, 50).map((emp) => (
                    <SelectItem key={emp.payrollNo} value={emp.payrollNo}>
                      {emp.name} ({emp.payrollNo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Course</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select defaultValue="APPEAR">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPEAR">Appeared</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="NO SHOW">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Result</Label>
                <Select defaultValue="PASSED">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PASSED">Passed</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="INCOMPLETE">Incomplete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Completion Date</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input type="date" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Score (%)</Label>
                <Input type="number" placeholder="e.g., 85" min={0} max={100} />
              </div>
              <div className="space-y-2">
                <Label>Certificate No.</Label>
                <Input placeholder="Certificate number" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Instructor</Label>
              <Input placeholder="Instructor name" />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input placeholder="Training location" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRecordOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRecord}>Add Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Training Record Details
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">{selectedRecord.employeeName}</p>
                    <p className="text-sm text-muted-foreground">{selectedRecord.employeeId}</p>
                  </div>
                  <Badge variant="outline" className={`gap-1 ${resultColors[selectedRecord.result]}`}>
                    {resultIcons[selectedRecord.result]}
                    {selectedRecord.result}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Course</p>
                <p className="font-medium">{selectedRecord.courseName}</p>
                <p className="text-sm text-muted-foreground">({selectedRecord.courseCode})</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="outline" className={statusColors[selectedRecord.status]}>
                    {selectedRecord.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className="font-medium">{selectedRecord.score ? `${selectedRecord.score}%` : "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Completion Date</p>
                  <p className="flex items-center gap-1.5 font-medium">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(selectedRecord.completedDate)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Expiry Date</p>
                  <p className="flex items-center gap-1.5 font-medium">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {selectedRecord.expiryDate ? formatDate(selectedRecord.expiryDate) : "-"}
                  </p>
                </div>
              </div>

              {selectedRecord.certificateNo && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Certificate Number</p>
                  <p className="flex items-center gap-1.5 font-medium">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    {selectedRecord.certificateNo}
                  </p>
                </div>
              )}

              {selectedRecord.instructor && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Instructor</p>
                  <p className="flex items-center gap-1.5 font-medium">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {selectedRecord.instructor}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
