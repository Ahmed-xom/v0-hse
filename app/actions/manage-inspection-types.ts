'use server'

import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function addInspectionType(data: {
  name: string
  description: string
  category: string
  frequency?: string
  status: 'Active' | 'Inactive'
}) {
  try {
    console.log('[v0] Adding inspection type:', data)

    const result = await db.execute(
      sql`
        INSERT INTO inspection_types (name, description, category, frequency, status, created_at, updated_at)
        VALUES (${data.name}, ${data.description}, ${data.category}, ${data.frequency || null}, ${data.status}, NOW(), NOW())
        RETURNING *
      `
    )

    console.log('[v0] Inspection type added:', result.rows?.[0])
    return {
      success: true,
      message: 'Inspection type added successfully',
      data: result.rows?.[0],
    }
  } catch (error: any) {
    console.error('[v0] Error adding inspection type:', error)
    return {
      success: false,
      error: error.message || 'Failed to add inspection type',
    }
  }
}

export async function updateInspectionType(id: string, data: Partial<typeof data>) {
  try {
    console.log('[v0] Updating inspection type:', { id, ...data })

    const updates = Object.entries(data)
      .map(([key, value]) => `${key} = ${value === null ? 'NULL' : `'${value}'`}`)
      .join(', ')

    const result = await db.execute(
      sql`
        UPDATE inspection_types
        SET ${sql.raw(`${updates}, updated_at = NOW()`)}
        WHERE id = ${id}
        RETURNING *
      `
    )

    console.log('[v0] Inspection type updated')
    return {
      success: true,
      message: 'Inspection type updated successfully',
      data: result.rows?.[0],
    }
  } catch (error: any) {
    console.error('[v0] Error updating inspection type:', error)
    return {
      success: false,
      error: error.message || 'Failed to update inspection type',
    }
  }
}

export async function deleteInspectionType(id: string) {
  try {
    console.log('[v0] Deleting inspection type:', id)

    await db.execute(sql`DELETE FROM inspection_types WHERE id = ${id}`)

    console.log('[v0] Inspection type deleted')
    return {
      success: true,
      message: 'Inspection type deleted successfully',
    }
  } catch (error: any) {
    console.error('[v0] Error deleting inspection type:', error)
    return {
      success: false,
      error: error.message || 'Failed to delete inspection type',
    }
  }
}
