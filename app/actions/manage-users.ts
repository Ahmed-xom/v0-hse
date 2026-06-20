'use server'

import { pool } from '@/lib/db'

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

    // Update user status in database using neon_auth schema
    const isBanned = status === 'Inactive'
    const now = new Date().toISOString()
    await pool.query(
      'UPDATE neon_auth."user" SET "updatedAt" = $1, "banned" = $2 WHERE id = $3',
      [now, isBanned, userId]
    )

    console.log('[v0] User status updated:', { userId, status })
    return {
      success: true,
      message: `User status changed to ${status}`,
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

    // Update user role in database using neon_auth schema
    const now = new Date().toISOString()
    await pool.query(
      'UPDATE neon_auth."user" SET "updatedAt" = $1, "role" = $2 WHERE id = $3',
      [now, role, userId]
    )

    console.log('[v0] User role updated:', { userId, role })
    return {
      success: true,
      message: `User role changed to ${role}`,
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

    // Soft delete by banning the user using neon_auth schema
    const now = new Date().toISOString()
    await pool.query(
      'UPDATE neon_auth."user" SET "updatedAt" = $1, "banned" = true WHERE id = $2',
      [now, userId]
    )

    console.log('[v0] User deleted:', { userId })
    return {
      success: true,
      message: 'User deleted successfully',
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
