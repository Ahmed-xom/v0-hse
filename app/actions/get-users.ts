'use server'

import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function getRealUsers() {
  try {
    const result = await db.execute(sql`
      SELECT 
        id, 
        email, 
        name,
        "emailVerified"
      FROM neon_auth."user"
      ORDER BY name ASC
    `)

    const rows = ((result as any).rows || []) as any[]
    
    // Transform to match User type
    const users = rows.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name || 'Unknown',
      status: user.emailVerified ? 'Active' : 'Inactive',
      role: 'USER',
      designation: '',
      businessUnit: 'XOM Oman',
      payrollNo: '',
    }))

    return { success: true, users, error: null }
  } catch (error) {
    console.error('[v0] Error fetching users:', error)
    return { success: false, users: [], error: (error as Error).message }
  }
}
