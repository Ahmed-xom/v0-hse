'use server'

import { Pool } from 'pg'
import { revalidatePath } from 'next/cache'
import { ALL_TABS, DEFAULT_TABS, type TabKey } from '@/lib/tab-access-config'

export type { TabKey }
export { ALL_TABS }

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.user_tab_access (
      id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_email   TEXT NOT NULL UNIQUE,
      allowed_tabs TEXT[] NOT NULL DEFAULT ARRAY['observations','incidents','inspections','meetings','service-quality','ptw','moc','documents','reports']::text[],
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

/** Get the allowed tabs for a specific user email. Returns all tabs if no record exists. */
export async function getUserTabAccess(email: string): Promise<TabKey[]> {
  try {
    await ensureTable()
    const r = await pool.query(
      `SELECT allowed_tabs FROM public.user_tab_access WHERE user_email = $1`,
      [email.toLowerCase()]
    )
    if (r.rows.length === 0) return DEFAULT_TABS
    return (r.rows[0].allowed_tabs ?? DEFAULT_TABS) as TabKey[]
  } catch {
    return DEFAULT_TABS
  }
}

/** Get tab access settings for every user (for the admin UI). */
export async function getAllUserTabAccess(): Promise<
  { userEmail: string; allowedTabs: TabKey[] }[]
> {
  try {
    await ensureTable()
    const r = await pool.query(
      `SELECT user_email, allowed_tabs FROM public.user_tab_access ORDER BY user_email`
    )
    return r.rows.map(row => ({
      userEmail: row.user_email,
      allowedTabs: (row.allowed_tabs ?? DEFAULT_TABS) as TabKey[],
    }))
  } catch {
    return []
  }
}

/** Upsert the allowed tabs for a user. */
export async function setUserTabAccess(
  email: string,
  allowedTabs: TabKey[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureTable()
    await pool.query(
      `INSERT INTO public.user_tab_access (id, user_email, allowed_tabs, updated_at)
       VALUES (gen_random_uuid()::text, $1, $2::text[], NOW())
       ON CONFLICT (user_email)
       DO UPDATE SET allowed_tabs = $2::text[], updated_at = NOW()`,
      [email.toLowerCase(), allowedTabs]
    )
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    console.error('[tab-access] setUserTabAccess error:', e.message)
    return { success: false, error: e.message }
  }
}

/** Bulk-set tab access for multiple users at once. */
export async function bulkSetUserTabAccess(
  rows: { email: string; allowedTabs: TabKey[] }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureTable()
    for (const row of rows) {
      await pool.query(
        `INSERT INTO public.user_tab_access (id, user_email, allowed_tabs, updated_at)
         VALUES (gen_random_uuid()::text, $1, $2::text[], NOW())
         ON CONFLICT (user_email)
         DO UPDATE SET allowed_tabs = $2::text[], updated_at = NOW()`,
        [row.email.toLowerCase(), row.allowedTabs]
      )
    }
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    console.error('[tab-access] bulkSetUserTabAccess error:', e.message)
    return { success: false, error: e.message }
  }
}
