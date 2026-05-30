"use client"

import { useState } from "react"
import { CheckCircle2, Clock, AlertCircle, ChevronRight, Search, Filter } from "lucide-react"
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

type InspectionStatus = "completed" | "in-progress" | "overdue" | "scheduled"

interface InspectionReport {
  id: string
  title: string
  location: string
  inspector: string
  date: string
  status: InspectionStatus
  findings: number
  criticalFindings: number
  completionRate: number
}

const inspectionReports: InspectionReport[] = [
  {
    id: "INS-001",
    title: "Monthly Fire Safety Audit",
    location: "Building A - Floor 3",
    inspector: "Sarah Johnson",
    date: "2024-01-15",
    status: "completed",
    findings: 3,
    criticalFindings: 0,
    completionRate: 100,
  },
  {
    id: "INS-002",
    title: "Electrical Systems Check",
    location: "Manufacturing Plant B",
    inspector: "Michael Chen",
    date: "2024-01-14",
    status: "completed",
    findings: 5,
    criticalFindings: 1,
    completionRate: 100,
  },
  {
    id: "INS-003",
    title: "PPE Compliance Review",
    location: "Warehouse C",
    inspector: "Emily Rodriguez",
    date: "2024-01-16",
    status: "in-progress",
    findings: 2,
    criticalFindings: 0,
    completionRate: 75,
  },
  {
    id: "INS-004",
    title: "Chemical Storage Inspection",
    location: "Lab Facility D",
    inspector: "David Kim",
    date: "2024-01-12",
    status: "overdue",
    findings: 8,
    criticalFindings: 2,
    completionRate: 40,
  },
  {
    id: "INS-005",
    title: "Ergonomics Assessment",
    location: "Office Building E",
    inspector: "Lisa Thompson",
    date: "2024-01-18",
    status: "scheduled",
    findings: 0,
    criticalFindings: 0,
    completionRate: 0,
  },
  {
    id: "INS-006",
    title: "Fall Protection Systems",
    location: "Construction Site F",
    inspector: "James Wilson",
    date: "2024-01-13",
    status: "completed",
    findings: 4,
    criticalFindings: 1,
    completionRate: 100,
  },
  {
    id: "INS-007",
    title: "Emergency Exit Routes",
    location: "Building A - All Floors",
    inspector: "Sarah Johnson",
    date: "2024-01-17",
    status: "in-progress",
    findings: 1,
    criticalFindings: 0,
    completionRate: 60,
  },
  {
    id: "INS-008",
    title: "Ventilation Systems",
    location: "Manufacturing Plant B",
    inspector: "Michael Chen",
    date: "2024-01-19",
    status: "scheduled",
    findings: 0,
    criticalFindings: 0,
    completionRate: 0,
  },
]

const statusConfig: Record<InspectionStatus, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  completed: { label: "Completed", icon: CheckCircle2, variant: "default" },
  "in-progress": { label: "In Progress", icon: Clock, variant: "secondary" },
  overdue: { label: "Overdue", icon: AlertCircle, variant: "destructive" },
  scheduled: { label: "Scheduled", icon: Clock, variant: "outline" },
}

export function InspectionReports() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredReports = inspectionReports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.inspector.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || report.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusCounts = {
    all: inspectionReports.length,
    completed: inspectionReports.filter((r) => r.status === "completed").length,
    "in-progress": inspectionReports.filter((r) => r.status === "in-progress").length,
    overdue: inspectionReports.filter((r) => r.status === "overdue").length,
    scheduled: inspectionReports.filter((r) => r.status === "scheduled").length,
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-chart-2" />
              Inspection Reports
            </CardTitle>
            <CardDescription>Recent safety inspections and compliance audits</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search inspections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:w-[250px]"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({statusCounts.all})</SelectItem>
                <SelectItem value="completed">Completed ({statusCounts.completed})</SelectItem>
                <SelectItem value="in-progress">In Progress ({statusCounts["in-progress"]})</SelectItem>
                <SelectItem value="overdue">Overdue ({statusCounts.overdue})</SelectItem>
                <SelectItem value="scheduled">Scheduled ({statusCounts.scheduled})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground">ID</TableHead>
                <TableHead className="text-muted-foreground">Inspection</TableHead>
                <TableHead className="text-muted-foreground">Location</TableHead>
                <TableHead className="text-muted-foreground">Inspector</TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-center text-muted-foreground">Findings</TableHead>
                <TableHead className="text-muted-foreground">Progress</TableHead>
                <TableHead className="sr-only">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => {
                const StatusIcon = statusConfig[report.status].icon
                return (
                  <TableRow key={report.id} className="group border-border/50 transition-colors hover:bg-secondary/30">
                    <TableCell className="font-mono text-sm text-muted-foreground">{report.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{report.title}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{report.location}</TableCell>
                    <TableCell className="text-muted-foreground">{report.inspector}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(report.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[report.status].variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig[report.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-medium">{report.findings}</span>
                        {report.criticalFindings > 0 && (
                          <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                            {report.criticalFindings} critical
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${report.completionRate}%` }}
                          />
                        </div>
                        <span className="w-10 text-sm text-muted-foreground">{report.completionRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">View details</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        {filteredReports.length === 0 && (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No inspections found matching your criteria
          </div>
        )}
      </CardContent>
    </Card>
  )
}
