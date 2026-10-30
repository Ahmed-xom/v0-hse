'use server'

import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { verifyCompatiblePassword } from '@/lib/auth/password-compatibility'
import { selectCredentialAccount } from '@/lib/auth/legacy-credential-adapter'
import { createAuthDiagnosticId, getAuthRuntimeContext } from '@/lib/auth/diagnostic'

export async function verifyUserPassword(email: string, password: string, correlationId?: string): Promise<boolean> {
  const requestId = createAuthDiagnosticId()
  const diagnosticId = correlationId || requestId
  console.info('[auth] verification started', { requestId, diagnosticId, runtime: getAuthRuntimeContext() })

  try {
    const result = await db.execute(sql`
      SELECT a.id, a.password, a."userId", a."accountId", a."providerId", a."updatedAt", u.email
      FROM neon_auth."account" a
      JOIN neon_auth."user" u ON u.id = a."userId"
      WHERE lower(u.email) = ${email.trim().toLowerCase()}
        AND a."providerId" = 'credential'
    `)

    const rows = (result as unknown as { rows?: Record<string, unknown>[] }).rows ?? []
    const identity = rows[0]
    const selected = identity && rows.every((row) => row.userId === identity.userId)
      ? selectCredentialAccount({ id: identity.userId, email: identity.email }, rows)
      : null

    if (!selected || typeof selected.password !== 'string' || !selected.password) {
      console.info('[auth] password verification denied', {
        requestId,
        diagnosticId,
        runtime: getAuthRuntimeContext(),
        reason: 'credential_not_found',
        rowCount: rows.length,
      })
      return false
    }

    const verified = await verifyCompatiblePassword({ hash: selected.password, password })

    if (!verified) {
      console.info('[auth] password verification denied', {
        requestId,
        diagnosticId,
        runtime: getAuthRuntimeContext(),
        reason: 'password_mismatch',
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
