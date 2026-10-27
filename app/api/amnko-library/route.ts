import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import orderManifest from '@/config/amnko-library-order.json'

const basename = (pathname: string | null | undefined) => pathname?.split('/').pop() ?? ''
const blobStem = (pathname: string | null | undefined) => basename(pathname).replace(/\.[^.]+$/, '')

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
  `)

  const orderByPathname = new Map<string, { order: number; sourceId: string; parentSourceId: string | null; parentName: string | null }>()
  const orderByStem = new Map<string, { order: number; sourceId: string; parentSourceId: string | null; parentName: string | null }>()
  for (const item of orderManifest.items) {
    if (item.blobPathname) {
      const value = { order: item.order, sourceId: String(item.sourceId), parentSourceId: item.parentSourceId ? String(item.parentSourceId) : null, parentName: item.parentName ?? null }
      orderByPathname.set(item.blobPathname, value)
      orderByStem.set(blobStem(item.blobPathname), value)
    }
  }

  const orderedRows = result.rows
    .map((row) => ({
      row,
      fallbackKey: String(row.document_id),
      reference: orderByPathname.get(row.blob_pathname) ?? orderByStem.get(blobStem(row.blob_pathname)) ?? null,
    }))
    .sort((a, b) => (a.reference?.order ?? Number.MAX_SAFE_INTEGER) - (b.reference?.order ?? Number.MAX_SAFE_INTEGER) || (a.reference?.sourceId ?? a.fallbackKey).localeCompare(b.reference?.sourceId ?? b.fallbackKey))

  return NextResponse.json({
    orderSource: 'config/amnko-library-order.json',
    referenceItemCount: orderManifest.items.length,
    documents: orderedRows.map(({ row, reference }) => ({
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
      referenceOrder: reference?.order ?? null,
      sourceId: reference?.sourceId ?? null,
      parentSourceId: reference?.parentSourceId ?? null,
      parentName: reference?.parentName ?? null,
    })),
  })
}
