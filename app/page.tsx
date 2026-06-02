"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { IncidentStatistics } from "@/components/dashboard/incident-statistics"
import { InspectionReports } from "@/components/dashboard/inspection-reports"
import { InspectionTypes } from "@/components/dashboard/inspection-types"
import { UsersManagement } from "@/components/dashboard/users-management"
import { BusinessUnits } from "@/components/dashboard/business-units"
import { BehaviourObservations } from "@/components/dashboard/behaviour-observations"
import { CoursesManagement } from "@/components/dashboard/courses-management"
import { TrainingRecords } from "@/components/dashboard/training-records"
import { ProtectedRoute } from "@/components/protected-route"

export default function HSEDashboard() {
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

          {/* Inspection Reports */}
          <section aria-label="Inspection Reports">
            <InspectionReports />
          </section>

          {/* Inspection Types */}
          <section aria-label="Inspection Types">
            <InspectionTypes />
          </section>

          {/* Training Courses */}
          <section aria-label="Training Courses">
            <CoursesManagement />
          </section>

          {/* Training Records */}
          <section aria-label="Training Records">
            <TrainingRecords />
          </section>

          {/* Team Members / Users */}
          <section aria-label="Team Members">
            <UsersManagement />
          </section>

          {/* Business Units */}
          <section aria-label="Business Units">
            <BusinessUnits />
          </section>
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
