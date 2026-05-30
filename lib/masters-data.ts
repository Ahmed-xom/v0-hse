export interface MasterItem {
  id: string
  name: string
  description?: string
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
}

export interface MasterCategory {
  id: string
  name: string
  icon: string
  items: MasterSection[]
}

export interface MasterSection {
  id: string
  name: string
  description: string
  itemCount: number
}

export const masterCategories: MasterCategory[] = [
  {
    id: "general",
    name: "General Masters",
    icon: "settings",
    items: [
      { id: "company", name: "Company", description: "Manage company information and settings", itemCount: 1 },
      { id: "license-usage", name: "License Usage", description: "View and manage license allocations", itemCount: 12 },
      { id: "settings", name: "Settings", description: "General system settings", itemCount: 8 },
      { id: "subscription", name: "Subscription", description: "Manage subscription plans", itemCount: 3 },
      { id: "currency", name: "Currency", description: "Configure currencies for transactions", itemCount: 5 },
      { id: "client", name: "Client", description: "Manage client information", itemCount: 24 },
      { id: "business-unit", name: "Business Unit", description: "Configure business units", itemCount: 7 },
      { id: "departments", name: "Departments", description: "Manage organizational departments", itemCount: 15 },
      { id: "designations", name: "Designations", description: "Employee designation titles", itemCount: 32 },
      { id: "job-position", name: "Job Position", description: "Define job positions", itemCount: 28 },
      { id: "location", name: "Location", description: "Manage office and site locations", itemCount: 12 },
      { id: "employee", name: "Employee", description: "Employee master data", itemCount: 265 },
      { id: "roles", name: "Roles", description: "User roles and permissions", itemCount: 9 },
      { id: "users", name: "Users", description: "System user accounts", itemCount: 265 },
      { id: "monthly-report-header", name: "Monthly Report Summary Header", description: "Report header configuration", itemCount: 6 },
      { id: "monthly-report-detail", name: "Monthly Report Summary Detail", description: "Report detail settings", itemCount: 14 },
      { id: "frequency-report", name: "Frequency Report Settings", description: "Frequency-based reporting config", itemCount: 4 },
      { id: "email-router", name: "Email Router", description: "Email routing configuration", itemCount: 3 },
      { id: "search-engine", name: "Search Engine", description: "Search configuration settings", itemCount: 2 },
      { id: "sign-in-history", name: "Sign In History", description: "User login history tracking", itemCount: 1250 },
      { id: "dashboard-targets", name: "Dashboard Targets", description: "KPI target configurations", itemCount: 12 },
      { id: "lagging-indicator", name: "Lagging Indicator LTI", description: "Lost Time Injury indicators", itemCount: 8 },
      { id: "parameter-settings", name: "Parameter Settings", description: "System parameters", itemCount: 15 },
      { id: "ticker-message", name: "Ticker Message", description: "Dashboard ticker messages", itemCount: 3 },
      { id: "reviewer-approver", name: "Reviewer/Approver", description: "Approval workflow settings", itemCount: 18 },
      { id: "password-setting", name: "Password Setting", description: "Password policy configuration", itemCount: 1 },
      { id: "insights-threshold", name: "Insights Threshold Settings", description: "Analytics threshold config", itemCount: 6 },
      { id: "team-lead", name: "Team Lead", description: "Team leadership assignments", itemCount: 22 },
    ]
  },
  {
    id: "hse",
    name: "HSE Masters",
    icon: "shield",
    items: [
      { id: "work-area", name: "WorkArea", description: "Define work areas for safety tracking", itemCount: 18 },
      { id: "contractors", name: "Contractors", description: "Contractor company information", itemCount: 34 },
      { id: "incident-type", name: "Incident Type", description: "Types of safety incidents", itemCount: 12 },
      { id: "number-of-people", name: "Number of People", description: "Personnel count categories", itemCount: 6 },
      { id: "frequency-of-activity", name: "Frequency Of Activity", description: "Activity frequency definitions", itemCount: 5 },
      { id: "probability", name: "Probability", description: "Risk probability levels", itemCount: 5 },
      { id: "actual-severity", name: "Actual Severity", description: "Severity classification", itemCount: 5 },
      { id: "hazard-category", name: "Hazard Category", description: "Hazard categorization", itemCount: 14 },
      { id: "activity-type", name: "Activity Type", description: "Work activity types", itemCount: 22 },
      { id: "potential-severity", name: "Potential Severity", description: "Potential severity levels", itemCount: 5 },
      { id: "outcome", name: "Outcome", description: "Incident outcome types", itemCount: 8 },
      { id: "damage", name: "Damage", description: "Damage categories", itemCount: 6 },
      { id: "road-condition", name: "Road Condition", description: "Road condition types", itemCount: 5 },
      { id: "weather-condition", name: "Weather Condition", description: "Weather condition categories", itemCount: 6 },
      { id: "site", name: "Site", description: "Work site locations", itemCount: 28 },
      { id: "impact", name: "Impact", description: "Impact assessment levels", itemCount: 5 },
      { id: "vehicle-details", name: "Vehicle Details", description: "Vehicle information", itemCount: 45 },
      { id: "asset-category", name: "Asset Category", description: "Asset categorization", itemCount: 8 },
      { id: "asset", name: "Asset", description: "Company assets", itemCount: 156 },
      { id: "substandard-acts", name: "Substandard Acts", description: "Unsafe act classifications", itemCount: 18 },
      { id: "substandard-condition", name: "Substandard Condition", description: "Unsafe condition types", itemCount: 15 },
      { id: "type", name: "Type", description: "General type classifications", itemCount: 12 },
      { id: "sub-type", name: "Sub Type", description: "Sub-type classifications", itemCount: 24 },
      { id: "breach-of-lsr", name: "Breach of LSR", description: "Life Saving Rules breaches", itemCount: 12 },
      { id: "injury-body-part", name: "Injury Body Part", description: "Body part injury tracking", itemCount: 28 },
      { id: "kpi-tracking", name: "KPI Tracking", description: "KPI measurement settings", itemCount: 16 },
    ]
  },
  {
    id: "audit",
    name: "Audit Masters",
    icon: "clipboard-check",
    items: [
      { id: "audit-category-type", name: "Category Type", description: "Audit category classifications", itemCount: 8 },
      { id: "audit-subcategory-type", name: "SubCategory Type", description: "Audit subcategory classifications", itemCount: 24 },
    ]
  },
  {
    id: "inspection",
    name: "Inspection Masters",
    icon: "search",
    items: [
      { id: "inspection-category-type", name: "Category Type", description: "Inspection category types", itemCount: 5 },
      { id: "inspection-subcategory-type", name: "SubCategory Type", description: "Inspection subcategory types", itemCount: 23 },
    ]
  },
  {
    id: "meeting",
    name: "Meeting Masters",
    icon: "users",
    items: [
      { id: "meeting-type", name: "Meeting Type", description: "Types of meetings", itemCount: 6 },
      { id: "meeting-location", name: "Meeting Location", description: "Meeting venues", itemCount: 12 },
    ]
  },
  {
    id: "risk-matrix",
    name: "Risk Matrix",
    icon: "grid",
    items: [
      { id: "setup-risk-matrix", name: "Setup RiskMatrix", description: "Risk matrix configuration", itemCount: 1 },
    ]
  },
  {
    id: "training",
    name: "Training Masters",
    icon: "graduation-cap",
    items: [
      { id: "course-category", name: "Course Category", description: "Training course categories", itemCount: 8 },
      { id: "courses", name: "Courses", description: "Training courses", itemCount: 45 },
      { id: "institutes", name: "Institutes", description: "Training institutes", itemCount: 12 },
    ]
  },
  {
    id: "observation",
    name: "Observation Masters",
    icon: "eye",
    items: [
      { id: "business-observation-location", name: "Business Observation Location", description: "Observation locations", itemCount: 18 },
      { id: "position", name: "Position", description: "Observer positions", itemCount: 14 },
      { id: "observation-type", name: "Observation Type", description: "Types of observations", itemCount: 4 },
      { id: "observation-category", name: "Observation Category", description: "Observation categories", itemCount: 8 },
      { id: "observation-sub-category", name: "Observation Sub Category", description: "Observation subcategories", itemCount: 24 },
      { id: "observation-specific", name: "Observation Specific", description: "Specific observation items", itemCount: 56 },
    ]
  },
  {
    id: "action-item",
    name: "Action Item Masters",
    icon: "check-square",
    items: [
      { id: "action-item-type", name: "Action Item / Task Type", description: "Task type classifications", itemCount: 6 },
      { id: "action-item-priority", name: "Action Item / Task Priority", description: "Priority levels", itemCount: 4 },
      { id: "action-item-status", name: "Action Item / Task Status", description: "Status options", itemCount: 5 },
      { id: "action-item-root-cause", name: "Action Item / Task Possible Root Cause", description: "Root cause options", itemCount: 18 },
      { id: "task-source", name: "Task Source", description: "Task source definitions", itemCount: 8 },
    ]
  },
  {
    id: "operational-excellence",
    name: "Operational Excellence",
    icon: "award",
    items: [
      { id: "nc-affected-system", name: "NC Affected System", description: "Non-conformance affected systems", itemCount: 12 },
      { id: "nc-type", name: "NC Type", description: "Non-conformance types", itemCount: 8 },
      { id: "nc-possible-cause", name: "NC Possible Cause", description: "Possible cause options", itemCount: 15 },
      { id: "moc-area-affected", name: "MOC Area Affected", description: "Management of Change areas", itemCount: 10 },
      { id: "moc-category", name: "MOC Category", description: "MOC categories", itemCount: 6 },
    ]
  },
  {
    id: "risk-assessment",
    name: "Risk and Impact Assessment",
    icon: "alert-triangle",
    items: [
      { id: "ria-activity", name: "Activity", description: "Risk assessment activities", itemCount: 28 },
      { id: "ria-hazard", name: "Hazard", description: "Identified hazards", itemCount: 45 },
      { id: "ria-hazard-category", name: "Hazard Category", description: "Hazard categorization", itemCount: 12 },
    ]
  },
  {
    id: "jm-masters",
    name: "JM Masters",
    icon: "truck",
    items: [
      { id: "driver", name: "Driver", description: "Driver information", itemCount: 38 },
      { id: "jm-vehicle-detail", name: "Vehicle Detail", description: "Vehicle details for JM", itemCount: 42 },
      { id: "inspection-checklist", name: "Inspection Checklist", description: "JM inspection checklists", itemCount: 15 },
    ]
  },
]

export const getTotalMasterItems = () => {
  return masterCategories.reduce((total, category) => {
    return total + category.items.reduce((catTotal, item) => catTotal + item.itemCount, 0)
  }, 0)
}

export const getTotalSections = () => {
  return masterCategories.reduce((total, category) => total + category.items.length, 0)
}
