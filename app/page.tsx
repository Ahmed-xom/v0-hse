"use client"

import { Suspense, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { InspectionReports } from "@/components/dashboard/inspection-reports"
import { InspectionTypes } from "@/components/dashboard/inspection-types"
import { Meetings } from "@/components/dashboard/meetings"
import { ServiceQuality } from "@/components/dashboard/service-quality"
import { PermitToWork } from "@/components/dashboard/permit-to-work"
import { ManagementOfChange } from "@/components/dashboard/moc"
import { DocumentsLibrary } from "@/components/dashboard/documents-library"
import { UsersManagementWithRefresh } from "@/components/dashboard/users-management-with-refresh"
import { BusinessUnits } from "@/components/dashboard/business-units"
import { BehaviourObservations } from "@/components/dashboard/behaviour-observations"
import { AdminSettings } from "@/components/dashboard/admin-settings"
import { IncidentManagement } from "@/components/dashboard/incident-management"
import { TrainingMatrix } from "@/components/dashboard/training-matrix"
import { TrainingRecords } from "@/components/dashboard/training-records"
import { Reports } from "@/components/dashboard/reports"
import { JourneyTracker } from "@/components/dashboard/journey-tracker"
import { ProtectedRoute } from "@/components/protected-route"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { isAdminRole, isReviewerRole } from "@/lib/auth-roles"
import { getUserTabAccess } from "@/app/actions/tab-access"
import { ALL_TABS, type TabKey } from "@/lib/tab-access-config"
import { useEffect, useRef } from "react"

export default function HSEDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    }>
      <HSEDashboardInner />
    </Suspense>
  )
}

function HSEDashboardInner() {
  const { currentUser, isLoading } = useAuth()
  const isAdmin = isAdminRole(currentUser?.role ?? '', currentUser?.email ?? '')
  const isReviewer = !isAdmin && isReviewerRole(currentUser?.role ?? '')
  const [usersRefreshKey, setUsersRefreshKey] = useState(0)
  const [allowedTabs, setAllowedTabs] = useState<TabKey[]>(ALL_TABS.map(t => t.key))
  const fetchedEmail = useRef<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get("tab") ?? "dashboard"

  // Fetch the current user's allowed tabs (non-admins only)
  useEffect(() => {
    if (!currentUser?.email || isAdmin) return
    if (fetchedEmail.current === currentUser.email) return
    fetchedEmail.current = currentUser.email
    getUserTabAccess(currentUser.email).then(setAllowedTabs)
  }, [currentUser?.email, isAdmin])

  const hasTab = (tab: TabKey) => isAdmin || allowedTabs.includes(tab)

  const handleTabChange = (tab: string) => {
    router.push(`/?tab=${tab}`)
  }

  const handleUserAdded = () => {
    setUsersRefreshKey((prev) => prev + 1)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          {/* Page Title */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">HSE Dashboard</h1>
            <p className="text-muted-foreground">
              Health, Safety & Environment performance overview
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          ) : isAdmin ? (
            <Tabs value={["dashboard","observations","incidents","inspections","meetings","service-quality","ptw","moc","documents","reports","journey","settings"].includes(activeTab) ? activeTab : "dashboard"} onValueChange={handleTabChange} className="w-full">
              <div className="flex gap-6 items-start">
                {/* Content — left side */}
                <div className="flex-1 min-w-0">

              <TabsContent value="dashboard" className="space-y-6">
                {/* KPI Cards + Incident Statistics (live DB) */}
                <DashboardOverview />

                {/* Behaviour Observations */}
                <section aria-label="Behaviour Observations">
                  <BehaviourObservations />
                </section>

                {/* Training Matrix */}
                <section aria-label="Training Matrix">
                  <TrainingMatrix />
                </section>

                {/* Inspection Reports */}
                <section aria-label="Inspection Reports">
                  <InspectionReports />
                </section>

                {/* Inspection Types */}
                <section aria-label="Inspection Types">
                  <InspectionTypes />
                </section>

                {/* Team Members / Users */}
                <section aria-label="Team Members">
                  <UsersManagementWithRefresh key={usersRefreshKey} />
                </section>

                {/* Business Units */}
                <section aria-label="Business Units">
                  <BusinessUnits />
                </section>

                {/* Training Records */}
                <section aria-label="Training Records">
                  <TrainingRecords />
                </section>
              </TabsContent>

              <TabsContent value="incidents" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Incident Management</h2>
                  <p className="text-muted-foreground text-sm">Record, investigate, and track all HSE incidents and near misses</p>
                </div>
                <IncidentManagement />
              </TabsContent>

              <TabsContent value="inspections" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Inspections</h2>
                  <p className="text-muted-foreground text-sm">Management visits, audits, HSE and site inspections</p>
                </div>
                <InspectionReports />
              </TabsContent>

              <TabsContent value="meetings" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Meetings</h2>
                  <p className="text-muted-foreground text-sm">HSE committee meetings, toolbox talks, safety stand-downs and more</p>
                </div>
                <Meetings />
              </TabsContent>

              <TabsContent value="service-quality" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Service Quality Reports</h2>
                  <p className="text-muted-foreground text-sm">Evaluate and track contractor and service quality performance</p>
                </div>
                <ServiceQuality />
              </TabsContent>

              <TabsContent value="ptw" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Permit to Work</h2>
                  <p className="text-muted-foreground text-sm">Manage and issue work permits for controlled and hazardous activities</p>
                </div>
                <PermitToWork />
              </TabsContent>

              <TabsContent value="moc" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Management of Change & Exemptions</h2>
                  <p className="text-muted-foreground text-sm">Track and control changes, deviations, and exemptions from standards</p>
                </div>
                <ManagementOfChange />
              </TabsContent>

              <TabsContent value="documents" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Documents Library</h2>
                  <p className="text-muted-foreground text-sm">Policies, standards, procedures, guidelines, and forms</p>
                </div>
                <DocumentsLibrary />
              </TabsContent>

              <TabsContent value="reports" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Reports</h2>
                  <p className="text-muted-foreground text-sm">HSE performance data, summaries, and exports</p>
                </div>
                <Reports journeyAccess={!!currentUser?.journeyAccess} />
              </TabsContent>

              <TabsContent value="journey" className="space-y-6">
                <JourneyTracker />
              </TabsContent>

              <TabsContent value="observations" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">All Observations</h2>
                  <p className="text-sm text-muted-foreground">View and manage behaviour-based safety observations across all business units.</p>
                </div>
                <BehaviourObservations viewAll />
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <AdminSettings onUserAdded={handleUserAdded} />
              </TabsContent>
                </div>{/* end content */}

                {/* Right-side vertical nav */}
                <TabsList className="flex flex-col h-auto w-44 shrink-0 sticky top-6 gap-0.5 p-1.5 rounded-lg bg-muted/60">
                  <TabsTrigger value="dashboard"      className="w-full justify-start text-sm px-3 py-2">Dashboard</TabsTrigger>
                  <TabsTrigger value="incidents"      className="w-full justify-start text-sm px-3 py-2">Incidents</TabsTrigger>
                  <TabsTrigger value="inspections"    className="w-full justify-start text-sm px-3 py-2">Inspections</TabsTrigger>
                  <TabsTrigger value="meetings"       className="w-full justify-start text-sm px-3 py-2">Meetings</TabsTrigger>
                  <TabsTrigger value="service-quality" className="w-full justify-start text-sm px-3 py-2">Service Quality</TabsTrigger>
                  <TabsTrigger value="ptw"            className="w-full justify-start text-sm px-3 py-2">Permit to Work</TabsTrigger>
                  <TabsTrigger value="moc"            className="w-full justify-start text-sm px-3 py-2">MOC / Exemptions</TabsTrigger>
                  <TabsTrigger value="documents"      className="w-full justify-start text-sm px-3 py-2">Documents</TabsTrigger>
                  <TabsTrigger value="reports"        className="w-full justify-start text-sm px-3 py-2">Reports</TabsTrigger>
                  <TabsTrigger value="journey"        className="w-full justify-start text-sm px-3 py-2">Journey</TabsTrigger>
                  <TabsTrigger value="observations"   className="w-full justify-start text-sm px-3 py-2">Observations</TabsTrigger>
                  <div className="my-1 h-px bg-border/60" />
                  <TabsTrigger value="settings"       className="w-full justify-start text-sm px-3 py-2">Settings</TabsTrigger>
                </TabsList>
              </div>{/* end flex row */}
            </Tabs>
          ) : isReviewer ? (
            /* ── Reviewer / Approver view ── */
            <Tabs value={["observations","incidents","inspections","meetings","service-quality","ptw","moc","documents","reports","journey"].includes(activeTab) ? activeTab : "observations"} onValueChange={handleTabChange} className="w-full">
              <div className="flex gap-6 items-start">
                {/* Content — left side */}
                <div className="flex-1 min-w-0">

              <TabsContent value="observations" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">All Observations</h2>
                  <p className="text-sm text-muted-foreground">View and export observations submitted by all employees.</p>
                </div>
                <BehaviourObservations viewAll />
              </TabsContent>

              <TabsContent value="incidents" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Incident Management</h2>
                  <p className="text-sm text-muted-foreground">Record, investigate, and track all HSE incidents and near misses.</p>
                </div>
                <IncidentManagement />
              </TabsContent>

              <TabsContent value="inspections" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Inspections</h2>
                  <p className="text-sm text-muted-foreground">Management visits, audits, HSE and site inspections.</p>
                </div>
                <InspectionReports />
              </TabsContent>

              <TabsContent value="meetings" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Meetings</h2>
                  <p className="text-sm text-muted-foreground">HSE committee meetings, toolbox talks, safety stand-downs and more.</p>
                </div>
                <Meetings />
              </TabsContent>

              <TabsContent value="service-quality" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Service Quality Reports</h2>
                  <p className="text-sm text-muted-foreground">Evaluate and track contractor and service quality performance.</p>
                </div>
                <ServiceQuality />
              </TabsContent>

              <TabsContent value="ptw" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Permit to Work</h2>
                  <p className="text-sm text-muted-foreground">Manage and issue work permits for controlled and hazardous activities.</p>
                </div>
                <PermitToWork />
              </TabsContent>

              <TabsContent value="moc" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Management of Change & Exemptions</h2>
                  <p className="text-sm text-muted-foreground">Track and control changes, deviations, and exemptions from standards.</p>
                </div>
                <ManagementOfChange />
              </TabsContent>

              <TabsContent value="documents" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Documents Library</h2>
                  <p className="text-sm text-muted-foreground">Policies, standards, procedures, guidelines, and forms.</p>
                </div>
                <DocumentsLibrary />
              </TabsContent>

              <TabsContent value="reports" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Reports</h2>
                  <p className="text-sm text-muted-foreground">HSE performance summaries and exports.</p>
                </div>
                <Reports journeyAccess={!!currentUser?.journeyAccess} />
              </TabsContent>

              {currentUser?.journeyAccess && (
                <TabsContent value="journey" className="space-y-6">
                  <JourneyTracker />
                </TabsContent>
              )}
                </div>{/* end content */}

                {/* Right-side vertical nav */}
                <TabsList className="flex flex-col h-auto w-44 shrink-0 sticky top-6 gap-0.5 p-1.5 rounded-lg bg-muted/60">
                  {hasTab('observations') && <TabsTrigger value="observations"    className="w-full justify-start text-sm px-3 py-2">Observations</TabsTrigger>}
                  {hasTab('incidents') && <TabsTrigger value="incidents"          className="w-full justify-start text-sm px-3 py-2">Incidents</TabsTrigger>}
                  {hasTab('inspections') && <TabsTrigger value="inspections"      className="w-full justify-start text-sm px-3 py-2">Inspections</TabsTrigger>}
                  {hasTab('meetings') && <TabsTrigger value="meetings"            className="w-full justify-start text-sm px-3 py-2">Meetings</TabsTrigger>}
                  {hasTab('service-quality') && <TabsTrigger value="service-quality" className="w-full justify-start text-sm px-3 py-2">Service Quality</TabsTrigger>}
                  {hasTab('ptw') && <TabsTrigger value="ptw"                      className="w-full justify-start text-sm px-3 py-2">Permit to Work</TabsTrigger>}
                  {hasTab('moc') && <TabsTrigger value="moc"                      className="w-full justify-start text-sm px-3 py-2">MOC / Exemptions</TabsTrigger>}
                  {hasTab('documents') && <TabsTrigger value="documents"          className="w-full justify-start text-sm px-3 py-2">Documents</TabsTrigger>}
                  {hasTab('reports') && <TabsTrigger value="reports"              className="w-full justify-start text-sm px-3 py-2">Reports</TabsTrigger>}
                  {hasTab('journey') && currentUser?.journeyAccess && <TabsTrigger value="journey" className="w-full justify-start text-sm px-3 py-2">Journey</TabsTrigger>}
                </TabsList>
              </div>{/* end flex row */}
            </Tabs>
          ) : (
            /* ── Regular user view ── */
            <Tabs value={["observations","incidents","inspections","meetings","service-quality","ptw","moc","documents","reports","journey"].includes(activeTab) ? activeTab : "observations"} onValueChange={handleTabChange} className="w-full">
              <div className="flex gap-6 items-start">
                {/* Content — left side */}
                <div className="flex-1 min-w-0">

              <TabsContent value="observations" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Observations</h2>
                  <p className="text-sm text-muted-foreground">Submit and track your behaviour-based safety observations.</p>
                </div>
                <BehaviourObservations />
              </TabsContent>

              <TabsContent value="incidents" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Incidents</h2>
                  <p className="text-sm text-muted-foreground">Report and track HSE incidents and near misses.</p>
                </div>
                <IncidentManagement />
              </TabsContent>

              <TabsContent value="inspections" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Inspections</h2>
                  <p className="text-sm text-muted-foreground">View inspection and audit reports.</p>
                </div>
                <InspectionReports readOnly />
              </TabsContent>

              <TabsContent value="meetings" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Meetings</h2>
                  <p className="text-sm text-muted-foreground">View HSE meeting records, agendas, and attendees.</p>
                </div>
                <Meetings readOnly />
              </TabsContent>

              <TabsContent value="service-quality" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Service Quality Reports</h2>
                  <p className="text-sm text-muted-foreground">View contractor and service quality evaluations.</p>
                </div>
                <ServiceQuality readOnly />
              </TabsContent>

              <TabsContent value="ptw" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Permit to Work</h2>
                  <p className="text-sm text-muted-foreground">View issued work permits for controlled and hazardous activities.</p>
                </div>
                <PermitToWork readOnly />
              </TabsContent>

              <TabsContent value="moc" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Management of Change & Exemptions</h2>
                  <p className="text-sm text-muted-foreground">View changes, deviations, and exemptions from standards.</p>
                </div>
                <ManagementOfChange readOnly />
              </TabsContent>

              <TabsContent value="documents" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Documents Library</h2>
                  <p className="text-sm text-muted-foreground">Policies, standards, procedures, guidelines, and forms.</p>
                </div>
                <DocumentsLibrary />
              </TabsContent>

              <TabsContent value="reports" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Reports</h2>
                  <p className="text-sm text-muted-foreground">HSE performance summaries and exports.</p>
                </div>
                <Reports journeyAccess={!!currentUser?.journeyAccess} />
              </TabsContent>

              {currentUser?.journeyAccess && (
                <TabsContent value="journey" className="space-y-6">
                  <JourneyTracker />
                </TabsContent>
              )}
                </div>{/* end content */}

                {/* Right-side vertical nav */}
                <TabsList className="flex flex-col h-auto w-44 shrink-0 sticky top-6 gap-0.5 p-1.5 rounded-lg bg-muted/60">
                  {hasTab('observations') && <TabsTrigger value="observations"    className="w-full justify-start text-sm px-3 py-2">Observations</TabsTrigger>}
                  {hasTab('incidents') && <TabsTrigger value="incidents"          className="w-full justify-start text-sm px-3 py-2">Incidents</TabsTrigger>}
                  {hasTab('inspections') && <TabsTrigger value="inspections"      className="w-full justify-start text-sm px-3 py-2">Inspections</TabsTrigger>}
                  {hasTab('meetings') && <TabsTrigger value="meetings"            className="w-full justify-start text-sm px-3 py-2">Meetings</TabsTrigger>}
                  {hasTab('service-quality') && <TabsTrigger value="service-quality" className="w-full justify-start text-sm px-3 py-2">Service Quality</TabsTrigger>}
                  {hasTab('ptw') && <TabsTrigger value="ptw"                      className="w-full justify-start text-sm px-3 py-2">Permit to Work</TabsTrigger>}
                  {hasTab('moc') && <TabsTrigger value="moc"                      className="w-full justify-start text-sm px-3 py-2">MOC / Exemptions</TabsTrigger>}
                  {hasTab('documents') && <TabsTrigger value="documents"          className="w-full justify-start text-sm px-3 py-2">Documents</TabsTrigger>}
                  {hasTab('reports') && <TabsTrigger value="reports"              className="w-full justify-start text-sm px-3 py-2">Reports</TabsTrigger>}
                  {hasTab('journey') && currentUser?.journeyAccess && <TabsTrigger value="journey" className="w-full justify-start text-sm px-3 py-2">Journey</TabsTrigger>}
                </TabsList>
              </div>{/* end flex row */}
            </Tabs>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 bg-card/30">
          <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                © 2024 XOM Oman. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <a href="#" className="transition-colors hover:text-foreground">Privacy Policy</a>
                <a href="#" className="transition-colors hover:text-foreground">Terms of Service</a>
                <a href="#" className="transition-colors hover:text-foreground">Support</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  )
}
