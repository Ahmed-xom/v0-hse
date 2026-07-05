import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const maxBytes = 50 * 1024 * 1024 // 50 MB limit
    if (file.size > maxBytes) {
      return NextResponse.json({ error: 'File exceeds 50 MB limit' }, { status: 413 })
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const pathname = `hse-files/${Date.now()}-${safeName}`

    const blob = await put(pathname, file, { access: 'public' })

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: file.size,
    })
  } catch (error) {
    console.error('[hse-files] upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
