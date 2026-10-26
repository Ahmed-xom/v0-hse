import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET() {
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
      d.created_at,
      d.is_public
    FROM public.amnko_library_document_link l
    INNER JOIN public.document d ON d.id = l.document_id
    WHERE l.blob_pathname LIKE 'amnko-library/%'
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
      isPublic: row.is_public === true,
      accessLabel: row.is_public === true ? 'public' : 'protected',
    })),
  })
}
