'use server'

import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { verifyCompatiblePassword } from '@/lib/auth/password-compatibility'
import { createAuthDiagnosticId, getAuthRuntimeContext } from '@/lib/auth/diagnostic'

export async function verifyUserPassword(email: string, password: string, correlationId?: string): Promise<boolean> {
  const requestId = createAuthDiagnosticId()
  const diagnosticId = correlationId || requestId
  console.info('[auth] verification started', { requestId, diagnosticId, runtime: getAuthRuntimeContext() })

  try {
    // Look up the hashed password from neon_auth.account for this user
    const result = await db.execute(sql`
      SELECT a.password, a."userId"
      FROM neon_auth."account" a
      JOIN neon_auth."user" u ON u.id = a."userId"
      WHERE lower(u.email) = ${email.toLowerCase()}
        AND a."providerId" = 'credential'
    `)

    const rows = (result as any).rows ?? []

    if (rows.length === 0 || rows.some((row: { password?: string }) => !row.password)) {
      console.info('[auth] password verification denied', {
        requestId,
        diagnosticId,
        runtime: getAuthRuntimeContext(),
        reason: 'credential_not_found',
        rowCount: rows.length,
      })
      return false
    }

    // Better Auth 1.7.2 stores credential hashes using its scrypt verifier.
    // Legacy data can contain duplicate rows for the same user/account; accept
    // the password if any credential row verifies successfully.
    const verified = await Promise.all(rows.map((row: { password: string }) => verifyCompatiblePassword({ hash: row.password, password }))).then((results) => results.some(Boolean))

    if (!verified) {
      console.info('[auth] password verification denied', {
        requestId,
        diagnosticId,
        runtime: getAuthRuntimeContext(),
        reason: 'password_mismatch',
        userId: rows[0].userId,
      })
    }

    return verified
  } catch (error) {
    console.error('[auth] password verification error', {
      requestId,
      diagnosticId,
      runtime: getAuthRuntimeContext(),
      reason: 'database_or_hash_error',
      errorType: error instanceof Error ? error.name : 'unknown',
    })
    return false
  }
}
