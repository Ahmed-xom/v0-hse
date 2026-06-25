"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { IncidentStatistics } from "@/components/dashboard/incident-statistics"
import { InspectionReports } from "@/components/dashboard/inspection-reports"
import { InspectionTypes } from "@/components/dashboard/inspection-types"
import { UsersManagementWithRefresh } from "@/components/dashboard/users-management-with-refresh"
import { BusinessUnits } from "@/components/dashboard/business-units"
import { BehaviourObservations } from "@/components/dashboard/behaviour-observations"
import { AdminSettings } from "@/components/dashboard/admin-settings"
import { TrainingMatrix } from "@/components/dashboard/training-matrix"
import { TrainingRecords } from "@/components/dashboard/training-records"
import { Reports } from "@/components/dashboard/reports"
import { ProtectedRoute } from "@/components/protected-route"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { isAdminRole, isReviewerRole } from "@/lib/auth-roles"

export default function HSEDashboard() {
  const { currentUser, isLoading } = useAuth()
  const isAdmin = isAdminRole(currentUser?.role ?? '', currentUser?.email ?? '')
  const isReviewer = !isAdmin && isReviewerRole(currentUser?.role ?? '')
  const [usersRefreshKey, setUsersRefreshKey] = useState(0)

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
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className="grid w-full max-w-lg grid-cols-3">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-6">
                {/* KPI Cards */}
                <section aria-label="Key Performance Indicators">
                  <KPICards />
                </section>

                {/* Incident Statistics */}
                <section aria-label="Incident Statistics">
                  <IncidentStatistics />
                </section>

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

              <TabsContent value="reports" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Reports</h2>
                  <p className="text-muted-foreground text-sm">HSE performance data, summaries, and exports</p>
                </div>
                <Reports />
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <AdminSettings onUserAdded={handleUserAdded} />
              </TabsContent>
            </Tabs>
          ) : isReviewer ? (
            /* ── Reviewer / Approver view ── */
            <Tabs defaultValue="observations" className="w-full">
              <TabsList className="grid w-full max-w-sm grid-cols-3">
                <TabsTrigger value="observations">Observations</TabsTrigger>
                <TabsTrigger value="inspections">Inspections</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>

              {/* All observations — read-only + export Excel */}
              <TabsContent value="observations" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">All Observations</h2>
                  <p className="text-sm text-muted-foreground">
                    View and export observations submitted by all employees.
                  </p>
                </div>
                <section aria-label="All Observations">
                  <BehaviourObservations viewAll />
                </section>
              </TabsContent>

              <TabsContent value="inspections" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Inspections</h2>
                  <p className="text-sm text-muted-foreground">View inspection reports and types.</p>
                </div>
                <section aria-label="Inspection Reports">
                  <InspectionReports />
                </section>
                <section aria-label="Inspection Types">
                  <InspectionTypes />
                </section>
              </TabsContent>

              <TabsContent value="reports" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Reports</h2>
                  <p className="text-sm text-muted-foreground">HSE performance summaries and exports.</p>
                </div>
                <section aria-label="Reports">
                  <Reports />
                </section>
              </TabsContent>
            </Tabs>
          ) : (
            /* ── Regular user view ── */
            <Tabs defaultValue="observations" className="w-full">
              <TabsList className="grid w-full max-w-sm grid-cols-3">
                <TabsTrigger value="observations">Observations</TabsTrigger>
                <TabsTrigger value="inspections">Inspections</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>

              {/* Observations — user can add and view only their own */}
              <TabsContent value="observations" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">My Observations</h2>
                  <p className="text-sm text-muted-foreground">Submit and track your behaviour-based safety observations.</p>
                </div>
                <section aria-label="Behaviour Observations">
                  <BehaviourObservations />
                </section>
              </TabsContent>

              {/* Inspections */}
              <TabsContent value="inspections" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Inspections</h2>
                  <p className="text-sm text-muted-foreground">View inspection reports and types.</p>
                </div>
                <section aria-label="Inspection Reports">
                  <InspectionReports />
                </section>
                <section aria-label="Inspection Types">
                  <InspectionTypes />
                </section>
              </TabsContent>

              {/* Reports */}
              <TabsContent value="reports" className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Reports</h2>
                  <p className="text-sm text-muted-foreground">HSE performance summaries and exports.</p>
                </div>
                <section aria-label="Reports">
                  <Reports />
                </section>
              </TabsContent>
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
