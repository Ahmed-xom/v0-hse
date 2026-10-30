'use server'

import crypto from 'crypto'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'

async function getCurrentUser(actorEmail?: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) {
    const result = await pool.query('SELECT id, role FROM neon_auth.user WHERE id = $1 LIMIT 1', [session.user.id])
    if (result.rows[0]) return { id: session.user.id, role: result.rows[0].role as string }
  }
  if (actorEmail) {
    const result = await pool.query('SELECT id, role FROM neon_auth.user WHERE lower(email) = lower($1) LIMIT 1', [actorEmail])
    if (result.rows[0]) return { id: result.rows[0].id as string, role: result.rows[0].role as string }
  }
  return null
}

async function requireMaster(actorEmail?: string) {
  try {
    const currentUser = await getCurrentUser(actorEmail)
    if (!currentUser || !['MASTER USER', 'ADMIN SYSTEM', 'ADMIN', 'HSE ADMIN'].includes(String(currentUser.role).trim().toUpperCase())) return null
    return currentUser
  } catch {
    return null
  }
}

export async function listCompanies(actorEmail?: string) {
  try {
    const currentUser = await getCurrentUser()
    const fallbackUser = !currentUser && actorEmail
      ? (await pool.query('SELECT id, role FROM neon_auth.user WHERE lower(email) = lower($1) LIMIT 1', [actorEmail])).rows[0]
      : null
    const resolvedUser = currentUser ?? (fallbackUser ? { id: fallbackUser.id as string, role: fallbackUser.role as string } : null)
    if (!resolvedUser) return []
  const isGlobalAdmin = ['ADMIN SYSTEM', 'ADMIN', 'HSE ADMIN'].includes(String(resolvedUser.role).trim().toUpperCase())
  const result = isGlobalAdmin
      ? await pool.query('SELECT id, name, code, status FROM public.company WHERE status = $1 ORDER BY name', ['Active'])
      : await pool.query(`SELECT c.id, c.name, c.code, c.status FROM public.company c INNER JOIN public.company_membership m ON m.company_id = c.id WHERE m.user_id = $1 AND m.status = 'Active' AND c.status = 'Active' ORDER BY c.name`, [resolvedUser.id])
    return result.rows
  } catch {
    return []
  }
}

export async function createCompany(input: { name: string; code?: string; actorEmail?: string }) {
  const master = await requireMaster(input.actorEmail)
  if (!master) return { success: false, error: 'You must be signed in as a master user to manage companies' }
  const name = input.name.trim()
  if (!name) return { success: false, error: 'Company name is required' }
  const id = `company-${crypto.randomUUID()}`
  try {
    await pool.query('INSERT INTO public.company (id, name, code) VALUES ($1, $2, $3)', [id, name, input.code?.trim() || null])
    await pool.query('INSERT INTO public.company_membership (id, company_id, user_id, role) VALUES ($1, $2, $3, $4) ON CONFLICT (company_id, user_id) DO NOTHING', [crypto.randomUUID(), id, master.id, 'OWNER'])
    return { success: true, company: { id, name, code: input.code?.trim() || null, status: 'Active' } }
  } catch (error: any) {
    return { success: false, error: error.code === '23505' ? 'A company with this name or code already exists' : 'Could not create company' }
  }
}

export async function updateCompany(input: { id: string; name: string; code?: string; status?: string; actorEmail?: string }) {
  const master = await requireMaster(input.actorEmail)
  if (!master) return { success: false, error: 'Only administrators can manage companies' }
  const name = input.name.trim()
  if (!input.id || !name) return { success: false, error: 'Company ID and name are required' }
  try {
    const result = await pool.query(
      'UPDATE public.company SET name = $1, code = $2, status = $3, updated_at = now() WHERE id = $4 RETURNING id, name, code, status',
      [name, input.code?.trim() || null, input.status === 'Inactive' ? 'Inactive' : 'Active', input.id]
    )
    return result.rows[0] ? { success: true, company: result.rows[0] } : { success: false, error: 'Company not found' }
  } catch (error: any) {
    return { success: false, error: error.code === '23505' ? 'A company with this name or code already exists' : 'Could not update company' }
  }
}

export async function setCompanyMembership(input: { companyId: string; userId: string; role?: string }) {
  const master = await requireMaster()
  if (!master) return { success: false, error: 'You must be signed in as a master user to manage memberships' }
  await pool.query('INSERT INTO public.company_membership (id, company_id, user_id, role) VALUES ($1, $2, $3, $4) ON CONFLICT (company_id, user_id) DO UPDATE SET role = EXCLUDED.role, status = $5, updated_at = now()', [crypto.randomUUID(), input.companyId, input.userId, input.role || 'MEMBER', 'Active'])
  return { success: true }
}
