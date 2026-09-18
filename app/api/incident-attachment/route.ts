import { put } from '@vercel/blob'
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
