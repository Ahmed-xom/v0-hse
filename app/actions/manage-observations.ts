'use server'

import { eq, desc, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { observation } from '@/lib/db/schema'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

function generateObservationId() {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `OBS-${year}${month}-${rand}`
}

export async function getObservations() {
  try {
    const rows = await db
      .select()
      .from(observation)
      .orderBy(desc(observation.createdAt))

    return {
      success: true,
      data: rows.map((o) => ({
        id: o.id,
        number: o.number ?? o.id,
        date: o.date ? o.date.toISOString() : o.createdAt.toISOString(),
        businessUnit: o.businessUnitId ?? '',
        observer: o.observer ?? '',
        observerEmail: '',
        position: o.position ?? '',
        location: o.location ?? '',
        nearMiss: o.nearMiss ?? false,
        draft: false,
        description: o.description ?? '',
        observationType: (o.severity as any) ?? 'Safe',
        category: o.category ?? '',
        attachments: [] as string[],
        correctiveActions: o.correctiveActions ?? '',
        actionItems: [] as any[],
        status: (o.status as any) ?? 'Open',
        createdBy: o.userId,
        createdAt: o.createdAt.toISOString(),
        shared: false,
      })),
    }
  } catch (error: any) {
    console.error('[v0] Error fetching observations:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export async function createObservation(formData: {
  date: string
  businessUnit: string
  position: string
  location: string
  nearMiss: string
  description: string
  observationType: string
  category: string
  correctiveActions: string
}) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' }
    }

    const id = generateObservationId()

    await db.insert(observation).values({
      id,
      number: id,
      userId: currentUser.id as any,
      observer: currentUser.name ?? currentUser.email,
      position: formData.position,
      location: formData.location,
      businessUnitId: formData.businessUnit,
      description: formData.description,
      // observationType maps to severity in the DB schema
      severity: formData.observationType,
      category: formData.category,
      nearMiss: formData.nearMiss === 'yes',
      correctiveActions: formData.correctiveActions,
      status: 'Open',
      date: new Date(formData.date),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    revalidatePath('/')
    return { success: true, id }
  } catch (error: any) {
    console.error('[v0] Error creating observation:', error)
    return { success: false, error: error.message }
  }
}

export async function updateObservationStatus(id: string, status: string) {
  try {
    await db
      .update(observation)
      .set({ status, updatedAt: new Date() })
      .where(eq(observation.id, id))

    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('[v0] Error updating observation status:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteObservation(id: string) {
  try {
    await db.delete(observation).where(eq(observation.id, id))
    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('[v0] Error deleting observation:', error)
    return { success: false, error: error.message }
  }
}
