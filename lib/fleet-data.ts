export type VehicleStatus = "Active" | "Expiring Soon" | "Expired" | "Cancelled"

export type VehicleType = 
  | "Fuso Truck with Crane"
  | "Mitsubishi Fuso 10 ton"
  | "Mitsibishi Canter"
  | "Mercedez logging unit"
  | "Mistubishi Fuso HAIB 10 ton"
  | "Hino 10 Ton"
  | "Toyota Hilux"
  | "Pick Up"
  | "Third Party Heavy Vehicle"
  | "Crew Bus"

export interface JourneyManagement {
  id: string
  vehicleId: string
  journeyDate: string
  driver: string
  startLocation: string
  endLocation: string
  purpose: string
  startKm: string
  endKm: string
  distanceTraveled: string
  departureTime: string
  arrivalTime: string
  approvedBy: string
  status: "Pending" | "Approved" | "In Progress" | "Completed" | "Cancelled"
  passengers?: string
  remarks?: string
}

export interface Vehicle {
  id: string
  registrationNo: string
  vehicleType: string
  expiryDate: string
  allowableLoad: string
  kmReading: string
  description: string
  status: VehicleStatus
  jmEnabled?: boolean
  lastJourneyDate?: string
  totalJourneys?: number
}

// Helper to determine status based on expiry date and registration
function getVehicleStatus(registrationNo: string, expiryDate: string): VehicleStatus {
  if (registrationNo.includes("(CANCEL)")) return "Cancelled"
  
  const expiry = new Date(expiryDate)
  const today = new Date()
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(today.getDate() + 30)
  
  if (expiry < today) return "Expired"
  if (expiry <= thirtyDaysFromNow) return "Expiring Soon"
  return "Active"
}

export const vehicleTypes = [
  "Fuso Truck with Crane",
  "Mitsubishi Fuso 10 ton",
  "Mitsibishi Canter",
  "Mercedez logging unit",
  "Mistubishi Fuso HAIB 10 ton",
  "Hino 10 Ton",
  "Toyota Hilux",
  "Pick Up",
  "Third Party Heavy Vehicle",
  "Crew Bus",
]

export const vehicles: Vehicle[] = [
  { id: "1", registrationNo: "9250YW(CANCEL)", vehicleType: "Fuso Truck with Crane", expiryDate: "2026-02-26", allowableLoad: "10 ton", kmReading: "248905", description: "Fuso Truck with Crane FOFS-29", status: "Cancelled", jmEnabled: false, totalJourneys: 0 },
  { id: "2", registrationNo: "971YR(CANCEL)", vehicleType: "Mitsubishi Fuso 10 ton", expiryDate: "2026-01-28", allowableLoad: "10 ton", kmReading: "502334", description: "Mitsubishi Fuso 10 ton FOFS-18", status: "Cancelled", jmEnabled: false, totalJourneys: 0 },
  { id: "3", registrationNo: "7668BA(CANCEL)", vehicleType: "Mitsibishi Canter", expiryDate: "2026-06-22", allowableLoad: "3 ton", kmReading: "137555", description: "Mitsibishi CanterFOFS-31", status: "Cancelled", jmEnabled: false, totalJourneys: 0 },
  { id: "4", registrationNo: "718YM(CANCEL)", vehicleType: "Mitsibishi Canter", expiryDate: "2026-06-22", allowableLoad: "3 ton", kmReading: "472890", description: "Mitsibishi CanterFOFS-26", status: "Cancelled", jmEnabled: false, totalJourneys: 0 },
  { id: "5", registrationNo: "1241RK(CANCEL)", vehicleType: "Mitsibishi Canter", expiryDate: "2026-04-21", allowableLoad: "3 ton", kmReading: "430310", description: "Mitsibishi Canter FOFS-19", status: "Cancelled", jmEnabled: false, totalJourneys: 0 },
  { id: "6", registrationNo: "4168 ML", vehicleType: "Mercedez logging unit", expiryDate: "2026-07-24", allowableLoad: "25 ton", kmReading: "17439 hrs", description: "Mercedez logging unit BAZ-16 (Rental)", status: "Active", jmEnabled: true, lastJourneyDate: "2025-07-01", totalJourneys: 145 },
  { id: "7", registrationNo: "6854 MK", vehicleType: "Mercedez logging unit", expiryDate: "2026-10-14", allowableLoad: "25 ton", kmReading: "150 hrs", description: "Mercedez logging unit BAZ-15", status: "Active", jmEnabled: true, lastJourneyDate: "2025-07-02", totalJourneys: 12 },
  { id: "8", registrationNo: "1792 YM", vehicleType: "Mercedez logging unit", expiryDate: "2026-10-14", allowableLoad: "25 ton", kmReading: "434 hrs", description: "Mercedez logging unit BAZ-14", status: "Active", jmEnabled: true, lastJourneyDate: "2025-06-28", totalJourneys: 34 },
  { id: "9", registrationNo: "2080 ML", vehicleType: "Mercedez logging unit", expiryDate: "2026-09-03", allowableLoad: "25 ton", kmReading: "36953 hrs", description: "Mercedez logging unit BAZ-13", status: "Active", jmEnabled: true, lastJourneyDate: "2025-07-01", totalJourneys: 289 },
  { id: "10", registrationNo: "9993 WB", vehicleType: "Mercedez logging unit", expiryDate: "2027-01-23", allowableLoad: "25 ton", kmReading: "18661 hrs", description: "Mercedez logging unit BAZ-12", status: "Active", jmEnabled: true, lastJourneyDate: "2025-06-30", totalJourneys: 167 },
  { id: "11", registrationNo: "9500 WB", vehicleType: "Mercedez logging unit", expiryDate: "2027-01-15", allowableLoad: "25 ton", kmReading: "20972 hrs", description: "Mercedez logging unit BAZ-11", status: "Active", jmEnabled: true, lastJourneyDate: "2025-07-02", totalJourneys: 178 },
  { id: "12", registrationNo: "8918 WB", vehicleType: "Mercedez logging unit", expiryDate: "2027-01-15", allowableLoad: "25 ton", kmReading: "21788 hrs", description: "Mercedez logging unit BAZ-09", status: "Active", jmEnabled: true, lastJourneyDate: "2025-06-29", totalJourneys: 192 },
  { id: "13", registrationNo: "2868 WB", vehicleType: "Mercedez logging unit", expiryDate: "2026-08-22", allowableLoad: "25 ton", kmReading: "24776 hrs", description: "Mercedez logging unit BAZ-08", status: "Active", jmEnabled: true, lastJourneyDate: "2025-07-01", totalJourneys: 215 },
  { id: "14", registrationNo: "2895 HM", vehicleType: "Mercedez logging unit", expiryDate: "2026-08-22", allowableLoad: "25 ton", kmReading: "17179 hrs", description: "Mercedez logging unit BAZ-07", status: "Active", jmEnabled: true, lastJourneyDate: "2025-06-25", totalJourneys: 156 },
  { id: "15", registrationNo: "1976 YD", vehicleType: "Mercedez logging unit", expiryDate: "2026-06-14", allowableLoad: "25 ton", kmReading: "21453 hrs", description: "Mercedez logging unit BAZ-06", status: "Active", jmEnabled: true, lastJourneyDate: "2025-07-02", totalJourneys: 189 },
  { id: "16", registrationNo: "6213 BK", vehicleType: "Mercedez logging unit", expiryDate: "2027-01-10", allowableLoad: "25 ton", kmReading: "5094 hrs", description: "Mercedez logging unit BAZ-03", status: "Active", jmEnabled: true, lastJourneyDate: "2025-06-28", totalJourneys: 45 },
  { id: "17", registrationNo: "418 MH", vehicleType: "Mistubishi Fuso HAIB 10 ton", expiryDate: "2026-10-21", allowableLoad: "10 ton", kmReading: "24038", description: "Mistubishi Fuso HAIB 10-ton FOFS-51", status: "Active", jmEnabled: true, lastJourneyDate: "2025-07-01", totalJourneys: 67 },
  { id: "18", registrationNo: "264 BK", vehicleType: "Mistubishi Fuso HAIB 10 ton", expiryDate: "2026-10-21", allowableLoad: "10 ton", kmReading: "12275", description: "Mistubishi Fuso HAIB 10-ton FOFS-50", status: "Active", jmEnabled: true, lastJourneyDate: "2025-06-30", totalJourneys: 34 },
  { id: "19", registrationNo: "5530 YR", vehicleType: "Mistubishi Fuso HAIB 10 ton", expiryDate: "2026-10-21", allowableLoad: "10 ton", kmReading: "11075", description: "Mistubishi Fuso HAIB 10-ton FOFS-49", status: "Active", jmEnabled: true, lastJourneyDate: "2025-07-02", totalJourneys: 28 },
  { id: "20", registrationNo: "6822 MK", vehicleType: "Mistubishi Fuso HAIB 10 ton", expiryDate: "2026-10-21", allowableLoad: "10 ton", kmReading: "26240", description: "Mistubishi Fuso HAIB 10-ton FOFS-48", status: "Active", jmEnabled: true, lastJourneyDate: "2025-06-28", totalJourneys: 72 },
  { id: "21", registrationNo: "4300 MA", vehicleType: "Mistubishi Fuso HAIB 10 ton", expiryDate: "2026-10-21", allowableLoad: "10 ton", kmReading: "24480", description: "Mistubishi Fuso HAIB 10-ton FOFS-47", status: "Active", jmEnabled: true, lastJourneyDate: "2025-07-01", totalJourneys: 68 },
  { id: "22", registrationNo: "9654 WK", vehicleType: "Fuso Truck with Crane", expiryDate: "2027-02-26", allowableLoad: "10 ton", kmReading: "331839", description: "Fuso Truck with Crane FOFS-30", status: "Active", jmEnabled: true, lastJourneyDate: "2025-07-02", totalJourneys: 412 },
  { id: "23", registrationNo: "5434 BA", vehicleType: "Mitsubishi Fuso 10 ton", expiryDate: "2027-01-28", allowableLoad: "10 ton", kmReading: "488060", description: "Mitsubishi Fuso 10 ton FOFS-28", status: "Active", jmEnabled: true, lastJourneyDate: "2025-06-29", totalJourneys: 523 },
  { id: "24", registrationNo: "9531 DS", vehicleType: "Mitsubishi Fuso 10 ton", expiryDate: "2026-07-09", allowableLoad: "10 ton", kmReading: "561222", description: "Mitsubishi Fuso 10 ton FOFS-27", status: "Active", jmEnabled: true, lastJourneyDate: "2025-07-01", totalJourneys: 601 },
  { id: "25", registrationNo: "8195 WK", vehicleType: "Hino 10 Ton", expiryDate: "2026-09-05", allowableLoad: "10 ton", kmReading: "560174", description: "Hino 10 Ton FOFS-12", status: "Active", jmEnabled: true, lastJourneyDate: "2025-07-02", totalJourneys: 589 },
  { id: "26", registrationNo: "4217 YM", vehicleType: "Mitsibishi Canter", expiryDate: "2027-04-01", allowableLoad: "3 ton", kmReading: "411", description: "Mitsibishi Canter FOFS-53", status: "Active", jmEnabled: true, lastJourneyDate: "2025-06-30", totalJourneys: 8 },
  { id: "27", registrationNo: "7356 WA", vehicleType: "Mitsibishi Canter", expiryDate: "2027-04-01", allowableLoad: "3 ton", kmReading: "421", description: "Mitsibishi Canter FOFS-52", status: "Active", jmEnabled: true, lastJourneyDate: "2025-07-01", totalJourneys: 9 },
  { id: "28", registrationNo: "5143 HK", vehicleType: "Mitsibishi Canter", expiryDate: "2026-10-21", allowableLoad: "3 ton", kmReading: "18652", description: "Mitsibishi Canter FOFS-46", status: "Active", jmEnabled: true, lastJourneyDate: "2025-06-28", totalJourneys: 156 },
  { id: "29", registrationNo: "9597 YB", vehicleType: "Mitsibishi Canter", expiryDate: "2026-10-21", allowableLoad: "3 ton", kmReading: "9716", description: "Mitsibishi Canter FOFS-45", status: "Active", jmEnabled: true, lastJourneyDate: "2025-07-02", totalJourneys: 89 },
  { id: "30", registrationNo: "5498 ML", vehicleType: "Mitsibishi Canter", expiryDate: "2026-10-21", allowableLoad: "3 ton", kmReading: "20837", description: "Mitsibishi Canter FOFS-44", status: "Active", jmEnabled: true, lastJourneyDate: "2025-07-01", totalJourneys: 178 },
  { id: "31", registrationNo: "2615 DS", vehicleType: "Mitsibishi Canter", expiryDate: "2026-10-21", allowableLoad: "3 ton", kmReading: "18984", description: "Mitsibishi Canter FOFS-43", status: "Active", jmEnabled: true, lastJourneyDate: "2025-06-29", totalJourneys: 162 },
  { id: "32", registrationNo: "1650 YD", vehicleType: "Mitsibishi Canter", expiryDate: "2026-10-21", allowableLoad: "3 ton", kmReading: "14764", description: "Mitsibishi Canter FOFS-42", status: "Active", jmEnabled: true, lastJourneyDate: "2025-06-30", totalJourneys: 134 },
  { id: "33", registrationNo: "3167 YS", vehicleType: "Mitsibishi Canter", expiryDate: "2026-10-21", allowableLoad: "3 ton", kmReading: "15360", description: "Mitsibishi Canter FOFS-41", status: "Active", jmEnabled: true, lastJourneyDate: "2025-07-02", totalJourneys: 141 },
  { id: "34", registrationNo: "6732/MS", vehicleType: "Mitsibishi Canter", expiryDate: "2026-06-26", allowableLoad: "3 ton", kmReading: "78999", description: "Mitsibishi Canter FOFS-40", status: "Active", jmEnabled: true, lastJourneyDate: "2025-07-01", totalJourneys: 678 },
  { id: "35", registrationNo: "1595 MH", vehicleType: "Mitsibishi Canter", expiryDate: "2026-06-30", allowableLoad: "3 ton", kmReading: "144000", description: "Mitsibishi Canter FOFS-32", status: "Active", jmEnabled: true, lastJourneyDate: "2025-06-28", totalJourneys: 1234 },
  { id: "36", registrationNo: "1155 RK", vehicleType: "Toyota Hilux", expiryDate: "2026-06-08", allowableLoad: "1.5 ton", kmReading: "207232", description: "Toyota Hilux FOFS-39", status: "Active", jmEnabled: true, lastJourneyDate: "2025-07-02", totalJourneys: 892 },
  { id: "37", registrationNo: "7992 BA", vehicleType: "Toyota Hilux", expiryDate: "2026-06-08", allowableLoad: "1.5 ton", kmReading: "321501", description: "Toyota Hilux FOFS-38", status: "Active", jmEnabled: true, lastJourneyDate: "2025-07-01", totalJourneys: 1456 },
  { id: "38", registrationNo: "5412 MA", vehicleType: "Toyota Hilux", expiryDate: "2026-06-08", allowableLoad: "1.5 ton", kmReading: "254286", description: "Toyota Hilux FOFS-37", status: "Active", jmEnabled: true, lastJourneyDate: "2025-06-29", totalJourneys: 1123 },
  { id: "39", registrationNo: "1939-MS", vehicleType: "Toyota Hilux", expiryDate: "2026-06-08", allowableLoad: "1.5 ton", kmReading: "268000", description: "Toyota Hilux FOFS-36", status: "Active", jmEnabled: true, lastJourneyDate: "2025-06-30", totalJourneys: 1189 },
  { id: "40", registrationNo: "4818 MK", vehicleType: "Toyota Hilux", expiryDate: "2026-06-08", allowableLoad: "1.5 ton", kmReading: "303766", description: "Toyota Hilux FOFS-35", status: "Active", jmEnabled: true, lastJourneyDate: "2025-07-02", totalJourneys: 1345 },
  { id: "41", registrationNo: "3432 MH", vehicleType: "Toyota Hilux", expiryDate: "2026-07-15", allowableLoad: "1.5 ton", kmReading: "224562", description: "Toyota Hilux FOFS-34", status: "Active", jmEnabled: true, lastJourneyDate: "2025-06-28", totalJourneys: 978 },
  { id: "42", registrationNo: "417 MH", vehicleType: "Toyota Hilux", expiryDate: "2026-07-15", allowableLoad: "1.5 ton", kmReading: "207316", description: "Toyota Hilux FOFS-33", status: "Active", jmEnabled: true, lastJourneyDate: "2025-07-01", totalJourneys: 912 },
  { id: "43", registrationNo: "9908BM", vehicleType: "Pick Up", expiryDate: "2025-12-22", allowableLoad: "3000", kmReading: "30921", description: "", status: "Expired", jmEnabled: false, totalJourneys: 245 },
  { id: "44", registrationNo: "7226RK", vehicleType: "Pick Up", expiryDate: "2025-12-22", allowableLoad: "3000", kmReading: "40255", description: "RAS: RASIC1246/738", status: "Expired", jmEnabled: false, totalJourneys: 312 },
  { id: "45", registrationNo: "1718RH", vehicleType: "Pick Up", expiryDate: "2025-12-22", allowableLoad: "3000", kmReading: "41222", description: "RAS: RASIC1246/731", status: "Expired", jmEnabled: false, totalJourneys: 321 },
  { id: "46", registrationNo: "1069 HM", vehicleType: "Third Party Heavy Vehicle", expiryDate: "2025-10-31", allowableLoad: "26410 KG", kmReading: "765580 KM", description: "", status: "Expired", jmEnabled: false, totalJourneys: 1567 },
  { id: "47", registrationNo: "5906HW", vehicleType: "Pick Up", expiryDate: "2025-12-22", allowableLoad: "3000", kmReading: "40263", description: "RAS: RASIC1246/729", status: "Expired", jmEnabled: false, totalJourneys: 318 },
  { id: "48", registrationNo: "8731 HM", vehicleType: "Third Party Heavy Vehicle", expiryDate: "2027-05-19", allowableLoad: "17610", kmReading: "224503", description: "Sultan Truck", status: "Active", jmEnabled: true, lastJourneyDate: "2025-07-02", totalJourneys: 456 },
  { id: "49", registrationNo: "4967 MR", vehicleType: "Third Party Heavy Vehicle", expiryDate: "2025-05-31", allowableLoad: "29440", kmReading: "893650", description: "", status: "Expired", jmEnabled: false, totalJourneys: 2134 },
  { id: "50", registrationNo: "7498 RK", vehicleType: "Third Party Heavy Vehicle", expiryDate: "2026-06-18", allowableLoad: "25000", kmReading: "127488", description: "Sultan Truk", status: "Active", jmEnabled: true, lastJourneyDate: "2025-06-30", totalJourneys: 289 },
  { id: "51", registrationNo: "1021YM", vehicleType: "Pick Up", expiryDate: "2025-12-22", allowableLoad: "3000", kmReading: "40198", description: "RAS: RASIC1246/730", status: "Expired", jmEnabled: false, totalJourneys: 315 },
  { id: "52", registrationNo: "Other", vehicleType: "Crew Bus", expiryDate: "2025-04-30", allowableLoad: "", kmReading: "", description: "", status: "Expired", jmEnabled: false, totalJourneys: 0 },
]

// Sample Journey Management records
export const journeyRecords: JourneyManagement[] = [
  { id: "JM-001", vehicleId: "36", journeyDate: "2025-07-02", driver: "Ahmed Al Balushi", startLocation: "Muscat Office", endLocation: "Sohar Site", purpose: "Equipment Delivery", startKm: "207100", endKm: "207232", distanceTraveled: "132 km", departureTime: "06:00", arrivalTime: "08:30", approvedBy: "Mohammed Said", status: "Completed", passengers: "2", remarks: "Delivered drilling equipment" },
  { id: "JM-002", vehicleId: "37", journeyDate: "2025-07-01", driver: "Salim Al Harthi", startLocation: "Duqm Base", endLocation: "Fahud Field", purpose: "Crew Transport", startKm: "321350", endKm: "321501", distanceTraveled: "151 km", departureTime: "05:30", arrivalTime: "08:00", approvedBy: "Khalid Al Rashdi", status: "Completed", passengers: "4", remarks: "Morning shift crew" },
  { id: "JM-003", vehicleId: "22", journeyDate: "2025-07-02", driver: "Rashid Al Kindi", startLocation: "Nimr Camp", endLocation: "Marmul Site", purpose: "Crane Operation", startKm: "331700", endKm: "331839", distanceTraveled: "139 km", departureTime: "07:00", arrivalTime: "09:45", approvedBy: "Said Al Habsi", status: "Completed", passengers: "1", remarks: "Crane lifting for rig move" },
  { id: "JM-004", vehicleId: "25", journeyDate: "2025-07-02", driver: "Hamood Al Siyabi", startLocation: "Muscat", endLocation: "Adam Site", purpose: "Material Transport", startKm: "560000", endKm: "560174", distanceTraveled: "174 km", departureTime: "04:00", arrivalTime: "07:30", approvedBy: "Yousuf Al Maskari", status: "Completed", passengers: "1", remarks: "Urgent spare parts delivery" },
  { id: "JM-005", vehicleId: "6", journeyDate: "2025-07-01", driver: "Ali Al Lawati", startLocation: "Fahud", endLocation: "Lekhwair", purpose: "Well Logging", startKm: "17400", endKm: "17439", distanceTraveled: "39 hrs", departureTime: "06:00", arrivalTime: "18:00", approvedBy: "Nasser Al Hinai", status: "Completed", passengers: "3", remarks: "Logging unit mobilization" },
  { id: "JM-006", vehicleId: "38", journeyDate: "2025-07-03", driver: "Khalfan Al Rawahi", startLocation: "Muscat Office", endLocation: "Sur Site", purpose: "Site Inspection", startKm: "254286", endKm: "254400", distanceTraveled: "114 km", departureTime: "06:30", arrivalTime: "09:00", approvedBy: "Ahmed Al Busaidi", status: "In Progress", passengers: "2", remarks: "HSE inspection visit" },
  { id: "JM-007", vehicleId: "17", journeyDate: "2025-07-03", driver: "Sultan Al Amri", startLocation: "Sohar Base", endLocation: "Saih Rawl", purpose: "Equipment Delivery", startKm: "24038", endKm: "24200", distanceTraveled: "162 km", departureTime: "05:00", arrivalTime: "09:00", approvedBy: "Hilal Al Farsi", status: "Approved", passengers: "1", remarks: "HAIB equipment transport" },
  { id: "JM-008", vehicleId: "40", journeyDate: "2025-07-03", driver: "Mubarak Al Wahaibi", startLocation: "Adam", endLocation: "Qarn Alam", purpose: "Personnel Transport", startKm: "303766", endKm: "303900", distanceTraveled: "134 km", departureTime: "07:00", arrivalTime: "10:00", approvedBy: "Saleh Al Kalbani", status: "Pending", passengers: "3" },
]
