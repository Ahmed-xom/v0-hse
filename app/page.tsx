"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { IncidentStatistics } from "@/components/dashboard/incident-statistics"
import { InspectionReports } from "@/components/dashboard/inspection-reports"
import { InspectionTypes } from "@/components/dashboard/inspection-types"
import { UsersManagement } from "@/components/dashboard/users-management"
import { BusinessUnits } from "@/components/dashboard/business-units"
import { BehaviourObservations } from "@/components/dashboard/behaviour-observations"
import { AdminSettings } from "@/components/dashboard/admin-settings"
import { ProtectedRoute } from "@/components/protected-route"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"

export default function HSEDashboard() {
  const { currentUser, isLoading } = useAuth()
  const isAdmin = currentUser?.email === "xom-it-admin@xomoman.com"

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
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-6">
                <section aria-label="Key Performance Indicators">
                  <KPICards />
                </section>

                <section aria-label="Incident Statistics">
                  <IncidentStatistics />
                </section>

                <section aria-label="Behaviour Observations">
                  <BehaviourObservations />
                </section>

                <section aria-label="Inspection Reports">
                  <InspectionReports />
                </section>

                <section aria-label="Inspection Types">
                  <InspectionTypes />
                </section>

                <section aria-label="Team Members">
                  <UsersManagement />
                </section>

                <section aria-label="Business Units">
                  <BusinessUnits />
                </section>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <AdminSettings />
              </TabsContent>
            </Tabs>
          ) : (
            <>
              <section aria-label="Key Performance Indicators">
                <KPICards />
              </section>

              <section aria-label="Incident Statistics">
                <IncidentStatistics />
              </section>

              <section aria-label="Behaviour Observations">
                <BehaviourObservations />
              </section>

              <section aria-label="Inspection Reports">
                <InspectionReports />
              </section>

              <section aria-label="Inspection Types">
                <InspectionTypes />
              </section>

              <section aria-label="Team Members">
                <UsersManagement />
              </section>

              <section aria-label="Business Units">
                <BusinessUnits />
              </section>
            </>
          )}
        </main>

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
