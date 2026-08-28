'use server'

import { pool } from '@/lib/db'
import { revalidateTag } from 'next/cache'
import { unstable_cache } from 'next/cache'
import { nanoid } from 'nanoid'

export type Incident = {
  id: string
  referenceNo: string
  title: string
  incidentType: string
  severity: string
  status: string
  date: string
  location: string | null
  businessUnit: string | null
  reportedBy: string | null
  reportedByEmail: string | null
  injuredPerson: string | null
  injuryType: string | null
  description: string | null
  immediateAction: string | null
  rootCause: string | null
  correctiveAction: string | null
  lostTimeDays: number
  nearMiss: boolean
  createdAt: string
  updatedAt: string
}

export async function getIncidents() {
  return unstable_cache(
    async () => {
      try {
        const result = await pool.query(`
          SELECT
            id,
            reference_no    AS "referenceNo",
            title,
            incident_type   AS "incidentType",
            severity,
            status,
            date,
            location,
            business_unit   AS "businessUnit",
            reported_by     AS "reportedBy",
            reported_by_email AS "reportedByEmail",
            injured_person  AS "injuredPerson",
            injury_type     AS "injuryType",
            description,
            immediate_action AS "immediateAction",
            root_cause      AS "rootCause",
            corrective_action AS "correctiveAction",
            COALESCE(lost_time_days, 0) AS "lostTimeDays",
            near_miss       AS "nearMiss",
            created_at      AS "createdAt",
            updated_at      AS "updatedAt"
          FROM public.incident
          ORDER BY date DESC
        `)
        return result.rows as Incident[]
      } catch (error) {
        console.error('[manage-incidents] getIncidents error:', error)
        return []
      }
    },
    ['incidents-data'],
    { tags: ['incidents'], revalidate: 60 }
  )()
}

export async function createIncident(data: {
  title: string
  incidentType: string
  severity: string
  date: string
  location?: string
  businessUnit?: string
  reportedBy?: string
  reportedByEmail?: string
  injuredPerson?: string
  injuryType?: string
  description?: string
  immediateAction?: string
  nearMiss?: boolean
  lostTimeDays?: number
}) {
  try {
    const id = nanoid()
    // Generate reference number: INC-YYYYMMDD-XXXX
    const now = new Date()
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '')
    const countResult = await pool.query(`SELECT COUNT(*) FROM public.incident WHERE date >= date_trunc('day', now())`)
    const seq = (parseInt(countResult.rows[0].count) + 1).toString().padStart(4, '0')
    const referenceNo = `INC-${datePart}-${seq}`

    await pool.query(
      `INSERT INTO public.incident (
        id, reference_no, title, incident_type, severity, status, date,
        location, business_unit, reported_by, reported_by_email,
        injured_person, injury_type, description, immediate_action,
        near_miss, lost_time_days, created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,'Open',$6,
        $7,$8,$9,$10,
        $11,$12,$13,$14,
        $15,$16,now(),now()
      )`,
      [
        id, referenceNo, data.title, data.incidentType, data.severity, data.date,
        data.location ?? null, data.businessUnit ?? null,
        data.reportedBy ?? null, data.reportedByEmail ?? null,
        data.injuredPerson ?? null, data.injuryType ?? null,
        data.description ?? null, data.immediateAction ?? null,
        data.nearMiss ?? false, data.lostTimeDays ?? 0,
      ]
    )
    revalidateTag('incidents', 'max')
    return { success: true, id, referenceNo }
  } catch (error: any) {
    console.error('[manage-incidents] createIncident error:', error)
    return { success: false, error: error.message }
  }
}

export async function updateIncident(id: string, data: Partial<{
  title: string
  incidentType: string
  severity: string
  status: string
  date: string
  location: string
  businessUnit: string
  reportedBy: string
  reportedByEmail: string
  injuredPerson: string
  injuryType: string
  description: string
  immediateAction: string
  rootCause: string
  correctiveAction: string
  lostTimeDays: number
  nearMiss: boolean
}>) {
  try {
    const fields: string[] = []
    const values: unknown[] = []
    let i = 1

    const map: Record<string, string> = {
      title: 'title',
      incidentType: 'incident_type',
      severity: 'severity',
      status: 'status',
      date: 'date',
      location: 'location',
      businessUnit: 'business_unit',
      reportedBy: 'reported_by',
      reportedByEmail: 'reported_by_email',
      injuredPerson: 'injured_person',
      injuryType: 'injury_type',
      description: 'description',
      immediateAction: 'immediate_action',
      rootCause: 'root_cause',
      correctiveAction: 'corrective_action',
      lostTimeDays: 'lost_time_days',
      nearMiss: 'near_miss',
    }

    for (const [key, col] of Object.entries(map)) {
      if (key in data) {
        fields.push(`${col} = $${i++}`)
        values.push((data as any)[key])
      }
    }

    if (fields.length === 0) return { success: true }

    fields.push(`updated_at = now()`)
    values.push(id)

    await pool.query(
      `UPDATE public.incident SET ${fields.join(', ')} WHERE id = $${i}`,
      values
    )
    revalidateTag('incidents', 'max')
    return { success: true }
  } catch (error: any) {
    console.error('[manage-incidents] updateIncident error:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteIncident(id: string) {
  try {
    await pool.query(`DELETE FROM public.incident WHERE id = $1`, [id])
    revalidateTag('incidents', 'max')
    return { success: true }
  } catch (error: any) {
    console.error('[manage-incidents] deleteIncident error:', error)
    return { success: false, error: error.message }
  }
}
