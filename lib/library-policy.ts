export const LIBRARY_ADMIN_ROLES = ['ADMIN SYSTEM', 'HSE ADMIN', 'ADMIN'] as const

export function isLibraryAdmin(role: string | null | undefined) {
  return LIBRARY_ADMIN_ROLES.some(value => value === role?.trim().toUpperCase())
}

// Vercel Blob's per-object limit, not an application/library quota.
export const BLOB_MAX_FILE_BYTES = 5_000_000_000_000

export function formatLibraryBytes(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = bytes > 0 ? Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1) : 0
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`
}

export function libraryErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '')
  if (/quota|limit.exceeded|storage.full|store.suspended|billing|payment|forbidden.*store/i.test(message)) {
    return 'Vercel Blob has reached a storage, usage, or billing limit. Contact the storage administrator. / بلغ التخزين حد الاستخدام أو الفوترة لدى Vercel Blob.'
  }
  if (/too.large|maximum.size|size.limit|exceeds.*5.?tb/i.test(message)) {
    return 'Vercel Blob supports up to 5 TB per file. / الحد الفعلي لدى مزود التخزين هو 5 TB للملف الواحد.'
  }
  if (/rate.limit|too.many.requests|429/i.test(message)) {
    return 'Vercel Blob is temporarily rate limited. Wait briefly, then retry. / تم بلوغ معدل العمليات لدى مزود التخزين؛ انتظر قليلًا ثم أعد المحاولة.'
  }
  if (/fetch|network|timeout|connection|offline/i.test(message)) {
    return 'Connection interrupted. Retry this file; completed files will not be uploaded again. / انقطع الاتصال؛ أعد محاولة الملف دون إعادة رفع الملفات المكتملة.'
  }
  return message || 'The operation failed. Please retry. / تعذرت العملية؛ يرجى إعادة المحاولة.'
}
