export interface BusinessUnit {
  id: string
  name: string
  type: "Group" | "Business Unit"
  underName: string
  trainingCompliance: number | null
  equipmentCompliance: number | null
  email: string
  description: string
  createdAt: string
  createdBy: string
  status: "Active" | "Inactive"
}

export const businessUnitsData: BusinessUnit[] = [
  {
    id: "BU-001",
    name: "XOM Oman",
    type: "Group",
    underName: "Primary",
    trainingCompliance: null,
    equipmentCompliance: null,
    email: "ibusaid@xomoman.com",
    description: "Parent Group",
    createdAt: "12-Jul-2024 02:33:30 PM",
    createdBy: "SYSTEM ADMIN (SADMIN)",
    status: "Active"
  },
  {
    id: "BU-002",
    name: "XOM LLC HO",
    type: "Business Unit",
    underName: "XOM Oman",
    trainingCompliance: 85,
    equipmentCompliance: 92,
    email: "ibusaid@xomoman.com",
    description: "Head Office",
    createdAt: "13-Jul-2024 05:42:26 PM",
    createdBy: "SYSTEM ADMIN (SADMIN)",
    status: "Active"
  },
  {
    id: "BU-003",
    name: "XOM Drilling System",
    type: "Business Unit",
    underName: "XOM Oman",
    trainingCompliance: 78,
    equipmentCompliance: 88,
    email: "mnessal@xomoman.com;hfarsi@xom",
    description: "Directional Drilling, Measurement and Logging",
    createdAt: "13-Jul-2024 05:43:15 PM",
    createdBy: "SYSTEM ADMIN (SADMIN)",
    status: "Active"
  },
  {
    id: "BU-004",
    name: "Falcon Oilfield Services",
    type: "Business Unit",
    underName: "XOM Oman",
    trainingCompliance: 91,
    equipmentCompliance: 95,
    email: "ezaki@falconofs.com;soseni@falconi",
    description: "Electric Wireline Logging and Perforation",
    createdAt: "13-Jul-2024 05:44:20 PM",
    createdBy: "SYSTEM ADMIN (SADMIN)",
    status: "Active"
  },
  {
    id: "BU-005",
    name: "XOM Well Maintenance",
    type: "Business Unit",
    underName: "Not in Use",
    trainingCompliance: 82,
    equipmentCompliance: 79,
    email: "",
    description: "Slickline, Non-Corrosive Pumping and Wellhead Maintenance",
    createdAt: "13-Jul-2024 05:45:53 PM",
    createdBy: "SYSTEM ADMIN (SADMIN)",
    status: "Active"
  },
  {
    id: "BU-006",
    name: "XOM LLC",
    type: "Business Unit",
    underName: "XOM Oman",
    trainingCompliance: 88,
    equipmentCompliance: 90,
    email: "ibusaid@xomoman.com;mnessal@xo",
    description: "Finance, Human Resource, Supply Chain",
    createdAt: "13-Jul-2024 05:47:05 PM",
    createdBy: "SYSTEM ADMIN (SADMIN)",
    status: "Active"
  },
  {
    id: "BU-007",
    name: "Not Active",
    type: "Group",
    underName: "XOM Oman",
    trainingCompliance: null,
    equipmentCompliance: null,
    email: "",
    description: "Inactive Units Container",
    createdAt: "11-Aug-2025 04:45:37 PM",
    createdBy: "Syed Sadaat ADMIN (ADMIN)",
    status: "Inactive"
  }
]
