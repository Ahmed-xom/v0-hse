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
import { DocumentsLibrary } from "@/components/dashboard/documents-library"
import { BehaviourObservations } from "@/components/dashboard/behaviour-observations"
import { CoursesManagement } from "@/components/dashboard/courses-management"
import { TrainingRecords } from "@/components/dashboard/training-records"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { SectionDataToolbar } from "@/components/dashboard/section-data-toolbar"
import { DashboardNavigation } from "@/components/dashboard/dashboard-navigation"
import { ArrowUpRight, BarChart3, Building2, FileText, ShieldAlert, Users } from "lucide-react"

export default function HSEDashboard() {
  const { activeCompanyId, user } = useAuth()
  const canImport = ["MASTER USER", "ADMIN SYSTEM", "ADMIN", "HSE ADMIN"].includes(String(user?.role ?? "").toUpperCase())

  return (
    <ProtectedRoute>
      <div key={activeCompanyId ?? "company-xom-llc"} className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex items-start">
          <DashboardNavigation />
          <main className="min-w-0 flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <section id="dashboard-overview" className="rounded-xl border border-border bg-card p-6 shadow-sm" aria-label="Dashboard overview">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">Operations workspace</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">AMNKO HSE control center</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Move directly to the records, people, and compliance tools that keep your safety program moving.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[ ["Performance", "kpi-cards", BarChart3], ["Incidents", "incidents", ShieldAlert], ["Team Members", "team-members", Users], ["Library", "document-library", FileText] ].map(([label, id, Icon]) => (
                  <a key={id as string} href={`#${id}`} className="group flex min-w-24 flex-col gap-3 rounded-lg border border-border bg-background p-3 text-sm transition-colors hover:border-primary/50 hover:bg-accent">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-medium">{label as string}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                ))}
              </div>
            </div>
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
