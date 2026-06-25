'use server'

import { eq, desc, ilike, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { training } from '@/lib/db/schema'
import { revalidatePath } from 'next/cache'

export async function getTrainingRecords(search?: string) {
  try {
    const rows = search
      ? await db
          .select()
          .from(training)
          .where(
            or(
              ilike(training.employeeName, `%${search}%`),
              ilike(training.employeeCode, `%${search}%`),
              ilike(training.courseName, `%${search}%`)
            )
          )
          .orderBy(desc(training.createdAt))
      : await db.select().from(training).orderBy(desc(training.createdAt))

    return { success: true, data: rows }
  } catch (error: any) {
    console.error('[v0] Error fetching training records:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export async function createTrainingRecord(data: {
  employeeName: string
  employeeCode: string
  courseName: string
  status: string
  result: string
  completedDate?: string
}) {
  try {
    const id = `tr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    await db.insert(training).values({
      id,
      employeeName: data.employeeName,
      employeeCode: data.employeeCode,
      courseName: data.courseName,
      status: data.status,
      result: data.result || null,
      completedDate: data.completedDate || null,
    })
    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('[v0] Error creating training record:', error)
    return { success: false, error: error.message }
  }
}

export async function updateTrainingRecord(id: string, data: {
  employeeName?: string
  employeeCode?: string
  courseName?: string
  status?: string
  result?: string
  completedDate?: string
}) {
  try {
    await db
      .update(training)
      .set({
        ...data,
        completedDate: data.completedDate ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(training.id, id))
    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('[v0] Error updating training record:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteTrainingRecord(id: string) {
  try {
    await db.delete(training).where(eq(training.id, id))
    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('[v0] Error deleting training record:', error)
    return { success: false, error: error.message }
  }
}

// Bulk create for the matrix builder — ON CONFLICT DO NOTHING
export async function bulkCreateMatrixRecords(records: {
  employeeName: string
  employeeCode: string
  courseName: string
  status: string
  result?: string
}[]) {
  try {
    let inserted = 0
    let skipped = 0
    for (const rec of records) {
      const id = `tr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const res = await db.execute(sql`
        INSERT INTO public.training (id, employee_name, employee_code, course_name, status, result, created_at, updated_at)
        VALUES (
          ${id},
          ${rec.employeeName},
          ${rec.employeeCode},
          ${rec.courseName},
          ${rec.status},
          ${rec.result || null},
          now(), now()
        )
        ON CONFLICT (employee_code, course_name) DO NOTHING
      `)
      if ((res as any).rowCount > 0) inserted++
      else skipped++
    }
    revalidatePath('/')
    return { success: true, inserted, skipped }
  } catch (error: any) {
    console.error('[v0] Error bulk creating matrix records:', error)
    return { success: false, error: error.message, inserted: 0, skipped: 0 }
  }
}

// Bulk import: upsert by (employee_code + course_name)
export async function importTrainingRecords(records: {
  employeeName: string
  employeeCode: string
  courseName: string
  status: string
  result: string
  completedDate?: string
}[]) {
  try {
    let inserted = 0
    for (const rec of records) {
      const id = `tr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      await db.execute(sql`
        INSERT INTO public.training (id, employee_name, employee_code, course_name, status, result, completed_date, created_at, updated_at)
        VALUES (
          ${id},
          ${rec.employeeName},
          ${rec.employeeCode},
          ${rec.courseName},
          ${rec.status},
          ${rec.result || null},
          ${rec.completedDate ? new Date(rec.completedDate) : null},
          now(), now()
        )
        ON CONFLICT DO NOTHING
      `)
      inserted++
    }
    revalidatePath('/')
    return { success: true, inserted }
  } catch (error: any) {
    console.error('[v0] Error importing training records:', error)
    return { success: false, error: error.message }
  }
}
