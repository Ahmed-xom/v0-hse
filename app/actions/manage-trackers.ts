'use server'

import crypto from 'crypto'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'

const ADMIN_ROLES = ['MASTER USER', 'ADMIN SYSTEM', 'ADMIN', 'HSE ADMIN']

async function getAdminUserId() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) return null
    const result = await pool.query('SELECT id, role FROM neon_auth.user WHERE id = $1 LIMIT 1', [session.user.id])
    const role = String(result.rows[0]?.role ?? '').trim().toUpperCase()
    return ADMIN_ROLES.includes(role) ? session.user.id : null
  } catch {
    return null
  }
}

async function requireAdmin() {
  const userId = await getAdminUserId()
  if (!userId) throw new Error('Unauthorized')
  return userId
}

export async function getTickets(companyId: string) {
  if (!companyId) return []
  const result = await pool.query(`SELECT id, ticket_no AS "ticketNo", subject, description, priority, status, category, due_date AS "dueDate", created_at AS "createdAt" FROM public.ticket WHERE company_id = $1 ORDER BY created_at DESC`, [companyId])
  return result.rows
}

export async function createTicket(input: { companyId: string; subject: string; description?: string; priority: string; category: string; dueDate?: string }) {
  const userId = await requireAdmin()
  if (!input.companyId || !input.subject.trim()) return { success: false, error: 'Company and subject are required' }
  const ticketNo = `XOM-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
  await pool.query(`INSERT INTO public.ticket (id, company_id, ticket_no, subject, description, priority, category, due_date, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [crypto.randomUUID(), input.companyId, ticketNo, input.subject.trim(), input.description?.trim() || null, input.priority, input.category, input.dueDate || null, userId])
  revalidatePath('/')
  return { success: true }
}

export async function updateTicket(id: string, input: { status?: string; priority?: string; assigneeId?: string | null }) {
  await requireAdmin()
  await pool.query(`UPDATE public.ticket SET status = COALESCE($2, status), priority = COALESCE($3, priority), assignee_id = $4, updated_at = now() WHERE id = $1`, [id, input.status ?? null, input.priority ?? null, input.assigneeId || null])
  revalidatePath('/')
  return { success: true }
}

export async function getInvoicePermissions(companyId: string) {
  const adminId = await getAdminUserId()
  if (!companyId || !adminId) return []
  const result = await pool.query(`SELECT p.id, p.user_id AS "userId", p.permission, u.name, u.email FROM public.invoice_permission p JOIN neon_auth.user u ON u.id = p.user_id WHERE p.company_id = $1 ORDER BY u.name`, [companyId])
  return result.rows
}

export async function setInvoicePermission(input: { companyId: string; userId: string; permission: 'view' | 'edit' | 'none' }) {
  const grantedBy = await requireAdmin()
  if (input.permission === 'none') {
    await pool.query('DELETE FROM public.invoice_permission WHERE company_id = $1 AND user_id = $2', [input.companyId, input.userId])
  } else {
    await pool.query(`INSERT INTO public.invoice_permission (id, company_id, user_id, permission, granted_by) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (company_id, user_id) DO UPDATE SET permission = EXCLUDED.permission, granted_by = EXCLUDED.granted_by, updated_at = now()`, [crypto.randomUUID(), input.companyId, input.userId, input.permission, grantedBy])
  }
  revalidatePath('/')
  return { success: true }
}

export async function getCompanyUsers(companyId: string) {
  const adminId = await getAdminUserId()
  if (!companyId || !adminId) return []
  const result = await pool.query(`SELECT u.id, u.name, u.email FROM neon_auth.user u JOIN public.company_membership cm ON cm.user_id = u.id WHERE cm.company_id = $1 AND cm.status = 'Active' ORDER BY u.name`, [companyId])
  return result.rows
}

export async function getMyInvoicePermission(companyId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) return 'none'
  const result = await pool.query('SELECT permission FROM public.invoice_permission WHERE company_id = $1 AND user_id = $2', [companyId, session.user.id])
  return result.rows[0]?.permission ?? 'none'
}
