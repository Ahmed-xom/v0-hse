"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { IncidentManagement } from "@/components/dashboard/incident-management"
import { InspectionReports } from "@/components/dashboard/inspection-reports"
import { InspectionTypes } from "@/components/dashboard/inspection-types"
import { UsersManagement } from "@/components/dashboard/users-management"
import { BusinessUnits } from "@/components/dashboard/business-units"
import { CompanyManagement } from "@/components/dashboard/company-management"
import { DocumentsLibrary } from "@/components/dashboard/documents-library"
import { BehaviourObservations } from "@/components/dashboard/behaviour-observations"
import { CoursesManagement } from "@/components/dashboard/courses-management"
import { TrainingRecords } from "@/components/dashboard/training-records"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { SectionDataToolbar } from "@/components/dashboard/section-data-toolbar"
import { DashboardNavigation } from "@/components/dashboard/dashboard-navigation"
import { StorageUsage } from "@/components/dashboard/storage-usage"

export default function HSEDashboard() {
  const { activeCompanyId, user } = useAuth()
  const canImport = ["MASTER USER", "ADMIN SYSTEM", "ADMIN", "HSE ADMIN"].includes(String(user?.role ?? "").toUpperCase())

  return (
    <ProtectedRoute>
      <div key={activeCompanyId ?? "company-xom-llc"} className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex items-start">
          <DashboardNavigation />
          <main id="dashboard-home" className="min-w-0 flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <section id="dashboard-overview" className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">Operations workspace</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">AMNKO HSE control center</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Select an option from the list to open each HSE module.</p>
          </section>

          {/* Page Title */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">AMNKO HSE</h1>
            <p className="text-muted-foreground">
              Health, Safety & Environment performance overview
            </p>
          </div>

          {/* KPI Cards */}
          <section id="kpi-cards" aria-label="Key Performance Indicators">
            <DashboardOverview companyId={activeCompanyId} />
          </section>

          <StorageUsage />

          {/* Incident Management */}
          <section id="incidents" aria-label="Incident Management">
            <SectionDataToolbar section="Incidents" canImport={canImport} columns={["Reference No", "Title", "Type", "Severity", "Status", "Date", "Location", "Business Unit", "Description"]} />
            <IncidentManagement companyId={activeCompanyId} />
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

          {/* Company Document Library */}
          <section id="document-library" aria-label="Company Document Library">
            <div className="mb-3">
              <h2 className="text-xl font-semibold">Document Library</h2>
              <p className="text-sm text-muted-foreground">Files for the active company</p>
            </div>
            <DocumentsLibrary activeCompanyId={activeCompanyId} />
          </section>

          {/* Company Management */}
          <section id="company-management" aria-label="Company Management">
            <SectionDataToolbar section="Companies" canImport={canImport} columns={["Name", "Code", "Description", "Status"]} />
            <CompanyManagement />
          </section>
          </main>
        </div>

        {/* Footer */}
        <footer className="border-t border-border/50 bg-card/30">
          <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
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
