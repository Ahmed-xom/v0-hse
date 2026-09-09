"use client"

import { useCallback, useEffect, useState } from "react"
import { Building2, Check, Edit3, Plus, Power } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

interface Company { id: string; name: string; code?: string | null; status?: string | null }
const adminRoles = ["MASTER USER", "ADMIN SYSTEM", "ADMIN", "HSE ADMIN"]

export function CompanyManagement() {
  const { user, activeCompanyId, setActiveCompanyId } = useAuth()
  const { toast } = useToast()
  const [companies, setCompanies] = useState<Company[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", code: "" })
  const [isSaving, setIsSaving] = useState(false)
  const isAdmin = Boolean(user && adminRoles.includes(String(user.role).trim().toUpperCase()))

  const loadCompanies = useCallback(async () => {
    if (!user?.email || !isAdmin) return
    const response = await fetch("/api/companies", { cache: "no-store", headers: { "x-user-email": user.email } })
    if (response.ok) setCompanies(await response.json())
  }, [isAdmin, user?.email])

  useEffect(() => { void loadCompanies() }, [loadCompanies])

  if (!isAdmin) return null

  const saveCompany = async () => {
    if (!form.name.trim()) return
    setIsSaving(true)
    const response = await fetch("/api/companies", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json", "x-user-email": user?.email ?? "" },
      body: JSON.stringify({ id: editing, name: form.name, code: form.code }),
    })
    const result = await response.json()
    setIsSaving(false)
    if (!result.success) {
      toast({ title: "Company not saved", description: result.error, variant: "destructive" })
      return
    }
    setCompanies((items) => editing ? items.map((item) => item.id === result.company.id ? result.company : item) : [...items, result.company])
    setActiveCompanyId(result.company.id)
    setEditing(null)
    setForm({ name: "", code: "" })
    toast({ title: editing ? "Company updated" : "Company created", description: result.company.name })
  }

  const editCompany = (company: Company) => {
    setEditing(company.id)
    setForm({ name: company.name, code: company.code ?? "" })
  }

  const toggleCompany = async (company: Company) => {
    const response = await fetch("/api/companies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-user-email": user?.email ?? "" },
      body: JSON.stringify({ id: company.id, name: company.name, code: company.code, status: company.status === "Inactive" ? "Active" : "Inactive" }),
    })
    const result = await response.json()
    if (!result.success) return toast({ title: "Status update failed", description: result.error, variant: "destructive" })
    setCompanies((items) => items.map((item) => item.id === result.company.id ? result.company : item))
    if (result.company.status === "Inactive" && activeCompanyId === result.company.id) {
      const next = companies.find((item) => item.id !== result.company.id && item.status !== "Inactive")
      if (next) setActiveCompanyId(next.id)
    }
  }

  return (
    <Card id="company-management" className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></div>
          <div><CardTitle>Company Management</CardTitle><CardDescription>Create, edit, activate, and switch company workspaces.</CardDescription></div>
        </div>
        <Button variant="outline" onClick={() => { setEditing(null); setForm({ name: "", code: "" }) }}><Plus className="mr-2 h-4 w-4" />New company</Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {companies.map((company) => <div key={company.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-4">
            <button className="flex min-w-0 items-center gap-3 text-left" onClick={() => setActiveCompanyId(company.id)}>
              <Building2 className="h-5 w-5 shrink-0 text-muted-foreground" />
              <span className="min-w-0"><span className="block truncate font-medium">{company.name}</span><span className="text-xs text-muted-foreground">{company.code || company.id}</span></span>
              {activeCompanyId === company.id && <Check className="h-4 w-4 text-primary" />}
            </button>
            <div className="flex items-center gap-2"><Badge variant={company.status === "Inactive" ? "secondary" : "default"}>{company.status || "Active"}</Badge><Button variant="ghost" size="icon" onClick={() => editCompany(company)} aria-label={`Edit ${company.name}`}><Edit3 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => toggleCompany(company)} aria-label={`Toggle ${company.name}`}><Power className="h-4 w-4" /></Button></div>
          </div>)}
        </div>
        <div className="grid gap-3 rounded-lg border border-dashed border-border/70 p-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
          <div className="grid gap-2"><Label htmlFor="company-management-name">Company name</Label><Input id="company-management-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Enter company name" /></div>
          <div className="grid gap-2"><Label htmlFor="company-management-code">Code</Label><Input id="company-management-code" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="Optional code" /></div>
          <div className="flex gap-2"><Button onClick={saveCompany} disabled={isSaving || !form.name.trim()}>{editing ? "Save changes" : "Create company"}</Button>{editing && <Button variant="ghost" onClick={() => { setEditing(null); setForm({ name: "", code: "" }) }}>Cancel</Button>}</div>
        </div>
      </CardContent>
    </Card>
  )
}
