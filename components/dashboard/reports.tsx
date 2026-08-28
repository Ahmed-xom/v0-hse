'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart3,
  Download,
  FileText,
  Filter,
  RefreshCw,
  ShieldAlert,
  GraduationCap,
  Users,
  TrendingUp,
  TrendingDown,
  Eye,
  BookOpen,
  Search,
  ChevronLeft,
  ChevronRight,
  Route,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getReportSummary,
  getObservationsReport,
  getTrainingReport,
  getJourneysReport,
  type ReportSummary,
  type ObservationReportRow,
  type TrainingReportRow,
  type JourneyReportRow,
  type DateRange,
} from '@/app/actions/reports'

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
  { value: 'all', label: 'All time' },
]

const ITEMS_PER_PAGE = 10

// ── Summary Stat Card ────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  trend,
}: {
  title: string
  value: string | number
  sub?: string
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="rounded-md bg-secondary p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {sub && (
          <div className="flex items-center gap-1 pt-1">
            {trend === 'up' && <TrendingUp className="h-3 w-3 text-success" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3 text-destructive" />}
            <span className="text-xs text-muted-foreground">{sub}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Severity Badge ────────────────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    High: 'bg-destructive/15 text-destructive border-destructive/30',
    Medium: 'bg-warning/15 text-warning border-warning/30',
    Low: 'bg-success/15 text-success border-success/30',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${map[severity] ?? 'bg-secondary text-secondary-foreground border-border'}`}
    >
      {severity}
    </span>
  )
}

// ── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const open = status === 'Open'
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
        open
          ? 'bg-warning/15 text-warning border-warning/30'
          : 'bg-success/15 text-success border-success/30'
      }`}
    >
      {status}
    </span>
  )
}

// ── Result Badge ─────────────────────────────────────────────────────────────
function ResultBadge({ result }: { result: string }) {
  const passed = result.toUpperCase() === 'PASSED'
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
        passed
          ? 'bg-success/15 text-success border-success/30'
          : 'bg-destructive/15 text-destructive border-destructive/30'
      }`}
    >
      {result}
    </span>
  )
}

// ── Export helpers ───────────────────────────────────────────────────────────
function exportToCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map((r) =>
      headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','),
    ),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Pagination ───────────────────────────────────────────────────────────────
function Pagination({
  page,
  total,
  perPage,
  onChange,
}: {
  page: number
  total: number
  perPage: number
  onChange: (p: number) => void
}) {
  const pages = Math.ceil(total / perPage)
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-sm text-muted-foreground">
        Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {page} / {pages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(page + 1)}
          disabled={page === pages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ── Summary Panel ────────────────────────────────────────────────────────────
function SummaryPanel({ summary }: { summary: ReportSummary }) {
  const obsChange =
    summary.observations.lastMonth > 0
      ? (
          ((summary.observations.thisMonth - summary.observations.lastMonth) /
            summary.observations.lastMonth) *
          100
        ).toFixed(0)
      : null

  const passRate =
    summary.training.total > 0
      ? Math.round((summary.training.passed / summary.training.total) * 100)
      : 0

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Observations"
          value={summary.observations.total}
          sub={
            obsChange !== null
              ? `${obsChange.startsWith('-') ? '' : '+'}${obsChange}% vs last month`
              : `${summary.observations.thisMonth} this month`
          }
          icon={ShieldAlert}
          trend={obsChange !== null ? (Number(obsChange) >= 0 ? 'up' : 'down') : 'neutral'}
        />
        <StatCard
          title="Open Observations"
          value={summary.observations.open}
          sub={`${summary.observations.closed} closed`}
          icon={Eye}
        />
        <StatCard
          title="Training Records"
          value={summary.training.total}
          sub={`${passRate}% pass rate`}
          icon={GraduationCap}
          trend={passRate >= 70 ? 'up' : 'down'}
        />
        <StatCard
          title="Active Employees"
          value={summary.employees.active}
          sub={`${summary.employees.total} total registered`}
          icon={Users}
        />
      </div>

      {/* Observation breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Observations by Severity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'High', count: summary.observations.high, color: 'bg-destructive' },
              { label: 'Medium', count: summary.observations.medium, color: 'bg-warning' },
              { label: 'Low', count: summary.observations.low, color: 'bg-success' },
            ].map(({ label, count, color }) => {
              const pct =
                summary.observations.total > 0
                  ? Math.round((count / summary.observations.total) * 100)
                  : 0
              return (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">
                      {count} <span className="text-muted-foreground">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-chart-2" />
              Training Outcomes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Passed', count: summary.training.passed, color: 'bg-success' },
              { label: 'Failed', count: summary.training.failed, color: 'bg-destructive' },
              { label: 'Appeared', count: summary.training.appeared, color: 'bg-chart-2' },
            ].map(({ label, count, color }) => {
              const pct =
                summary.training.total > 0
                  ? Math.round((count / summary.training.total) * 100)
                  : 0
              return (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">
                      {count} <span className="text-muted-foreground">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export function Reports({ journeyAccess = false }: { journeyAccess?: boolean }) {
  const [activeTab, setActiveTab] = useState('summary')
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Summary
  const [summary, setSummary] = useState<ReportSummary | null>(null)

  // Observations tab
  const [observations, setObservations] = useState<ObservationReportRow[]>([])
  const [obsSearch, setObsSearch] = useState('')
  const [obsSeverity, setObsSeverity] = useState('all')
  const [obsStatus, setObsStatus] = useState('all')
  const [obsPage, setObsPage] = useState(1)

  // Training tab
  const [training, setTraining] = useState<TrainingReportRow[]>([])
  const [trainSearch, setTrainSearch] = useState('')
  const [trainResult, setTrainResult] = useState('all')
  const [trainPage, setTrainPage] = useState(1)

  // Journey tab
  const [journeys, setJourneys] = useState<JourneyReportRow[]>([])
  const [journeySearch, setJourneySearch] = useState('')
  const [journeyStatus, setJourneyStatus] = useState('all')
  const [journeyPurpose, setJourneyPurpose] = useState('all')
  const [journeyPage, setJourneyPage] = useState(1)

  const loadAll = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const fetches: Promise<any>[] = [
        getReportSummary(),
        getObservationsReport(dateRange, obsSeverity, obsStatus),
        getTrainingReport(dateRange, trainResult),
      ]
      if (journeyAccess) fetches.push(getJourneysReport(dateRange, journeyStatus, journeyPurpose))
      const [sumRes, obsRes, trainRes, jrnRes] = await Promise.all(fetches)
      if (sumRes.success && sumRes.data) setSummary(sumRes.data)
      if (obsRes.success && obsRes.data) setObservations(obsRes.data)
      if (trainRes.success && trainRes.data) setTraining(trainRes.data)
      if (jrnRes?.success && jrnRes.data) setJourneys(jrnRes.data)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
      setObsPage(1)
      setTrainPage(1)
      setJourneyPage(1)
    }
  }, [dateRange, obsSeverity, obsStatus, trainResult, journeyAccess, journeyStatus, journeyPurpose])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // Filtered observations
  const filteredObs = observations.filter(
    (o) =>
      obsSearch === '' ||
      o.description.toLowerCase().includes(obsSearch.toLowerCase()) ||
      o.location.toLowerCase().includes(obsSearch.toLowerCase()),
  )
  const pagedObs = filteredObs.slice((obsPage - 1) * ITEMS_PER_PAGE, obsPage * ITEMS_PER_PAGE)

  // Filtered journeys
  const filteredJourneys = journeys.filter(
    (j) =>
      journeySearch === '' ||
      j.userName.toLowerCase().includes(journeySearch.toLowerCase()) ||
      j.origin.toLowerCase().includes(journeySearch.toLowerCase()) ||
      j.destination.toLowerCase().includes(journeySearch.toLowerCase()),
  )
  const pagedJourneys = filteredJourneys.slice(
    (journeyPage - 1) * ITEMS_PER_PAGE,
    journeyPage * ITEMS_PER_PAGE,
  )

  // Filtered training
  const filteredTrain = training.filter(
    (t) =>
      trainSearch === '' ||
      t.employeeName.toLowerCase().includes(trainSearch.toLowerCase()) ||
      t.courseName.toLowerCase().includes(trainSearch.toLowerCase()),
  )
  const pagedTrain = filteredTrain.slice(
    (trainPage - 1) * ITEMS_PER_PAGE,
    trainPage * ITEMS_PER_PAGE,
  )

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Reports
            </CardTitle>
            <CardDescription>HSE performance reports and data exports</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date range picker */}
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <Filter className="mr-1.5 h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={loadAll}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`mb-6 grid w-full ${journeyAccess ? 'max-w-lg grid-cols-4' : 'max-w-sm grid-cols-3'}`}>
            <TabsTrigger value="summary" className="gap-1.5 text-xs">
              <BarChart3 className="h-3.5 w-3.5" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="observations" className="gap-1.5 text-xs">
              <ShieldAlert className="h-3.5 w-3.5" />
              Observations
            </TabsTrigger>
            <TabsTrigger value="training" className="gap-1.5 text-xs">
              <BookOpen className="h-3.5 w-3.5" />
              Training
            </TabsTrigger>
            {journeyAccess && (
              <TabsTrigger value="journeys" className="gap-1.5 text-xs">
                <Route className="h-3.5 w-3.5" />
                Journeys
              </TabsTrigger>
            )}
          </TabsList>

          {/* SUMMARY TAB */}
          <TabsContent value="summary">
            {summary ? (
              <SummaryPanel summary={summary} />
            ) : (
              <p className="text-sm text-muted-foreground">Failed to load summary.</p>
            )}
          </TabsContent>

          {/* OBSERVATIONS TAB */}
          <TabsContent value="observations">
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search observations..."
                    value={obsSearch}
                    onChange={(e) => { setObsSearch(e.target.value); setObsPage(1) }}
                    className="h-8 pl-8 text-xs"
                  />
                </div>
                <Select value={obsSeverity} onValueChange={(v) => { setObsSeverity(v); setObsPage(1) }}>
                  <SelectTrigger className="h-8 w-[120px] text-xs">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All severities</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={obsStatus} onValueChange={(v) => { setObsStatus(v); setObsPage(1) }}>
                  <SelectTrigger className="h-8 w-[110px] text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs ml-auto"
                  onClick={() =>
                    exportToCSV(
                      filteredObs.map((o) => ({
                        ID: o.id,
                        Description: o.description,
                        Severity: o.severity,
                        Location: o.location,
                        Status: o.status,
                        'Business Unit': o.businessUnit,
                        Date: new Date(o.createdAt).toLocaleDateString(),
                      })),
                      `observations-report-${new Date().toISOString().slice(0, 10)}.csv`,
                    )
                  }
                  disabled={filteredObs.length === 0}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Export CSV
                </Button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-lg border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-xs text-muted-foreground">Description</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Severity</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Location</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Status</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedObs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                          No observations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedObs.map((o) => (
                        <TableRow key={o.id} className="border-border/50 hover:bg-secondary/30">
                          <TableCell className="max-w-[260px] truncate text-sm">
                            {o.description}
                          </TableCell>
                          <TableCell>
                            <SeverityBadge severity={o.severity} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{o.location}</TableCell>
                          <TableCell>
                            <StatusBadge status={o.status} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(o.createdAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                page={obsPage}
                total={filteredObs.length}
                perPage={ITEMS_PER_PAGE}
                onChange={setObsPage}
              />
            </div>
          </TabsContent>

          {/* TRAINING TAB */}
          <TabsContent value="training">
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search employee or course..."
                    value={trainSearch}
                    onChange={(e) => { setTrainSearch(e.target.value); setTrainPage(1) }}
                    className="h-8 pl-8 text-xs"
                  />
                </div>
                <Select value={trainResult} onValueChange={(v) => { setTrainResult(v); setTrainPage(1) }}>
                  <SelectTrigger className="h-8 w-[120px] text-xs">
                    <SelectValue placeholder="Result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All results</SelectItem>
                    <SelectItem value="PASSED">Passed</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs ml-auto"
                  onClick={() =>
                    exportToCSV(
                      filteredTrain.map((t) => ({
                        'Employee Name': t.employeeName,
                        'Employee Code': t.employeeCode ?? '',
                        Course: t.courseName,
                        Status: t.status,
                        Result: t.result,
                        'Completed Date': new Date(t.completedDate).toLocaleDateString(),
                      })),
                      `training-report-${new Date().toISOString().slice(0, 10)}.csv`,
                    )
                  }
                  disabled={filteredTrain.length === 0}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Export CSV
                </Button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-lg border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-xs text-muted-foreground">Employee</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Code</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Course</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Result</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedTrain.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                          No training records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedTrain.map((t) => (
                        <TableRow key={t.id} className="border-border/50 hover:bg-secondary/30">
                          <TableCell className="text-sm font-medium">{t.employeeName}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {t.employeeCode ?? '—'}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                            {t.courseName}
                          </TableCell>
                          <TableCell>
                            <ResultBadge result={t.result} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(t.completedDate).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                page={trainPage}
                total={filteredTrain.length}
                perPage={ITEMS_PER_PAGE}
                onChange={setTrainPage}
              />
            </div>
          </TabsContent>
          {/* JOURNEYS TAB */}
          {journeyAccess && (
            <TabsContent value="journeys">
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search driver, origin or destination..."
                      value={journeySearch}
                      onChange={(e) => { setJourneySearch(e.target.value); setJourneyPage(1) }}
                      className="h-8 pl-8 text-xs"
                    />
                  </div>
                  <Select value={journeyStatus} onValueChange={(v) => { setJourneyStatus(v); setJourneyPage(1) }}>
                    <SelectTrigger className="h-8 w-[130px] text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="Planned">Planned</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Flagged">Flagged</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={journeyPurpose} onValueChange={(v) => { setJourneyPurpose(v); setJourneyPage(1) }}>
                    <SelectTrigger className="h-8 w-[130px] text-xs">
                      <SelectValue placeholder="Purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All purposes</SelectItem>
                      <SelectItem value="Site Visit">Site Visit</SelectItem>
                      <SelectItem value="Client Meeting">Client Meeting</SelectItem>
                      <SelectItem value="Delivery">Delivery</SelectItem>
                      <SelectItem value="Inspection">Inspection</SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs ml-auto"
                    onClick={() =>
                      exportToCSV(
                        filteredJourneys.map((j) => ({
                          ID: j.id,
                          Driver: j.userName,
                          Email: j.userEmail,
                          Origin: j.origin,
                          Destination: j.destination,
                          Purpose: j.purpose,
                          'Vehicle Type': j.vehicleType,
                          'Plate Number': j.vehiclePlate ?? '',
                          'Departure Date': j.departureDate,
                          'Departure Time': j.departureTime,
                          'Estimated Return': j.estimatedReturn ?? '',
                          Passengers: j.passengers,
                          Status: j.status,
                          Notes: j.notes ?? '',
                          'Created At': new Date(j.createdAt).toLocaleDateString(),
                        })),
                        `journeys-report-${new Date().toISOString().slice(0, 10)}.csv`,
                      )
                    }
                    disabled={filteredJourneys.length === 0}
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Export CSV
                  </Button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border border-border/50">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="text-xs text-muted-foreground">Driver</TableHead>
                        <TableHead className="text-xs text-muted-foreground">Route</TableHead>
                        <TableHead className="text-xs text-muted-foreground">Purpose</TableHead>
                        <TableHead className="text-xs text-muted-foreground">Vehicle</TableHead>
                        <TableHead className="text-xs text-muted-foreground">Departure</TableHead>
                        <TableHead className="text-xs text-muted-foreground">Passengers</TableHead>
                        <TableHead className="text-xs text-muted-foreground">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedJourneys.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                            No journey records found
                          </TableCell>
                        </TableRow>
                      ) : (
                        pagedJourneys.map((j) => (
                          <TableRow key={j.id} className="border-border/50 hover:bg-secondary/30">
                            <TableCell className="text-sm font-medium">{j.userName}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {j.origin} → {j.destination}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{j.purpose}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {j.vehicleType}{j.vehiclePlate ? ` · ${j.vehiclePlate}` : ''}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(j.departureDate).toLocaleDateString('en-GB', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })}
                              {' '}
                              {j.departureTime}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground text-center">
                              {j.passengers}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                                j.status === 'Completed' ? 'bg-success/15 text-success border-success/30' :
                                j.status === 'In Progress' ? 'bg-warning/15 text-warning border-warning/30' :
                                j.status === 'Flagged' ? 'bg-destructive/15 text-destructive border-destructive/30' :
                                j.status === 'Cancelled' ? 'bg-secondary text-muted-foreground border-border' :
                                'bg-primary/10 text-primary border-primary/20'
                              }`}>
                                {j.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <Pagination
                  page={journeyPage}
                  total={filteredJourneys.length}
                  perPage={ITEMS_PER_PAGE}
                  onChange={setJourneyPage}
                />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}
