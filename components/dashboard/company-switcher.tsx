"use client"

import { useState } from 'react'
import { Building2, Check, Plus } from 'lucide-react'
import { listCompanies, createCompany } from '@/app/actions/companies'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth-context'

export function CompanySwitcher() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [companies, setCompanies] = useState<{ id: string; name: string; code?: string | null }[]>([])
  const [activeId, setActiveId] = useState('company-amnko')
  const [name, setName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  if (!user) return null
  const canManage = user.role === 'MASTER USER' || user.role === 'ADMIN SYSTEM'
  const loadCompanies = async () => { if (canManage) setCompanies(await listCompanies()) }
  const addCompany = async () => {
    if (!name.trim()) return
    setIsCreating(true)
    const result = await createCompany({ name })
    if (result.success && result.company) { setCompanies((items) => [...items, result.company!]); setActiveId(result.company.id); setName('') }
    setIsCreating(false)
  }
  return <Popover open={open} onOpenChange={(value) => { setOpen(value); if (value) loadCompanies() }}>
    <PopoverTrigger asChild><Button variant="outline" className="hidden max-w-48 gap-2 sm:flex"><Building2 data-icon="inline-start" /><span className="truncate">{companies.find((c) => c.id === activeId)?.name || 'AMNKO'}</span></Button></PopoverTrigger>
    <PopoverContent align="end" className="w-72"><div className="flex flex-col gap-3"><div><p className="font-semibold">Active company</p><p className="text-sm text-muted-foreground">Choose the company workspace</p></div><div className="flex flex-col gap-1">{companies.map((company) => <Button key={company.id} variant="ghost" className="justify-between" onClick={() => { setActiveId(company.id); setOpen(false) }}>{company.name}{activeId === company.id && <Check />}</Button>)}</div>{canManage && <><Separator /><Label htmlFor="company-name">Add company</Label><div className="flex gap-2"><Input id="company-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Company name" /><Button size="icon" onClick={addCompany} disabled={isCreating} aria-label="Add company"><Plus /></Button></div></>}</div></PopoverContent>
  </Popover>
}
