'use server'

import { Pool } from 'pg'
import { revalidatePath } from 'next/cache'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export type PTWStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Active' | 'Suspended' | 'Closed' | 'Cancelled'

export interface PermitToWork {
  id: string
  permit_no: string | null
  permit_type: string
  title: string
  work_description: string | null
  location: string | null
  business_unit: string | null
  work_start: string | null
  work_end: string | null
  requested_by: string | null
  requested_by_email: string | null
  approved_by: string | null
  approved_by_email: string | null
  status: PTWStatus
  priority: string
  hazards: string | null
  precautions: string | null
  ppe_required: string[]
  isolations_required: boolean
  hot_work: boolean
  confined_space: boolean
  working_at_height: boolean
  electrical_work: boolean
  excavation: boolean
  lifting_operations: boolean
  contractor: string | null
  contractor_supervisor: string | null
  close_reason: string | null
  created_at: string
  updated_at: string
}

export async function getPermits(): Promise<PermitToWork[]> {
  try {
    const res = await pool.query('SELECT * FROM public.permit_to_work ORDER BY created_at DESC')
    return res.rows
  } catch { return [] }
}

export async function createPermit(data: Partial<PermitToWork> & { title: string; permit_type: string }): Promise<{ success: boolean; id?: string; permit_no?: string }> {
  try {
    const year = new Date().getFullYear()
    const count = await pool.query("SELECT COUNT(*) FROM public.permit_to_work WHERE permit_no LIKE $1", [`PTW-${year}-%`])
    const seq = String(Number(count.rows[0].count) + 1).padStart(4, '0')
    const permit_no = `PTW-${year}-${seq}`

    const res = await pool.query(`
      INSERT INTO public.permit_to_work
        (permit_no, permit_type, title, work_description, location, business_unit,
         work_start, work_end, requested_by, requested_by_email, approved_by, approved_by_email,
         status, priority, hazards, precautions, ppe_required, isolations_required,
         hot_work, confined_space, working_at_height, electrical_work, excavation,
         lifting_operations, contractor, contractor_supervisor)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
      RETURNING id, permit_no
    `, [
      permit_no, data.permit_type, data.title, data.work_description ?? null, data.location ?? null,
      data.business_unit ?? null, data.work_start ?? null, data.work_end ?? null,
      data.requested_by ?? null, data.requested_by_email ?? null,
      data.approved_by ?? null, data.approved_by_email ?? null,
      data.status ?? 'Draft', data.priority ?? 'Medium',
      data.hazards ?? null, data.precautions ?? null, data.ppe_required ?? [],
      data.isolations_required ?? false, data.hot_work ?? false, data.confined_space ?? false,
      data.working_at_height ?? false, data.electrical_work ?? false, data.excavation ?? false,
      data.lifting_operations ?? false, data.contractor ?? null, data.contractor_supervisor ?? null,
    ])
    revalidatePath('/')
    return { success: true, id: res.rows[0].id, permit_no: res.rows[0].permit_no }
  } catch (e: any) {
    console.error('[ptw] create error:', e.message)
    return { success: false }
  }
}

export async function updatePermit(id: string, data: Partial<PermitToWork>): Promise<{ success: boolean }> {
  try {
    await pool.query(`
      UPDATE public.permit_to_work SET
        permit_type=$1, title=$2, work_description=$3, location=$4, business_unit=$5,
        work_start=$6, work_end=$7, requested_by=$8, requested_by_email=$9,
        approved_by=$10, approved_by_email=$11, status=$12, priority=$13,
        hazards=$14, precautions=$15, ppe_required=$16, isolations_required=$17,
        hot_work=$18, confined_space=$19, working_at_height=$20, electrical_work=$21,
        excavation=$22, lifting_operations=$23, contractor=$24, contractor_supervisor=$25,
        close_reason=$26, updated_at=NOW()
      WHERE id=$27
    `, [
      data.permit_type, data.title, data.work_description ?? null, data.location ?? null,
      data.business_unit ?? null, data.work_start ?? null, data.work_end ?? null,
      data.requested_by ?? null, data.requested_by_email ?? null,
      data.approved_by ?? null, data.approved_by_email ?? null,
      data.status, data.priority ?? 'Medium',
      data.hazards ?? null, data.precautions ?? null, data.ppe_required ?? [],
      data.isolations_required ?? false, data.hot_work ?? false, data.confined_space ?? false,
      data.working_at_height ?? false, data.electrical_work ?? false, data.excavation ?? false,
      data.lifting_operations ?? false, data.contractor ?? null, data.contractor_supervisor ?? null,
      data.close_reason ?? null, id,
    ])
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    console.error('[ptw] update error:', e.message)
    return { success: false }
  }
}

export async function deletePermit(id: string): Promise<{ success: boolean }> {
  try {
    await pool.query('DELETE FROM public.permit_to_work WHERE id=$1', [id])
    revalidatePath('/')
    return { success: true }
  } catch { return { success: false } }
}
