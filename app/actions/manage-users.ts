'use server'

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'

export async function updateUserStatus(
  userId: string,
  status: 'Active' | 'Inactive'
) {
  try {
    console.log('[v0] Updating user status:', { userId, status })

    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
      }
    }

    // Update user status in database
    const isBanned = status === 'Inactive'
    const result = await db
      .update(user)
      .set({
        banned: isBanned,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .returning()

    console.log('[v0] User status updated:', result[0])
    return {
      success: true,
      message: `User status changed to ${status}`,
      data: result[0],
    }
  } catch (error: any) {
    console.error('[v0] Error updating user status:', error)
    return {
      success: false,
      error: error.message || 'Failed to update user status',
    }
  }
}

export async function updateUserRole(
  userId: string,
  role: string
) {
  try {
    console.log('[v0] Updating user role:', { userId, role })

    if (!userId || !role) {
      return {
        success: false,
        error: 'User ID and role are required',
      }
    }

    // Update user role in database
    const result = await db
      .update(user)
      .set({
        role: role,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .returning()

    console.log('[v0] User role updated:', result[0])
    return {
      success: true,
      message: `User role changed to ${role}`,
      data: result[0],
    }
  } catch (error: any) {
    console.error('[v0] Error updating user role:', error)
    return {
      success: false,
      error: error.message || 'Failed to update user role',
    }
  }
}

export async function deleteUser(userId: string) {
  try {
    console.log('[v0] Deleting user:', userId)

    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
      }
    }

    // Soft delete by banning the user
    const result = await db
      .update(user)
      .set({
        banned: true,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .returning()

    console.log('[v0] User deleted:', result[0])
    return {
      success: true,
      message: 'User deleted successfully',
      data: result[0],
    }
  } catch (error: any) {
    console.error('[v0] Error deleting user:', error)
    return {
      success: false,
      error: error.message || 'Failed to delete user',
    }
  }
}

export async function exportUsersToExcel(users: any[]) {
  try {
    console.log('[v0] Exporting users to Excel:', users.length, 'users')

    if (!users || users.length === 0) {
      return {
        success: false,
        error: 'No users to export',
      }
    }

    // Create CSV content
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Business Unit', 'Designation', 'Payroll No', 'Created Date']
    
    const csvContent = [
      headers.join(','),
      ...users.map((user) =>
        [
          user.id || '',
          `"${user.name || ''}"`,
          user.email || '',
          user.role || '',
          user.status || 'Active',
          user.businessUnit || '',
          user.designation || '',
          user.payrollNo || '',
          user.createdAt || new Date().toISOString(),
        ].join(',')
      ),
    ].join('\n')

    console.log('[v0] CSV generated successfully')
    return {
      success: true,
      message: 'Users exported successfully',
      data: csvContent,
    }
  } catch (error: any) {
    console.error('[v0] Error exporting users:', error)
    return {
      success: false,
      error: error.message || 'Failed to export users',
    }
  }
}
