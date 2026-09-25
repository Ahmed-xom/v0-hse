import crypto from 'crypto'
import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'

const ADMIN_ROLES = ['MASTER USER', 'ADMIN SYSTEM', 'ADMIN', 'HSE ADMIN']
const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roleResult = await pool.query('SELECT role FROM neon_auth.user WHERE id = $1 LIMIT 1', [session.user.id])
  if (!ADMIN_ROLES.includes(String(roleResult.rows[0]?.role ?? '').trim().toUpperCase())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await request.formData()
  const ticketId = String(formData.get('ticketId') ?? '')
  const file = formData.get('file')
  if (!ticketId || !(file instanceof File)) return NextResponse.json({ error: 'Ticket and file are required' }, { status: 400 })
  if (file.size === 0 || file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Files must be between 1 byte and 10 MB' }, { status: 400 })

  const ticketResult = await pool.query('SELECT company_id FROM public.ticket WHERE id = $1 LIMIT 1', [ticketId])
  const companyId = ticketResult.rows[0]?.company_id
  if (!companyId) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const blob = await put(`ticket-attachments/${ticketId}/${crypto.randomUUID()}-${safeName}`, file, { access: 'private' })
  const attachmentId = crypto.randomUUID()
  await pool.query('INSERT INTO public.ticket_attachment (id, ticket_id, company_id, file_name, pathname, content_type, size_bytes, uploaded_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [attachmentId, ticketId, companyId, file.name, blob.pathname, file.type || 'application/octet-stream', file.size, session.user.id])
  return NextResponse.json({ id: attachmentId, fileName: file.name })
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ticketId = new URL(request.url).searchParams.get('ticketId')
  if (!ticketId) return NextResponse.json({ error: 'Ticket is required' }, { status: 400 })
  const result = await pool.query(`SELECT a.id, a.file_name AS "fileName", a.pathname, a.content_type AS "contentType", a.size_bytes AS "sizeBytes"
    FROM public.ticket_attachment a
    JOIN public.ticket t ON t.id = a.ticket_id
    WHERE a.ticket_id = $1 AND EXISTS (
      SELECT 1 FROM public.company_membership cm
      WHERE cm.company_id = t.company_id AND cm.user_id = $2 AND cm.status = 'Active'
    ) ORDER BY a.created_at DESC`, [ticketId, session.user.id])
  return NextResponse.json(result.rows.map((row) => ({ ...row, url: `/api/ticket-attachments/file?pathname=${encodeURIComponent(row.pathname)}` })))
}
