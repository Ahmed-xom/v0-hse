'use server'

import { and, eq, desc, ilike, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { training } from '@/lib/db/schema'
import { requireCompanyAccess } from '@/lib/company-access'
import { revalidatePath } from 'next/cache'

type TrainingInput = { employeeName: string; employeeCode: string; courseName: string; status: string; result?: string; completedDate?: string; expiryDate?: string }

export async function getTrainingRecords(search?: string, companyId?: string) {
  try {
    const scope = await requireCompanyAccess(companyId)
    const companyFilter = eq(training.companyId, scope.companyId)
    const filter = search ? and(companyFilter, or(ilike(training.employeeName, `%${search}%`), ilike(training.employeeCode, `%${search}%`), ilike(training.courseName, `%${search}%`))) : companyFilter
    const rows = await db.select().from(training).where(filter).orderBy(desc(training.createdAt))
    return { success: true, data: rows }
  } catch {
    return { success: false, error: 'Unable to access training records in this company', data: [] }
  }
}

function computeExpiryDate(completedDate?: string): string | null {
  if (!completedDate) return null
  const d = new Date(completedDate)
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().split('T')[0]
}

export async function createTrainingRecord(data: TrainingInput & { companyId?: string }) {
  try {
    const scope = await requireCompanyAccess(data.companyId)
    const id = `tr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    await db.insert(training).values({ id, companyId: scope.companyId, employeeName: data.employeeName, employeeCode: data.employeeCode, courseName: data.courseName, status: data.status, result: data.result || null, completedDate: data.completedDate || null, expiryDate: data.expiryDate || computeExpiryDate(data.completedDate) || null })
    revalidatePath('/')
    return { success: true }
  } catch {
    return { success: false, error: 'Unable to create training record in this company' }
  }
}

export async function updateTrainingRecord(id: string, data: Partial<TrainingInput> & { companyId?: string }) {
  try {
    const scope = await requireCompanyAccess(data.companyId)
    const expiryDate = data.expiryDate || computeExpiryDate(data.completedDate)
    const rows = await db.update(training).set({ employeeName: data.employeeName, employeeCode: data.employeeCode, courseName: data.courseName, status: data.status, result: data.result, completedDate: data.completedDate ?? undefined, expiryDate: expiryDate ?? undefined, updatedAt: new Date() }).where(and(eq(training.id, id), eq(training.companyId, scope.companyId))).returning({ id: training.id })
    if (!rows.length) return { success: false, error: 'Training record not found in this company' }
    revalidatePath('/')
    return { success: true }
  } catch {
    return { success: false, error: 'Unable to update training record in this company' }
  }
}

export async function deleteTrainingRecord(id: string, companyId?: string) {
  try {
    const scope = await requireCompanyAccess(companyId)
    const rows = await db.delete(training).where(and(eq(training.id, id), eq(training.companyId, scope.companyId))).returning({ id: training.id })
    if (!rows.length) return { success: false, error: 'Training record not found in this company' }
    revalidatePath('/')
    return { success: true }
  } catch {
    return { success: false, error: 'Unable to delete training record in this company' }
  }
}

// Bulk create for the matrix builder — ON CONFLICT DO NOTHING
export async function bulkCreateMatrixRecords(records: TrainingInput[], companyId?: string) {
  try {
    const scope = await requireCompanyAccess(companyId)
    let inserted = 0
    let skipped = 0
    for (const rec of records) {
      const id = `tr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const rows = await db.insert(training).values({ id, companyId: scope.companyId, employeeName: rec.employeeName, employeeCode: rec.employeeCode, courseName: rec.courseName, status: rec.status, result: rec.result || null }).onConflictDoNothing().returning({ id: training.id })
      if (rows.length) inserted++
      else skipped++
    }
    revalidatePath('/')
    return { success: true, inserted, skipped }
  } catch {
    return { success: false, error: 'Unable to create training matrix in this company', inserted: 0, skipped: 0 }
  }
}

// Bulk import: upsert by (employee_code + course_name)
export async function importTrainingRecords(records: TrainingInput[], companyId?: string) {
  try {
    const scope = await requireCompanyAccess(companyId)
    let inserted = 0
    for (const rec of records) {
      const id = `tr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const rows = await db.insert(training).values({ id, companyId: scope.companyId, employeeName: rec.employeeName, employeeCode: rec.employeeCode, courseName: rec.courseName, status: rec.status, result: rec.result || null, completedDate: rec.completedDate || null, expiryDate: rec.expiryDate || computeExpiryDate(rec.completedDate) || null }).onConflictDoNothing().returning({ id: training.id })
      if (rows.length) inserted++
    }
    revalidatePath('/')
    return { success: true, inserted }
  } catch {
    return { success: false, error: 'Unable to import training records in this company' }
  }
}
