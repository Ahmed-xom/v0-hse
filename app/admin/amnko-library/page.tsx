'use client'

import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, FileText, Lock, Search, ShieldCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

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
}

export default function AmnkoLibraryPage() {
  const [documents, setDocuments] = useState<LibraryDocument[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/amnko-library', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 401 ? 'غير مصرح' : 'تعذر تحميل مكتبة AMNKO')
        return response.json() as Promise<{ documents?: LibraryDocument[] }>
      })
      .then((data) => setDocuments(data.documents ?? []))
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return documents
    return documents.filter((document) => [document.title, document.fileName, document.category, document.rowguid]
      .some((value) => value?.toLowerCase().includes(normalized)))
  }, [documents, query])

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">AMNKO HSE / secured library</p>
            <h1 className="text-3xl font-semibold tracking-tight">مكتبة AMNKO HSE</h1>
            <p className="text-muted-foreground">المستندات الخاصة المرتبطة بسجلات المكتبة الأصلية.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="size-4" aria-hidden="true" />
            <span>وصول Admin فقط</span>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3" aria-label="Library summary">
          <Card><CardHeader className="pb-2"><CardDescription>إجمالي المستندات</CardDescription><CardTitle>{documents.length}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>نتائج البحث</CardDescription><CardTitle>{filtered.length}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>التحقق</CardDescription><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" aria-hidden="true" />SHA-256</CardTitle></CardHeader></Card>
        </section>

        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle>المستندات المرتبطة</CardTitle><CardDescription>فتح الملف يتم عبر API خاص، وليس عبر رابط Blob عام.</CardDescription></div>
            <div className="relative w-full sm:max-w-sm"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input className="pr-9" aria-label="بحث في المكتبة" placeholder="ابحث باسم الملف أو Rowguid" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
          </CardHeader>
          <CardContent>
            {loading ? <p className="py-10 text-center text-muted-foreground">جارٍ تحميل المكتبة...</p> : error ? <p role="alert" className="rounded-md border border-destructive/40 p-4 text-destructive">{error}</p> : filtered.length === 0 ? <p className="py-10 text-center text-muted-foreground">لا توجد مستندات مطابقة.</p> : <div className="overflow-x-auto"><table className="w-full text-right text-sm"><thead><tr className="border-b text-muted-foreground"><th className="px-3 py-3 font-medium">المستند</th><th className="px-3 py-3 font-medium">الفئة</th><th className="px-3 py-3 font-medium">الحالة</th><th className="px-3 py-3 font-medium">الإجراء</th></tr></thead><tbody>{filtered.map((document) => <tr key={document.rowguid} className="border-b last:border-0"><td className="px-3 py-3"><div className="flex items-center gap-3"><FileText className="size-5 text-primary" aria-hidden="true" /><div className="min-w-0"><p className="truncate font-medium">{document.title}</p><p className="max-w-[34rem] truncate text-xs text-muted-foreground">{document.fileName ?? document.rowguid}</p></div></div></td><td className="px-3 py-3 text-muted-foreground">{document.category ?? 'AMNKO HSE'}</td><td className="px-3 py-3"><Badge variant={document.verified ? 'secondary' : 'destructive'}>{document.verified ? 'Verified' : 'Unverified'}</Badge></td><td className="px-3 py-3"><Button asChild size="sm" variant="outline"><a href={`/api/amnko-attachments/file?pathname=${encodeURIComponent(document.pathname)}`} target="_blank" rel="noreferrer"><ExternalLink data-icon="inline-start" />فتح الملف</a></Button></td></tr>)}</tbody></table></div>}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
