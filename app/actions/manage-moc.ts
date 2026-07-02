'use server'

import { Pool } from 'pg'
import { revalidatePath } from 'next/cache'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export type MOCStatus = 'Draft' | 'Under Review' | 'Approved' | 'Rejected' | 'Implemented' | 'Closed' | 'Cancelled'

export interface MOC {
  id: string
  moc_no: string | null
  moc_type: string
  title: string
  description: string | null
  reason: string | null
  business_unit: string | null
  location: string | null
  initiator: string | null
  initiator_email: string | null
  approver: string | null
  approver_email: string | null
  risk_level: string
  status: MOCStatus
  implementation_date: string | null
  review_date: string | null
  expiry_date: string | null
  hse_impact: string | null
  environmental_impact: string | null
  operational_impact: string | null
  mitigations: string | null
  lessons_learned: string | null
  created_at: string
  updated_at: string
}

export async function getMOCs(): Promise<MOC[]> {
  try {
    const res = await pool.query('SELECT * FROM public.moc ORDER BY created_at DESC')
    return res.rows
  } catch { return [] }
}

export async function createMOC(data: Partial<MOC> & { title: string; moc_type: string }): Promise<{ success: boolean; id?: string; moc_no?: string }> {
  try {
    const year = new Date().getFullYear()
    const count = await pool.query("SELECT COUNT(*) FROM public.moc WHERE moc_no LIKE $1", [`MOC-${year}-%`])
    const seq = String(Number(count.rows[0].count) + 1).padStart(4, '0')
    const moc_no = `MOC-${year}-${seq}`

    const res = await pool.query(`
      INSERT INTO public.moc
        (moc_no, moc_type, title, description, reason, business_unit, location,
         initiator, initiator_email, approver, approver_email, risk_level, status,
         implementation_date, review_date, expiry_date, hse_impact, environmental_impact,
         operational_impact, mitigations, lessons_learned)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
      RETURNING id, moc_no
    `, [
      moc_no, data.moc_type, data.title, data.description ?? null, data.reason ?? null,
      data.business_unit ?? null, data.location ?? null,
      data.initiator ?? null, data.initiator_email ?? null,
      data.approver ?? null, data.approver_email ?? null,
      data.risk_level ?? 'Medium', data.status ?? 'Draft',
      data.implementation_date ?? null, data.review_date ?? null, data.expiry_date ?? null,
      data.hse_impact ?? null, data.environmental_impact ?? null,
      data.operational_impact ?? null, data.mitigations ?? null, data.lessons_learned ?? null,
    ])
    revalidatePath('/')
    return { success: true, id: res.rows[0].id, moc_no: res.rows[0].moc_no }
  } catch (e: any) {
    console.error('[moc] create error:', e.message)
    return { success: false }
  }
}

export async function updateMOC(id: string, data: Partial<MOC>): Promise<{ success: boolean }> {
  try {
    await pool.query(`
      UPDATE public.moc SET
        moc_type=$1, title=$2, description=$3, reason=$4, business_unit=$5, location=$6,
        initiator=$7, initiator_email=$8, approver=$9, approver_email=$10,
        risk_level=$11, status=$12, implementation_date=$13, review_date=$14, expiry_date=$15,
        hse_impact=$16, environmental_impact=$17, operational_impact=$18,
        mitigations=$19, lessons_learned=$20, updated_at=NOW()
      WHERE id=$21
    `, [
      data.moc_type, data.title, data.description ?? null, data.reason ?? null,
      data.business_unit ?? null, data.location ?? null,
      data.initiator ?? null, data.initiator_email ?? null,
      data.approver ?? null, data.approver_email ?? null,
      data.risk_level ?? 'Medium', data.status,
      data.implementation_date ?? null, data.review_date ?? null, data.expiry_date ?? null,
      data.hse_impact ?? null, data.environmental_impact ?? null,
      data.operational_impact ?? null, data.mitigations ?? null, data.lessons_learned ?? null,
      id,
    ])
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    console.error('[moc] update error:', e.message)
    return { success: false }
  }
}

export async function deleteMOC(id: string): Promise<{ success: boolean }> {
  try {
    await pool.query('DELETE FROM public.moc WHERE id=$1', [id])
    revalidatePath('/')
    return { success: true }
  } catch { return { success: false } }
}
