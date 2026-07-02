'use server'

import { Pool } from 'pg'
import { revalidatePath } from 'next/cache'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export type InspectionType = 'Management Visit' | 'Audit' | 'HSE Inspection' | 'Site Inspection'
export type InspectionStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue' | 'Cancelled'
export type InspectionPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export interface Inspection {
  id: string
  ref_no: string | null
  inspection_type: InspectionType
  title: string
  location: string | null
  business_unit: string | null
  inspector_name: string | null
  inspector_email: string | null
  date: string
  scheduled_date: string | null
  status: InspectionStatus
  findings: string | null
  recommendations: string | null
  action_required: string | null
  action_owner: string | null
  action_due_date: string | null
  priority: InspectionPriority
  total_findings: number
  critical_findings: number
  completion_rate: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export async function getInspections(filter?: {
  type?: string
  status?: string
  search?: string
}): Promise<Inspection[]> {
  try {
    let query = `SELECT * FROM public.inspection_v2 WHERE 1=1`
    const params: any[] = []
    let idx = 1

    if (filter?.type && filter.type !== 'all') {
      query += ` AND inspection_type = $${idx++}`
      params.push(filter.type)
    }
    if (filter?.status && filter.status !== 'all') {
      query += ` AND status = $${idx++}`
      params.push(filter.status)
    }
    if (filter?.search) {
      query += ` AND (title ILIKE $${idx} OR location ILIKE $${idx} OR inspector_name ILIKE $${idx})`
      params.push(`%${filter.search}%`)
      idx++
    }
    query += ` ORDER BY date DESC`

    const result = await pool.query(query, params)
    return result.rows.map((r) => ({
      ...r,
      date: r.date ? new Date(r.date).toISOString() : '',
      scheduled_date: r.scheduled_date ? new Date(r.scheduled_date).toISOString() : null,
      action_due_date: r.action_due_date ? new Date(r.action_due_date).toISOString() : null,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : '',
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : '',
    }))
  } catch (e: any) {
    console.error('[v0] getInspections error:', e.message)
    return []
  }
}

export async function createInspection(data: {
  inspection_type: InspectionType
  title: string
  location?: string
  business_unit?: string
  inspector_name?: string
  inspector_email?: string
  date: string
  scheduled_date?: string
  status?: InspectionStatus
  findings?: string
  recommendations?: string
  action_required?: string
  action_owner?: string
  action_due_date?: string
  priority?: InspectionPriority
  total_findings?: number
  critical_findings?: number
  completion_rate?: number
  created_by?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const ref_no = `INS-${Date.now().toString().slice(-6)}`
    const result = await pool.query(
      `INSERT INTO public.inspection_v2
        (ref_no, inspection_type, title, location, business_unit, inspector_name, inspector_email,
         date, scheduled_date, status, findings, recommendations, action_required, action_owner,
         action_due_date, priority, total_findings, critical_findings, completion_rate, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING id`,
      [
        ref_no,
        data.inspection_type,
        data.title,
        data.location ?? null,
        data.business_unit ?? null,
        data.inspector_name ?? null,
        data.inspector_email ?? null,
        data.date,
        data.scheduled_date ?? null,
        data.status ?? 'Scheduled',
        data.findings ?? null,
        data.recommendations ?? null,
        data.action_required ?? null,
        data.action_owner ?? null,
        data.action_due_date ?? null,
        data.priority ?? 'Medium',
        data.total_findings ?? 0,
        data.critical_findings ?? 0,
        data.completion_rate ?? 0,
        data.created_by ?? null,
      ]
    )
    revalidatePath('/')
    return { success: true, id: result.rows[0].id }
  } catch (e: any) {
    console.error('[v0] createInspection error:', e.message)
    return { success: false, error: e.message }
  }
}

export async function updateInspection(
  id: string,
  data: Partial<Omit<Inspection, 'id' | 'ref_no' | 'created_at'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const fields = Object.keys(data)
      .map((k, i) => `${k} = $${i + 2}`)
      .join(', ')
    const values = Object.values(data)
    await pool.query(
      `UPDATE public.inspection_v2 SET ${fields}, updated_at = NOW() WHERE id = $1`,
      [id, ...values]
    )
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    console.error('[v0] updateInspection error:', e.message)
    return { success: false, error: e.message }
  }
}

export async function deleteInspection(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await pool.query('DELETE FROM public.inspection_v2 WHERE id = $1', [id])
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
