'use server'

import crypto from 'crypto'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'

async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  const result = await pool.query('SELECT id, role FROM neon_auth.user WHERE id = $1 LIMIT 1', [session.user.id])
  return result.rows[0] ? { id: session.user.id, role: result.rows[0].role as string } : null
}

async function requireMaster() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !['MASTER USER', 'ADMIN SYSTEM'].includes(currentUser.role)) return null
    return currentUser
  } catch {
    return null
  }
}

export async function listCompanies() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return []
    const isGlobalAdmin = ['MASTER USER', 'ADMIN SYSTEM'].includes(currentUser.role)
    const result = isGlobalAdmin
      ? await pool.query('SELECT id, name, code, status FROM public.company WHERE status = $1 ORDER BY name', ['Active'])
      : await pool.query(`SELECT c.id, c.name, c.code, c.status FROM public.company c INNER JOIN public.company_membership m ON m.company_id = c.id WHERE m.user_id = $1 AND m.status = 'Active' AND c.status = 'Active' ORDER BY c.name`, [currentUser.id])
    return result.rows
  } catch {
    return []
  }
}

export async function createCompany(input: { name: string; code?: string }) {
  const master = await requireMaster()
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

export async function setCompanyMembership(input: { companyId: string; userId: string; role?: string }) {
  const master = await requireMaster()
  if (!master) return { success: false, error: 'You must be signed in as a master user to manage memberships' }
  await pool.query('INSERT INTO public.company_membership (id, company_id, user_id, role) VALUES ($1, $2, $3, $4) ON CONFLICT (company_id, user_id) DO UPDATE SET role = EXCLUDED.role, status = $5, updated_at = now()', [crypto.randomUUID(), input.companyId, input.userId, input.role || 'MEMBER', 'Active'])
  return { success: true }
}
