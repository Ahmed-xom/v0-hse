import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import orderManifest from '@/config/amnko-library-order.json'

const normalizeOrderKey = (value: string | null | undefined) => value
  ?.toLocaleLowerCase('en')
  .replace(/\.(docx?|xlsx?|pptx?|pdf|jpg|jpeg|png|zip)$/i, '')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim()

const basename = (pathname: string | null | undefined) => pathname?.split('/').pop() ?? ''

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

  const orderByKey = new Map<string, number[]>()
  for (const item of orderManifest.items) {
    const orders = orderByKey.get(item.matchKey) ?? []
    orders.push(item.order)
    orderByKey.set(item.matchKey, orders)
  }

  const usedOrders = new Set<number>()
  const orderedRows = result.rows
    .map((row, sourceIndex) => {
      const candidateKeys = [
        normalizeOrderKey(row.title),
        normalizeOrderKey(row.file_name),
        normalizeOrderKey(basename(row.blob_pathname)),
      ].filter((key): key is string => Boolean(key))
      const referenceOrder = candidateKeys
        .flatMap((key) => orderByKey.get(key) ?? [])
        .find((order) => !usedOrders.has(order))

      if (referenceOrder !== undefined) usedOrders.add(referenceOrder)
      return { row, sourceIndex, referenceOrder }
    })
    .sort((a, b) => (a.referenceOrder ?? Number.MAX_SAFE_INTEGER) - (b.referenceOrder ?? Number.MAX_SAFE_INTEGER) || a.sourceIndex - b.sourceIndex)

  return NextResponse.json({
    orderSource: 'config/amnko-library-order.json',
    referenceItemCount: orderManifest.items.length,
    documents: orderedRows.map(({ row, referenceOrder }) => ({
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
      referenceOrder: referenceOrder ?? null,
    })),
  })
}
