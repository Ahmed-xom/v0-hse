'use server'

import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { verifyPassword } from '@better-auth/utils/password'
import { createAuthDiagnosticId, getAuthRuntimeContext } from '@/lib/auth/diagnostic'

export type PasswordVerificationResult =
  | { ok: true; diagnosticId: string }
  | { ok: false; reason: 'credential_not_found' | 'password_mismatch' | 'verification_error'; diagnosticId: string }

export async function verifyUserPassword(email: string, password: string, correlationId?: string): Promise<PasswordVerificationResult> {
  const requestId = createAuthDiagnosticId()
  const diagnosticId = correlationId || requestId
  console.info('[auth] verification started', { requestId, diagnosticId, runtime: getAuthRuntimeContext() })

  try {
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
      return { ok: false, reason: 'credential_not_found', diagnosticId }
    }

    const results = await Promise.all(rows.map((row: { password: string }) => verifyPassword(row.password, password)))
    const verified = results.some(Boolean)

    if (!verified) {
      console.info('[auth] password verification denied', {
        requestId,
        diagnosticId,
        runtime: getAuthRuntimeContext(),
        reason: 'password_mismatch',
        userId: rows[0].userId,
      })
      return { ok: false, reason: 'password_mismatch', diagnosticId }
    }

    return { ok: true, diagnosticId }
  } catch (error) {
    console.error('[auth] password verification error', {
      requestId,
      diagnosticId,
      runtime: getAuthRuntimeContext(),
      reason: 'database_or_hash_error',
      errorType: error instanceof Error ? error.name : 'unknown',
    })
    return { ok: false, reason: 'verification_error', diagnosticId }
  }
}
