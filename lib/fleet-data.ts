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

export interface Vehicle {
  id: string
  registrationNo: string
  vehicleType: string
  expiryDate: string
  allowableLoad: string
  kmReading: string
  description: string
  status: VehicleStatus
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
  { id: "1", registrationNo: "9250YW(CANCEL)", vehicleType: "Fuso Truck with Crane", expiryDate: "2026-02-26", allowableLoad: "10 ton", kmReading: "248905", description: "Fuso Truck with Crane FOFS-29", status: "Cancelled" },
  { id: "2", registrationNo: "971YR(CANCEL)", vehicleType: "Mitsubishi Fuso 10 ton", expiryDate: "2026-01-28", allowableLoad: "10 ton", kmReading: "502334", description: "Mitsubishi Fuso 10 ton FOFS-18", status: "Cancelled" },
  { id: "3", registrationNo: "7668BA(CANCEL)", vehicleType: "Mitsibishi Canter", expiryDate: "2026-06-22", allowableLoad: "3 ton", kmReading: "137555", description: "Mitsibishi CanterFOFS-31", status: "Cancelled" },
  { id: "4", registrationNo: "718YM(CANCEL)", vehicleType: "Mitsibishi Canter", expiryDate: "2026-06-22", allowableLoad: "3 ton", kmReading: "472890", description: "Mitsibishi CanterFOFS-26", status: "Cancelled" },
  { id: "5", registrationNo: "1241RK(CANCEL)", vehicleType: "Mitsibishi Canter", expiryDate: "2026-04-21", allowableLoad: "3 ton", kmReading: "430310", description: "Mitsibishi Canter FOFS-19", status: "Cancelled" },
  { id: "6", registrationNo: "4168 ML", vehicleType: "Mercedez logging unit", expiryDate: "2026-07-24", allowableLoad: "25 ton", kmReading: "17439 hrs", description: "Mercedez logging unit BAZ-16 (Rental)", status: "Active" },
  { id: "7", registrationNo: "6854 MK", vehicleType: "Mercedez logging unit", expiryDate: "2026-10-14", allowableLoad: "25 ton", kmReading: "150 hrs", description: "Mercedez logging unit BAZ-15", status: "Active" },
  { id: "8", registrationNo: "1792 YM", vehicleType: "Mercedez logging unit", expiryDate: "2026-10-14", allowableLoad: "25 ton", kmReading: "434 hrs", description: "Mercedez logging unit BAZ-14", status: "Active" },
  { id: "9", registrationNo: "2080 ML", vehicleType: "Mercedez logging unit", expiryDate: "2026-09-03", allowableLoad: "25 ton", kmReading: "36953 hrs", description: "Mercedez logging unit BAZ-13", status: "Active" },
  { id: "10", registrationNo: "9993 WB", vehicleType: "Mercedez logging unit", expiryDate: "2027-01-23", allowableLoad: "25 ton", kmReading: "18661 hrs", description: "Mercedez logging unit BAZ-12", status: "Active" },
  { id: "11", registrationNo: "9500 WB", vehicleType: "Mercedez logging unit", expiryDate: "2027-01-15", allowableLoad: "25 ton", kmReading: "20972 hrs", description: "Mercedez logging unit BAZ-11", status: "Active" },
  { id: "12", registrationNo: "8918 WB", vehicleType: "Mercedez logging unit", expiryDate: "2027-01-15", allowableLoad: "25 ton", kmReading: "21788 hrs", description: "Mercedez logging unit BAZ-09", status: "Active" },
  { id: "13", registrationNo: "2868 WB", vehicleType: "Mercedez logging unit", expiryDate: "2026-08-22", allowableLoad: "25 ton", kmReading: "24776 hrs", description: "Mercedez logging unit BAZ-08", status: "Active" },
  { id: "14", registrationNo: "2895 HM", vehicleType: "Mercedez logging unit", expiryDate: "2026-08-22", allowableLoad: "25 ton", kmReading: "17179 hrs", description: "Mercedez logging unit BAZ-07", status: "Active" },
  { id: "15", registrationNo: "1976 YD", vehicleType: "Mercedez logging unit", expiryDate: "2026-06-14", allowableLoad: "25 ton", kmReading: "21453 hrs", description: "Mercedez logging unit BAZ-06", status: "Active" },
  { id: "16", registrationNo: "6213 BK", vehicleType: "Mercedez logging unit", expiryDate: "2027-01-10", allowableLoad: "25 ton", kmReading: "5094 hrs", description: "Mercedez logging unit BAZ-03", status: "Active" },
  { id: "17", registrationNo: "418 MH", vehicleType: "Mistubishi Fuso HAIB 10 ton", expiryDate: "2026-10-21", allowableLoad: "10 ton", kmReading: "24038", description: "Mistubishi Fuso HAIB 10-ton FOFS-51", status: "Active" },
  { id: "18", registrationNo: "264 BK", vehicleType: "Mistubishi Fuso HAIB 10 ton", expiryDate: "2026-10-21", allowableLoad: "10 ton", kmReading: "12275", description: "Mistubishi Fuso HAIB 10-ton FOFS-50", status: "Active" },
  { id: "19", registrationNo: "5530 YR", vehicleType: "Mistubishi Fuso HAIB 10 ton", expiryDate: "2026-10-21", allowableLoad: "10 ton", kmReading: "11075", description: "Mistubishi Fuso HAIB 10-ton FOFS-49", status: "Active" },
  { id: "20", registrationNo: "6822 MK", vehicleType: "Mistubishi Fuso HAIB 10 ton", expiryDate: "2026-10-21", allowableLoad: "10 ton", kmReading: "26240", description: "Mistubishi Fuso HAIB 10-ton FOFS-48", status: "Active" },
  { id: "21", registrationNo: "4300 MA", vehicleType: "Mistubishi Fuso HAIB 10 ton", expiryDate: "2026-10-21", allowableLoad: "10 ton", kmReading: "24480", description: "Mistubishi Fuso HAIB 10-ton FOFS-47", status: "Active" },
  { id: "22", registrationNo: "9654 WK", vehicleType: "Fuso Truck with Crane", expiryDate: "2027-02-26", allowableLoad: "10 ton", kmReading: "331839", description: "Fuso Truck with Crane FOFS-30", status: "Active" },
  { id: "23", registrationNo: "5434 BA", vehicleType: "Mitsubishi Fuso 10 ton", expiryDate: "2027-01-28", allowableLoad: "10 ton", kmReading: "488060", description: "Mitsubishi Fuso 10 ton FOFS-28", status: "Active" },
  { id: "24", registrationNo: "9531 DS", vehicleType: "Mitsubishi Fuso 10 ton", expiryDate: "2026-07-09", allowableLoad: "10 ton", kmReading: "561222", description: "Mitsubishi Fuso 10 ton FOFS-27", status: "Active" },
  { id: "25", registrationNo: "8195 WK", vehicleType: "Hino 10 Ton", expiryDate: "2026-09-05", allowableLoad: "10 ton", kmReading: "560174", description: "Hino 10 Ton FOFS-12", status: "Active" },
  { id: "26", registrationNo: "4217 YM", vehicleType: "Mitsibishi Canter", expiryDate: "2027-04-01", allowableLoad: "3 ton", kmReading: "411", description: "Mitsibishi Canter FOFS-53", status: "Active" },
  { id: "27", registrationNo: "7356 WA", vehicleType: "Mitsibishi Canter", expiryDate: "2027-04-01", allowableLoad: "3 ton", kmReading: "421", description: "Mitsibishi Canter FOFS-52", status: "Active" },
  { id: "28", registrationNo: "5143 HK", vehicleType: "Mitsibishi Canter", expiryDate: "2026-10-21", allowableLoad: "3 ton", kmReading: "18652", description: "Mitsibishi Canter FOFS-46", status: "Active" },
  { id: "29", registrationNo: "9597 YB", vehicleType: "Mitsibishi Canter", expiryDate: "2026-10-21", allowableLoad: "3 ton", kmReading: "9716", description: "Mitsibishi Canter FOFS-45", status: "Active" },
  { id: "30", registrationNo: "5498 ML", vehicleType: "Mitsibishi Canter", expiryDate: "2026-10-21", allowableLoad: "3 ton", kmReading: "20837", description: "Mitsibishi Canter FOFS-44", status: "Active" },
  { id: "31", registrationNo: "2615 DS", vehicleType: "Mitsibishi Canter", expiryDate: "2026-10-21", allowableLoad: "3 ton", kmReading: "18984", description: "Mitsibishi Canter FOFS-43", status: "Active" },
  { id: "32", registrationNo: "1650 YD", vehicleType: "Mitsibishi Canter", expiryDate: "2026-10-21", allowableLoad: "3 ton", kmReading: "14764", description: "Mitsibishi Canter FOFS-42", status: "Active" },
  { id: "33", registrationNo: "3167 YS", vehicleType: "Mitsibishi Canter", expiryDate: "2026-10-21", allowableLoad: "3 ton", kmReading: "15360", description: "Mitsibishi Canter FOFS-41", status: "Active" },
  { id: "34", registrationNo: "6732/MS", vehicleType: "Mitsibishi Canter", expiryDate: "2026-06-26", allowableLoad: "3 ton", kmReading: "78999", description: "Mitsibishi Canter FOFS-40", status: "Active" },
  { id: "35", registrationNo: "1595 MH", vehicleType: "Mitsibishi Canter", expiryDate: "2026-06-30", allowableLoad: "3 ton", kmReading: "144000", description: "Mitsibishi Canter FOFS-32", status: "Active" },
  { id: "36", registrationNo: "1155 RK", vehicleType: "Toyota Hilux", expiryDate: "2026-06-08", allowableLoad: "1.5 ton", kmReading: "207232", description: "Toyota Hilux FOFS-39", status: "Active" },
  { id: "37", registrationNo: "7992 BA", vehicleType: "Toyota Hilux", expiryDate: "2026-06-08", allowableLoad: "1.5 ton", kmReading: "321501", description: "Toyota Hilux FOFS-38", status: "Active" },
  { id: "38", registrationNo: "5412 MA", vehicleType: "Toyota Hilux", expiryDate: "2026-06-08", allowableLoad: "1.5 ton", kmReading: "254286", description: "Toyota Hilux FOFS-37", status: "Active" },
  { id: "39", registrationNo: "1939-MS", vehicleType: "Toyota Hilux", expiryDate: "2026-06-08", allowableLoad: "1.5 ton", kmReading: "268000", description: "Toyota Hilux FOFS-36", status: "Active" },
  { id: "40", registrationNo: "4818 MK", vehicleType: "Toyota Hilux", expiryDate: "2026-06-08", allowableLoad: "1.5 ton", kmReading: "303766", description: "Toyota Hilux FOFS-35", status: "Active" },
  { id: "41", registrationNo: "3432 MH", vehicleType: "Toyota Hilux", expiryDate: "2026-07-15", allowableLoad: "1.5 ton", kmReading: "224562", description: "Toyota Hilux FOFS-34", status: "Active" },
  { id: "42", registrationNo: "417 MH", vehicleType: "Toyota Hilux", expiryDate: "2026-07-15", allowableLoad: "1.5 ton", kmReading: "207316", description: "Toyota Hilux FOFS-33", status: "Active" },
  { id: "43", registrationNo: "9908BM", vehicleType: "Pick Up", expiryDate: "2025-12-22", allowableLoad: "3000", kmReading: "30921", description: "", status: "Expired" },
  { id: "44", registrationNo: "7226RK", vehicleType: "Pick Up", expiryDate: "2025-12-22", allowableLoad: "3000", kmReading: "40255", description: "RAS: RASIC1246/738", status: "Expired" },
  { id: "45", registrationNo: "1718RH", vehicleType: "Pick Up", expiryDate: "2025-12-22", allowableLoad: "3000", kmReading: "41222", description: "RAS: RASIC1246/731", status: "Expired" },
  { id: "46", registrationNo: "1069 HM", vehicleType: "Third Party Heavy Vehicle", expiryDate: "2025-10-31", allowableLoad: "26410 KG", kmReading: "765580 KM", description: "", status: "Expired" },
  { id: "47", registrationNo: "5906HW", vehicleType: "Pick Up", expiryDate: "2025-12-22", allowableLoad: "3000", kmReading: "40263", description: "RAS: RASIC1246/729", status: "Expired" },
  { id: "48", registrationNo: "8731 HM", vehicleType: "Third Party Heavy Vehicle", expiryDate: "2027-05-19", allowableLoad: "17610", kmReading: "224503", description: "Sultan Truck", status: "Active" },
  { id: "49", registrationNo: "4967 MR", vehicleType: "Third Party Heavy Vehicle", expiryDate: "2025-05-31", allowableLoad: "29440", kmReading: "893650", description: "", status: "Expired" },
  { id: "50", registrationNo: "7498 RK", vehicleType: "Third Party Heavy Vehicle", expiryDate: "2026-06-18", allowableLoad: "25000", kmReading: "127488", description: "Sultan Truk", status: "Active" },
  { id: "51", registrationNo: "1021YM", vehicleType: "Pick Up", expiryDate: "2025-12-22", allowableLoad: "3000", kmReading: "40198", description: "RAS: RASIC1246/730", status: "Expired" },
  { id: "52", registrationNo: "Other", vehicleType: "Crew Bus", expiryDate: "2025-04-30", allowableLoad: "", kmReading: "", description: "", status: "Expired" },
]
