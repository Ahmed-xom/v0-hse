'use server'

import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { verifyPassword } from '@better-auth/utils/password'

export async function verifyUserPassword(email: string, password: string): Promise<boolean> {
  const requestId = crypto.randomUUID()

  try {
    // Look up the hashed password from neon_auth.account for this user
    const result = await db.execute(sql`
      SELECT a.password, a."userId"
      FROM neon_auth."account" a
      JOIN neon_auth."user" u ON u.id = a."userId"
      WHERE lower(u.email) = ${email.toLowerCase()}
        AND a."providerId" = 'credential'
      LIMIT 1
    `)

    const rows = (result as any).rows ?? []

    if (rows.length === 0 || !rows[0].password) {
      console.info('[auth] password verification denied', {
        requestId,
        reason: 'credential_not_found',
      })
      return false
    }

    // Better Auth 1.7.2 stores credential hashes using its scrypt verifier.
    const verified = await verifyPassword(rows[0].password, password)

    if (!verified) {
      console.info('[auth] password verification denied', {
        requestId,
        reason: 'password_mismatch',
        userId: rows[0].userId,
      })
    }

    return verified
  } catch (error) {
    console.error('[auth] password verification error', {
      requestId,
      reason: 'database_or_hash_error',
      errorType: error instanceof Error ? error.name : 'unknown',
    })
    return false
  }
}
