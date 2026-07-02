'use server'

import { pool } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export type ServiceQualityStatus = 'Open' | 'In Progress' | 'Closed' | 'Cancelled'
export type ServiceQualityPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export const SERVICE_CATEGORIES = [
  'Camp Services',
  'Catering',
  'Cleaning & Housekeeping',
  'Equipment Maintenance',
  'HSE Services',
  'IT Services',
  'Logistics & Transport',
  'Medical Services',
  'Security',
  'Waste Management',
  'Other',
] as const

export interface ServiceQualityReport {
  id: string
  ref_no: string | null
  report_date: string
  period: string | null
  business_unit: string | null
  contractor: string | null
  service_category: string
  title: string
  description: string | null
  findings: string | null
  recommendations: string | null
  action_required: string | null
  action_owner: string | null
  action_due_date: string | null
  rating: number | null
  status: ServiceQualityStatus
  priority: ServiceQualityPriority
  reported_by: string | null
  reported_by_email: string | null
  created_at: string
  updated_at: string
}

export interface ServiceQualityFormData {
  report_date: string
  period?: string
  business_unit?: string
  contractor?: string
  service_category: string
  title: string
  description?: string
  findings?: string
  recommendations?: string
  action_required?: string
  action_owner?: string
  action_due_date?: string
  rating?: number
  status: ServiceQualityStatus
  priority: ServiceQualityPriority
  reported_by?: string
  reported_by_email?: string
}

// ── Auto-generate a ref number ────────────────────────────────────────────────
async function generateRefNo(): Promise<string> {
  const year = new Date().getFullYear()
  const res = await pool.query(
    `SELECT COUNT(*) FROM public.service_quality_report WHERE EXTRACT(YEAR FROM created_at) = $1`,
    [year],
  )
  const seq = Number(res.rows[0].count) + 1
  return `SQR-${year}-${String(seq).padStart(4, '0')}`
}

// ── List ──────────────────────────────────────────────────────────────────────
export async function getServiceQualityReports(opts?: {
  status?: string
  category?: string
  priority?: string
  search?: string
}): Promise<{ success: boolean; data?: ServiceQualityReport[]; error?: string }> {
  try {
    const conditions: string[] = []
    const params: unknown[] = []
    let idx = 1

    if (opts?.status && opts.status !== 'all') {
      conditions.push(`status = $${idx++}`)
      params.push(opts.status)
    }
    if (opts?.category && opts.category !== 'all') {
      conditions.push(`service_category = $${idx++}`)
      params.push(opts.category)
    }
    if (opts?.priority && opts.priority !== 'all') {
      conditions.push(`priority = $${idx++}`)
      params.push(opts.priority)
    }
    if (opts?.search) {
      conditions.push(`(title ILIKE $${idx} OR contractor ILIKE $${idx} OR business_unit ILIKE $${idx} OR reported_by ILIKE $${idx})`)
      params.push(`%${opts.search}%`)
      idx++
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const res = await pool.query(
      `SELECT * FROM public.service_quality_report ${where} ORDER BY report_date DESC`,
      params,
    )
    return { success: true, data: res.rows }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ── Create ────────────────────────────────────────────────────────────────────
export async function createServiceQualityReport(
  data: ServiceQualityFormData,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const ref_no = await generateRefNo()
    const res = await pool.query(
      `INSERT INTO public.service_quality_report
        (ref_no, report_date, period, business_unit, contractor, service_category,
         title, description, findings, recommendations, action_required,
         action_owner, action_due_date, rating, status, priority, reported_by, reported_by_email)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING id`,
      [
        ref_no,
        data.report_date,
        data.period || null,
        data.business_unit || null,
        data.contractor || null,
        data.service_category,
        data.title,
        data.description || null,
        data.findings || null,
        data.recommendations || null,
        data.action_required || null,
        data.action_owner || null,
        data.action_due_date || null,
        data.rating || null,
        data.status,
        data.priority,
        data.reported_by || null,
        data.reported_by_email || null,
      ],
    )
    revalidatePath('/')
    return { success: true, id: res.rows[0].id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
export async function updateServiceQualityReport(
  id: string,
  data: Partial<ServiceQualityFormData>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const fields = Object.keys(data).filter((k) => (data as any)[k] !== undefined)
    if (!fields.length) return { success: true }
    const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(', ')
    const values = fields.map((f) => (data as any)[f])
    await pool.query(
      `UPDATE public.service_quality_report SET ${sets}, updated_at = NOW() WHERE id = $1`,
      [id, ...values],
    )
    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
export async function deleteServiceQualityReport(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await pool.query(`DELETE FROM public.service_quality_report WHERE id = $1`, [id])
    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
