'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ExternalLink, FileText, Folder, Lock, Search } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type LibraryDocument = {
  rowguid: string
  documentId: string
  pathname: string
  title: string
  fileName: string | null
  fileType: string | null
  fileSize: string | null
  category: string | null
  status: string | null
  createdAt: string
  verified: boolean
  isPublic: boolean
  accessLabel: 'public' | 'protected'
  referenceOrder: number | null
  sourceId: string | null
  parentSourceId: string | null
  parentName: string | null
}

type LibraryFolder = { id: string; name: string; parentId: string | null; order: number }

type LibraryResponse = { documents?: LibraryDocument[]; folders?: LibraryFolder[] }

export default function AmnkoLibraryPage() {
  const [documents, setDocuments] = useState<LibraryDocument[]>([])
  const [folders, setFolders] = useState<LibraryFolder[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({})
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<LibraryDocument | null>(null)

  const handleFileAction = async (document: LibraryDocument, download: boolean) => {
    const url = `/api/amnko-attachments/file?pathname=${encodeURIComponent(document.pathname)}${download ? '&download=1' : ''}`
    const errorKey = document.pathname

    try {
      const response = await fetch(url, { credentials: 'include' })
      if (!response.ok) {
        const reason = await response.text().catch(() => '')
        throw new Error(`HTTP ${response.status}${reason ? ` — ${reason.slice(0, 160)}` : ''}`)
      }

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = objectUrl
      link.rel = 'noopener noreferrer'
      if (download) {
        link.download = document.fileName ?? document.pathname.split('/').pop() ?? 'amnko-document'
      } else {
        link.target = '_blank'
      }
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), download ? 1000 : 60_000)
      setFileErrors((current) => ({ ...current, [errorKey]: '' }))
    } catch (reason) {
      setFileErrors((current) => ({
        ...current,
        [errorKey]: `تعذر ${download ? 'تنزيل' : 'فتح'} الملف: ${reason instanceof Error ? reason.message : 'خطأ غير معروف'}`,
      }))
    }
  }

  useEffect(() => {
    fetch('/api/amnko-library', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error('تعذر تحميل مكتبة AMNKO')
        return response.json() as Promise<LibraryResponse>
      })
      .then((data) => {
        setDocuments(data.documents ?? [])
        setFolders(data.folders ?? [])
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return documents
      .filter((document) => !currentFolder ? !document.parentSourceId : document.parentSourceId === currentFolder)
      .filter((document) => !normalized || [document.title, document.fileName, document.category, document.rowguid]
        .some((value) => value?.toLowerCase().includes(normalized)))
      .sort((a, b) => (a.referenceOrder ?? Number.MAX_SAFE_INTEGER) - (b.referenceOrder ?? Number.MAX_SAFE_INTEGER) || (a.sourceId ?? a.rowguid).localeCompare(b.sourceId ?? b.rowguid))
  }, [documents, query, currentFolder])

  const visibleFolders = folders.filter((folder) => !currentFolder ? !folder.parentId : folder.parentId === currentFolder)
  const currentParent = currentFolder ? folders.find((folder) => folder.id === currentFolder)?.parentId ?? null : null
  const currentFolderName = currentFolder ? folders.find((folder) => folder.id === currentFolder)?.name : null

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">AMNKO HSE / secured library</p>
            <h1 className="text-3xl font-semibold tracking-tight">مكتبة AMNKO HSE</h1>
            <p className="text-muted-foreground">قائمة المستندات المتاحة في مكتبة AMNKO HSE. محتوى الملفات يبقى محميًا حسب تصنيف الوصول.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="size-4" aria-hidden="true" />
            <span>المحتوى المحمي يتطلب صلاحية</span>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3" aria-label="Library summary">
          <Card><CardHeader className="pb-2"><CardDescription>إجمالي المستندات</CardDescription><CardTitle>{documents.length}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>نتائج البحث</CardDescription><CardTitle>{filtered.length}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>متاح للمعاينة العامة</CardDescription><CardTitle>{documents.filter((document) => document.isPublic).length}</CardTitle></CardHeader></Card>
        </section>

        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle>المستندات المرتبطة</CardTitle><CardDescription>المعاينة والتنزيل متاحان فقط لمسارات مكتبة AMNKO المعتمدة.</CardDescription></div>
            <div className="relative w-full sm:max-w-sm"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input className="pr-9" aria-label="بحث في المكتبة" placeholder="ابحث باسم الملف أو Rowguid" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
          </CardHeader>
          <CardContent>
            {!loading && !error && <div className="mb-4 flex flex-wrap items-center gap-2" aria-label="مسار المجلدات">
              {currentFolder ? <Button type="button" size="sm" variant="outline" onClick={() => setCurrentFolder(currentParent)}><ChevronLeft className="size-4" />العودة إلى الأب</Button> : null}
              {visibleFolders.map((folder) => <Button key={folder.id} type="button" size="sm" variant="secondary" onClick={() => setCurrentFolder(folder.id)}><Folder className="size-4" />{folder.name}</Button>)}
              {!currentFolder && folders.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد علاقات مجلد مثبتة في المصدر.</p> : null}
              {currentFolder && visibleFolders.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد مجلدات فرعية مثبتة.</p> : null}
            </div>}
            {loading ? <p className="py-10 text-center text-muted-foreground">جارٍ تحميل المكتبة...</p> : error ? <p role="alert" className="rounded-md border border-destructive/40 p-4 text-destructive">{error}</p> : <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm" aria-label="المجلد الحالي">
                <button type="button" className="font-medium text-primary hover:underline" onClick={() => setCurrentFolder(null)}>المكتبة</button>
                {currentFolderName ? <><span className="text-muted-foreground">/</span><span>{currentFolderName}</span></> : null}
                <span className="mr-auto text-muted-foreground">{filtered.length} مستند</span>
              </div>
              {filtered.length === 0 ? <p className="py-10 text-center text-muted-foreground">لا توجد مستندات مطابقة.</p> : <div className="overflow-x-auto"><table className="w-full text-right text-sm"><thead><tr className="border-b text-muted-foreground"><th className="px-3 py-3 font-medium">اسم المستند</th><th className="px-3 py-3 font-medium">النوع</th><th className="px-3 py-3 font-medium">الحالة</th><th className="px-3 py-3 font-medium">تاريخ الإنشاء</th><th className="px-3 py-3 font-medium">الإجراء</th></tr></thead><tbody>{filtered.map((document) => <tr key={document.rowguid} className="border-b last:border-0"><td className="px-3 py-3"><div className="flex items-center gap-3"><FileText className="size-5 text-primary" aria-hidden="true" /><div className="min-w-0"><button type="button" className="text-right font-medium hover:text-primary hover:underline" onClick={() => setSelectedDocument(document)}>{document.title || 'اسم المستند غير متوفر'}</button><p className="max-w-[34rem] truncate text-xs text-muted-foreground">{document.fileType ?? document.fileName ?? 'نوع غير متوفر'}</p></div></div></td><td className="px-3 py-3 text-muted-foreground">{document.fileType ?? 'غير متوفر'}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-2"><Badge variant={document.verified ? 'secondary' : 'destructive'}>{document.verified ? 'موثق' : 'غير موثق'}</Badge><Badge variant={document.isPublic ? 'outline' : 'secondary'}>{document.isPublic ? 'عام' : 'محمي'}</Badge></div></td><td className="px-3 py-3 text-muted-foreground">{document.createdAt ? new Date(document.createdAt).toLocaleDateString('ar-SA') : 'غير متوفر'}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => void handleFileAction(document, false)}><ExternalLink data-icon="inline-start" />معاينة</Button><Button type="button" size="sm" variant="ghost" onClick={() => void handleFileAction(document, true)}>تنزيل</Button></div>{fileErrors[document.pathname] ? <p role="alert" className="mt-2 max-w-xs text-xs text-destructive">{fileErrors[document.pathname]}</p> : null}</td></tr>)}</tbody></table></div>}
            </div>}
          </CardContent>
        </Card>
      </div>
      <Dialog open={Boolean(selectedDocument)} onOpenChange={(open) => !open && setSelectedDocument(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.title || 'اسم المستند غير متوفر'}</DialogTitle>
            <DialogDescription>تفاصيل المستند من سجل AMNKO الأصلي</DialogDescription>
          </DialogHeader>
          {selectedDocument ? <dl className="grid gap-3 text-sm">
            <div><dt className="font-medium text-muted-foreground">File</dt><dd className="break-words">{selectedDocument.fileName || selectedDocument.title || 'اسم الملف غير متوفر'}</dd></div>
            <div><dt className="font-medium text-muted-foreground">النوع</dt><dd>{selectedDocument.fileType || 'غير متوفر'}</dd></div>
            <div><dt className="font-medium text-muted-foreground">المجلد</dt><dd>{selectedDocument.parentName || 'المكتبة الرئيسية'}</dd></div>
            <div><dt className="font-medium text-muted-foreground">الحالة</dt><dd>{selectedDocument.verified ? 'موثق' : 'غير موثق'}</dd></div>
          </dl> : null}
        </DialogContent>
      </Dialog>
    </main>
  )
}
