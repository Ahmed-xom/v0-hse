import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
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
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const attachmentId = new URL(request.url).searchParams.get('attachmentId')?.trim()
  if (!attachmentId || attachmentId.length > 200) {
    return NextResponse.json({ error: 'Invalid attachment' }, { status: 400 })
  }

  const result = await pool.query(`
    SELECT original_name, content, byte_size, sha256, target_id
    FROM public.attachment_records
    WHERE attachment_id = $1 AND is_deleted = false
    LIMIT 1
  `, [attachmentId])
  const row = result.rows[0]
  if (!row || row.target_id) return new NextResponse('Not found', { status: 404 })

  const filename = safeFilename(row.original_name)
  const disposition = `inline; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
  return new NextResponse(row.content, {
    headers: {
      'Content-Type': contentType(filename),
      'Content-Length': String(row.byte_size),
      'Content-Disposition': disposition,
      'Cache-Control': 'private, no-store',
      'X-Content-SHA256': row.sha256,
    },
  })
}
