export type ObservationType = "Safe" | "Unsafe" | "At Risk"
export type Priority = "High" | "Medium" | "Low"
export type ObservationStatus = "Open" | "In Progress" | "Closed" | "Overdue"

export interface ActionItem {
  id: string
  type: string
  action: string
  actionParty: string
  approver: string
  priority: Priority
  raisedDate: string
  targetDate: string
  status: ObservationStatus
  attachments: string[]
}

export interface Observation {
  id: string
  date: string
  businessUnit: string
  observer: string
  observerEmail: string
  position: string
  location: string
  nearMiss: boolean
  description: string
  observationType: ObservationType
  category: string
  attachments: string[]
  correctiveActions: string
  actionItems: ActionItem[]
  status: ObservationStatus
  createdAt: string
}

export const observationCategories = [
  "Housekeeping",
  "PPE",
  "Tools & Equipment",
  "Procedures",
  "Environmental",
  "Ergonomics",
  "Chemical Handling",
  "Electrical Safety",
  "Fire Safety",
  "Working at Height",
  "Confined Space",
  "Lifting Operations",
  "Driving Safety",
  "Other",
]

export const positions = [
  "Operator",
  "Technician",
  "Supervisor",
  "Engineer",
  "Manager",
  "HSE Officer",
  "Contractor",
  "Visitor",
  "Other",
]

export const locations = [
  "Main Office",
  "Workshop",
  "Rig Site",
  "Well Site",
  "Warehouse",
  "Field Location",
  "Camp",
  "Transportation",
  "Other",
]

export const actionItemTypes = [
  "Corrective Action",
  "Preventive Action",
  "Training Required",
  "Equipment Repair",
  "Procedure Update",
  "Investigation",
  "Other",
]

// Sample observations data
export const observations: Observation[] = [
  {
    id: "OBS-001",
    date: "2024-01-15",
    businessUnit: "XOM Drilling System",
    observer: "Ahmed Mohammed Al-Balushi",
    observerEmail: "abalushi@xomoman.com",
    position: "HSE Officer",
    location: "Rig Site",
    nearMiss: false,
    description: "Worker observed wearing proper PPE including hard hat, safety glasses, and steel-toed boots while working near heavy equipment.",
    observationType: "Safe",
    category: "PPE",
    attachments: [],
    correctiveActions: "",
    actionItems: [],
    status: "Closed",
    createdAt: "2024-01-15T08:30:00Z",
  },
  {
    id: "OBS-002",
    date: "2024-01-16",
    businessUnit: "Falcon Oilfield Services",
    observer: "Salim Said Al-Harthi",
    observerEmail: "sharthi@xomoman.com",
    position: "Supervisor",
    location: "Workshop",
    nearMiss: true,
    description: "Oil spill observed near the equipment storage area. Floor was slippery and could have caused a fall.",
    observationType: "Unsafe",
    category: "Housekeeping",
    attachments: [],
    correctiveActions: "Area was immediately cleaned and absorbent materials were applied. Warning signs placed.",
    actionItems: [
      {
        id: "ACT-001",
        type: "Corrective Action",
        action: "Install drip trays under all equipment",
        actionParty: "Maintenance Team",
        approver: "HSE Manager",
        priority: "High",
        raisedDate: "2024-01-16",
        targetDate: "2024-01-20",
        status: "Closed",
        attachments: [],
      },
    ],
    status: "Closed",
    createdAt: "2024-01-16T10:15:00Z",
  },
  {
    id: "OBS-003",
    date: "2024-01-18",
    businessUnit: "XOM Well Maintenance",
    observer: "Mohammed Salem Al-Riyami",
    observerEmail: "mriyami@xomoman.com",
    position: "Technician",
    location: "Well Site",
    nearMiss: false,
    description: "Worker observed not wearing safety harness while working at height on scaffolding.",
    observationType: "Unsafe",
    category: "Working at Height",
    attachments: [],
    correctiveActions: "Worker was stopped immediately and provided with proper fall protection equipment. Toolbox talk conducted.",
    actionItems: [
      {
        id: "ACT-002",
        type: "Training Required",
        action: "Conduct working at height refresher training for all site workers",
        actionParty: "HSE Department",
        approver: "Site Manager",
        priority: "High",
        raisedDate: "2024-01-18",
        targetDate: "2024-01-25",
        status: "In Progress",
        attachments: [],
      },
      {
        id: "ACT-003",
        type: "Procedure Update",
        action: "Update working at height procedure to include mandatory buddy system",
        actionParty: "HSE Officer",
        approver: "HSE Manager",
        priority: "Medium",
        raisedDate: "2024-01-18",
        targetDate: "2024-02-01",
        status: "Open",
        attachments: [],
      },
    ],
    status: "In Progress",
    createdAt: "2024-01-18T14:45:00Z",
  },
]
