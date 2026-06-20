'use server'

import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function addMasterCategory(data: {
  name: string
  description: string
  icon: string
  color?: string
}) {
  try {
    console.log('[v0] Adding master category:', data)

    const result = await db.execute(
      sql`
        INSERT INTO master_categories (name, description, icon, color, created_at, updated_at)
        VALUES (${data.name}, ${data.description}, ${data.icon}, ${data.color || null}, NOW(), NOW())
        RETURNING *
      `
    )

    console.log('[v0] Master category added:', result.rows?.[0])
    return {
      success: true,
      message: 'Master category added successfully',
      data: result.rows?.[0],
    }
  } catch (error: any) {
    console.error('[v0] Error adding master category:', error)
    return {
      success: false,
      error: error.message || 'Failed to add master category',
    }
  }
}

export async function addMasterSection(data: {
  categoryId: string
  name: string
  description: string
  itemCount?: number
}) {
  try {
    console.log('[v0] Adding master section:', data)

    const result = await db.execute(
      sql`
        INSERT INTO master_sections (category_id, name, description, item_count, created_at, updated_at)
        VALUES (${data.categoryId}, ${data.name}, ${data.description}, ${data.itemCount || 0}, NOW(), NOW())
        RETURNING *
      `
    )

    console.log('[v0] Master section added:', result.rows?.[0])
    return {
      success: true,
      message: 'Master section added successfully',
      data: result.rows?.[0],
    }
  } catch (error: any) {
    console.error('[v0] Error adding master section:', error)
    return {
      success: false,
      error: error.message || 'Failed to add master section',
    }
  }
}

export async function updateMasterItem(id: string, data: Partial<any>) {
  try {
    console.log('[v0] Updating master item:', { id, ...data })

    const updates = Object.entries(data)
      .map(([key, value]) => `${key} = ${value === null ? 'NULL' : `'${value}'`}`)
      .join(', ')

    const result = await db.execute(
      sql`
        UPDATE master_items
        SET ${sql.raw(`${updates}, updated_at = NOW()`)}
        WHERE id = ${id}
        RETURNING *
      `
    )

    console.log('[v0] Master item updated')
    return {
      success: true,
      message: 'Master item updated successfully',
      data: result.rows?.[0],
    }
  } catch (error: any) {
    console.error('[v0] Error updating master item:', error)
    return {
      success: false,
      error: error.message || 'Failed to update master item',
    }
  }
}

export async function deleteMasterItem(id: string) {
  try {
    console.log('[v0] Deleting master item:', id)

    await db.execute(sql`DELETE FROM master_items WHERE id = ${id}`)

    console.log('[v0] Master item deleted')
    return {
      success: true,
      message: 'Master item deleted successfully',
    }
  } catch (error: any) {
    console.error('[v0] Error deleting master item:', error)
    return {
      success: false,
      error: error.message || 'Failed to delete master item',
    }
  }
}
