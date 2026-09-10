"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { IncidentStatistics } from "@/components/dashboard/incident-statistics"
import { IncidentManagement } from "@/components/dashboard/incident-management"
import { InspectionReports } from "@/components/dashboard/inspection-reports"
import { InspectionTypes } from "@/components/dashboard/inspection-types"
import { UsersManagement } from "@/components/dashboard/users-management"
import { BusinessUnits } from "@/components/dashboard/business-units"
import { CompanyManagement } from "@/components/dashboard/company-management"
import { BehaviourObservations } from "@/components/dashboard/behaviour-observations"
import { CoursesManagement } from "@/components/dashboard/courses-management"
import { TrainingRecords } from "@/components/dashboard/training-records"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { SectionDataToolbar } from "@/components/dashboard/section-data-toolbar"

export default function HSEDashboard() {
  const { activeCompanyId, user } = useAuth()
  const canImport = ["MASTER USER", "ADMIN SYSTEM", "ADMIN", "HSE ADMIN"].includes(String(user?.role ?? "").toUpperCase())

  return (
    <ProtectedRoute>
      <div key={activeCompanyId ?? "company-xom-llc"} className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          {/* Page Title */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">AMNKO HSE</h1>
            <p className="text-muted-foreground">
              Health, Safety & Environment performance overview
            </p>
          </div>

          {/* KPI Cards */}
          <section id="kpi-cards" aria-label="Key Performance Indicators">
            <KPICards />
          </section>

          {/* Incident Statistics */}
          <section id="incident-statistics" aria-label="Incident Statistics">
            <IncidentStatistics />
          </section>

          {/* Incident Management */}
          <section id="incidents" aria-label="Incident Management">
            <SectionDataToolbar section="Incidents" canImport={canImport} columns={["Reference No", "Title", "Type", "Severity", "Status", "Date", "Location", "Business Unit", "Description"]} />
            <IncidentManagement />
          </section>

          {/* Behaviour Observations */}
          <section id="behaviour-observations" aria-label="Behaviour Observations">
            <SectionDataToolbar section="Observations" canImport={canImport} columns={["Date", "Observer", "Location", "Category", "Description", "Action Required", "Status"]} />
            <BehaviourObservations />
          </section>

          {/* Inspection Reports */}
          <section id="inspection-reports" aria-label="Inspection Reports">
            <SectionDataToolbar section="Inspections" canImport={canImport} columns={["Reference No", "Inspection Type", "Date", "Location", "Inspector", "Status", "Findings"]} />
            <InspectionReports />
          </section>

          {/* Inspection Types */}
          <section id="inspection-types" aria-label="Inspection Types">
            <SectionDataToolbar section="Inspection Types" canImport={canImport} columns={["Name", "Description", "Frequency", "Status"]} />
            <InspectionTypes />
          </section>

          {/* Training Courses */}
          <section id="training-courses" aria-label="Training Courses">
            <SectionDataToolbar section="Training Courses" canImport={canImport} columns={["Course Name", "Description", "Category", "Validity", "Status"]} />
            <CoursesManagement />
          </section>

          {/* Training Records */}
          <section id="training-records" aria-label="Training Records">
            <SectionDataToolbar section="Training Records" canImport={canImport} columns={["Employee", "Course", "Completion Date", "Expiry Date", "Status"]} />
            <TrainingRecords />
          </section>

          {/* Team Members / Users */}
          <section id="team-members" aria-label="Team Members">
            <UsersManagement />
          </section>

          {/* Business Units */}
          <section id="business-units" aria-label="Business Units">
            <SectionDataToolbar section="Business Units" canImport={canImport} columns={["Name", "Code", "Description", "Manager", "Email", "Type", "Status"]} />
            <BusinessUnits />
          </section>

          {/* Company Management */}
          <section aria-label="Company Management">
            <SectionDataToolbar section="Companies" canImport={canImport} columns={["Name", "Code", "Description", "Status"]} />
            <CompanyManagement />
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 bg-card/30">
          <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                © 2024 AMNKO HSE. All rights reserved.
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
