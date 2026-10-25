import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { pool } from '@/lib/db'

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await pool.query(`
    SELECT
      l.rowguid,
      l.document_id,
      l.blob_pathname,
      l.sha256,
      l.verification_status,
      d.title,
      d.file_name,
      d.file_type,
      d.file_size,
      d.category,
      d.status,
      d.created_at
    FROM public.amnko_library_document_link l
    INNER JOIN public.document d ON d.id = l.document_id
    WHERE d.is_public = false
      AND l.blob_pathname LIKE 'amnko-library/%'
    ORDER BY d.title ASC
  `)

  return NextResponse.json({
    documents: result.rows.map((row) => ({
      rowguid: row.rowguid,
      documentId: row.document_id,
      pathname: row.blob_pathname,
      title: row.title,
      fileName: row.file_name,
      fileType: row.file_type,
      fileSize: row.file_size,
      category: row.category,
      status: row.status,
      createdAt: row.created_at,
      verified: row.verification_status === 'VERIFIED',
    })),
  })
}
