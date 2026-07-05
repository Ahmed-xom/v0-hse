'use server'

import { Pool } from 'pg'
import { put, del } from '@vercel/blob'
import { revalidatePath } from 'next/cache'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export interface HSEDocument {
  id: string
  doc_no: string | null
  title: string
  category: string
  sub_category: string | null
  description: string | null
  version: string
  status: string
  file_url: string | null
  file_name: string | null
  file_size: string | null
  file_type: string | null
  blob_pathname: string | null
  business_unit: string | null
  owner: string | null
  owner_email: string | null
  uploaded_by: string | null
  uploaded_by_email: string | null
  review_date: string | null
  expiry_date: string | null
  tags: string[]
  is_public: boolean
  allowed_emails: string[]
  created_at: string
  updated_at: string
}

// Upload a file to Vercel Blob via server action (avoids client-side CORS issues in preview)
export async function uploadFileAction(
  formData: FormData
): Promise<{ success: boolean; url?: string; pathname?: string; error?: string }> {
  try {
    const file = formData.get('file') as File | null
    if (!file || file.size === 0) return { success: false, error: 'No file provided' }
    if (file.size > 50 * 1024 * 1024) return { success: false, error: 'File exceeds 50 MB limit' }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const pathname = `hse-files/${Date.now()}-${safeName}`
    const blob = await put(pathname, file, { access: 'public' })

    return { success: true, url: blob.url, pathname: blob.pathname }
  } catch (e: any) {
    console.error('[documents] uploadFileAction error:', e.message)
    return { success: false, error: e.message ?? 'Upload failed' }
  }
}

// Returns documents visible to the given user email.
// Admins see everything. Regular users see: is_public=true OR their email is in allowed_emails.
export async function getDocuments(userEmail?: string, isAdmin?: boolean): Promise<HSEDocument[]> {
  try {
    let query: string
    let params: string[]
    if (isAdmin) {
      query = 'SELECT * FROM public.document ORDER BY category, title'
      params = []
    } else if (userEmail) {
      query = `SELECT * FROM public.document
               WHERE is_public = true OR $1 = ANY(allowed_emails)
               ORDER BY category, title`
      params = [userEmail]
    } else {
      query = 'SELECT * FROM public.document WHERE is_public = true ORDER BY category, title'
      params = []
    }
    const res = await pool.query(query, params)
    return res.rows.map(r => ({
      ...r,
      tags: r.tags ?? [],
      allowed_emails: r.allowed_emails ?? [],
    }))
  } catch (e: any) {
    console.error('[documents] getDocuments error:', e.message)
    return []
  }
}

export async function createDocument(
  data: Partial<HSEDocument> & { title: string; category: string }
): Promise<{ success: boolean; id?: string }> {
  try {
    const year = new Date().getFullYear()
    const count = await pool.query("SELECT COUNT(*) FROM public.document WHERE doc_no LIKE $1", [`DOC-${year}-%`])
    const seq = String(Number(count.rows[0].count) + 1).padStart(4, '0')
    const doc_no = `DOC-${year}-${seq}`

    const res = await pool.query(`
      INSERT INTO public.document
        (doc_no, title, category, sub_category, description, version, status,
         file_url, file_name, file_size, file_type, blob_pathname, business_unit,
         owner, owner_email, uploaded_by, uploaded_by_email,
         review_date, expiry_date, tags, is_public, allowed_emails)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      RETURNING id
    `, [
      doc_no, data.title, data.category,
      data.sub_category ?? null, data.description ?? null,
      data.version ?? '1.0', data.status ?? 'Active',
      data.file_url ?? null, data.file_name ?? null, data.file_size ?? null,
      data.file_type ?? null, data.blob_pathname ?? null,
      data.business_unit ?? null, data.owner ?? null, data.owner_email ?? null,
      data.uploaded_by ?? null, data.uploaded_by_email ?? null,
      data.review_date ?? null, data.expiry_date ?? null,
      data.tags ?? [], data.is_public ?? true, data.allowed_emails ?? [],
    ])
    revalidatePath('/')
    return { success: true, id: res.rows[0].id }
  } catch (e: any) {
    console.error('[documents] create error:', e.message)
    return { success: false }
  }
}

export async function updateDocument(
  id: string,
  data: Partial<HSEDocument>
): Promise<{ success: boolean }> {
  try {
    await pool.query(`
      UPDATE public.document SET
        title=$1, category=$2, sub_category=$3, description=$4, version=$5, status=$6,
        file_url=$7, file_name=$8, file_size=$9, file_type=$10, blob_pathname=$11,
        business_unit=$12, owner=$13, owner_email=$14,
        review_date=$15, expiry_date=$16, tags=$17,
        is_public=$18, allowed_emails=$19, updated_at=NOW()
      WHERE id=$20
    `, [
      data.title, data.category,
      data.sub_category ?? null, data.description ?? null,
      data.version ?? '1.0', data.status ?? 'Active',
      data.file_url ?? null, data.file_name ?? null, data.file_size ?? null,
      data.file_type ?? null, data.blob_pathname ?? null,
      data.business_unit ?? null, data.owner ?? null, data.owner_email ?? null,
      data.review_date ?? null, data.expiry_date ?? null,
      data.tags ?? [], data.is_public ?? true, data.allowed_emails ?? [],
      id,
    ])
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    console.error('[documents] update error:', e.message)
    return { success: false }
  }
}

export async function deleteDocument(id: string): Promise<{ success: boolean }> {
  try {
    // Delete the blob file if one exists
    const r = await pool.query('SELECT file_url FROM public.document WHERE id=$1', [id])
    if (r.rows[0]?.file_url) {
      await del(r.rows[0].file_url).catch(() => {})
    }
    await pool.query('DELETE FROM public.document WHERE id=$1', [id])
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    console.error('[documents] delete error:', e.message)
    return { success: false }
  }
}

// Admin: grant access to specific user emails for a private document
export async function updateDocumentAccess(
  id: string,
  allowedEmails: string[],
  isPublic: boolean
): Promise<{ success: boolean }> {
  try {
    await pool.query(
      'UPDATE public.document SET allowed_emails=$1, is_public=$2, updated_at=NOW() WHERE id=$3',
      [allowedEmails, isPublic, id]
    )
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    console.error('[documents] updateAccess error:', e.message)
    return { success: false }
  }
}

// Get all user emails for the access management dropdown
export async function getAllUserEmails(): Promise<{ name: string; email: string }[]> {
  try {
    const r = await pool.query(
      `SELECT name, email FROM neon_auth.user WHERE banned=false AND email IS NOT NULL ORDER BY name`,
      []
    )
    return r.rows
  } catch (e: any) {
    console.error('[documents] getAllUserEmails error:', e.message)
    return []
  }
}
