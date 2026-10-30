import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { LibraryAccessError, requireLibraryAdmin, requireLibraryCompany } from '@/lib/library-access'
import { libraryBlobToken, prepareLibraryUpload, uploadMetadataSchema, verifyLibraryUpload } from '@/lib/library-upload'
import { libraryErrorMessage } from '@/lib/library-policy'
import { createDocument, updateDocument } from '@/app/actions/manage-documents'

export const runtime = 'nodejs'
export const maxDuration = 60

function failure(error: unknown) {
  const status = error instanceof LibraryAccessError ? error.status : error instanceof z.ZodError ? 400 : 503
  return NextResponse.json({ error: error instanceof z.ZodError ? error.issues.map(issue => issue.message).join('; ') : libraryErrorMessage(error) }, { status })
}

export async function PUT(request: Request) {
  try {
    const actor = await requireLibraryAdmin(undefined, request.headers)
    const metadata = uploadMetadataSchema.parse(await request.json())
    await requireLibraryCompany(actor, metadata.companyId)
    return NextResponse.json(prepareLibraryUpload(metadata, actor), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return failure(error) }
}

export async function POST(request: Request) {
  try {
    const actor = await requireLibraryAdmin(undefined, request.headers)
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Use direct multipart upload from the library. Do not send file bytes to this API.' }, { status: 415 })
    }
    const body = await request.json() as HandleUploadBody
    if (body?.type !== 'blob.generate-client-token') return NextResponse.json({ error: 'Invalid upload operation' }, { status: 400 })
    const result = await handleUpload({
      body, request, token: libraryBlobToken(),
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const intent = verifyLibraryUpload(clientPayload ?? '', actor)
        await requireLibraryCompany(actor, intent.companyId)
        if (pathname !== intent.pathname) throw new LibraryAccessError('Upload path does not match authorization')
        return {
          addRandomSuffix: false,
          allowOverwrite: false,
          maximumSizeInBytes: intent.size,
          validUntil: Math.min(intent.expires, Date.now() + 24 * 60 * 60 * 1000),
        }
      },
    })
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return failure(error) }
}

export async function PATCH(request: Request) {
  try {
    await requireLibraryAdmin(undefined, request.headers)
    const input = z.object({ receipt: z.string().min(1).max(8192), document: z.object({ title: z.string(), category: z.string() }).passthrough(), documentId: z.string().optional() }).parse(await request.json())
    const result = input.documentId
      ? await updateDocument(input.documentId, input.document, input.receipt)
      : await createDocument(input.document, input.receipt)
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } catch (error) { return failure(error) }
}
