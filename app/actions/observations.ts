'use server'

import { pool } from '@/lib/db'
import { revalidateTag } from 'next/cache'
import { unstable_cache } from 'next/cache'

export async function getObservations() {
  return unstable_cache(
    async () => {
      try {
        const result = await pool.query(`
          SELECT 
            o.id,
            o."userId",
            o."observationTypeId",
            o."businessUnitId",
            o.description,
            o.severity,
            o.location,
            o.status,
            o."createdAt",
            o."updatedAt",
            e.name as created_by_name,
            e.email as created_by_email
          FROM public.observation o
          LEFT JOIN public.employee e ON o."userId" = e.id
          ORDER BY o."createdAt" DESC
        `)
        return result.rows
      } catch (error) {
        console.error('[v0] Error fetching observations:', error)
        return []
      }
    },
    ['observations-data'],
    { tags: ['observations'], revalidate: 60 }
  )()
}

export async function getInspections() {
  return unstable_cache(
    async () => {
      try {
        const result = await pool.query(`
          SELECT 
            i.id,
            i."userId",
            i."inspectionTypeId",
            i."businessUnitId",
            i.date,
            i.findings,
            i.status,
            i."createdAt",
            i."updatedAt",
            e.name as created_by_name,
            e.email as created_by_email
          FROM public.inspection i
          LEFT JOIN public.employee e ON i."userId" = e.id
          ORDER BY i."createdAt" DESC
        `)
        return result.rows
      } catch (error) {
        console.error('[v0] Error fetching inspections:', error)
        return []
      }
    },
    ['inspections-data'],
    { tags: ['inspections'], revalidate: 60 }
  )()
}

export async function createObservation(data: {
  userId: string
  observationTypeId: string
  businessUnitId: string
  description: string
  severity: string
  location: string
}) {
  try {
    console.log('[v0] Creating observation:', data)

    const result = await pool.query(
      `INSERT INTO public.observation (id, "userId", "observationTypeId", "businessUnitId", description, severity, location, status, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [data.userId, data.observationTypeId, data.businessUnitId, data.description, data.severity, data.location, 'Open']
    )

    console.log('[v0] Observation created:', result.rows[0].id)
    
    // Broadcast update to all users
    revalidateTag('observations')
    
    return {
      success: true,
      message: 'Observation created and shared with all users',
      data: result.rows[0],
    }
  } catch (error: any) {
    console.error('[v0] Error creating observation:', error)
    return {
      success: false,
      error: error.message || 'Failed to create observation',
    }
  }
}

export async function updateObservationStatus(observationId: string, status: string) {
  try {
    console.log('[v0] Updating observation status:', { observationId, status })

    const result = await pool.query(
      `UPDATE public.observation SET status = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *`,
      [status, observationId]
    )

    if (result.rows.length === 0) {
      throw new Error('Observation not found')
    }

    console.log('[v0] Observation status updated:', observationId)
    
    // Broadcast update to all users
    revalidateTag('observations')
    
    return {
      success: true,
      message: 'Observation updated and shared with all users',
      data: result.rows[0],
    }
  } catch (error: any) {
    console.error('[v0] Error updating observation:', error)
    return {
      success: false,
      error: error.message || 'Failed to update observation',
    }
  }
}
