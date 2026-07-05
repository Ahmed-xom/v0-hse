"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Plus, Search, RefreshCw, Eye, Edit, Trash2, FileText,
  Download, ExternalLink, ChevronDown, FolderOpen, Upload,
  Lock, Globe, Users, Shield, X, FileUp, CheckCircle2,
  FilePdf, FileSpreadsheet, FileCode, File,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { format, parseISO } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { isAdminRole, isReviewerRole } from "@/lib/auth-roles"
import {
  getDocuments, createDocument, updateDocument, deleteDocument,
  updateDocumentAccess, getAllUserEmails, uploadFileAction,
  type HSEDocument,
} from "@/app/actions/manage-documents"
import { DOCUMENT_CATEGORIES } from "@/lib/hse-constants"

// ── helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "Under Review": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Superseded: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Archived: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
}

function fileIcon(name: string | null, type: string | null) {
  const ext = (name ?? '').split('.').pop()?.toLowerCase() ?? ''
  const t = (type ?? '').toLowerCase()
  if (['pdf'].includes(ext) || t.includes('pdf'))
    return <FileText className="h-5 w-5 text-red-500" />
  if (['xls', 'xlsx', 'csv'].includes(ext) || t.includes('sheet') || t.includes('excel'))
    return <FileText className="h-5 w-5 text-emerald-500" />
  if (['doc', 'docx'].includes(ext) || t.includes('word'))
    return <FileText className="h-5 w-5 text-blue-500" />
  if (['ppt', 'pptx'].includes(ext))
    return <FileText className="h-5 w-5 text-orange-500" />
  return <FileText className="h-5 w-5 text-muted-foreground" />
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  try { return format(parseISO(d), 'dd MMM yyyy') } catch { return d }
}

// ── types ─────────────────────────────────────────────────────────────────────

type FormData = Omit<HSEDocument, 'id' | 'doc_no' | 'created_at' | 'updated_at'>

const EMPTY_FORM: FormData = {
  title: '', category: 'Policy', sub_category: '', description: '',
  version: '1.0', status: 'Active',
  file_url: '', file_name: '', file_size: '', file_type: '', blob_pathname: '',
  business_unit: '', owner: '', owner_email: '',
  uploaded_by: '', uploaded_by_email: '',
  review_date: '', expiry_date: '',
  tags: [], is_public: true, allowed_emails: [],
}

interface Props { readOnly?: boolean }

// ── component ─────────────────────────────────────────────────────────────────

export function DocumentsLibrary({ readOnly = false }: Props) {
  const { currentUser } = useAuth()
  const isAdmin = isAdminRole(currentUser?.role ?? '', currentUser?.email ?? '')
  const isReviewer = !isAdmin && isReviewerRole(currentUser?.role ?? '')
  const canEdit = !readOnly && (isAdmin || isReviewer)
  const { toast } = useToast()

  // list state
  const [docs, setDocs] = useState<HSEDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // dialogs
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isAccessOpen, setIsAccessOpen] = useState(false)
  const [selected, setSelected] = useState<HSEDocument | null>(null)

  // form
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)

  // file upload
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  // access management
  const [allUsers, setAllUsers] = useState<{ name: string; email: string }[]>([])
  const [accessEmails, setAccessEmails] = useState<string[]>([])
  const [accessIsPublic, setAccessIsPublic] = useState(true)
  const [accessSearch, setAccessSearch] = useState('')
  const [savingAccess, setSavingAccess] = useState(false)

  // ── data load ────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getDocuments(currentUser?.email ?? '', isAdmin)
    setDocs(data)
    setLoading(false)
  }, [currentUser?.email, isAdmin])

  useEffect(() => { load() }, [load])

  // ── filtering ─────────────────────────────────────────────────────────────

  const filtered = docs.filter(d => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      d.title.toLowerCase().includes(q) ||
      (d.doc_no ?? '').toLowerCase().includes(q) ||
      (d.owner ?? '').toLowerCase().includes(q) ||
      d.tags?.some(t => t.toLowerCase().includes(q))
    const matchCat = filterCategory === 'all' || d.category === filterCategory
    const matchStatus = filterStatus === 'all' || d.status === filterStatus
    return matchSearch && matchCat && matchStatus
  })

  const stats = {
    total: docs.length,
    active: docs.filter(d => d.status === 'Active').length,
    policies: docs.filter(d => d.category === 'Policy').length,
    restricted: docs.filter(d => !d.is_public).length,
  }

  // ── file upload ───────────────────────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 50 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum file size is 50 MB', variant: 'destructive' })
      return
    }
    setUploadFile(f)
    setForm(prev => ({
      ...prev,
      file_name: f.name,
      file_type: f.type || f.name.split('.').pop()?.toUpperCase() || '',
      file_size: formatBytes(f.size),
    }))
  }

  const uploadToBlob = async (): Promise<{ url: string; pathname: string } | null> => {
    if (!uploadFile) return null
    setUploading(true)
    setUploadProgress(20)

    try {
      // Use server action to avoid CORS/iframe origin issues in the preview environment
      const fd = new FormData()
      fd.append('file', uploadFile)
      setUploadProgress(50)
      const result = await uploadFileAction(fd)
      setUploadProgress(100)
      if (!result.success || !result.url) {
        throw new Error(result.error ?? 'Upload failed')
      }
      return { url: result.url, pathname: result.pathname! }
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' })
      return null
    } finally {
      setUploading(false)
    }
  }

  // ── form open/close ───────────────────────────────────────────────────────

  const openCreate = () => {
    setSelected(null)
    setForm({
      ...EMPTY_FORM,
      owner: currentUser?.name ?? '',
      owner_email: currentUser?.email ?? '',
      uploaded_by: currentUser?.name ?? '',
      uploaded_by_email: currentUser?.email ?? '',
    })
    setUploadFile(null)
    setTagInput('')
    setIsFormOpen(true)
  }

  const openEdit = (d: HSEDocument) => {
    setSelected(d)
    setForm({
      title: d.title, category: d.category, sub_category: d.sub_category ?? '',
      description: d.description ?? '', version: d.version, status: d.status,
      file_url: d.file_url ?? '', file_name: d.file_name ?? '',
      file_size: d.file_size ?? '', file_type: d.file_type ?? '',
      blob_pathname: d.blob_pathname ?? '',
      business_unit: d.business_unit ?? '', owner: d.owner ?? '',
      owner_email: d.owner_email ?? '',
      uploaded_by: d.uploaded_by ?? '', uploaded_by_email: d.uploaded_by_email ?? '',
      review_date: d.review_date ? d.review_date.slice(0, 10) : '',
      expiry_date: d.expiry_date ? d.expiry_date.slice(0, 10) : '',
      tags: d.tags ?? [], is_public: d.is_public, allowed_emails: d.allowed_emails ?? [],
    })
    setUploadFile(null)
    setTagInput('')
    setIsFormOpen(true)
  }

  // ── save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' }); return
    }
    setSaving(true)
    let fileData = { file_url: form.file_url, blob_pathname: form.blob_pathname }

    // Upload new file if selected
    if (uploadFile) {
      const uploaded = await uploadToBlob()
      if (!uploaded) { setSaving(false); return }
      fileData = { file_url: uploaded.url, blob_pathname: uploaded.pathname }
    }

    const payload = { ...form, ...fileData }
    const res = selected
      ? await updateDocument(selected.id, payload)
      : await createDocument(payload)

    setSaving(false)
    if (res.success) {
      toast({ title: selected ? 'Document updated' : 'Document uploaded to library' })
      setIsFormOpen(false)
      setUploadFile(null)
      load()
    } else {
      toast({ title: 'Failed to save document', variant: 'destructive' })
    }
  }

  // ── delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    const res = await deleteDocument(id)
    if (res.success) { toast({ title: 'Document deleted' }); load() }
    else toast({ title: 'Failed to delete', variant: 'destructive' })
  }

  // ── access management ─────────────────────────────────────────────────────

  const openAccess = async (d: HSEDocument) => {
    setSelected(d)
    setAccessEmails(d.allowed_emails ?? [])
    setAccessIsPublic(d.is_public)
    setAccessSearch('')
    if (allUsers.length === 0) {
      const users = await getAllUserEmails()
      setAllUsers(users)
    }
    setIsAccessOpen(true)
  }

  const handleSaveAccess = async () => {
    if (!selected) return
    setSavingAccess(true)
    const res = await updateDocumentAccess(selected.id, accessEmails, accessIsPublic)
    setSavingAccess(false)
    if (res.success) {
      toast({ title: 'Access settings updated' })
      setIsAccessOpen(false)
      load()
    } else {
      toast({ title: 'Failed to update access', variant: 'destructive' })
    }
  }

  const toggleUserAccess = (email: string) => {
    setAccessEmails(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    )
  }

  // ── tags ──────────────────────────────────────────────────────────────────

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }))
    setTagInput('')
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Files', value: stats.total, icon: <FolderOpen className="h-7 w-7 text-primary" /> },
          { label: 'Active', value: stats.active, icon: <CheckCircle2 className="h-7 w-7 text-emerald-500" /> },
          { label: 'Policies', value: stats.policies, icon: <FileText className="h-7 w-7 text-blue-500" /> },
          { label: 'Restricted', value: stats.restricted, icon: <Lock className="h-7 w-7 text-amber-500" /> },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              {s.icon}
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
        <div className="flex flex-1 flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search files, tags..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
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
          <Button variant="outline" size="sm" onClick={load} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          {canEdit && (
            <Button size="sm" onClick={openCreate}>
              <Upload className="mr-2 h-4 w-4" />Upload File
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Access</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Review Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                  Loading files...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <FolderOpen className="h-12 w-12 opacity-30" />
                    <p className="font-medium">No files found</p>
                    {canEdit && <p className="text-sm">Upload your first file to the HSE library.</p>}
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.map(d => (
              <TableRow key={d.id} className="group">
                <TableCell>{fileIcon(d.file_name, d.file_type)}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium leading-tight max-w-[220px] truncate">{d.title}</p>
                    {d.doc_no && <p className="text-xs text-muted-foreground font-mono">{d.doc_no}</p>}
                    {d.sub_category && <p className="text-xs text-muted-foreground">{d.sub_category}</p>}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{d.category}</TableCell>
                <TableCell className="text-sm">v{d.version}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={STATUS_STYLES[d.status]}>
                    {d.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {d.is_public ? (
                    <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-500/30 bg-emerald-500/5">
                      <Globe className="h-3 w-3" />All Users
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-amber-600 border-amber-500/30 bg-amber-500/5">
                      <Lock className="h-3 w-3" />
                      {d.allowed_emails?.length ? `${d.allowed_emails.length} user(s)` : 'Restricted'}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {d.uploaded_by ?? d.owner ?? '—'}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{fmtDate(d.review_date)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => { setSelected(d); setIsViewOpen(true) }}>
                        <Eye className="mr-2 h-4 w-4" />View Details
                      </DropdownMenuItem>
                      {d.file_url && (
                        <DropdownMenuItem asChild>
                          <a href={d.file_url} target="_blank" rel="noopener noreferrer" download={d.file_name ?? true}>
                            <Download className="mr-2 h-4 w-4" />Download File
                          </a>
                        </DropdownMenuItem>
                      )}
                      {canEdit && (
                        <>
                          <DropdownMenuItem onClick={() => openEdit(d)}>
                            <Edit className="mr-2 h-4 w-4" />Edit Details
                          </DropdownMenuItem>
                          {isAdmin && (
                            <DropdownMenuItem onClick={() => openAccess(d)}>
                              <Shield className="mr-2 h-4 w-4" />Manage Access
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(d.id)}
                          >
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

      {/* ── Upload / Edit Dialog ─────────────────────────────────────────── */}
      {canEdit && (
        <Dialog open={isFormOpen} onOpenChange={v => { setIsFormOpen(v); if (!v) setUploadFile(null) }}>
          <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selected ? `Edit — ${selected.title}` : 'Upload File to HSE Library'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5">
              {/* File drop zone */}
              <div
                className="relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-8 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  const f = e.dataTransfer.files[0]
                  if (f) {
                    const synth = { target: { files: e.dataTransfer.files } } as any
                    handleFileSelect(synth)
                  }
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.zip"
                  onChange={handleFileSelect}
                />
                {uploadFile ? (
                  <>
                    {fileIcon(uploadFile.name, uploadFile.type)}
                    <div className="text-center">
                      <p className="font-medium text-sm">{uploadFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(uploadFile.size)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-7 w-7 p-0"
                      onClick={e => { e.stopPropagation(); setUploadFile(null) }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : form.file_name ? (
                  <>
                    {fileIcon(form.file_name, form.file_type)}
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">Current: {form.file_name}</p>
                      <p className="text-xs text-muted-foreground">Click to replace file</p>
                    </div>
                  </>
                ) : (
                  <>
                    <FileUp className="h-10 w-10 text-muted-foreground/50" />
                    <div className="text-center">
                      <p className="font-medium text-sm">Click or drag and drop to upload</p>
                      <p className="text-xs text-muted-foreground">PDF, Word, Excel, PowerPoint, Images — max 50 MB</p>
                    </div>
                  </>
                )}
              </div>

              {/* Upload progress */}
              {uploading && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Uploading file...</p>
                  <Progress value={uploadProgress} className="h-1.5" />
                </div>
              )}

              {/* Meta fields */}
              <div className="space-y-1.5">
                <Label>Title <span className="text-destructive">*</span></Label>
                <Input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Document title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category <span className="text-destructive">*</span></Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Sub-Category</Label>
                  <Input
                    value={form.sub_category ?? ''}
                    onChange={e => setForm(f => ({ ...f, sub_category: e.target.value }))}
                    placeholder="e.g. Fire Safety"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  rows={2}
                  value={form.description ?? ''}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of this document"
                />
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
                      <Badge
                        key={t}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))}
                      >
                        {t} &times;
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Access */}
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Checkbox
                  id="is_public"
                  checked={form.is_public}
                  onCheckedChange={v => setForm(f => ({ ...f, is_public: !!v }))}
                />
                <div>
                  <Label htmlFor="is_public" className="cursor-pointer font-medium flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-emerald-500" />
                    Visible to all users
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    When unchecked, only users explicitly granted access by an admin can view this file.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => { setIsFormOpen(false); setUploadFile(null) }}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || uploading}>
                {saving || uploading ? (uploadFile ? 'Uploading...' : 'Saving...') : selected ? 'Update Document' : 'Upload & Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── View Details Dialog ───────────────────────────────────────────── */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selected && fileIcon(selected.file_name, selected.file_type)}
              {selected?.title}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={STATUS_STYLES[selected.status]}>{selected.status}</Badge>
                <Badge variant="outline">{selected.category}</Badge>
                <Badge variant="outline">v{selected.version}</Badge>
                {selected.is_public
                  ? <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-500/30"><Globe className="h-3 w-3" />Public</Badge>
                  : <Badge variant="outline" className="gap-1 text-amber-600 border-amber-500/30"><Lock className="h-3 w-3" />Restricted</Badge>
                }
              </div>
              {selected.description && <p className="text-muted-foreground leading-relaxed">{selected.description}</p>}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-muted/40 p-3">
                <Row label="Doc No." value={selected.doc_no} />
                <Row label="Sub-Category" value={selected.sub_category} />
                <Row label="Business Unit" value={selected.business_unit} />
                <Row label="Owner" value={selected.owner} />
                <Row label="Uploaded By" value={selected.uploaded_by} />
                <Row label="File" value={selected.file_name} />
                <Row label="File Size" value={selected.file_size} />
                <Row label="Review Date" value={fmtDate(selected.review_date)} />
                <Row label="Expiry Date" value={fmtDate(selected.expiry_date)} />
              </div>
              {selected.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selected.tags.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
                </div>
              )}
              {selected.file_url && (
                <a
                  href={selected.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={selected.file_name ?? true}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download {selected.file_name ?? 'File'}
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Access Management Dialog (admin only) ────────────────────────── */}
      {isAdmin && (
        <Dialog open={isAccessOpen} onOpenChange={setIsAccessOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Manage Access — {selected?.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Public toggle */}
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Checkbox
                  id="access_public"
                  checked={accessIsPublic}
                  onCheckedChange={v => setAccessIsPublic(!!v)}
                />
                <div>
                  <Label htmlFor="access_public" className="cursor-pointer font-medium flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-emerald-500" />
                    Visible to all users
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    All authenticated users can see and download this file.
                  </p>
                </div>
              </div>

              {!accessIsPublic && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Grant access to specific users</p>
                  </div>

                  <Input
                    placeholder="Search users..."
                    value={accessSearch}
                    onChange={e => setAccessSearch(e.target.value)}
                  />

                  {accessEmails.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {accessEmails.map(e => (
                        <Badge key={e} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleUserAccess(e)}>
                          {allUsers.find(u => u.email === e)?.name ?? e}
                          <X className="h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  )}

                  <ScrollArea className="h-56 rounded-lg border">
                    <div className="p-2 space-y-1">
                      {allUsers
                        .filter(u => {
                          if (!accessSearch) return true
                          const q = accessSearch.toLowerCase()
                          return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
                        })
                        .map(u => (
                          <div
                            key={u.email}
                            className={`flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer transition-colors ${
                              accessEmails.includes(u.email)
                                ? 'bg-primary/10 border border-primary/20'
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => toggleUserAccess(u.email)}
                          >
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium leading-tight truncate">{u.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            </div>
                            {accessEmails.includes(u.email) && (
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                            )}
                          </div>
                        ))}
                    </div>
                  </ScrollArea>

                  <p className="text-xs text-muted-foreground">
                    {accessEmails.length} user(s) selected
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAccessOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveAccess} disabled={savingAccess}>
                {savingAccess ? 'Saving...' : 'Save Access Settings'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// ── small helper ──────────────────────────────────────────────────────────────
function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium truncate">{value || '—'}</p>
    </div>
  )
}
