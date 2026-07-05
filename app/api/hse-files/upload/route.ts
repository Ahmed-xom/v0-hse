import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] upload route hit, content-type:', request.headers.get('content-type'))
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    console.log('[v0] file from formData:', file?.name, file?.size)

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const maxBytes = 50 * 1024 * 1024
    if (file.size > maxBytes) {
      return NextResponse.json({ error: 'File exceeds 50 MB limit' }, { status: 413 })
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const pathname = `hse-files/${Date.now()}-${safeName}`
    console.log('[v0] uploading blob pathname:', pathname)

    const blob = await put(pathname, file, { access: 'public' })
    console.log('[v0] blob uploaded successfully:', blob.url)

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: file.size,
    })
  } catch (error: any) {
    console.error('[v0] upload route error:', error?.message ?? error)
    return NextResponse.json({ error: error?.message ?? 'Upload failed' }, { status: 500 })
  }
}
