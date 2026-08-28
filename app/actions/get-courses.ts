'use server'

import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export interface Course {
  id: string
  name: string
  code: string | null
  category: string | null
  duration_months: number
  currency: string
  cost: number
}

export async function getCourses(): Promise<Course[]> {
  try {
    const result = await db.execute(sql`
      SELECT id, name, code, category, duration_months, currency, cost
      FROM public.course
      WHERE is_active = true
      ORDER BY category, name
    `)
    return (result as any).rows as Course[]
  } catch (e) {
    console.error('[v0] getCourses error:', e)
    return []
  }
}
