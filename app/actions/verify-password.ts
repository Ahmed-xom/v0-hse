'use server'

import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

const DEFAULT_PASSWORD = 'Xom@2026'

export async function verifyUserPassword(email: string, password: string): Promise<boolean> {
  try {
    // Look up the hashed password from neon_auth.account for this user
    const result = await db.execute(sql`
      SELECT a.password
      FROM neon_auth."account" a
      JOIN neon_auth."user" u ON u.id = a."userId"
      WHERE lower(u.email) = ${email.toLowerCase()}
        AND a."providerId" = 'credential'
      LIMIT 1
    `)

    const rows = (result as any).rows ?? []

    if (rows.length > 0 && rows[0].password) {
      // Compare against the hashed password stored in DB
      return bcrypt.compare(password, rows[0].password)
    }

    // No hashed password in DB yet — fall back to the default password
    return password === DEFAULT_PASSWORD
  } catch {
    // On any error fall back to the default password so existing users aren't locked out
    return password === DEFAULT_PASSWORD
  }
}
