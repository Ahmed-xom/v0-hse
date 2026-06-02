export type TrainingStatus = "APPEAR" | "SCHEDULED" | "CANCELLED" | "NO SHOW"
export type TrainingResult = "PASSED" | "FAILED" | "PENDING" | "INCOMPLETE"

export interface TrainingRecord {
  id: string
  employeeName: string
  employeeId: string
  courseName: string
  courseCode: string
  status: TrainingStatus
  result: TrainingResult
  completedDate: string
  expiryDate?: string
  certificateNo?: string
  instructor?: string
  location?: string
  score?: number
}

// Sample training records from the provided data
export const trainingRecords: TrainingRecord[] = [
  { id: "TR-001", employeeName: "Abdullah Said Salim Al Hinai", employeeId: "L-FWM-0050", courseName: "HSE Induction", courseCode: "OPAL HSEI", status: "APPEAR", result: "PASSED", completedDate: "1994-11-17", expiryDate: "2025-11-17" },
  { id: "TR-002", employeeName: "Gibi John", employeeId: "E-FWM-0104", courseName: "HSE Induction", courseCode: "OPAL HSEI", status: "APPEAR", result: "PASSED", completedDate: "1997-03-12", expiryDate: "2025-03-12" },
  { id: "TR-003", employeeName: "Fouad Ibrahim", employeeId: "E-SHE-0001", courseName: "HSE Induction", courseCode: "OPAL HSEI", status: "APPEAR", result: "PASSED", completedDate: "2003-01-09", expiryDate: "2025-01-09" },
  { id: "TR-004", employeeName: "Hashil Humaid Mohammed Amri", employeeId: "L-FWM-0067", courseName: "Defensive Driving Graded Road", courseCode: "OPAL GR", status: "APPEAR", result: "PASSED", completedDate: "2003-02-15", expiryDate: "2026-02-15" },
  { id: "TR-005", employeeName: "Bati Al yaqoubi", employeeId: "L-HIRC-0001", courseName: "Pressure Level 1 (Legacy)", courseCode: "Pressure Level 1", status: "APPEAR", result: "PASSED", completedDate: "2003-04-13", expiryDate: "2025-04-13" },
  { id: "TR-006", employeeName: "Sultan Hamed Sultan Al Duree", employeeId: "L-FWM-0090", courseName: "HSE Induction", courseCode: "OPAL HSEI", status: "APPEAR", result: "PASSED", completedDate: "2003-07-17", expiryDate: "2025-07-17" },
  { id: "TR-007", employeeName: "Zahran Al Aufi", employeeId: "L-SHE-0001", courseName: "HSE Induction", courseCode: "OPAL HSEI", status: "APPEAR", result: "PASSED", completedDate: "2003-09-03", expiryDate: "2025-09-03" },
  { id: "TR-008", employeeName: "Mohamed Salim Al Sulaimani", employeeId: "L-HIR-0019", courseName: "HSE Induction", courseCode: "OPAL HSEI", status: "APPEAR", result: "PASSED", completedDate: "2003-10-20", expiryDate: "2025-10-20" },
  { id: "TR-009", employeeName: "Gibi John", employeeId: "E-FWM-0104", courseName: "Defensive Driving Graded Road", courseCode: "OPAL GR", status: "APPEAR", result: "PASSED", completedDate: "2004-04-22", expiryDate: "2026-04-22" },
  { id: "TR-010", employeeName: "Ali Mohamed Murad Al Bulushi", employeeId: "L-FWM-0058", courseName: "Defensive Driving Graded Road", courseCode: "OPAL GR", status: "APPEAR", result: "PASSED", completedDate: "2004-04-26", expiryDate: "2026-04-26" },
  { id: "TR-011", employeeName: "Bati Al yaqoubi", employeeId: "L-HIRC-0001", courseName: "Explosives Level 1", courseCode: "Explosives Level 1", status: "APPEAR", result: "PASSED", completedDate: "2004-08-13", expiryDate: "2025-08-13" },
  { id: "TR-012", employeeName: "Bati Al yaqoubi", employeeId: "L-HIRC-0001", courseName: "Radiation level 1", courseCode: "RA LV-1", status: "APPEAR", result: "PASSED", completedDate: "2004-08-15", expiryDate: "2025-08-15" },
  { id: "TR-013", employeeName: "Ali Abdullah Humaid Al Kalbani", employeeId: "L-FWM-0047", courseName: "Defensive Driving Graded Road", courseCode: "OPAL GR", status: "APPEAR", result: "PASSED", completedDate: "2004-10-06", expiryDate: "2026-10-06" },
  { id: "TR-014", employeeName: "Zahran Al Aufi", employeeId: "L-SHE-0001", courseName: "PCE 10k H2S pressure control school (Wireline)", courseCode: "PCE 10K WL ops", status: "APPEAR", result: "PASSED", completedDate: "2005-01-01", expiryDate: "2026-01-01" },
  { id: "TR-015", employeeName: "Fouad Ibrahim", employeeId: "E-SHE-0001", courseName: "PCE 10k H2S pressure control school (Wireline)", courseCode: "PCE 10K WL ops", status: "APPEAR", result: "PASSED", completedDate: "2005-01-01", expiryDate: "2026-01-01" },
  { id: "TR-016", employeeName: "Zahran Al Aufi", employeeId: "L-SHE-0001", courseName: "Radiation level 1", courseCode: "RA LV-1", status: "APPEAR", result: "PASSED", completedDate: "2005-01-01", expiryDate: "2026-01-01" },
  { id: "TR-017", employeeName: "Khalid Said Al Abri", employeeId: "L-NSE-0025", courseName: "HSE Induction", courseCode: "OPAL HSEI", status: "APPEAR", result: "PASSED", completedDate: "2005-08-13", expiryDate: "2025-08-13" },
  { id: "TR-018", employeeName: "Waleed Saleem Thaleth Al Omairi", employeeId: "L-FWM-0112", courseName: "Defensive Driving Graded Road", courseCode: "OPAL GR", status: "APPEAR", result: "PASSED", completedDate: "2005-09-05", expiryDate: "2026-09-05" },
  { id: "TR-019", employeeName: "Sayed Sadaqat", employeeId: "L-NSE-000", courseName: "Hazard Identification Level 1", courseCode: "Hazard Identification L-1", status: "APPEAR", result: "PASSED", completedDate: "2006-01-23", expiryDate: "2026-01-23" },
  { id: "TR-020", employeeName: "Mohamed Salim Al Sulaimani", employeeId: "L-HIR-0019", courseName: "Defensive Driving Graded Road", courseCode: "OPAL GR", status: "APPEAR", result: "PASSED", completedDate: "2006-01-23", expiryDate: "2026-01-23" },
  { id: "TR-021", employeeName: "Sayed Sadaqat", employeeId: "L-NSE-000", courseName: "Electrical Safety Level 1", courseCode: "Elec Safety L-1", status: "APPEAR", result: "PASSED", completedDate: "2006-01-23", expiryDate: "2026-01-23" },
  { id: "TR-022", employeeName: "Yaqoob Awadh Salim Al Hinai", employeeId: "L-FWM-0091", courseName: "Defensive Driving Graded Road", courseCode: "OPAL GR", status: "APPEAR", result: "PASSED", completedDate: "2006-02-26", expiryDate: "2026-02-26" },
  { id: "TR-023", employeeName: "Khalid Zahran Busaidi", employeeId: "L-FDS-0002", courseName: "HSE Induction", courseCode: "OPAL HSEI", status: "APPEAR", result: "PASSED", completedDate: "2006-04-11", expiryDate: "2025-04-11" },
  { id: "TR-024", employeeName: "Arunangshu Banerjee", employeeId: "E-NSE-0004", courseName: "HSE Induction", courseCode: "OPAL HSEI", status: "APPEAR", result: "PASSED", completedDate: "2006-04-15", expiryDate: "2025-04-15" },
  { id: "TR-025", employeeName: "Hamed Salim Hamed Al Madhoushi", employeeId: "L-FWM-0093", courseName: "Defensive Driving Graded Road", courseCode: "OPAL GR", status: "APPEAR", result: "PASSED", completedDate: "2006-04-23", expiryDate: "2026-04-23" },
  { id: "TR-026", employeeName: "Saif Said Nasser Al Rashdi", employeeId: "L-FWM-0036", courseName: "Defensive Driving Graded Road", courseCode: "OPAL GR", status: "APPEAR", result: "PASSED", completedDate: "2006-06-09", expiryDate: "2026-06-09" },
  { id: "TR-027", employeeName: "Saif Said Nasser Al Rashdi", employeeId: "L-FWM-0036", courseName: "HSE Induction", courseCode: "OPAL HSEI", status: "APPEAR", result: "PASSED", completedDate: "2006-07-14", expiryDate: "2025-07-14" },
  { id: "TR-028", employeeName: "Humid Mubarak Humid Al Jabri", employeeId: "L-FWM-0029", courseName: "Defensive Driving Graded Road", courseCode: "OPAL GR", status: "APPEAR", result: "PASSED", completedDate: "2006-08-03", expiryDate: "2026-08-03" },
  { id: "TR-029", employeeName: "Ahmed Al Hashmi", employeeId: "L-NSE-0004", courseName: "PCE 10K maintenance school", courseCode: "PCE 10K maintenance", status: "APPEAR", result: "PASSED", completedDate: "2006-08-29", expiryDate: "2026-08-29" },
  { id: "TR-030", employeeName: "Sayed Kamal", employeeId: "E-NSE-0003", courseName: "PCE 10K maintenance school", courseCode: "PCE 10K maintenance", status: "APPEAR", result: "PASSED", completedDate: "2006-08-29", expiryDate: "2026-08-29" },
  // More recent records
  { id: "TR-031", employeeName: "Mohammed Said Al Hinai", employeeId: "L-FWM-0078", courseName: "HSE Induction", courseCode: "OPAL HSEI", status: "APPEAR", result: "PASSED", completedDate: "2024-06-15", expiryDate: "2026-06-15" },
  { id: "TR-032", employeeName: "Ahmed Al Rashdi", employeeId: "L-HIR-0021", courseName: "Defensive Driving Graded Road", courseCode: "OPAL GR", status: "APPEAR", result: "PASSED", completedDate: "2024-07-20", expiryDate: "2027-07-20" },
  { id: "TR-033", employeeName: "Khalid Al Busaidi", employeeId: "L-FDS-0016", courseName: "First Aid, CPR & AED", courseCode: "OPAL FA", status: "APPEAR", result: "PASSED", completedDate: "2024-08-05", expiryDate: "2026-08-05" },
  { id: "TR-034", employeeName: "Sultan Al Maamari", employeeId: "L-FWM-0044", courseName: "H2S & SO2 Awareness and Escape", courseCode: "OPAL H2S", status: "APPEAR", result: "PASSED", completedDate: "2024-09-10", expiryDate: "2026-09-10" },
  { id: "TR-035", employeeName: "Nasser Al Harrasi", employeeId: "L-NSE-0079", courseName: "HSE Dropped Object Prevention", courseCode: "HSE DROPS", status: "APPEAR", result: "PASSED", completedDate: "2024-10-18", expiryDate: "2026-10-18" },
  { id: "TR-036", employeeName: "Yahya Al Busaidi", employeeId: "L-NSE-0196", courseName: "Radiation level 1", courseCode: "RA LV-1", status: "APPEAR", result: "PASSED", completedDate: "2024-11-22", expiryDate: "2026-11-22" },
  { id: "TR-037", employeeName: "Rashid Al Sawafi", employeeId: "L-NSE-0093", courseName: "Fire Warden Training", courseCode: "OPAL FW", status: "APPEAR", result: "PASSED", completedDate: "2024-12-01", expiryDate: "2026-12-01" },
  { id: "TR-038", employeeName: "Ishaq Al Afeefi", employeeId: "L-NSE-0110", courseName: "Manual Handling", courseCode: "MH", status: "APPEAR", result: "PASSED", completedDate: "2025-01-08", expiryDate: "2026-07-08" },
  { id: "TR-039", employeeName: "Ahmed Al Qamshooey", employeeId: "L-NSE-0176", courseName: "Working at Height", courseCode: "WAH", status: "APPEAR", result: "PASSED", completedDate: "2025-02-14", expiryDate: "2027-02-14" },
  { id: "TR-040", employeeName: "Sultan Al Alawi", employeeId: "L-NSE-0172", courseName: "Lifting Equipment Competent Person", courseCode: "LEC", status: "APPEAR", result: "PASSED", completedDate: "2025-03-20", expiryDate: "2028-03-20" },
  { id: "TR-041", employeeName: "Issa Al Amri", employeeId: "L-NSE-0174", courseName: "HSE OXY Basic Training", courseCode: "OXY-AHA", status: "APPEAR", result: "PASSED", completedDate: "2025-04-05", expiryDate: "2027-04-05" },
  { id: "TR-042", employeeName: "Adil Al Riyami", employeeId: "L-NSE-0178", courseName: "Rigging & Banksman", courseCode: "RNB", status: "APPEAR", result: "PASSED", completedDate: "2025-05-12", expiryDate: "2028-05-12" },
  { id: "TR-043", employeeName: "Hamed Al Kindi", employeeId: "L-NSE-0190", courseName: "Confined Space Entry", courseCode: "CSE", status: "APPEAR", result: "PASSED", completedDate: "2025-06-18", expiryDate: "2027-06-18" },
  { id: "TR-044", employeeName: "Salim Al Shaqsi", employeeId: "L-NSE-0183", courseName: "Scaffold Inspection", courseCode: "SI", status: "APPEAR", result: "PASSED", completedDate: "2025-06-25", expiryDate: "2027-06-25" },
  { id: "TR-045", employeeName: "Tariq Al Kalbani", employeeId: "L-NSE-0279", courseName: "IWCF Well Intervention Operations Level 3", courseCode: "IWCF L-3", status: "APPEAR", result: "PASSED", completedDate: "2025-07-01", expiryDate: "2027-07-01" },
  // Scheduled trainings
  { id: "TR-046", employeeName: "Mohammed Al Nasseri", employeeId: "L-FWM-0007", courseName: "HSE Induction Refresher", courseCode: "OPAL HSEI-R", status: "SCHEDULED", result: "PENDING", completedDate: "2025-07-15" },
  { id: "TR-047", employeeName: "Salim Al Mashaikhi", employeeId: "L-FWM-0095", courseName: "Defensive Driving Refresher", courseCode: "OPAL GR-R", status: "SCHEDULED", result: "PENDING", completedDate: "2025-07-20" },
  { id: "TR-048", employeeName: "Abdullah Al Waihibi", employeeId: "L-FWM-0022", courseName: "Emergency Response Training", courseCode: "ERT", status: "SCHEDULED", result: "PENDING", completedDate: "2025-08-01" },
  // Failed/Incomplete records
  { id: "TR-049", employeeName: "Ahmed Test Employee", employeeId: "L-TEST-001", courseName: "Defensive Driving Assessment", courseCode: "OPAL GR", status: "APPEAR", result: "FAILED", completedDate: "2025-05-10", score: 58 },
  { id: "TR-050", employeeName: "Test User Two", employeeId: "L-TEST-002", courseName: "HSE Knowledge Test", courseCode: "OPAL HSEI", status: "APPEAR", result: "INCOMPLETE", completedDate: "2025-06-01" },
]

// Course categories for filtering
export const courseCategories = [
  "HSE Induction",
  "Defensive Driving",
  "Radiation Safety",
  "Pressure Control",
  "First Aid",
  "Fire Safety",
  "Working at Height",
  "Lifting Operations",
  "Well Control",
  "Hazard Identification",
  "Environmental",
  "Other",
]

// Get unique employees from training records
export const getUniqueEmployees = () => {
  const uniqueMap = new Map<string, { name: string; id: string }>()
  trainingRecords.forEach((record) => {
    if (!uniqueMap.has(record.employeeId)) {
      uniqueMap.set(record.employeeId, { name: record.employeeName, id: record.employeeId })
    }
  })
  return Array.from(uniqueMap.values())
}

// Get training records by employee
export const getRecordsByEmployee = (employeeId: string) => {
  return trainingRecords.filter((record) => record.employeeId === employeeId)
}

// Get training records by course
export const getRecordsByCourse = (courseCode: string) => {
  return trainingRecords.filter((record) => record.courseCode === courseCode)
}
