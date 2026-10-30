import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { head } from '@vercel/blob'
import { z } from 'zod'
import { BLOB_MAX_FILE_BYTES, formatLibraryBytes } from '@/lib/library-policy'
import { LibraryAccessError, type LibraryActor } from '@/lib/library-access'

export const uploadMetadataSchema = z.object({
  companyId: z.string().trim().min(1).max(200),
  fileName: z.string().trim().min(1).max(255).refine(value => !/[\u0000-\u001f\/\\]/.test(value), 'Invalid file name'),
  size: z.number().int().min(1).max(BLOB_MAX_FILE_BYTES, 'Vercel Blob maximum file size is 5 TB'),
  contentType: z.string().max(255).optional(),
})

const receiptSchema = uploadMetadataSchema.extend({
  id: z.string().uuid(), actorId: z.string(), pathname: z.string(), expires: z.number(),
})

export function libraryBlobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) throw new Error('The current library Blob store is unavailable. Contact the administrator.')
  return token
}

function signature(payload: string) {
  const secret = process.env.BETTER_AUTH_SECRET
  if (!secret) throw new Error('Upload signing is unavailable')
  return createHmac('sha256', secret).update(`amnko-library-upload:${payload}`).digest()
}

export function prepareLibraryUpload(input: unknown, actor: LibraryActor) {
  const metadata = uploadMetadataSchema.parse(input)
  const id = randomUUID()
  const filename = metadata.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const pathname = `hse-files/${encodeURIComponent(metadata.companyId)}/${actor.id}/${id}/${filename}`
  const receipt = { ...metadata, id, actorId: actor.id, pathname, expires: Date.now() + 7 * 86400000 }
  const payload = Buffer.from(JSON.stringify(receipt)).toString('base64url')
  return { pathname, receipt: `${payload}.${signature(payload).toString('base64url')}`, access: 'public' as const }
}

export function verifyLibraryUpload(receipt: string, actor: LibraryActor) {
  if (typeof receipt !== 'string' || receipt.length > 8192) throw new LibraryAccessError('Invalid upload receipt', 400)
  const [payload, signed, extra] = receipt.split('.')
  if (!payload || !signed || extra) throw new LibraryAccessError('Invalid upload receipt', 400)
  const expected = signature(payload)
  const actual = Buffer.from(signed, 'base64url')
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new LibraryAccessError('Invalid upload signature', 403)
  const parsed = receiptSchema.parse(JSON.parse(Buffer.from(payload, 'base64url').toString()))
  if (parsed.actorId !== actor.id || parsed.expires < Date.now()) throw new LibraryAccessError('Upload authorization expired or belongs to another user', 403)
  return parsed
}

export async function verifiedLibraryBlob(receipt: string, actor: LibraryActor, companyId: string) {
  const upload = verifyLibraryUpload(receipt, actor)
  if (upload.companyId !== companyId) throw new LibraryAccessError('Upload company does not match')
  const blob = await head(upload.pathname, { token: libraryBlobToken() })
  if (blob.pathname !== upload.pathname || blob.size !== upload.size) throw new LibraryAccessError('Uploaded file verification failed', 400)
  return {
    id: upload.id,
    file_url: blob.url,
    blob_pathname: blob.pathname,
    file_name: upload.fileName,
    file_type: blob.contentType,
    file_size: formatLibraryBytes(blob.size),
  }
}
