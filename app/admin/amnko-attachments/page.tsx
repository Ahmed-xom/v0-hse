'use client'

import { useEffect, useState } from 'react'

type Attachment = {
  attachment_id: string
  original_name: string
  archive_path: string
  sha256: string
  byte_size: number
  parentStatus: 'UNLINKED' | 'LINKED'
}

export default function AmnkoAttachmentsPage() {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/amnko-attachments', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 401 ? 'غير مصرح' : 'تعذر تحميل المرفقات')
        return response.json()
      })
      .then((data) => setAttachments(data.attachments ?? []))
      .catch((reason: Error) => setError(reason.message))
  }, [])

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-2">
          <p className="text-sm text-muted-foreground">AMNKO HSE / staging</p>
          <h1 className="text-3xl font-semibold tracking-tight">مرفقات الترحيل</h1>
          <p className="text-muted-foreground">عرض إداري مؤقت للمرفقات المحفوظة. جميع الروابط غير مرتبطة بسجل حادث أو رحلة.</p>
        </header>
        {error ? <p role="alert" className="rounded-md border border-destructive/40 p-4 text-destructive">{error}</p> : null}
        {!error && attachments.length === 0 ? <p className="rounded-md border p-6 text-muted-foreground">جارٍ التحميل...</p> : null}
        <section aria-label="Attachment list" className="overflow-hidden rounded-lg border">
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b bg-muted/40 px-4 py-3 text-sm font-medium">
            <span>الملف</span><span>الحجم</span><span>الحالة</span>
          </div>
          {attachments.map((attachment) => (
            <div key={attachment.attachment_id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b px-4 py-4 last:border-b-0">
              <div className="min-w-0">
                <p className="truncate font-medium">{attachment.original_name}</p>
                <p className="truncate text-xs text-muted-foreground">{attachment.attachment_id} · {attachment.sha256}</p>
              </div>
              <span className="text-sm text-muted-foreground">{Number(attachment.byte_size).toLocaleString()} B</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-amber-700">UNLINKED</span>
                <a className="rounded-md border px-3 py-2 text-sm hover:bg-muted" href={`/api/amnko-attachments/file?attachmentId=${encodeURIComponent(attachment.attachment_id)}`} target="_blank" rel="noreferrer">معاينة / تنزيل</a>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
