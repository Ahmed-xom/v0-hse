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

  const allowed = await pool.query(
    `SELECT 1
     FROM public.amnko_library_document_link
     WHERE blob_pathname = $1
       AND blob_pathname LIKE 'amnko-library/%'
     LIMIT 1`,
    [pathname],
  )
  if (allowed.rowCount !== 1) return new NextResponse('Not found', { status: 404 })

  const result = await get(pathname, {
    access: 'private',
    token: process.env.b1_READ_WRITE_TOKEN,
  })
  if (!result) return new NextResponse('Not found', { status: 404 })

  const filename = safeFilename(pathname)
  const dispositionType = download ? 'attachment' : 'inline'
  const disposition = `${dispositionType}; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
  return new NextResponse(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType || contentType(filename),
      'Content-Disposition': disposition,
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      ETag: result.blob.etag,
    },
  })
}
