import { NextResponse } from 'next/server'
import { getAuthorizedLibraryDocument, LibraryAccessError } from '@/lib/library-access'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const { document } = await getAuthorizedLibraryDocument(id, false, request.headers)
    if (!document.file_url) return NextResponse.json({ error: 'This document has no file' }, { status: 404 })
    const url = new URL(document.file_url)
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.public.blob.vercel-storage.com')) {
      return NextResponse.json({ error: 'This legacy file requires administrator review; the original file has not been changed.' }, { status: 409 })
    }
    // Keep the existing public store and let Blob serve large downloads without Function body/duration limits.
    url.searchParams.set('download', '1')
    return new Response(null, { status: 307, headers: { Location: url.toString(), 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    const status = error instanceof LibraryAccessError ? error.status : 502
    return NextResponse.json({ error: status === 502 ? 'Download failed. Please retry.' : (error as Error).message }, { status })
  }
}
