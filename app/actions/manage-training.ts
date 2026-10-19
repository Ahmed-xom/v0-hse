'use server'

import { and, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { training } from '@/lib/db/schema'
import { getAuthorizedCompanyIds } from '@/lib/company-access'
import { revalidatePath } from 'next/cache'

async function resolveCompany(companyId?: string) {
  const access = await getAuthorizedCompanyIds()
  const selected = companyId && access.companyIds.includes(companyId) ? companyId : access.companyIds[0]
  if (!access.userId || !selected) throw new Error('No authorized company scope')
  return selected
}

export async function getTrainingRecords(search?: string, companyId?: string) {
  try {
    const scope = await resolveCompany(companyId)
    const filters = [eq(training.companyId, scope)]
    if (search) filters.push(or(ilike(training.employeeName, `%${search}%`), ilike(training.employeeCode, `%${search}%`), ilike(training.courseName, `%${search}%`)) as typeof filters[number])
    const rows = await db.select().from(training).where(and(...filters)).orderBy(desc(training.createdAt))
    return { success: true, data: rows }
  } catch (error) {
    console.error('[v0] Error fetching training records:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unable to load training records', data: [] }
  }
}

function computeExpiryDate(completedDate?: string): string | null {
  if (!completedDate) return null
  const d = new Date(completedDate)
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().split('T')[0]
}

type TrainingInput = { employeeName: string; employeeCode: string; courseName: string; status: string; result?: string; completedDate?: string; expiryDate?: string; companyId?: string }

export async function createTrainingRecord(data: TrainingInput) {
  try {
    const companyId = await resolveCompany(data.companyId)
    const id = `tr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    await db.insert(training).values({ id, companyId, employeeName: data.employeeName, employeeCode: data.employeeCode, courseName: data.courseName, status: data.status, result: data.result || null, completedDate: data.completedDate || null, expiryDate: data.expiryDate || computeExpiryDate(data.completedDate) || null })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('[v0] Error creating training record:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unable to create training record' }
  }
}

export async function updateTrainingRecord(id: string, data: Omit<TrainingInput, 'companyId'> & { companyId?: string }) {
  try {
    const companyId = await resolveCompany(data.companyId)
    const expiryDate = data.expiryDate || computeExpiryDate(data.completedDate)
    const result = await db.update(training).set({ ...data, companyId: undefined, completedDate: data.completedDate ?? undefined, expiryDate: expiryDate ?? undefined, updatedAt: new Date() }).where(and(eq(training.id, id), eq(training.companyId, companyId)))
    if (!result.rowCount) return { success: false, error: 'Training record not found in this company' }
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('[v0] Error updating training record:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unable to update training record' }
  }
}

export async function deleteTrainingRecord(id: string, companyId?: string) {
  try {
    const scope = await resolveCompany(companyId)
    const result = await db.delete(training).where(and(eq(training.id, id), eq(training.companyId, scope)))
    if (!result.rowCount) return { success: false, error: 'Training record not found in this company' }
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('[v0] Error deleting training record:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unable to delete training record' }
  }
}

export async function bulkCreateMatrixRecords(records: Array<Omit<TrainingInput, 'companyId'>>, companyId?: string) {
  try {
    const scope = await resolveCompany(companyId)
    let inserted = 0
    let skipped = 0
    for (const rec of records) {
      const id = `tr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const result = await db.execute(sql`INSERT INTO public.training (id, company_id, employee_name, employee_code, course_name, status, result, created_at, updated_at) VALUES (${id}, ${scope}, ${rec.employeeName}, ${rec.employeeCode}, ${rec.courseName}, ${rec.status}, ${rec.result || null}, now(), now()) ON CONFLICT (employee_code, course_name, company_id) DO NOTHING`)
      if (Number((result as { rowCount?: number }).rowCount) > 0) inserted++
      else skipped++
    }
    revalidatePath('/')
    return { success: true, inserted, skipped }
  } catch (error) {
    console.error('[v0] Error bulk creating matrix records:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unable to bulk create records', inserted: 0, skipped: 0 }
  }
}

export async function importTrainingRecords(records: Array<Omit<TrainingInput, 'companyId'>>, companyId?: string) {
  try {
    const scope = await resolveCompany(companyId)
    let inserted = 0
    for (const rec of records) {
      const id = `tr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const result = await db.execute(sql`INSERT INTO public.training (id, company_id, employee_name, employee_code, course_name, status, result, completed_date, created_at, updated_at) VALUES (${id}, ${scope}, ${rec.employeeName}, ${rec.employeeCode}, ${rec.courseName}, ${rec.status}, ${rec.result || null}, ${rec.completedDate ? new Date(rec.completedDate) : null}, now(), now()) ON CONFLICT DO NOTHING`)
      if (Number((result as { rowCount?: number }).rowCount) > 0) inserted++
    }
    revalidatePath('/')
    return { success: true, inserted }
  } catch (error) {
    console.error('[v0] Error importing training records:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unable to import training records' }
  }
}
