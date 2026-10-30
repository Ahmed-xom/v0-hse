'use client'

import { useRef, useState } from 'react'
import { CheckCircle2, FileUp, Loader2, RotateCcw, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DOCUMENT_CATEGORIES } from '@/lib/hse-constants'
import { useLanguage } from '@/lib/language-context'
import { BLOB_MAX_FILE_BYTES, formatLibraryBytes, libraryErrorMessage } from '@/lib/library-policy'
import { saveLibraryUpload, uploadLibraryFile } from '@/lib/library-upload-client'
import type { DocumentFolder } from '@/app/actions/manage-documents'

type UploadRow = {
  id: string; file: File; title: string; description: string; category: string; folderId: string | null
  progress: number; status: 'queued' | 'uploading' | 'saving' | 'success' | 'failed'; error?: string; receipt?: string
}

interface Props {
  open: boolean; onOpenChange: (open: boolean) => void; companyId: string; folders: DocumentFolder[]
  folderId: string | null; onSaved: () => void
}

export function LibraryUploadDialog({ open, onOpenChange, companyId, folders, folderId, onSaved }: Props) {
  const { isArabic } = useLanguage()
  const label = (english: string, arabic: string) => isArabic ? arabic : english
  const [rows, setRows] = useState<UploadRow[]>([])
  const [busy, setBusy] = useState(false)
  const [visibleToAll, setVisibleToAll] = useState(true)
  const [selectionError, setSelectionError] = useState('')
  const busyRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const completed = rows.filter(row => row.status === 'success').length
  const totalBytes = rows.reduce((sum, row) => sum + row.file.size, 0)
  const percentage = totalBytes ? Math.round(rows.reduce((sum, row) => sum + row.file.size * row.progress / 100, 0) / totalBytes * 100) : 0
  const patch = (id: string, change: Partial<UploadRow>) => setRows(previous => previous.map(row => row.id === id ? { ...row, ...change } : row))

  const addFiles = (files: FileList | null) => {
    if (!files || busyRef.current) return
    const additions = Array.from(files).map(file => ({
      id: crypto.randomUUID(), file, title: file.name, description: '', category: 'Policy', folderId,
      progress: 0, status: 'queued' as const,
    }))
    setRows(previous => [...previous, ...additions])
    setSelectionError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const start = async (onlyId?: string) => {
    if (busyRef.current) return
    const pending = rows.filter(row => row.status !== 'success' && (!onlyId || row.id === onlyId))
    if (!pending.length) return
    if (pending.some(row => !row.title.trim())) { setSelectionError(label('Every file needs a name.', 'يرجى إدخال اسم لكل ملف.')); return }
    busyRef.current = true
    setBusy(true)
    setSelectionError('')
    let cursor = 0
    let saved = false
    const worker = async () => {
      while (cursor < pending.length) {
        const row = pending[cursor++]
        try {
          if (!row.file.size) throw new Error(label('Empty file. Choose a file with content.', 'الملف فارغ؛ اختر ملفًا يحتوي على بيانات.'))
          if (row.file.size > BLOB_MAX_FILE_BYTES) throw new Error(label('Vercel Blob maximum: 5 TB per file.', 'الحد الفعلي لدى Vercel Blob هو 5 TB للملف الواحد.'))
          patch(row.id, { status: row.receipt ? 'saving' : 'uploading', error: undefined })
          let receipt = row.receipt
          if (!receipt) {
            const uploaded = await uploadLibraryFile(row.file, companyId, value => patch(row.id, { progress: value }))
            receipt = uploaded.receipt
            patch(row.id, { receipt, progress: 100, status: 'saving' })
          }
          await saveLibraryUpload(receipt, {
            title: row.title, description: row.description, category: row.category,
            folder_id: row.folderId, company_id: companyId, is_public: visibleToAll,
          })
          patch(row.id, { status: 'success', progress: 100 })
          saved = true
        } catch (error) { patch(row.id, { status: 'failed', error: libraryErrorMessage(error) }) }
      }
    }
    try { await Promise.all([worker(), worker()]) }
    finally {
      busyRef.current = false
      setBusy(false)
      if (saved) onSaved()
    }
  }

  const folderPath = (folder: DocumentFolder) => {
    const names = [folder.name]
    const visited = new Set([folder.id])
    let parent = folders.find(item => item.id === folder.parent_id)
    while (parent && !visited.has(parent.id)) {
      names.unshift(parent.name); visited.add(parent.id)
      parent = folders.find(item => item.id === parent?.parent_id)
    }
    return names.join(' / ')
  }

  return (
    <Dialog open={open} onOpenChange={value => { if (!busyRef.current) onOpenChange(value) }}>
      <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto" dir={isArabic ? 'rtl' : 'ltr'} onInteractOutside={event => { if (busy) event.preventDefault() }}>
        <DialogHeader>
          <DialogTitle>{label('Add File', 'إضافة ملف')}</DialogTitle>
          <DialogDescription>{label('Select multiple files. Edit each name, description, category and destination before uploading.', 'اختر عدة ملفات، ثم حدد اسم ووصف وتصنيف ومجلد كل ملف قبل الرفع.')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          <div className="rounded-lg border border-dashed bg-muted/30 p-5" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); addFiles(event.dataTransfer.files) }}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="library-batch-files"><FileUp className="size-5" />{label('Choose files or drop them here', 'اختر الملفات أو اسحبها إلى هنا')}</FieldLabel>
                <Input ref={inputRef} id="library-batch-files" type="file" multiple disabled={busy} onChange={event => addFiles(event.target.files)} />
              </Field>
            </FieldGroup>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{label('PDF, Word, Excel, PowerPoint, images, TXT, archives and other file types. No application quota. Vercel Blob: up to 5 TB per file; plan limits apply.', 'PDF وWord وExcel وPowerPoint والصور وTXT والملفات المضغوطة وغيرها. لا حصة من التطبيق. حد Vercel Blob: ‏5 TB للملف؛ تنطبق حدود الخطة.')}</p>
          </div>
          {selectionError && <Alert variant="destructive"><AlertDescription>{selectionError}</AlertDescription></Alert>}
          {rows.length > 0 && (
            <>
              <div className="flex flex-col gap-2" aria-live="polite">
                <div className="flex flex-wrap justify-between gap-2 text-sm"><span>{completed} / {rows.length} {label('saved', 'ملف محفوظ')} · {formatLibraryBytes(totalBytes)}</span><span>{percentage}% {label('transferred', 'تم نقله')}</span></div>
                <Progress value={percentage} aria-label={label('Overall transfer progress', 'تقدم نقل جميع الملفات')} />
                <p className="text-sm text-muted-foreground">{label('Keep this window open until saving completes. Failed files can be retried separately.', 'أبقِ هذه النافذة مفتوحة حتى اكتمال الحفظ. يمكنك إعادة محاولة الملفات الفاشلة منفردة.')}</p>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={visibleToAll} disabled={busy} onChange={event => setVisibleToAll(event.target.checked)} />{label('Visible to authorized company users (otherwise Admin only until access is granted)', 'مرئي لمستخدمي الشركة المصرح لهم (وإلا للمدير فقط حتى منح الصلاحية)')}</label>
              <ul className="flex flex-col gap-4" aria-label={label('Upload queue', 'قائمة الرفع')}>
                {rows.map(row => (
                  <li key={row.id} className="flex min-w-0 flex-col gap-4 rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><p className="break-all text-sm font-medium">{row.file.name}</p><p className="text-sm text-muted-foreground">{formatLibraryBytes(row.file.size)}</p></div>
                      <Badge variant={row.status === 'failed' ? 'destructive' : 'secondary'}>{row.status === 'success' ? label('Saved', 'تم الحفظ') : row.status === 'failed' ? label('Failed', 'فشل') : row.status === 'saving' ? label('Saving', 'جارٍ الحفظ') : row.status === 'uploading' ? label('Uploading', 'جارٍ الرفع') : label('Ready', 'جاهز')}</Badge>
                    </div>
                    <FieldGroup>
                      <Field><FieldLabel htmlFor={`title-${row.id}`}>{label('File name', 'اسم الملف')}</FieldLabel><Input id={`title-${row.id}`} value={row.title} maxLength={500} disabled={busy || row.status === 'success'} onChange={event => patch(row.id, { title: event.target.value })} /></Field>
                      <Field><FieldLabel htmlFor={`description-${row.id}`}>{label('Description', 'الوصف')}</FieldLabel><Textarea id={`description-${row.id}`} value={row.description} rows={2} disabled={busy || row.status === 'success'} onChange={event => patch(row.id, { description: event.target.value })} /></Field>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field><FieldLabel htmlFor={`category-${row.id}`}>{label('Category', 'التصنيف')}</FieldLabel><Select value={row.category} disabled={busy || row.status === 'success'} onValueChange={value => patch(row.id, { category: value })}><SelectTrigger id={`category-${row.id}`}><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{DOCUMENT_CATEGORIES.map(category => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                        <Field><FieldLabel htmlFor={`folder-${row.id}`}>{label('Folder', 'المجلد')}</FieldLabel><Select value={row.folderId ?? '__root__'} disabled={busy || row.status === 'success'} onValueChange={value => patch(row.id, { folderId: value === '__root__' ? null : value })}><SelectTrigger id={`folder-${row.id}`}><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="__root__">{label('Library root', 'جذر المكتبة')}</SelectItem>{folders.map(folder => <SelectItem key={folder.id} value={folder.id}>{folderPath(folder)}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                      </div>
                    </FieldGroup>
                    {(row.status === 'uploading' || row.status === 'saving' || row.status === 'success') && <div className="flex items-center gap-3"><Progress value={row.progress} aria-label={`${row.file.name}: ${Math.round(row.progress)}%`} /><span className="text-sm tabular-nums">{Math.round(row.progress)}%</span>{row.status === 'success' && <CheckCircle2 className="size-5 shrink-0 text-primary" />}</div>}
                    {row.error && <Alert variant="destructive"><AlertDescription>{row.error}</AlertDescription></Alert>}
                    {row.status !== 'success' && <div className="flex flex-wrap gap-2">{row.status === 'failed' && <Button size="sm" variant="outline" disabled={busy} onClick={() => void start(row.id)}><RotateCcw data-icon="inline-start" />{label('Retry this file', 'إعادة محاولة الملف')}</Button>}<Button size="sm" variant="ghost" disabled={busy} onClick={() => setRows(previous => previous.filter(item => item.id !== row.id))}><Trash2 data-icon="inline-start" />{label('Remove from queue', 'إزالة من القائمة')}</Button></div>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>{label('Close', 'إغلاق')}</Button>
          <Button disabled={busy || !rows.some(row => row.status !== 'success')} onClick={() => void start()}>{busy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Upload data-icon="inline-start" />}{busy ? label('Uploading & saving…', 'جارٍ الرفع والحفظ…') : label('Upload / retry remaining', 'رفع / إعادة محاولة المتبقي')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
