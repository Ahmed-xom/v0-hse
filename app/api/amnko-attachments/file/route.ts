import { get } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  txt: 'text/plain; charset=utf-8',
  csv: 'text/csv; charset=utf-8',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
  mp4: 'video/mp4',
}

function safeFilename(value: string) {
  const basename = value.split(/[\\/]/).pop() || 'attachment'
  return basename.replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 180) || 'attachment'
}

function contentType(filename: string) {
  const extension = filename.split('.').pop()?.toLowerCase() || ''
  return MIME_TYPES[extension] || 'application/octet-stream'
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const pathname = url.searchParams.get('pathname')?.trim()
  const download = url.searchParams.get('download') === '1'

  if (!pathname || !pathname.startsWith('amnko-library/') || pathname.includes('..') || pathname.length > 500) {
    return NextResponse.json({ error: 'Invalid attachment' }, { status: 400 })
  }

  const allowed = await pool.query<{ file_name: string | null; file_type: string | null }>(
    `SELECT d.file_name, d.file_type
     FROM public.amnko_library_document_link l
     INNER JOIN public.document d ON d.id = l.document_id
     WHERE l.blob_pathname = $1
       AND l.blob_pathname LIKE 'amnko-library/%'
     LIMIT 1`,
    [pathname],
  )
  const document = allowed.rows[0]
  if (!document) return new NextResponse('Not found', { status: 404 })

  const result = await get(pathname, {
    access: 'private',
    token: process.env.b1_READ_WRITE_TOKEN,
  })
  if (!result) return new NextResponse('Not found', { status: 404 })

  const filename = safeFilename(document.file_name || pathname)
  const extension = filename.split('.').pop()?.toLowerCase() || ''
  const inlineTypes = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp', 'txt', 'csv'])
  const dispositionType = !download && inlineTypes.has(extension) ? 'inline' : 'attachment'
  const disposition = `${dispositionType}; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
  return new NextResponse(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType && result.blob.contentType !== 'application/octet-stream' ? result.blob.contentType : contentType(filename),
      'Content-Disposition': disposition,
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      ETag: result.blob.etag,
    },
  })
}
