'use server'

import { db } from '@/lib/db'
import { training, trainingNotification } from '@/lib/db/schema'
import { sql, eq, and, isNotNull, lte, gte } from 'drizzle-orm'
import { REVIEWER_ROLES } from '@/lib/auth-roles'

export interface TrainingNotification {
  id: string
  trainingId: string
  employeeName: string
  employeeCode: string
  courseName: string
  expiryDate: string
  daysUntilExpiry: number
  message: string
  read: boolean
  createdAt: string
}

// Generate (or refresh) notifications for training records expiring within 30 days.
// Called on login or on-demand. Upserts one notification per training record per recipient.
export async function generateTrainingNotifications(): Promise<{ success: boolean; generated: number }> {
  try {
    const today = new Date()
    const in30Days = new Date(today)
    in30Days.setDate(today.getDate() + 30)

    // Find training expiring in the next 30 days (or already expired in the last 7 days as overdue)
    const expiringRecords = await db
      .select()
      .from(training)
      .where(
        and(
          isNotNull(training.expiryDate),
          lte(training.expiryDate, in30Days.toISOString().split('T')[0]),
          gte(training.expiryDate, new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0])
        )
      )

    if (expiringRecords.length === 0) return { success: true, generated: 0 }

    // Fetch all reviewers + approvers from neon_auth.user
    const recipients = await db.execute<{ email: string; role: string }>(sql`
      SELECT email, role FROM neon_auth."user"
      WHERE upper(role) = ANY(${REVIEWER_ROLES})
        AND banned IS NOT TRUE
        AND email IS NOT NULL
    `)

    if (!recipients.rows?.length) return { success: true, generated: 0 }

    let generated = 0
    for (const rec of expiringRecords) {
      const expiry = new Date(rec.expiryDate!)
      const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / 86400000)
      const urgency = daysUntil < 0 ? 'OVERDUE' : daysUntil <= 7 ? 'URGENT' : 'UPCOMING'
      const message =
        daysUntil < 0
          ? `Training "${rec.courseName}" for ${rec.employeeName} expired ${Math.abs(daysUntil)} day(s) ago`
          : `Training "${rec.courseName}" for ${rec.employeeName} expires in ${daysUntil} day(s)`

      for (const r of recipients.rows) {
        const notifId = `tn-${rec.id}-${r.email.replace(/[^a-z0-9]/gi, '')}`
        await db.execute(sql`
          INSERT INTO public.training_notification
            (id, training_id, recipient_email, recipient_role, message, read, created_at)
          VALUES
            (${notifId}, ${rec.id}, ${r.email}, ${r.role}, ${message}, false, now())
          ON CONFLICT (id) DO UPDATE
            SET message = EXCLUDED.message,
                read    = false
        `)
        generated++
      }
    }

    return { success: true, generated }
  } catch (error: any) {
    console.error('[v0] generateTrainingNotifications error:', error)
    return { success: false, generated: 0 }
  }
}

// Fetch notifications for the currently-logged-in reviewer/approver
export async function getMyTrainingNotifications(email: string): Promise<{
  success: boolean
  notifications: TrainingNotification[]
  unreadCount: number
}> {
  try {
    if (!email) return { success: true, notifications: [], unreadCount: 0 }

    const rows = await db.execute<{
      id: string
      training_id: string
      employee_name: string
      employee_code: string
      course_name: string
      expiry_date: string
      message: string
      read: boolean
      created_at: string
    }>(sql`
      SELECT
        n.id,
        n.training_id,
        t.employee_name,
        t.employee_code,
        t.course_name,
        t.expiry_date,
        n.message,
        n.read,
        n.created_at
      FROM public.training_notification n
      JOIN public.training t ON t.id = n.training_id
      WHERE n.recipient_email = ${email}
      ORDER BY n.created_at DESC
      LIMIT 50
    `)

    const today = new Date()
    const notifications: TrainingNotification[] = (rows.rows ?? []).map((r) => {
      const expiry = r.expiry_date ? new Date(r.expiry_date) : null
      const daysUntil = expiry ? Math.ceil((expiry.getTime() - today.getTime()) / 86400000) : 0
      return {
        id: r.id,
        trainingId: r.training_id,
        employeeName: r.employee_name,
        employeeCode: r.employee_code,
        courseName: r.course_name,
        expiryDate: r.expiry_date ?? '',
        daysUntilExpiry: daysUntil,
        message: r.message,
        read: r.read,
        createdAt: r.created_at,
      }
    })

    const unreadCount = notifications.filter((n) => !n.read).length
    return { success: true, notifications, unreadCount }
  } catch (error: any) {
    console.error('[v0] getMyTrainingNotifications error:', error)
    return { success: true, notifications: [], unreadCount: 0 }
  }
}

// Mark a single notification as read
export async function markNotificationRead(id: string): Promise<{ success: boolean }> {
  try {
    await db.execute(sql`
      UPDATE public.training_notification SET read = true WHERE id = ${id}
    `)
    return { success: true }
  } catch (error: any) {
    console.error('[v0] markNotificationRead error:', error)
    return { success: false }
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsRead(email: string): Promise<{ success: boolean }> {
  try {
    await db.execute(sql`
      UPDATE public.training_notification SET read = true WHERE recipient_email = ${email}
    `)
    return { success: true }
  } catch (error: any) {
    console.error('[v0] markAllNotificationsRead error:', error)
    return { success: false }
  }
}
