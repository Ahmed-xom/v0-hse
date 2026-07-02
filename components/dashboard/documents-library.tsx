"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus, Search, RefreshCw, Eye, Edit, Trash2, FileText,
  Download, ExternalLink, ChevronDown, FolderOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format, parseISO } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { isAdminRole, isReviewerRole } from "@/lib/auth-roles"
import {
  getDocuments, createDocument, updateDocument, deleteDocument,
  type HSEDocument,
} from "@/app/actions/manage-documents"
import { DOCUMENT_CATEGORIES } from "@/lib/hse-constants"

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "Under Review": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Superseded: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Archived: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
}

const CATEGORY_ICONS: Record<string, string> = {
  Policy: '📋', Standard: '📐', Procedure: '📝', Guideline: '🗒️',
  'Form / Template': '📄', Report: '📊', 'HSE Plan': '🗺️',
  'Legal / Regulatory': '⚖️', 'Training Material': '🎓', Other: '📁',
}

type FormData = Omit<HSEDocument, 'id' | 'doc_no' | 'created_at' | 'updated_at'>

const EMPTY_FORM: FormData = {
  title: '', category: 'Policy', sub_category: '', description: '',
  version: '1.0', status: 'Active', file_url: '', file_name: '',
  file_size: '', file_type: '', business_unit: '', owner: '',
  owner_email: '', review_date: '', expiry_date: '', tags: [], is_public: true,
}

interface Props { readOnly?: boolean }

export function DocumentsLibrary({ readOnly = false }: Props) {
  const { currentUser } = useAuth()
  const isAdmin = isAdminRole(currentUser?.role ?? '', currentUser?.email ?? '')
  const isReviewer = !isAdmin && isReviewerRole(currentUser?.role ?? '')
  const canEdit = !readOnly && (isAdmin || isReviewer)
  const { toast } = useToast()

  const [docs, setDocs] = useState<HSEDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selected, setSelected] = useState<HSEDocument | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setDocs(await getDocuments())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = docs.filter(d => {
    const matchSearch = !search ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      (d.doc_no ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (d.owner ?? '').toLowerCase().includes(search.toLowerCase()) ||
      d.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
    const matchCat = filterCategory === 'all' || d.category === filterCategory
    const matchStatus = filterStatus === 'all' || d.status === filterStatus
    return matchSearch && matchCat && matchStatus
  })

  // Group by category for the card view
  const byCategory = DOCUMENT_CATEGORIES.reduce<Record<string, HSEDocument[]>>((acc, cat) => {
    const items = filtered.filter(d => d.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {})

  const stats = {
    total: docs.length,
    active: docs.filter(d => d.status === 'Active').length,
    policies: docs.filter(d => d.category === 'Policy').length,
    standards: docs.filter(d => d.category === 'Standard').length,
  }

  const openCreate = () => { setSelected(null); setForm(EMPTY_FORM); setTagInput(''); setIsFormOpen(true) }
  const openEdit = (d: HSEDocument) => {
    setSelected(d)
    setForm({
      title: d.title, category: d.category, sub_category: d.sub_category ?? '',
      description: d.description ?? '', version: d.version, status: d.status,
      file_url: d.file_url ?? '', file_name: d.file_name ?? '',
      file_size: d.file_size ?? '', file_type: d.file_type ?? '',
      business_unit: d.business_unit ?? '', owner: d.owner ?? '',
      owner_email: d.owner_email ?? '',
      review_date: d.review_date ? d.review_date.slice(0, 10) : '',
      expiry_date: d.expiry_date ? d.expiry_date.slice(0, 10) : '',
      tags: d.tags ?? [], is_public: d.is_public,
    })
    setTagInput('')
    setIsFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' })
      return
    }
    setSaving(true)
    const res = selected ? await updateDocument(selected.id, form) : await createDocument(form)
    setSaving(false)
    if (res.success) {
      toast({ title: selected ? 'Document updated' : 'Document added to library' })
      setIsFormOpen(false)
      load()
    } else {
      toast({ title: 'Failed to save document', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    const res = await deleteDocument(id)
    if (res.success) { toast({ title: 'Document deleted' }); load() }
    else toast({ title: 'Failed to delete', variant: 'destructive' })
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !form.tags.includes(t)) {
      setForm(f => ({ ...f, tags: [...f.tags, t] }))
    }
    setTagInput('')
  }

  const fmtDate = (d: string | null) => {
    if (!d) return '—'
    try { return format(parseISO(d), 'dd MMM yyyy') } catch { return d }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Documents', value: stats.total, color: 'text-primary' },
          { label: 'Active', value: stats.active, color: 'text-emerald-500' },
          { label: 'Policies', value: stats.policies, color: 'text-blue-500' },
          { label: 'Standards', value: stats.standards, color: 'text-amber-500' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <FileText className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search documents, tags..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {DOCUMENT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.keys(STATUS_STYLES).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
          {canEdit && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />Add Document
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doc No.</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Review Date</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="py-12 text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <FolderOpen className="h-10 w-10 opacity-40" />
                    <p>No documents found. {canEdit && 'Add your first document to the library.'}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.map(d => (
              <TableRow key={d.id}>
                <TableCell className="font-mono text-xs">{d.doc_no ?? '—'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{CATEGORY_ICONS[d.category] ?? '📄'}</span>
                    <div>
                      <p className="font-medium leading-tight max-w-[200px] truncate">{d.title}</p>
                      {d.sub_category && <p className="text-xs text-muted-foreground">{d.sub_category}</p>}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{d.category}</TableCell>
                <TableCell className="text-sm">v{d.version}</TableCell>
                <TableCell><Badge variant="outline" className={STATUS_STYLES[d.status]}>{d.status}</Badge></TableCell>
                <TableCell className="text-sm">{d.owner ?? '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{fmtDate(d.review_date)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {d.tags?.slice(0, 2).map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                    {(d.tags?.length ?? 0) > 2 && <span className="text-xs text-muted-foreground">+{d.tags.length - 2}</span>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm"><ChevronDown className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setSelected(d); setIsViewOpen(true) }}>
                        <Eye className="mr-2 h-4 w-4" />View Details
                      </DropdownMenuItem>
                      {d.file_url && (
                        <DropdownMenuItem asChild>
                          <a href={d.file_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />Open File
                          </a>
                        </DropdownMenuItem>
                      )}
                      {canEdit && (
                        <>
                          <DropdownMenuItem onClick={() => openEdit(d)}>
                            <Edit className="mr-2 h-4 w-4" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(d.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Dialog */}
      {canEdit && (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selected ? `Edit — ${selected.title}` : 'Add Document to Library'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Title <span className="text-destructive">*</span></Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Document title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category <span className="text-destructive">*</span></Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{DOCUMENT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Sub-Category</Label>
                  <Input value={form.sub_category ?? ''} onChange={e => setForm(f => ({ ...f, sub_category: e.target.value }))} placeholder="e.g. Fire Safety" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea rows={2} value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Version</Label>
                  <Input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} placeholder="1.0" />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.keys(STATUS_STYLES).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Business Unit</Label>
                  <Input value={form.business_unit ?? ''} onChange={e => setForm(f => ({ ...f, business_unit: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>File URL</Label>
                <Input type="url" value={form.file_url ?? ''} onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>File Name</Label>
                  <Input value={form.file_name ?? ''} onChange={e => setForm(f => ({ ...f, file_name: e.target.value }))} placeholder="document.pdf" />
                </div>
                <div className="space-y-1.5">
                  <Label>File Type</Label>
                  <Input value={form.file_type ?? ''} onChange={e => setForm(f => ({ ...f, file_type: e.target.value }))} placeholder="PDF, Word, Excel..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Document Owner</Label>
                  <Input value={form.owner ?? ''} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Owner Email</Label>
                  <Input type="email" value={form.owner_email ?? ''} onChange={e => setForm(f => ({ ...f, owner_email: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Review Date</Label>
                  <Input type="date" value={form.review_date ?? ''} onChange={e => setForm(f => ({ ...f, review_date: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Expiry Date</Label>
                  <Input type="date" value={form.expiry_date ?? ''} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
                </div>
              </div>
              {/* Tags */}
              <div className="space-y-1.5">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); addTag() } }}
                    placeholder="Add a tag and press Enter"
                  />
                  <Button type="button" variant="outline" onClick={addTag}>Add</Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {form.tags.map(t => (
                      <Badge key={t} variant="secondary" className="cursor-pointer" onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))}>
                        {t} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_public"
                  checked={form.is_public}
                  onCheckedChange={v => setForm(f => ({ ...f, is_public: !!v }))}
                />
                <Label htmlFor="is_public" className="cursor-pointer font-normal">Visible to all users</Label>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : selected ? 'Update Document' : 'Add Document'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">{CATEGORY_ICONS[selected?.category ?? ''] ?? '📄'}</span>
              {selected?.title}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className={STATUS_STYLES[selected.status]}>{selected.status}</Badge>
                <Badge variant="outline">{selected.category}</Badge>
                <Badge variant="secondary">v{selected.version}</Badge>
                {selected.is_public && <Badge variant="outline" className="border-emerald-500/30 text-emerald-600">Public</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {[
                  ['Doc No.', selected.doc_no],
                  ['Sub-Category', selected.sub_category],
                  ['Business Unit', selected.business_unit],
                  ['Owner', selected.owner],
                  ['Review Date', fmtDate(selected.review_date)],
                  ['Expiry Date', fmtDate(selected.expiry_date)],
                  ['File Name', selected.file_name],
                  ['File Type', selected.file_type],
                ].map(([l, v]) => v ? (
                  <div key={l as string}><p className="text-xs text-muted-foreground">{l}</p><p className="font-medium">{v}</p></div>
                ) : null)}
              </div>
              {selected.description && (
                <div><p className="text-xs font-semibold text-muted-foreground mb-1">Description</p><p>{selected.description}</p></div>
              )}
              {selected.tags?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Tags</p>
                  <div className="flex flex-wrap gap-1">{selected.tags.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}</div>
                </div>
              )}
              {selected.file_url && (
                <Button asChild className="w-full">
                  <a href={selected.file_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />Open Document
                  </a>
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
