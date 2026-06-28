'use server'

import { db } from '@/lib/db'
import { journey } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

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
  estimatedReturn: string | null
  passengers: number
  status: string
  notes: string | null
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
  estimatedReturn?: string
  passengers: number
  notes?: string
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
      estimatedReturn: data.estimatedReturn || null,
      passengers: data.passengers,
      status: 'Planned',
      notes: data.notes || null,
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
