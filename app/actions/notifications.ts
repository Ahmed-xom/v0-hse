'use server'

import { Pool } from 'pg'
import { revalidatePath } from 'next/cache'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export interface AppNotification {
  id: string
  user_email: string
  type: string
  title: string
  body: string | null
  link: string | null
  read: boolean
  created_at: string
}

export async function getNotifications(userEmail: string): Promise<AppNotification[]> {
  try {
    const r = await pool.query(
      `SELECT * FROM public.notification WHERE user_email = $1 ORDER BY created_at DESC LIMIT 50`,
      [userEmail]
    )
    return r.rows.map((n) => ({ ...n, created_at: new Date(n.created_at).toISOString() }))
  } catch (e: any) {
    console.error('[v0] getNotifications error:', e.message)
    return []
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  try {
    await pool.query(`UPDATE public.notification SET read = true WHERE id = $1`, [id])
    revalidatePath('/')
  } catch (e: any) {
    console.error('[v0] markNotificationRead error:', e.message)
  }
}

export async function markAllNotificationsRead(userEmail: string): Promise<void> {
  try {
    await pool.query(`UPDATE public.notification SET read = true WHERE user_email = $1`, [userEmail])
    revalidatePath('/')
  } catch (e: any) {
    console.error('[v0] markAllNotificationsRead error:', e.message)
  }
}
