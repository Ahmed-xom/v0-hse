import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // 10 MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 })
    }

    const safeName = `journeys/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    const blob = await put(safeName, file, { access: 'public' })

    return NextResponse.json({ pathname: blob.url, name: file.name })
  } catch (error) {
    console.error('[journey-upload] error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
