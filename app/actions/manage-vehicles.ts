'use server'

import { pool } from '@/lib/db'
import { revalidateTag } from 'next/cache'

export interface Vehicle {
  id: number
  plate_no: string
  vehicle_type: string
  expiry_date: string | null
  allowable_load: string
  km_reading: string
  description: string
  is_active: boolean
  created_at: string
}

export async function getVehicles(): Promise<{ success: boolean; data?: Vehicle[]; error?: string }> {
  try {
    const result = await pool.query(
      `SELECT id, plate_no, vehicle_type, expiry_date, allowable_load, km_reading, description, is_active, created_at
       FROM public.vehicle
       ORDER BY is_active DESC, id ASC`
    )
    return { success: true, data: result.rows as Vehicle[] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createVehicle(input: {
  plate_no: string
  vehicle_type: string
  expiry_date: string
  allowable_load: string
  km_reading: string
  description: string
}): Promise<{ success: boolean; data?: Vehicle; error?: string }> {
  try {
    if (!input.plate_no?.trim()) return { success: false, error: 'Plate number is required' }
    if (!input.vehicle_type?.trim()) return { success: false, error: 'Vehicle type is required' }

    const result = await pool.query(
      `INSERT INTO public.vehicle (plate_no, vehicle_type, expiry_date, allowable_load, km_reading, description, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
       RETURNING *`,
      [
        input.plate_no.trim(),
        input.vehicle_type.trim(),
        input.expiry_date || null,
        input.allowable_load?.trim() || '',
        input.km_reading?.trim() || '0',
        input.description?.trim() || '',
      ]
    )
    revalidateTag('vehicles', 'max')
    return { success: true, data: result.rows[0] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateVehicle(
  id: number,
  input: {
    plate_no?: string
    vehicle_type?: string
    expiry_date?: string
    allowable_load?: string
    km_reading?: string
    description?: string
    is_active?: boolean
  }
): Promise<{ success: boolean; data?: Vehicle; error?: string }> {
  try {
    if (!id) return { success: false, error: 'Vehicle ID is required' }

    const result = await pool.query(
      `UPDATE public.vehicle
       SET plate_no      = COALESCE($1, plate_no),
           vehicle_type  = COALESCE($2, vehicle_type),
           expiry_date   = COALESCE($3::date, expiry_date),
           allowable_load= COALESCE($4, allowable_load),
           km_reading    = COALESCE($5, km_reading),
           description   = COALESCE($6, description),
           is_active     = COALESCE($7, is_active)
       WHERE id = $8
       RETURNING *`,
      [
        input.plate_no?.trim() ?? null,
        input.vehicle_type?.trim() ?? null,
        input.expiry_date || null,
        input.allowable_load?.trim() ?? null,
        input.km_reading?.trim() ?? null,
        input.description?.trim() ?? null,
        input.is_active ?? null,
        id,
      ]
    )
    if (result.rows.length === 0) return { success: false, error: 'Vehicle not found' }
    revalidateTag('vehicles', 'max')
    return { success: true, data: result.rows[0] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteVehicle(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await pool.query(`DELETE FROM public.vehicle WHERE id = $1 RETURNING id`, [id])
    if (result.rows.length === 0) return { success: false, error: 'Vehicle not found' }
    revalidateTag('vehicles', 'max')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function toggleVehicleStatus(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    await pool.query(`UPDATE public.vehicle SET is_active = NOT is_active WHERE id = $1`, [id])
    revalidateTag('vehicles', 'max')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
