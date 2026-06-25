"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import {
  Search,
  Plus,
  Download,
  Upload,
  MoreHorizontal,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  GraduationCap,
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
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { isAdminRole } from "@/lib/auth-roles"
import {
  getTrainingRecords,
  createTrainingRecord,
  deleteTrainingRecord,
  importTrainingRecords,
  bulkCreateMatrixRecords,
} from "@/app/actions/manage-training"
import Papa from "papaparse"

const STATUSES = ["Pending", "In Progress", "Completed", "Overdue", "Cancelled"]
const RESULTS = ["Pass", "Fail", "Incomplete", "Exempted"]
const ITEMS_PER_PAGE = 15

// Derive unique courses and employees from loaded records for the matrix builder
function getUniqueCourses(records: { courseName: string }[]) {
  return [...new Set(records.map((r) => r.courseName))].sort()
}
function getUniqueEmployees(records: { employeeName: string; employeeCode: string }[]) {
  const seen = new Set<string>()
  return records
    .filter((r) => { const k = r.employeeCode; if (seen.has(k)) return false; seen.add(k); return true })
    .map((r) => ({ name: r.employeeName, code: r.employeeCode }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

type TrainingRecord = {
  id: string
  employeeName: string
  employeeCode: string
  courseName: string
  status: string
  result: string | null
  completedDate: string | null
  createdAt: Date | string
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  Completed:   { label: "Completed",   variant: "default",     icon: CheckCircle2 },
  "In Progress":{ label: "In Progress", variant: "secondary",  icon: Clock },
  Pending:     { label: "Pending",     variant: "outline",     icon: AlertCircle },
  Overdue:     { label: "Overdue",     variant: "destructive", icon: XCircle },
  Cancelled:   { label: "Cancelled",  variant: "outline",     icon: XCircle },
}

const resultConfig: Record<string, string> = {
  Pass:      "text-emerald-400",
  Fail:      "text-destructive",
  Incomplete:"text-amber-400",
  Exempted:  "text-muted-foreground",
}

export function TrainingMatrix() {
  const { user } = useAuth()
  const { toast } = useToast()
  const isAdmin = isAdminRole(user?.role ?? "", user?.email ?? "")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [records, setRecords] = useState<TrainingRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [resultFilter, setResultFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isMatrixOpen, setIsMatrixOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  // Matrix builder state
  const [matrixEmployeeSearch, setMatrixEmployeeSearch] = useState("")
  const [matrixCourseSearch, setMatrixCourseSearch] = useState("")
  const [selectedEmployees, setSelectedEmployees] = useState<{ name: string; code: string }[]>([])
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [matrixStatus, setMatrixStatus] = useState("Pending")

  const allEmployees = useMemo(() => getUniqueEmployees(records), [records])
  const allCourses = useMemo(() => getUniqueCourses(records), [records])

  const filteredMatrixEmployees = useMemo(() =>
    allEmployees.filter((e) =>
      !matrixEmployeeSearch ||
      e.name.toLowerCase().includes(matrixEmployeeSearch.toLowerCase()) ||
      e.code.toLowerCase().includes(matrixEmployeeSearch.toLowerCase())
    ), [allEmployees, matrixEmployeeSearch])

  const filteredMatrixCourses = useMemo(() =>
    allCourses.filter((c) =>
      !matrixCourseSearch || c.toLowerCase().includes(matrixCourseSearch.toLowerCase())
    ), [allCourses, matrixCourseSearch])

  const [form, setForm] = useState({
    employeeName: "",
    employeeCode: "",
    courseName: "",
    status: "Pending",
    result: "",
    completedDate: "",
  })

  // Fetch records from DB
  useEffect(() => {
    async function fetchRecords() {
      setIsLoading(true)
      try {
        const result = await getTrainingRecords()
        if (result.success) setRecords(result.data as TrainingRecord[])
      } catch (err) {
        console.error("[v0] Failed to load training records:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchRecords()
  }, [refreshKey])

  // Stats
  const stats = useMemo(() => ({
    total: records.length,
    completed: records.filter((r) => r.status === "Completed").length,
    inProgress: records.filter((r) => r.status === "In Progress").length,
    overdue: records.filter((r) => r.status === "Overdue").length,
    pending: records.filter((r) => r.status === "Pending").length,
    passRate: records.filter((r) => r.result === "Pass").length,
  }), [records])

  // Filtered + paginated
  const filtered = useMemo(() => {
    return records.filter((r) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        !q ||
        r.employeeName.toLowerCase().includes(q) ||
        r.employeeCode.toLowerCase().includes(q) ||
        r.courseName.toLowerCase().includes(q)
      const matchesStatus = statusFilter === "all" || r.status === statusFilter
      const matchesResult = resultFilter === "all" || r.result === resultFilter
      return matchesSearch && matchesStatus && matchesResult
    })
  }, [records, searchQuery, statusFilter, resultFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1) }, [searchQuery, statusFilter, resultFilter])

  // ── Add record ──────────────────────────────────────────
  const handleAdd = async () => {
    if (!form.employeeName || !form.employeeCode || !form.courseName) {
      toast({ title: "Required fields missing", description: "Employee name, code, and course are required.", variant: "destructive" })
      return
    }
    setIsSubmitting(true)
    try {
      const result = await createTrainingRecord(form)
      if (result.success) {
        toast({ title: "Record added", description: "Training record saved to database." })
        setIsAddOpen(false)
        setForm({ employeeName: "", employeeCode: "", courseName: "", status: "Pending", result: "", completedDate: "" })
        setRefreshKey((k) => k + 1)
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Add Training Matrix (bulk) ──────────────────────────
  const handleMatrixCreate = async () => {
    if (selectedEmployees.length === 0 || selectedCourses.length === 0) {
      toast({ title: "Selection required", description: "Select at least one employee and one course.", variant: "destructive" })
      return
    }
    setIsSubmitting(true)
    try {
      const rows = selectedEmployees.flatMap((emp) =>
        selectedCourses.map((course) => ({
          employeeName: emp.name,
          employeeCode: emp.code,
          courseName: course,
          status: matrixStatus,
          result: "",
        }))
      )
      const res = await bulkCreateMatrixRecords(rows)
      if (res.success) {
        toast({ title: "Matrix created", description: `${res.inserted} records added (${res.skipped} already existed).` })
        setIsMatrixOpen(false)
        setSelectedEmployees([])
        setSelectedCourses([])
        setMatrixEmployeeSearch("")
        setMatrixCourseSearch("")
        setMatrixStatus("Pending")
        setRefreshKey((k) => k + 1)
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Export CSV ───────────────────────────────────────────
  const handleExport = () => {
    const csv = Papa.unparse(
      filtered.map((r) => ({
        "Employee Name": r.employeeName,
        "Employee Code": r.employeeCode,
        "Course Name": r.courseName,
        "Status": r.status,
        "Result": r.result ?? "",
        "Completed Date": r.completedDate ?? "",
      }))
    )
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `training_matrix_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Exported", description: `${filtered.length} records exported to CSV.` })
  }

  // ── Import CSV ───────────────────────────────────────────
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        try {
          const rows = (result.data as Record<string, string>[]).map((row) => ({
            employeeName: row["Employee Name"] || row["employee_name"] || row["Name"] || "",
            employeeCode: row["Employee Code"] || row["employee_code"] || row["Code"] || "",
            courseName: row["Course Name"] || row["course_name"] || row["Course"] || "",
            status: row["Status"] || row["status"] || "Pending",
            result: row["Result"] || row["result"] || "",
            completedDate: row["Completed Date"] || row["completed_date"] || "",
          })).filter((r) => r.employeeName && r.courseName)

          if (rows.length === 0) {
            toast({ title: "No valid rows found", description: "Check that the CSV has Employee Name, Employee Code, Course Name columns.", variant: "destructive" })
            return
          }

          const res = await importTrainingRecords(rows)
          if (res.success) {
            toast({ title: "Import complete", description: `${res.inserted} records imported.` })
            setRefreshKey((k) => k + 1)
          } else {
            toast({ title: "Import failed", description: res.error, variant: "destructive" })
          }
        } finally {
          setIsImporting(false)
          if (fileInputRef.current) fileInputRef.current.value = ""
        }
      },
      error: () => {
        toast({ title: "Parse error", description: "Could not parse the CSV file.", variant: "destructive" })
        setIsImporting(false)
      },
    })
  }

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    const res = await deleteTrainingRecord(id)
    if (res.success) {
      setRefreshKey((k) => k + 1)
      toast({ title: "Record deleted" })
    } else {
      toast({ title: "Error", description: res.error, variant: "destructive" })
    }
  }

  return (
    <>
      {/* Hidden file input for import */}
      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile} />

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Training Matrix</CardTitle>
                <CardDescription>
                  {isLoading ? "Loading..." : `${records.length} training records`}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isAdmin && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                  >
                    <Upload className="h-4 w-4" />
                    {isImporting ? "Importing..." : "Import CSV"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleExport}
                    disabled={filtered.length === 0}
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button size="sm" className="gap-2" onClick={() => setIsAddOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add Record
                  </Button>
                  <Button size="sm" variant="secondary" className="gap-2" onClick={() => setIsMatrixOpen(true)}>
                    <BookOpen className="h-4 w-4" />
                    Add Training Matrix
                  </Button>
                </>
              )}
              {!isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleExport}
                  disabled={filtered.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Total",       value: stats.total,       color: "text-foreground" },
              { label: "Completed",   value: stats.completed,   color: "text-emerald-400" },
              { label: "In Progress", value: stats.inProgress,  color: "text-blue-400" },
              { label: "Pending",     value: stats.pending,     color: "text-amber-400" },
              { label: "Overdue",     value: stats.overdue,     color: "text-destructive" },
              { label: "Passed",      value: stats.passRate,    color: "text-emerald-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border/50 bg-background/50 p-3 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <Separator className="border-border/50" />

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, code or course..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={resultFilter} onValueChange={setResultFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                {RESULTS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-md border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 bg-muted/30">
                  <TableHead className="w-14 text-xs">#</TableHead>
                  <TableHead className="text-xs">Employee Name</TableHead>
                  <TableHead className="text-xs">Code</TableHead>
                  <TableHead className="text-xs">Course</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Result</TableHead>
                  <TableHead className="text-xs">Completed</TableHead>
                  {isAdmin && <TableHead className="w-10 text-xs" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i} className="border-border/50">
                      {Array.from({ length: isAdmin ? 8 : 7 }).map((__, j) => (
                        <TableCell key={j}>
                          <div className="h-3 w-full max-w-[140px] animate-pulse rounded bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 8 : 7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <BookOpen className="h-8 w-8 opacity-40" />
                        <p className="text-sm font-medium">No training records found</p>
                        <p className="text-xs">
                          {isAdmin ? 'Click "Add Record" or "Import CSV" to get started' : "No records match your filters"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((rec, idx) => {
                    const cfg = statusConfig[rec.status] ?? statusConfig["Pending"]
                    const StatusIcon = cfg.icon
                    const resultColor = resultConfig[rec.result ?? ""] ?? "text-muted-foreground"
                    return (
                      <TableRow key={rec.id} className="border-border/50 hover:bg-muted/20">
                        <TableCell className="text-xs text-muted-foreground">
                          {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                        </TableCell>
                        <TableCell className="font-medium">{rec.employeeName}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{rec.employeeCode}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">{rec.courseName}</TableCell>
                        <TableCell>
                          <Badge variant={cfg.variant} className="gap-1 text-xs">
                            <StatusIcon className="h-3 w-3" />
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {rec.result ? (
                            <span className={`text-sm font-medium ${resultColor}`}>{rec.result}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {rec.completedDate ? new Date(rec.completedDate).toLocaleDateString("en-GB") : "—"}
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDelete(rec.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? "Loading..."
                : filtered.length === 0
                ? "No records"
                : `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of ${filtered.length} records`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Training Matrix Dialog */}
      <Dialog open={isMatrixOpen} onOpenChange={(open) => { setIsMatrixOpen(open); if (!open) { setSelectedEmployees([]); setSelectedCourses([]) } }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Training Matrix</DialogTitle>
            <DialogDescription>
              Select employees and courses. A training record will be created for every combination ({selectedEmployees.length} employees × {selectedCourses.length} courses = <strong>{selectedEmployees.length * selectedCourses.length}</strong> records).
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-6 py-2 md:grid-cols-2">
            {/* Employees panel */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Employees <span className="ml-1 rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">{selectedEmployees.length} selected</span>
              </Label>
              <Input
                placeholder="Search employees..."
                value={matrixEmployeeSearch}
                onChange={(e) => setMatrixEmployeeSearch(e.target.value)}
                className="h-8 text-xs"
              />
              <div className="flex gap-1 flex-wrap">
                <button
                  type="button"
                  className="text-xs text-primary underline"
                  onClick={() => setSelectedEmployees(filteredMatrixEmployees)}
                >Select all {filteredMatrixEmployees.length}</button>
                <span className="text-muted-foreground text-xs">·</span>
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline"
                  onClick={() => setSelectedEmployees([])}
                >Clear</button>
              </div>
              <div className="h-64 overflow-y-auto rounded border border-border/50 bg-background/30">
                {filteredMatrixEmployees.map((emp) => {
                  const checked = selectedEmployees.some((e) => e.code === emp.code)
                  return (
                    <label
                      key={emp.code}
                      className={`flex cursor-pointer items-center gap-2 border-b border-border/30 px-3 py-2 text-xs last:border-0 hover:bg-muted/30 ${checked ? "bg-primary/5" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        className="h-3.5 w-3.5 accent-primary"
                        onChange={() =>
                          setSelectedEmployees((prev) =>
                            checked ? prev.filter((e) => e.code !== emp.code) : [...prev, emp]
                          )
                        }
                      />
                      <span className="flex-1 truncate font-medium">{emp.name}</span>
                      <span className="font-mono text-muted-foreground">{emp.code}</span>
                    </label>
                  )
                })}
                {filteredMatrixEmployees.length === 0 && (
                  <p className="py-8 text-center text-xs text-muted-foreground">No employees found</p>
                )}
              </div>
            </div>

            {/* Courses panel */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Courses <span className="ml-1 rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">{selectedCourses.length} selected</span>
              </Label>
              <Input
                placeholder="Search courses..."
                value={matrixCourseSearch}
                onChange={(e) => setMatrixCourseSearch(e.target.value)}
                className="h-8 text-xs"
              />
              <div className="flex gap-1 flex-wrap">
                <button
                  type="button"
                  className="text-xs text-primary underline"
                  onClick={() => setSelectedCourses(filteredMatrixCourses)}
                >Select all {filteredMatrixCourses.length}</button>
                <span className="text-muted-foreground text-xs">·</span>
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline"
                  onClick={() => setSelectedCourses([])}
                >Clear</button>
              </div>
              <div className="h-64 overflow-y-auto rounded border border-border/50 bg-background/30">
                {filteredMatrixCourses.map((course) => {
                  const checked = selectedCourses.includes(course)
                  return (
                    <label
                      key={course}
                      className={`flex cursor-pointer items-center gap-2 border-b border-border/30 px-3 py-2 text-xs last:border-0 hover:bg-muted/30 ${checked ? "bg-primary/5" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        className="h-3.5 w-3.5 accent-primary"
                        onChange={() =>
                          setSelectedCourses((prev) =>
                            checked ? prev.filter((c) => c !== course) : [...prev, course]
                          )
                        }
                      />
                      <span className="flex-1 truncate">{course}</span>
                    </label>
                  )
                })}
                {filteredMatrixCourses.length === 0 && (
                  <p className="py-8 text-center text-xs text-muted-foreground">No courses found</p>
                )}
              </div>
            </div>
          </div>

          {/* Default status */}
          <div className="space-y-1.5 pt-2 border-t border-border/50">
            <Label>Default Status for new records</Label>
            <Select value={matrixStatus} onValueChange={setMatrixStatus}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMatrixOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button
              onClick={handleMatrixCreate}
              disabled={isSubmitting || selectedEmployees.length === 0 || selectedCourses.length === 0}
            >
              {isSubmitting ? "Creating..." : `Create ${selectedEmployees.length * selectedCourses.length} Records`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Record Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Training Record</DialogTitle>
            <DialogDescription>Enter the employee and course details below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Employee Name <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Full name"
                  value={form.employeeName}
                  onChange={(e) => setForm((f) => ({ ...f, employeeName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Employee Code <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="e.g. EMP-001"
                  value={form.employeeCode}
                  onChange={(e) => setForm((f) => ({ ...f, employeeCode: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Course Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Fire Safety Awareness"
                value={form.courseName}
                onChange={(e) => setForm((f) => ({ ...f, courseName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Result</Label>
                <Select value={form.result} onValueChange={(v) => setForm((f) => ({ ...f, result: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select result" /></SelectTrigger>
                  <SelectContent>
                    {RESULTS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Completed Date</Label>
              <Input
                type="date"
                value={form.completedDate}
                onChange={(e) => setForm((f) => ({ ...f, completedDate: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleAdd} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Add Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
