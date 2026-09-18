import { get, put } from '@vercel/blob'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File must be 10MB or smaller' }, { status: 400 })
    const blob = await put(`incident-data/${crypto.randomUUID()}-${file.name}`, file, { access: 'private', contentType: file.type || 'application/octet-stream' })
    return NextResponse.json({ pathname: blob.pathname, name: file.name })
  } catch (error) {
    console.error('[incident-attachment] upload failed', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const pathname = new URL(request.url).searchParams.get('pathname')
  if (!pathname) return NextResponse.json({ error: 'Missing pathname' }, { status: 400 })
  try {
    const result = await get(pathname, { access: 'private' })
    if (!result) return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    return new NextResponse(result.stream, { headers: { 'Content-Type': result.blob.contentType ?? 'application/octet-stream', 'Content-Disposition': `inline; filename="${result.blob.pathname.split('/').pop() ?? 'attachment'}"`, 'Cache-Control': 'private, no-cache' } })
  } catch (error) {
    console.error('[incident-attachment] download failed', error)
    return NextResponse.json({ error: 'Attachment unavailable' }, { status: 404 })
  }
}

