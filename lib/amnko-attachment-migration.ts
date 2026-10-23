import { createHash } from 'node:crypto'
import { del, put } from '@vercel/blob'

export type AttachmentDestination = 'incident' | 'journey'

export type VerifiedAttachmentMapping = {
  attachmentId: string
  parentGroup: string
  legacyParentId: string
  legacyRowguid: string
  targetTable: AttachmentDestination
  targetId: string
  sourceArchivePath: string
  attachmentName: string
  isDeleted: boolean
}

export type PreparedAttachment = VerifiedAttachmentMapping & {
  sha256: string
  bytes: number
  objectKey: string
}

export type AttachmentUploadResult = PreparedAttachment & {
  pathname: string
  url: string
}

function sanitizeSegment(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown'
}

export function sha256Hex(data: Uint8Array) {
  return createHash('sha256').update(data).digest('hex')
}

export function normalizeObjectKey(key: string) {
  const normalized = key
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('/')
  if (!normalized || normalized.includes('//')) throw new Error('INVALID_BLOB_OBJECT_KEY')
  return normalized
}

export function deterministicObjectKey(mapping: VerifiedAttachmentMapping, sha256: string) {
  const filename = sanitizeSegment(mapping.attachmentName || mapping.sourceArchivePath.split(/[\\/]/).pop() || 'attachment')
  return normalizeObjectKey([
    'amnko-hse',
    mapping.targetTable,
    mapping.targetId,
    mapping.legacyRowguid,
    mapping.attachmentId,
    `${sha256}-${filename}`,
  ].join('/'))
}

export function prepareAttachment(mapping: VerifiedAttachmentMapping, data: Uint8Array): PreparedAttachment {
  if (mapping.isDeleted) throw new Error('DELETED_ATTACHMENT_NOT_ELIGIBLE')
  if (!mapping.targetId || !mapping.legacyRowguid) throw new Error('VERIFIED_MAPPING_REQUIRED')
  const sha256 = sha256Hex(data)
  return { ...mapping, sha256, bytes: data.byteLength, objectKey: deterministicObjectKey(mapping, sha256) }
}

export async function uploadPreparedAttachment(prepared: PreparedAttachment, data: Uint8Array, contentType = 'application/octet-stream'): Promise<AttachmentUploadResult> {
  const actualHash = sha256Hex(data)
  if (actualHash !== prepared.sha256 || data.byteLength !== prepared.bytes) throw new Error('CONTENT_INTEGRITY_CHECK_FAILED')
  const blob = await put(prepared.objectKey, Buffer.from(data), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: false,
    contentType,
  })
  return { ...prepared, pathname: blob.pathname, url: blob.url }
}

export async function rollbackNewUploads(results: AttachmentUploadResult[]) {
  const deleted: string[] = []
  const failed: Array<{ pathname: string; error: string }> = []
  for (const result of results) {
    try {
      await del(result.pathname)
      deleted.push(result.pathname)
    } catch (error) {
      failed.push({ pathname: result.pathname, error: error instanceof Error ? error.message : 'ROLLBACK_FAILED' })
    }
  }
  return { deleted, failed }
}
