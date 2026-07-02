'use server'

import { Pool } from 'pg'
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
  business_unit: string | null
  owner: string | null
  owner_email: string | null
  review_date: string | null
  expiry_date: string | null
  tags: string[]
  is_public: boolean
  created_at: string
  updated_at: string
}

export async function getDocuments(): Promise<HSEDocument[]> {
  try {
    const res = await pool.query('SELECT * FROM public.document ORDER BY category, title')
    return res.rows
  } catch { return [] }
}

export async function createDocument(data: Partial<HSEDocument> & { title: string; category: string }): Promise<{ success: boolean; id?: string }> {
  try {
    const year = new Date().getFullYear()
    const count = await pool.query("SELECT COUNT(*) FROM public.document WHERE doc_no LIKE $1", [`DOC-${year}-%`])
    const seq = String(Number(count.rows[0].count) + 1).padStart(4, '0')
    const doc_no = `DOC-${year}-${seq}`

    const res = await pool.query(`
      INSERT INTO public.document
        (doc_no, title, category, sub_category, description, version, status,
         file_url, file_name, file_size, file_type, business_unit, owner, owner_email,
         review_date, expiry_date, tags, is_public)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING id
    `, [
      doc_no, data.title, data.category, data.sub_category ?? null,
      data.description ?? null, data.version ?? '1.0', data.status ?? 'Active',
      data.file_url ?? null, data.file_name ?? null, data.file_size ?? null, data.file_type ?? null,
      data.business_unit ?? null, data.owner ?? null, data.owner_email ?? null,
      data.review_date ?? null, data.expiry_date ?? null, data.tags ?? [], data.is_public ?? true,
    ])
    revalidatePath('/')
    return { success: true, id: res.rows[0].id }
  } catch (e: any) {
    console.error('[documents] create error:', e.message)
    return { success: false }
  }
}

export async function updateDocument(id: string, data: Partial<HSEDocument>): Promise<{ success: boolean }> {
  try {
    await pool.query(`
      UPDATE public.document SET
        title=$1, category=$2, sub_category=$3, description=$4, version=$5, status=$6,
        file_url=$7, file_name=$8, file_size=$9, file_type=$10, business_unit=$11,
        owner=$12, owner_email=$13, review_date=$14, expiry_date=$15, tags=$16,
        is_public=$17, updated_at=NOW()
      WHERE id=$18
    `, [
      data.title, data.category, data.sub_category ?? null, data.description ?? null,
      data.version ?? '1.0', data.status ?? 'Active',
      data.file_url ?? null, data.file_name ?? null, data.file_size ?? null, data.file_type ?? null,
      data.business_unit ?? null, data.owner ?? null, data.owner_email ?? null,
      data.review_date ?? null, data.expiry_date ?? null, data.tags ?? [], data.is_public ?? true,
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
    await pool.query('DELETE FROM public.document WHERE id=$1', [id])
    revalidatePath('/')
    return { success: true }
  } catch { return { success: false } }
}
