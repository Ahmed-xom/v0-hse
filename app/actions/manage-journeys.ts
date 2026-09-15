'use server'

import { db } from '@/lib/db'
import { journey, vehicle } from '@/lib/db/schema'
import { eq, desc, asc } from 'drizzle-orm'
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

export type JourneyRecord = {
  id: string
  userEmail: string
  userName: string
  origin: string
  destination: string
  purpose: string
  vehicleType: string
  vehiclePlate: string | null
  departureDate: string
  departureTime: string
  journeyType: 'morning' | 'night'
  estimatedReturn: string | null
  passengers: number
  status: string
  notes: string | null
  attachmentUrl: string | null
  attachmentName: string | null
  createdAt: Date
}

export async function getJourneys(userEmail: string) {
  try {
    const rows = await db
      .select()
      .from(journey)
      .where(eq(journey.userEmail, userEmail))
      .orderBy(desc(journey.createdAt))
    return { success: true, data: rows as JourneyRecord[] }
  } catch (error: any) {
    console.error('[manage-journeys] getJourneys error:', error)
    return { success: false, data: [], error: error.message }
  }
}

export async function getAllJourneys() {
  try {
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
  departureDate: string
  departureTime: string
  journeyType?: 'morning' | 'night'
  estimatedReturn?: string
  passengers: number
  notes?: string
  attachmentUrl?: string
  attachmentName?: string
}) {
  try {
    const id = `jrn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    await db.insert(journey).values({
      id,
      userEmail: data.userEmail,
      userName: data.userName,
      origin: data.origin,
      destination: data.destination,
      purpose: data.purpose,
      vehicleType: data.vehicleType,
      vehiclePlate: data.vehiclePlate || null,
      departureDate: data.departureDate,
      departureTime: data.departureTime,
      journeyType: data.journeyType || 'morning',
      estimatedReturn: data.estimatedReturn || null,
      passengers: data.passengers,
      status: 'Planned',
      notes: data.notes || null,
      attachmentUrl: data.attachmentUrl || null,
      attachmentName: data.attachmentName || null,
    })
    revalidatePath('/journey-tracker')
    return { success: true, id }
  } catch (error: any) {
    console.error('[manage-journeys] createJourney error:', error)
    return { success: false, error: error.message }
  }
}

export async function updateJourneyStatus(id: string, status: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    const email = session?.user?.email
    if (!email) return { success: false, error: 'Unauthorized' }
    const canApprove = await getUserJourneyApprover(email)
    const role = String((session.user as any).role ?? '').toUpperCase()
    if (!canApprove && !['ADMIN SYSTEM', 'ADMIN', 'HSE ADMIN', 'MASTER USER'].includes(role)) {
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
    await db.delete(journey).where(eq(journey.id, id))
    revalidatePath('/journey-tracker')
    return { success: true }
  } catch (error: any) {
    console.error('[manage-journeys] deleteJourney error:', error)
    return { success: false, error: error.message }
  }
}
