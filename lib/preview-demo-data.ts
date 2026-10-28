export type DemoSection = {
  id: string
  title: string
  description: string
  columns: string[]
  rows: string[][]
}

export const demoSections: DemoSection[] = [
  { id: "incidents", title: "Incidents", description: "Incident reporting, investigation and corrective actions.", columns: ["Reference", "Title", "Severity", "Status"], rows: [["DEMO-INC-001", "Practice drill observation", "Low", "Closed"], ["DEMO-INC-002", "Simulated workshop near miss", "Low", "Under review"]] },
  { id: "behaviour-observations", title: "Observations", description: "Safe behaviours and improvement opportunities.", columns: ["Reference", "Observation", "Location", "Status"], rows: [["DEMO-OBS-001", "Correct protective equipment", "Demo site A", "Complete"], ["DEMO-OBS-002", "Improve walkway markings", "Demo workshop", "Open"]] },
  { id: "inspection-reports", title: "Inspection Reports", description: "Scheduled workplace inspections and findings.", columns: ["Reference", "Inspection", "Inspector", "Status"], rows: [["DEMO-INS-001", "Workshop safety walk", "Demo inspector", "Complete"], ["DEMO-INS-002", "Equipment checklist", "Demo inspector", "Scheduled"]] },
  { id: "inspection-types", title: "Inspection Types", description: "Inspection categories and review frequencies.", columns: ["Code", "Type", "Frequency", "Status"], rows: [["DEMO-TYPE-001", "Workplace safety", "Monthly", "Active"], ["DEMO-TYPE-002", "Emergency readiness", "Quarterly", "Active"]] },
  { id: "training-courses", title: "Training Courses", description: "Safety learning catalogue and certification validity.", columns: ["Code", "Course", "Validity", "Status"], rows: [["DEMO-CRS-001", "Safety induction", "12 months", "Active"], ["DEMO-CRS-002", "Emergency response", "24 months", "Active"]] },
  { id: "training-records", title: "Training Records", description: "Fictional completion records, not employee qualifications.", columns: ["Record", "Participant", "Course", "Status"], rows: [["DEMO-TRN-001", "Demo participant A", "Safety induction", "Complete"], ["DEMO-TRN-002", "Demo participant B", "Emergency response", "Scheduled"]] },
  { id: "team-members", title: "Team Members", description: "Fictional participants only. No payroll or personal information.", columns: ["Demo ID", "Display name", "Function", "Status"], rows: [["DEMO-TEAM-001", "Demo participant A", "Safety coordinator", "Demo only"], ["DEMO-TEAM-002", "Demo participant B", "Site supervisor", "Demo only"]] },
  { id: "business-units", title: "Business Units", description: "Example operating units for layout review.", columns: ["Code", "Business unit", "Type", "Status"], rows: [["DEMO-BU-001", "Demo operations", "Operations", "Active"], ["DEMO-BU-002", "Demo workshop", "Maintenance", "Active"]] },
  { id: "document-library", title: "Document Library", description: "Document inventory unavailable in safe demo mode. No authorized document inventory or files loaded.", columns: [], rows: [] },
  { id: "company-management", title: "Company Management", description: "Example company records without real customer details.", columns: ["Code", "Company", "Description", "Status"], rows: [["DEMO-CO-001", "Demo Company A", "Fictional organisation", "Demo only"], ["DEMO-CO-002", "Demo Company B", "Fictional organisation", "Demo only"]] },
  { id: "journey-tracker", title: "Journey Tracker", description: "Journey planning preview without real routes, people or attachments.", columns: ["Reference", "Journey", "Vehicle", "Status"], rows: [["DEMO-JM-001", "Demo site A to demo site B", "Demo vehicle A", "Planned"], ["DEMO-JM-002", "Demo workshop to demo depot", "Demo vehicle B", "Complete"]] },
  { id: "meetings", title: "Meetings", description: "Example safety meetings. Invitations and reminders are disabled.", columns: ["Reference", "Meeting", "Participants", "Status"], rows: [["DEMO-MTG-001", "Sample toolbox talk", "Demo team", "Scheduled"], ["DEMO-MTG-002", "Sample safety review", "Demo team", "Complete"]] },
  { id: "reports", title: "Reports", description: "Illustrative reporting catalogue, not live performance results.", columns: ["Reference", "Report", "Period", "Access"], rows: [["DEMO-RPT-001", "Sample safety summary", "Demo period", "View only"], ["DEMO-RPT-002", "Sample training summary", "Demo period", "View only"]] },
  { id: "ticket-invoice-tracker", title: "Ticket & Invoice Tracker", description: "Fictional tracker records; no financial information or real invoices.", columns: ["Reference", "Description", "Category", "Status"], rows: [["DEMO-TKT-001", "Example support request", "Demo ticket", "Open"], ["DEMO-INV-001", "Illustrative invoice record", "Demo invoice", "No payment available"]] },
]

export const demoPageTitles: Record<string, string> = {
  "/": "Operations workspace",
  "/journey-tracker": "Journey Tracker",
  "/profile": "Profile",
  "/settings": "Master Settings",
  "/admin/amnko-library": "AMNKO Library",
  "/admin/amnko-attachments": "AMNKO Attachments",
  "/admin/data-migration": "Data Migration Preview",
  "/admin/database-migration": "Database Migration",
  "/sign-in": "Sign-in design preview",
  "/forgot-password": "Password recovery design preview",
  "/reset-password": "Password reset design preview",
  "/login-help": "Login help",
}

export function demoSectionsForPage(view: string): DemoSection[] {
  if (view === "/") return demoSections
  if (view === "/journey-tracker") return demoSections.filter(section => section.id === "journey-tracker")
  if (view === "/admin/amnko-library" || view === "/admin/amnko-attachments") return demoSections.filter(section => section.id === "document-library")
  if (view === "/profile") return demoSections.filter(section => section.id === "team-members")
  if (view === "/settings") return [{ id: "master-settings", title: "Master Settings", description: "Read-only configuration examples. No real permissions are loaded or changed.", columns: ["Category", "Setting", "Example", "Mode"], rows: [["Company", "Default workspace", "Demo Company A", "Read-only"], ["Access", "Demo role configuration", "Not loaded", "Protected"], ["Training", "Reminder interval", "30 demo days", "Read-only"]] }]
  return []
}
