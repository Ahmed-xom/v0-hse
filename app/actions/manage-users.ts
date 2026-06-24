'use server'

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'

export async function getUsers() {
  try {
    const rows = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        banned: user.banned,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(user.createdAt)

    return {
      success: true,
      data: rows.map((u) => ({
        id: u.id,
        name: u.name ?? '',
        email: u.email,
        role: (u.role as string) ?? 'USER',
        status: u.banned ? ('Inactive' as const) : ('Active' as const),
        banned: u.banned ?? false,
        createdAt: u.createdAt,
        // These come from employee table - fall back to empty strings
        payrollNo: '',
        designation: '',
        businessUnit: '',
      })),
    }
  } catch (error: any) {
    console.error('[v0] Error fetching users:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch users',
      data: [],
    }
  }
}

export async function updateUserStatus(
  userId: string,
  status: 'Active' | 'Inactive'
) {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
      }
    }

    // Update user status in database
    const isBanned = status === 'Inactive'
    await db
      .update(user)
      .set({
        banned: isBanned,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .execute()

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
    if (!userId || !role) {
      return {
        success: false,
        error: 'User ID and role are required',
      }
    }

    // Update user role in database
    await db
      .update(user)
      .set({
        role: role,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .execute()

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
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
      }
    }

    // Soft delete by banning the user
    await db
      .update(user)
      .set({
        banned: true,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .execute()

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
