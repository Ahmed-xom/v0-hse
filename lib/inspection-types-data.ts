export interface InspectionType {
  id: string
  name: string
  description: string
  category: "safety" | "equipment" | "compliance" | "environmental" | "general"
}

export const inspectionTypes: InspectionType[] = [
  {
    id: "INSP-001",
    name: "Shop Grounding",
    description: "Electrical grounding inspection for workshop facilities",
    category: "equipment",
  },
  {
    id: "INSP-002",
    name: "Overhead Crane",
    description: "Safety inspection for overhead crane equipment and operations",
    category: "equipment",
  },
  {
    id: "INSP-003",
    name: "DFMS",
    description: "Conducted DFMS weekly inspection",
    category: "compliance",
  },
  {
    id: "INSP-004",
    name: "DFMS Inspection",
    description: "Drilling Fluid Management System inspection",
    category: "compliance",
  },
  {
    id: "INSP-005",
    name: "Bowties Review HSE Monitoring Plan",
    description: "Conducted Bowties as part of HSE Monitoring Plan",
    category: "compliance",
  },
  {
    id: "INSP-006",
    name: "Boots on Ground MD-Technical Director Visit",
    description: "Falcon Base Nizwa Management Visit Report - Purpose: Falcon MD & Technical Director visited to assess operational readiness, facility maintenance, HSE compliance, and workforce engagement. Scope: Facilities inspection (buildings, storage, utilities), Workshop review (equipment, tools, safety), Staff engagement (feedback collection)",
    category: "general",
  },
  {
    id: "INSP-007",
    name: "Falcon Road Safety Audit 2025",
    description: "June 2025 OPAL Audit gaps: Driving Policy update needed. No senior JM report reviews. Missing RAG review process. Biannual JM audits not done. Manlost drills overdue. IVMS checks not quarterly. No fatigue management tool.",
    category: "safety",
  },
  {
    id: "INSP-008",
    name: "BOG-HSE Manager Visit to Nizwa Base",
    description: "The HSE Manager conducted a site visit to Nizwa Base. Conducted a comprehensive walkaround inspection of the base facilities. Held an engagement session with the Falcon Team. Met with the Management Team. Delivered a presentation on SP 2000 requirements. Reviewed and discussed action items from the recent PDO Driving Audit.",
    category: "general",
  },
  {
    id: "INSP-009",
    name: "Slickline HSE Inspection",
    description: "Health, Safety and Environment inspection for Slickline operations",
    category: "safety",
  },
  {
    id: "INSP-010",
    name: "NCP Inspection",
    description: "Non-Conformance Prevention inspection",
    category: "compliance",
  },
  {
    id: "INSP-011",
    name: "WHM Site Inspection Checklist",
    description: "Wellhead Maintenance Inspection",
    category: "equipment",
  },
  {
    id: "INSP-012",
    name: "Forklift Daily Inspection",
    description: "Daily pre-operation inspection for forklift equipment",
    category: "equipment",
  },
  {
    id: "INSP-013",
    name: "Vehicle Checklist After Returning from Field",
    description: "Post-field vehicle condition and safety inspection",
    category: "equipment",
  },
  {
    id: "INSP-014",
    name: "Tyre Shop Safety Inspection",
    description: "Safety inspection for tyre shop operations and facilities",
    category: "safety",
  },
  {
    id: "INSP-015",
    name: "Severe Weather Preparation Inspection",
    description: "Inspection to ensure readiness for severe weather conditions",
    category: "environmental",
  },
  {
    id: "INSP-016",
    name: "Scaffold Inspection",
    description: "Safety inspection for scaffolding structures and equipment",
    category: "safety",
  },
  {
    id: "INSP-017",
    name: "Radioactive Source Transportation Inspection",
    description: "Compliance inspection for safe transportation of radioactive sources",
    category: "compliance",
  },
  {
    id: "INSP-018",
    name: "Pre-Mobilization Inspection",
    description: "Equipment and personnel readiness inspection before mobilization",
    category: "general",
  },
  {
    id: "INSP-019",
    name: "Pre-Hired Vehicle Inspection",
    description: "Vehicle condition inspection before hiring/rental",
    category: "equipment",
  },
  {
    id: "INSP-020",
    name: "PPE Inspection",
    description: "Personal Protective Equipment compliance and condition inspection",
    category: "safety",
  },
  {
    id: "INSP-021",
    name: "Management HSE Engagement Visit Inspection",
    description: "Management site visit for HSE engagement and oversight",
    category: "general",
  },
  {
    id: "INSP-022",
    name: "Ladder Inspection",
    description: "Safety inspection for ladders and climbing equipment",
    category: "safety",
  },
  {
    id: "INSP-023",
    name: "Full Body Harness Inspection",
    description: "Inspection of full body harness equipment for fall protection",
    category: "safety",
  },
]

export const categoryConfig: Record<InspectionType["category"], { label: string; color: string }> = {
  safety: { label: "Safety", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  equipment: { label: "Equipment", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  compliance: { label: "Compliance", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  environmental: { label: "Environmental", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  general: { label: "General", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
}
