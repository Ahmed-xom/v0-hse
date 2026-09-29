'use server'

import { db } from '@/lib/db'
import { employee, journey, masterValue, vehicle } from '@/lib/db/schema'
import { eq, desc, asc, ilike, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getUserJourneyAccess, getUserJourneyApprover } from '@/app/actions/manage-users'

export type VehicleRecord = {
  id: number
  plateNo: string
  vehicleType: string
  expiryDate: string | null
  allowableLoad: string | null
  kmReading: string | null
  description: string | null
}

export async function getVehicles() {
  try {
    const rows = await db
      .select()
      .from(vehicle)
      .where(eq(vehicle.isActive, true))
      .orderBy(asc(vehicle.plateNo))
    return { success: true, data: rows as VehicleRecord[] }
  } catch (error: any) {
    return { success: false, data: [], error: error.message }
  }
}

export type DriverRecord = {
  id: string
  name: string
  payrollNo: string | null
  designation: string | null
  expiryDate: string | null
}

export async function getDrivers() {
  try {
    const masterDrivers = await db
      .select({ id: masterValue.id, name: masterValue.name, description: masterValue.description, expiryDate: masterValue.expiryDate })
      .from(masterValue)
      .where(and(eq(masterValue.sectionKey, 'driver'), eq(masterValue.isActive, true)))
      .orderBy(asc(masterValue.sortOrder), asc(masterValue.name))

    if (masterDrivers.length > 0) {
      return {
        success: true,
        data: masterDrivers.map((driver) => ({
          id: driver.id,
          name: driver.name,
          payrollNo: null,
          designation: driver.description,
          expiryDate: driver.expiryDate,
        })),
      }
    }

    const employeeDrivers = await db
      .select({ id: employee.id, name: employee.name, payrollNo: employee.payrollNo, designation: employee.designation })
      .from(employee)
      .where(and(eq(employee.status, 'Active'), ilike(employee.designation, '%driver%')))
      .orderBy(asc(employee.name))
    return { success: true, data: employeeDrivers.filter((row): row is DriverRecord => Boolean(row.name)).map((row) => ({ ...row, expiryDate: null })) }
  } catch (error: any) {
    console.error('[manage-journeys] getDrivers error:', error)
    return { success: false, data: [], error: error.message }
  }
}

export type JourneyRecord = {
  id: string
  userEmail: string
  userName: string
  origin: string
  destination: string
  purpose: string
  vehicleType: string
  vehiclePlate: string | null
  driver: string | null
  secondDriver: string | null
  departureDate: string
  departureTime: string
  journeyType: 'morning' | 'night'
  estimatedReturn: string | null
  passengers: number
  status: string
  notes: string | null
  attachmentUrl: string | null
  attachmentName: string | null
  templateDetails: Record<string, unknown>
  createdAt: Date
}

export async function getJourneys(userEmail: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    const sessionEmail = session?.user?.email
    if (!sessionEmail || sessionEmail.toLowerCase() !== userEmail.toLowerCase()) return { success: false, data: [], error: 'Unauthorized' }
    const rows = await db
      .select()
      .from(journey)
      .where(eq(journey.userEmail, sessionEmail))
      .orderBy(desc(journey.createdAt))
    return { success: true, data: rows as JourneyRecord[] }
  } catch (error: any) {
    console.error('[manage-journeys] getJourneys error:', error)
    return { success: false, data: [], error: error.message }
  }
}

export async function getAllJourneys(companyId?: string | null) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    const email = session?.user?.email
    if (!email) return { success: false, data: [], error: 'Unauthorized' }
    const role = String((session.user as any).role ?? '').toUpperCase()
    const canReview = await getUserJourneyApprover(email)
    if (!email) return { success: false, data: [], error: 'Unauthorized' }
    const rows = await db
      .select()
      .from(journey)
      .orderBy(desc(journey.createdAt))
    return { success: true, data: rows as JourneyRecord[] }
  } catch (error: any) {
    console.error('[manage-journeys] getAllJourneys error:', error)
    return { success: false, data: [], error: error.message }
  }
}

export async function createJourney(data: {
  userEmail: string
  userName: string
  origin: string
  destination: string
  purpose: string
  vehicleType: string
  vehiclePlate?: string
  driver?: string
  secondDriver?: string
  departureDate: string
  departureTime: string
  journeyType?: 'morning' | 'night'
  estimatedReturn?: string
  passengers: number
  notes?: string
  attachmentUrl?: string
  attachmentName?: string
  templateDetails?: Record<string, unknown>
}) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.email || session.user.email.toLowerCase() !== data.userEmail.toLowerCase()) return { success: false, error: 'Unauthorized' }
    const id = `jrn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const sessionUser = session.user as { name?: string | null }
    await db.insert(journey).values({
      id,
      userEmail: session.user.email,
      userName: sessionUser.name || data.userName,
      origin: data.origin,
      destination: data.destination,
      purpose: data.purpose,
      vehicleType: data.vehicleType,
      vehiclePlate: data.vehiclePlate || null,
      driver: data.driver || sessionUser.name || data.userName,
      secondDriver: data.secondDriver || null,
      departureDate: data.departureDate,
      departureTime: data.departureTime,
      journeyType: data.journeyType || 'morning',
      estimatedReturn: data.estimatedReturn || null,
      passengers: data.passengers,
      status: 'Planned',
      notes: data.notes || null,
      attachmentUrl: data.attachmentUrl || null,
      attachmentName: data.attachmentName || null,
      templateDetails: data.templateDetails ?? {},
    })
    revalidatePath('/journey-tracker')
    return { success: true, id }
  } catch (error: any) {
    console.error('[manage-journeys] createJourney error:', error)
    return { success: false, error: error.message }
  }
}

export async function updateJourneyStatus(id: string, status: string) {
  const allowedStatuses = ['Planned', 'Pending Approval', 'Approved', 'Active', 'In Progress', 'Completed', 'Flagged', 'Cancelled']
  if (!allowedStatuses.includes(status)) return { success: false, error: 'Invalid journey status' }
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    const email = session?.user?.email
    if (!email) return { success: false, error: 'Unauthorized' }
    const canApprove = await getUserJourneyApprover(email)
    const role = String((session.user as any).role ?? '').toUpperCase()
    if (!canApprove && !['ADMIN SYSTEM', 'ADMIN', 'HSE ADMIN', 'MASTER USER', 'MANAGEMENT'].includes(role)) {
      return { success: false, error: 'Journey Approver access required' }
    }
    await db
      .update(journey)
      .set({ status, updatedAt: new Date() })
      .where(eq(journey.id, id))
    revalidatePath('/journey-tracker')
    return { success: true }
  } catch (error: any) {
    console.error('[manage-journeys] updateJourneyStatus error:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteJourney(id: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    const email = session?.user?.email
    if (!email) return { success: false, error: 'Unauthorized' }
    const role = String((session.user as any).role ?? '').toUpperCase()
    const canReview = await getUserJourneyApprover(email)
    if (!canReview && !['ADMIN SYSTEM', 'ADMIN', 'HSE ADMIN', 'MASTER USER', 'MANAGEMENT'].includes(role)) return { success: false, error: 'Journey Approver access required' }
    await db.delete(journey).where(eq(journey.id, id))
    revalidatePath('/journey-tracker')
    return { success: true }
  } catch (error: any) {
    console.error('[manage-journeys] deleteJourney error:', error)
    return { success: false, error: error.message }
  }
}
