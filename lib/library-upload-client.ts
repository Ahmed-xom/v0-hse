import { upload } from '@vercel/blob/client'
import { BLOB_MAX_FILE_BYTES, libraryErrorMessage } from '@/lib/library-policy'

export interface PreparedLibraryUpload { pathname: string; receipt: string; access: 'public' }

export async function uploadLibraryFile(file: File, companyId: string, onProgress: (percentage: number) => void, signal?: AbortSignal) {
  if (file.size > BLOB_MAX_FILE_BYTES) throw new Error('Vercel Blob maximum file size is 5 TB / الحد الفعلي للملف هو 5 TB')
  if (!file.size) throw new Error('Empty files cannot be uploaded / لا يمكن رفع ملف فارغ')
  const response = await fetch('/api/hse-files/upload', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, signal,
    body: JSON.stringify({ companyId, fileName: file.name, size: file.size, contentType: file.type }),
  })
  const prepared = await response.json()
  if (!response.ok) throw new Error(prepared.error || 'Upload authorization failed')
  const intent = prepared as PreparedLibraryUpload
  try {
    const blob = await upload(intent.pathname, file, {
      access: intent.access, handleUploadUrl: '/api/hse-files/upload', clientPayload: intent.receipt,
      multipart: true, abortSignal: signal,
      onUploadProgress: ({ percentage }) => onProgress(percentage),
    })
    return { ...intent, url: blob.url }
  } catch (error) { throw new Error(libraryErrorMessage(error)) }
}

export async function saveLibraryUpload(receipt: string, document: Record<string, unknown>, documentId?: string) {
  const response = await fetch('/api/hse-files/upload', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receipt, document, documentId }),
  })
  const result = await response.json()
  if (!response.ok || !result.success) throw new Error(result.error || 'The upload finished, but saving failed. Retry to save without uploading again.')
  return result as { success: true; id?: string }
}
