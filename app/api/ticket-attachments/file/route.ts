import { get } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const pathname = new URL(request.url).searchParams.get('pathname')
  if (!pathname) return NextResponse.json({ error: 'File is required' }, { status: 400 })

  const allowed = await pool.query('SELECT 1 FROM public.ticket_attachment WHERE pathname = $1 LIMIT 1', [pathname])
  if (!allowed.rowCount) return NextResponse.json({ error: 'File not found' }, { status: 404 })
  const result = await get(pathname, { access: 'private', ifNoneMatch: request.headers.get('if-none-match') ?? undefined })
  if (!result) return new NextResponse('Not found', { status: 404 })
  if (result.statusCode === 304) return new NextResponse(null, { status: 304, headers: { ETag: result.blob.etag, 'Cache-Control': 'private, no-cache' } })
  return new NextResponse(result.stream, { headers: { 'Content-Type': result.blob.contentType, ETag: result.blob.etag, 'Cache-Control': 'private, no-cache', 'Content-Disposition': `attachment; filename="${result.blob.pathname.split('/').pop()?.replace(/^[^/]+-/, '') ?? 'download'}"` } })
}
