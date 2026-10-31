'use server'

import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { verifyPassword } from '@better-auth/utils/password'
import { createAuthDiagnosticId, getAuthRuntimeContext } from '@/lib/auth/diagnostic'

export type PasswordVerificationResult =
  | { status: 'verified' }
  | { status: 'invalid' }
  | { status: 'unavailable'; requestId: string }

export async function verifyUserPassword(
  email: string,
  password: string,
  correlationId?: string,
): Promise<PasswordVerificationResult> {
  const requestId = createAuthDiagnosticId()
  const diagnosticId = correlationId || requestId

  if (!process.env.DATABASE_URL) {
    console.error('[auth] password verification unavailable', {
      requestId,
      diagnosticId,
      reason: 'database_url_missing',
      runtime: getAuthRuntimeContext(),
    })
    return { status: 'unavailable', requestId }
  }

  console.info('[auth] verification started', {
    requestId,
    diagnosticId,
    runtime: getAuthRuntimeContext(),
  })

  try {
    const result = await db.execute(sql`
      SELECT a.password, a."userId"
      FROM neon_auth."account" a
      JOIN neon_auth."user" u ON u.id = a."userId"
      WHERE lower(u.email) = ${email.trim().toLowerCase()}
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
      return { status: 'invalid' }
    }

    const verified = await Promise.all(
      rows.map((row: { password: string }) => verifyPassword(row.password, password)),
    ).then((results) => results.some(Boolean))

    if (!verified) {
      console.info('[auth] password verification denied', {
        requestId,
        diagnosticId,
        runtime: getAuthRuntimeContext(),
        reason: 'password_mismatch',
        userId: rows[0].userId,
      })
    }

    return verified ? { status: 'verified' } : { status: 'invalid' }
  } catch (error) {
    console.error('[auth] password verification error', {
      requestId,
      diagnosticId,
      runtime: getAuthRuntimeContext(),
      reason: 'database_or_hash_error',
      errorType: error instanceof Error ? error.name : 'unknown',
      errorCode: typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code)
        : undefined,
    })
    return { status: 'unavailable', requestId }
  }
}
