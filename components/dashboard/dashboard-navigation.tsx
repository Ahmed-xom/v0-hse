"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { isXomCompanyActive } from "@/app/actions/manage-trackers"
import { useAuth } from "@/lib/auth-context"

const sections = [
  ["Home", "dashboard-home"],
  ["Performance Overview", "kpi-cards"],
  ["Incidents", "incidents"],
  ["Observations", "behaviour-observations"],
  ["Inspection Reports", "inspection-reports"],
  ["Inspection Types", "inspection-types"],
  ["Training Courses", "training-courses"],
  ["Training Records", "training-records"],
  ["Team Members", "team-members"],
  ["Business Units", "business-units"],
  ["Document Library", "document-library"],
  ["Company Management", "company-management"],
  ["Journey Tracker", "journey-tracker"],
  ["Meetings", "meetings"],
  ["Ticket & Invoice Tracker", "ticket-invoice-tracker"],
] as const

export function DashboardNavigation() {
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [active, setActive] = useState("dashboard-home")
  const [showXomTracker, setShowXomTracker] = useState(false)
  const { activeCompanyId } = useAuth()

  useEffect(() => {
    let cancelled = false
    setShowXomTracker(false)
    if (!activeCompanyId) return
    void isXomCompanyActive(activeCompanyId).then((isXom) => {
      if (!cancelled) setShowXomTracker(isXom)
    })
    return () => { cancelled = true }
  }, [activeCompanyId])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: "-20% 0px -65%" },
    )
    sections.forEach(([, id]) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })
    return () => observer.disconnect()
  }, [])

  const navigate = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
    setActive(id)
    setOpen(false)
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg lg:hidden">
        <Menu className="h-4 w-4" /> Options
      </button>
      {open && <button aria-label="Close options" className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 shadow-xl transition-all lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:translate-x-0 lg:shadow-none", collapsed && "lg:w-16", open ? "translate-x-0" : "-translate-x-full")}>
        <div className={cn("mb-6 flex items-center justify-between", collapsed ? "lg:px-0" : "px-2")}>
          <div className={cn(collapsed && "lg:hidden")}>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/60">Workspace</p>
            <h2 className="mt-1 text-lg font-semibold text-sidebar-foreground">All options</h2>
          </div>
          <button type="button" aria-label="Close options" onClick={() => setOpen(false)} className="rounded-md p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden"><X className="h-4 w-4" /></button>
        </div>
        <nav aria-label="Dashboard options" className={cn("flex flex-1 flex-col gap-1 overflow-y-auto", collapsed && "lg:hidden")}>
          {sections.filter(([, id]) => id !== "ticket-invoice-tracker" || showXomTracker).map(([label, id]) => (
            <button key={id} type="button" onClick={() => navigate(id)} className={cn("rounded-md px-3 py-2.5 text-left text-sm transition-colors", active === id ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground")}>{label}</button>
          ))}
        </nav>
        <button type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Show options" : "Hide options"} className="mt-auto hidden items-center justify-center gap-2 rounded-md border border-sidebar-border px-3 py-2 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground lg:flex">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /> Hide list</>}
        </button>
      </aside>
    </>
  )
}
