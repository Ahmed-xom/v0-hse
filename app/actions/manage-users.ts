'use server'

import { eq, sql } from 'drizzle-orm'
import { db, pool } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { revalidateTag } from 'next/cache'

export async function getUsers() {
  try {
    // Join neon_auth.user with public.employee by email to get designation,
    // payroll_no and business_unit
    const rows = await db.execute(sql`
      SELECT
        u.id::text          AS id,
        u.name              AS name,
        u.email             AS email,
        u.role              AS role,
        u.banned            AS banned,
        u."createdAt"       AS "createdAt",
        COALESCE(u.approver, '')      AS approver,
        COALESCE(e.payroll_no, '')    AS "payrollNo",
        COALESCE(e.designation, '')   AS designation,
        COALESCE(e.business_unit, '') AS "businessUnit"
      FROM neon_auth.user u
      LEFT JOIN public.employee e ON lower(e.email) = lower(u.email)
      ORDER BY u."createdAt" ASC
    `)

    return {
      success: true,
      data: (rows.rows as any[]).map((u) => ({
        id: u.id as string,
        name: (u.name as string) ?? '',
        email: u.email as string,
        role: (u.role as string) ?? 'USER',
        status: u.banned ? ('Inactive' as const) : ('Active' as const),
        banned: Boolean(u.banned),
        createdAt: u.createdAt,
        payrollNo: (u.payrollNo as string) ?? '',
        designation: (u.designation as string) ?? '',
        businessUnit: (u.businessUnit as string) ?? '',
        approver: (u.approver as string) ?? '',
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

    // Update user status in employee table
    const now = new Date().toISOString()
    const result = await pool.query(
      'UPDATE public."employee" SET "updated_at" = $1, "status" = $2 WHERE id = $3 RETURNING id',
      [now, status, userId]
    )
    
    if (result.rows.length === 0) {
      throw new Error('User not found')
    }

    revalidateTag('users', 'max')
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

    // Update user role in employee table
    const now = new Date().toISOString()
    const result = await pool.query(
      'UPDATE public."employee" SET "updated_at" = $1, "hse_role" = $2 WHERE id = $3 RETURNING id',
      [now, role, userId]
    )
    
    if (result.rows.length === 0) {
      throw new Error('User not found')
    }

    revalidateTag('users', 'max')
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

    // Soft delete by setting status to Inactive in employee table
    const now = new Date().toISOString()
    const result = await pool.query(
      'UPDATE public."employee" SET "updated_at" = $1, "status" = $2 WHERE id = $3 RETURNING id',
      [now, 'Inactive', userId]
    )
    
    if (result.rows.length === 0) {
      throw new Error('User not found')
    }

    revalidateTag('users', 'max')
    return {
      success: true,
      message: 'User deleted successfully - all observations updated',
    }
  } catch (error: any) {
    console.error('[v0] Error deleting user:', error)
    return {
      success: false,
      error: error.message || 'Failed to delete user',
    }
  }
}

export async function updateUserApprover(userId: string, approver: string) {
  try {
    if (!userId) return { success: false, error: 'User ID is required' }
    await db.execute(sql`
      UPDATE neon_auth.user SET approver = ${approver || null}
      WHERE id = ${userId}::uuid
    `)
    revalidateTag('users', 'max')
    return { success: true }
  } catch (error: any) {
    console.error('[v0] Error updating approver:', error)
    return { success: false, error: error.message }
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
