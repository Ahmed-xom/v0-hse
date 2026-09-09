"use client"

import { useState } from 'react'
import { Building2, Check, Plus } from 'lucide-react'
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
  const [activeId, setActiveId] = useState('company-xom-llc')
  const [name, setName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  if (!user) return null
  const canManage = ['MASTER USER', 'ADMIN SYSTEM', 'ADMIN', 'HSE ADMIN'].includes(String(user.role).trim().toUpperCase())
  const loadCompanies = async () => {
    const response = await fetch('/api/companies', { cache: 'no-store' })
    if (!response.ok) return
    const availableCompanies: { id: string; name: string; code?: string | null }[] = await response.json()
    setCompanies(availableCompanies)
    if (!availableCompanies.some((company) => company.id === activeId) && availableCompanies[0]) {
      setActiveId(availableCompanies[0].id)
    }
  }
  const addCompany = async () => {
    if (!name.trim()) return
    setIsCreating(true)
    const response = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const result = await response.json()
    if (result.success && result.company) { setCompanies((items) => [...items, result.company]); setActiveId(result.company.id); setName('') }
    setIsCreating(false)
  }
  return <Popover open={open} onOpenChange={(value) => { setOpen(value); if (value) loadCompanies() }}>
    <PopoverTrigger asChild><Button variant="outline" className="hidden max-w-48 gap-2 sm:flex"><Building2 data-icon="inline-start" /><span className="truncate">{companies.find((c) => c.id === activeId)?.name || 'AMNKO'}</span></Button></PopoverTrigger>
    <PopoverContent align="end" className="w-72"><div className="flex flex-col gap-3"><div><p className="font-semibold">Active company</p><p className="text-sm text-muted-foreground">Choose the company workspace</p></div><div className="flex flex-col gap-1">{companies.length > 0 ? companies.map((company) => <Button key={company.id} variant="ghost" className="justify-between" onClick={() => { setActiveId(company.id); setOpen(false) }}>{company.name}{activeId === company.id && <Check />}</Button>) : <p className="px-3 py-2 text-sm text-muted-foreground">No companies assigned</p>}</div>{canManage && <><Separator /><Label htmlFor="company-name">Add company</Label><div className="flex gap-2"><Input id="company-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Company name" /><Button size="icon" onClick={addCompany} disabled={isCreating} aria-label="Add company"><Plus /></Button></div></>}</div></PopoverContent>
  </Popover>
}
