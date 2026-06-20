'use server'

import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function addBusinessUnit(data: {
  name: string
  description: string
  email: string
  type: 'Group' | 'Business Unit'
  status: 'Active' | 'Inactive'
  manager?: string
}) {
  try {
    console.log('[v0] Adding business unit:', data)

    // Insert into a business_units table
    const result = await db.execute(
      sql`
        INSERT INTO business_units (name, description, email, type, status, manager, created_at, updated_at)
        VALUES (${data.name}, ${data.description}, ${data.email}, ${data.type}, ${data.status}, ${data.manager || null}, NOW(), NOW())
        RETURNING *
      `
    )

    console.log('[v0] Business unit added:', result.rows?.[0])
    return {
      success: true,
      message: 'Business unit added successfully',
      data: result.rows?.[0],
    }
  } catch (error: any) {
    console.error('[v0] Error adding business unit:', error)
    if (error.message?.includes('already exists')) {
      return {
        success: false,
        error: `A business unit with name ${data.name} already exists`,
      }
    }
    return {
      success: false,
      error: error.message || 'Failed to add business unit',
    }
  }
}

export async function updateBusinessUnit(id: string, data: Partial<typeof data>) {
  try {
    console.log('[v0] Updating business unit:', { id, ...data })

    const updates = Object.entries(data)
      .map(([key, value]) => `${key} = ${value === null ? 'NULL' : `'${value}'`}`)
      .join(', ')

    const result = await db.execute(
      sql`
        UPDATE business_units
        SET ${sql.raw(`${updates}, updated_at = NOW()`)}
        WHERE id = ${id}
        RETURNING *
      `
    )

    console.log('[v0] Business unit updated')
    return {
      success: true,
      message: 'Business unit updated successfully',
      data: result.rows?.[0],
    }
  } catch (error: any) {
    console.error('[v0] Error updating business unit:', error)
    return {
      success: false,
      error: error.message || 'Failed to update business unit',
    }
  }
}

export async function deleteBusinessUnit(id: string) {
  try {
    console.log('[v0] Deleting business unit:', id)

    await db.execute(sql`DELETE FROM business_units WHERE id = ${id}`)

    console.log('[v0] Business unit deleted')
    return {
      success: true,
      message: 'Business unit deleted successfully',
    }
  } catch (error: any) {
    console.error('[v0] Error deleting business unit:', error)
    return {
      success: false,
      error: error.message || 'Failed to delete business unit',
    }
  }
}
