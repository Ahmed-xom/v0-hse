"use client"

import { useEffect, useState } from "react"
import { ArrowUpRight, Menu, X } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const sections = [
  ["Home", "dashboard-home"],
  ["Overview", "dashboard-overview"],
  ["Performance", "kpi-cards"],
  ["Incidents", "incidents"],
  ["Observations", "behaviour-observations"],
  ["Inspections", "inspection-reports"],
  ["Inspection Types", "inspection-types"],
  ["Training Courses", "training-courses"],
  ["Training Records", "training-records"],
  ["Team Members", "team-members"],
  ["Business Units", "business-units"],
  ["Document Library", "document-library"],
  ["Company Management", "company-management"],
] as const

export function DashboardNavigation() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState("dashboard-home")

  useEffect(() => {
    const elements = sections
      .map(([, id]) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: "-15% 0px -65% 0px", threshold: [0.1, 0.5] },
    )
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  const navigate = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
    setActive(id)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-20 z-40 inline-flex items-center gap-2 rounded-md border border-sidebar-border bg-sidebar px-3 py-2 text-sm font-medium text-sidebar-foreground shadow-sm lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open dashboard navigation"
      >
        <Menu className="h-4 w-4" />
        Sections
      </button>
      {open && <button className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation" />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 shadow-xl transition-transform lg:sticky lg:inset-auto lg:top-0 lg:z-30 lg:h-screen lg:translate-x-0 lg:shadow-none", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="mb-8 flex items-center justify-between px-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-sidebar-primary">AMNKO HSE</p>
            <h2 className="mt-1 text-lg font-semibold text-sidebar-foreground">Workspace</h2>
          </div>
          <button className="rounded-md p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent lg:hidden" onClick={() => setOpen(false)} aria-label="Close dashboard navigation"><X className="h-4 w-4" /></button>
        </div>
        <nav className="flex-1 space-y-1" aria-label="Dashboard sections">
          {sections.map(([label, id]) => (
            <button key={id} onClick={() => navigate(id)} className={cn("group flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground", active === id && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground")}>
              <span>{label}</span>
              <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-70" />
            </button>
          ))}
        </nav>
        <p className="border-t border-sidebar-border pt-4 text-xs leading-5 text-sidebar-foreground/55">Use the section list to move through the HSE workspace.</p>
      </aside>
    </>
  )
}
