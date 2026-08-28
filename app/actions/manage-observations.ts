'use server'

import { eq, desc, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { observation } from '@/lib/db/schema'
import { revalidatePath } from 'next/cache'
import { sendEmail, observationCreatedHtml, observationStatusUpdatedHtml } from '@/lib/send-email'

// Fetch emails of HSE staff / management to notify on new observations
async function getHseNotifyEmails(): Promise<string[]> {
  try {
    const result = await db.execute(sql`
      SELECT email FROM public.employee
      WHERE hse_role IN ('HSE STAFF', 'ADMIN SYSTEM', 'MASTER USER', 'MANAGEMENT')
        AND status = 'Active'
        AND email IS NOT NULL
        AND email <> ''
    `)
    return ((result as any).rows ?? []).map((r: any) => r.email as string)
  } catch {
    return []
  }
}

function generateObservationId() {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `OBS-${year}${month}-${rand}`
}

// Pass userEmail to filter to the user's own observations.
// Pass undefined (or omit) for admins who should see everything.
export async function getObservations(userEmail?: string) {
  try {
    const rows = await db
      .select()
      .from(observation)
      .where(
        userEmail
          ? sql`lower(${observation.observer}) = lower(${userEmail})`
          : undefined
      )
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
  // caller passes the logged-in user info — no server-side session needed
  userId?: string
  observerName?: string
  observerEmail?: string
}) {
  try {
    const id = generateObservationId()
    // Use a deterministic fallback UUID if caller didn't supply one
    const userId = (formData.userId && formData.userId.trim())
      ? formData.userId
      : '00000000-0000-0000-0000-000000000000'

    await db.insert(observation).values({
      id,
      number: id,
      userId: userId as any,
      observer: formData.observerName ?? 'Unknown',
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

    // Send email notifications (fire-and-forget — don't block the response)
    const notifyEmails = await getHseNotifyEmails()
    const observerEmail = formData.observerEmail ?? ''
    const allRecipients = Array.from(
      new Set([...notifyEmails, ...(observerEmail ? [observerEmail] : [])].filter(Boolean))
    )

    if (allRecipients.length > 0) {
      const html = observationCreatedHtml({
        number: id,
        date: formData.date,
        businessUnit: formData.businessUnit,
        observer: formData.observerName ?? 'Unknown',
        location: formData.location,
        category: formData.category,
        severity: formData.observationType,
        nearMiss: formData.nearMiss === 'yes',
        description: formData.description,
        correctiveActions: formData.correctiveActions,
      })
      sendEmail({
        to: allRecipients,
        subject: `New Observation Raised — ${id}${formData.nearMiss === 'yes' ? ' [NEAR MISS]' : ''}`,
        html,
      }).catch((e) => console.error('[observations] email error:', e))
    }

    return { success: true, id }
  } catch (error: any) {
    console.error('[v0] Error creating observation:', error)
    return { success: false, error: error.message }
  }
}

export async function updateObservationStatus(
  id: string,
  status: string,
  opts?: { oldStatus?: string; updatedBy?: string; observerEmail?: string }
) {
  try {
    // Fetch old status before updating if not provided
    let oldStatus = opts?.oldStatus ?? ''
    let observerEmail = opts?.observerEmail ?? ''

    if (!oldStatus || !observerEmail) {
      const existing = await db
        .select()
        .from(observation)
        .where(eq(observation.id, id))
        .limit(1)
      if (existing.length > 0) {
        oldStatus = oldStatus || (existing[0].status ?? '')
        observerEmail = observerEmail || (existing[0].observer ?? '')
      }
    }

    await db
      .update(observation)
      .set({ status, updatedAt: new Date() })
      .where(eq(observation.id, id))

    revalidatePath('/')

    // Notify observer + HSE staff of status change
    const notifyEmails = await getHseNotifyEmails()
    const allRecipients = Array.from(
      new Set([...notifyEmails, ...(observerEmail ? [observerEmail] : [])].filter(Boolean))
    )

    if (allRecipients.length > 0 && oldStatus !== status) {
      const html = observationStatusUpdatedHtml({
        number: id,
        oldStatus,
        newStatus: status,
        updatedBy: opts?.updatedBy,
      })
      sendEmail({
        to: allRecipients,
        subject: `Observation ${id} — Status Updated to ${status}`,
        html,
      }).catch((e) => console.error('[observations] status email error:', e))
    }

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
