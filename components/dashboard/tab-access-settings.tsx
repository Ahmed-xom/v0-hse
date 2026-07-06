"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2, Save, Search, Users, CheckSquare, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  getAllUserTabAccess,
  setUserTabAccess,
  ALL_TABS,
  type TabKey,
} from "@/app/actions/tab-access"
import { getUsers } from "@/app/actions/manage-users"

type UserRow = {
  email: string
  name: string
  role: string
  allowedTabs: TabKey[]
  dirty: boolean
}

const ALL_TAB_KEYS = ALL_TABS.map(t => t.key)
const DEFAULT_ALL: TabKey[] = [...ALL_TAB_KEYS]

export function TabAccessSettings() {
  const { toast } = useToast()
  const [rows, setRows] = useState<UserRow[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [usersResult, accessRows] = await Promise.all([
        getUsers(),
        getAllUserTabAccess(),
      ])

      const accessMap = new Map(accessRows.map(r => [r.userEmail.toLowerCase(), r.allowedTabs]))
      const users = (usersResult.data ?? []) as { email: string; name: string; role: string }[]

      setRows(
        users.map(u => ({
          email: u.email,
          name: u.name,
          role: u.role,
          allowedTabs: accessMap.get(u.email.toLowerCase()) ?? DEFAULT_ALL,
          dirty: false,
        }))
      )
    } catch (e) {
      toast({ title: "Error loading users", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  const toggleTab = (email: string, tab: TabKey) => {
    setRows(prev => prev.map(r => {
      if (r.email !== email) return r
      const has = r.allowedTabs.includes(tab)
      return {
        ...r,
        allowedTabs: has ? r.allowedTabs.filter(t => t !== tab) : [...r.allowedTabs, tab],
        dirty: true,
      }
    }))
  }

  const toggleAllTabs = (email: string, grant: boolean) => {
    setRows(prev => prev.map(r => {
      if (r.email !== email) return r
      return { ...r, allowedTabs: grant ? [...DEFAULT_ALL] : [], dirty: true }
    }))
  }

  const handleSave = async (email: string) => {
    const row = rows.find(r => r.email === email)
    if (!row) return
    setSaving(email)
    try {
      const result = await setUserTabAccess(email, row.allowedTabs)
      if (!result.success) throw new Error(result.error)
      setRows(prev => prev.map(r => r.email === email ? { ...r, dirty: false } : r))
      toast({ title: "Access updated", description: `Tab access saved for ${row.name}` })
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" })
    } finally {
      setSaving(null)
    }
  }

  const filtered = rows.filter(r =>
    !search ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.email.toLowerCase().includes(search.toLowerCase()) ||
    r.role.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle>Tab Access Control</CardTitle>
            <CardDescription>
              Choose which dashboard sections each user can see. Admins always have full access.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email or role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No users found.</p>
        ) : (
          <div className="rounded-md border overflow-hidden">
            {/* Header row */}
            <div className="bg-muted/50 border-b">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-52 shrink-0">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</span>
                </div>
                <div className="flex flex-1 gap-1">
                  {ALL_TABS.map(tab => (
                    <div key={tab.key} className="flex-1 min-w-[60px] text-center">
                      <span className="text-xs font-medium text-muted-foreground leading-tight block">
                        {tab.label.split(" ").map((w, i) => (
                          <span key={i} className="block">{w}</span>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="w-28 shrink-0" />
              </div>
            </div>

            <ScrollArea className="max-h-[520px]">
              {filtered.map((row, idx) => (
                <div
                  key={row.email}
                  className={`flex items-center gap-3 px-4 py-3 border-b last:border-0 transition-colors ${
                    row.dirty ? "bg-amber-50/30 dark:bg-amber-950/20" : idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                  }`}
                >
                  {/* User info */}
                  <div className="w-52 shrink-0 min-w-0">
                    <p className="text-sm font-medium truncate">{row.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{row.email}</p>
                    <Badge variant="outline" className="text-[10px] h-4 mt-0.5 px-1">{row.role}</Badge>
                  </div>

                  {/* Tab checkboxes */}
                  <div className="flex flex-1 gap-1">
                    {ALL_TABS.map(tab => (
                      <div key={tab.key} className="flex-1 min-w-[60px] flex justify-center">
                        <Checkbox
                          checked={row.allowedTabs.includes(tab.key)}
                          onCheckedChange={() => toggleTab(row.email, tab.key)}
                          aria-label={`${tab.label} access for ${row.name}`}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="w-28 shrink-0 flex items-center gap-1 justify-end">
                    {/* Grant/Revoke all */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="Grant all tabs"
                      onClick={() => toggleAllTabs(row.email, true)}
                    >
                      <CheckSquare className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="Revoke all tabs"
                      onClick={() => toggleAllTabs(row.email, false)}
                    >
                      <Square className="h-3.5 w-3.5" />
                    </Button>
                    {/* Save */}
                    <Button
                      size="sm"
                      variant={row.dirty ? "default" : "outline"}
                      className="h-7 px-2 text-xs"
                      disabled={!row.dirty || saving === row.email}
                      onClick={() => handleSave(row.email)}
                    >
                      {saving === row.email
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Save className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Changes are saved per user. Rows highlighted in amber have unsaved changes.
        </p>
      </CardContent>
    </Card>
  )
}
