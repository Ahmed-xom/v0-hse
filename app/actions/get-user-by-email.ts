'use server'

import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { createAuthDiagnosticId, getAuthRuntimeContext } from '@/lib/auth/diagnostic'

export interface DbUser {
  id: string
  name: string
  email: string
  role: string
  banned: boolean
  payrollNo: string
  designation: string
  businessUnit: string
  status: string
}

export type UserLookupResult =
  | { status: 'found'; user: DbUser }
  | { status: 'not_found' }
  | { status: 'unavailable'; requestId: string }

export async function getUserByEmail(email: string): Promise<UserLookupResult> {
  const requestId = createAuthDiagnosticId()

  if (!process.env.DATABASE_URL) {
    console.error('[auth] user lookup unavailable', {
      requestId,
      reason: 'database_url_missing',
      runtime: getAuthRuntimeContext(),
    })
    return { status: 'unavailable', requestId }
  }

  try {
    const result = await db.execute(sql`
      SELECT
        u.id::text            AS id,
        u.name                AS name,
        u.email               AS email,
        COALESCE(u.role, 'USER') AS role,
        COALESCE(u.banned, false) AS banned,
        COALESCE(e.payroll_no, '')    AS "payrollNo",
        COALESCE(e.designation, '')   AS designation,
        COALESCE(e.business_unit, '') AS "businessUnit",
        COALESCE(e.status, 'Active')  AS status
      FROM neon_auth.user u
      LEFT JOIN public.employee e ON lower(e.email) = lower(u.email)
      WHERE lower(u.email) = ${email.trim().toLowerCase()}
      LIMIT 1
    `)

    const rows = (result as any).rows ?? []
    if (rows.length === 0) return { status: 'not_found' }

    const row = rows[0]
    return {
      status: 'found',
      user: {
        id: row.id,
        name: row.name ?? '',
        email: row.email ?? '',
        role: row.role ?? 'USER',
        banned: row.banned ?? false,
        payrollNo: row.payrollNo ?? '',
        designation: row.designation ?? '',
        businessUnit: row.businessUnit ?? '',
        status: row.status ?? 'Active',
      },
    }
  } catch (error) {
    console.error('[auth] user lookup failed', {
      requestId,
      reason: 'database_query_failed',
      errorType: error instanceof Error ? error.name : 'unknown',
      errorCode: typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code)
        : undefined,
      runtime: getAuthRuntimeContext(),
    })
    return { status: 'unavailable', requestId }
  }
}
