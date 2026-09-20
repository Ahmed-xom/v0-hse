"use client"

import { useState, useEffect } from "react"
import { KPICards } from "./kpi-cards"
import { IncidentStatistics } from "./incident-statistics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardStats } from "@/app/actions/get-dashboard-stats"
import type { DashboardStats } from "@/app/actions/get-dashboard-stats"

export function DashboardOverview({ companyId }: { companyId?: string | null }) {
  const [stats, setStats] = useState<DashboardStats | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getDashboardStats(companyId).then((s) => {
      setStats(s)
      setIsLoading(false)
    }).catch((error) => {
      console.error('[v0] Dashboard stats failed', error)
      setStats(undefined)
      setIsLoading(false)
    })
  }, [companyId])

  return (
    <>
      <section aria-label="Key Performance Indicators">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-secondary/50" />
            ))}
          </div>
        ) : (
          <KPICards stats={stats} />
        )}
      </section>

      {!isLoading && stats && (
        <section aria-label="Journey Management Overview" className="mt-6">
          <Card><CardHeader><CardTitle>Journey Management</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">{[['Total', stats.journeyStats.total], ['Draft', stats.journeyStats.draft], ['Pending Approval', stats.journeyStats.pending], ['Approved', stats.journeyStats.approved], ['Active', stats.journeyStats.active], ['Completed', stats.journeyStats.completed], ['Cancelled', stats.journeyStats.cancelled], ['High Risk', stats.journeyStats.highRisk]].map(([label, value]) => <div key={label as string} className="rounded-lg border border-border/50 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>)}</div></CardContent></Card>
        </section>
      )}

      <section aria-label="Incident Statistics" className="mt-6">
        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-lg bg-secondary/50" />
            ))}
          </div>
        ) : (
          <IncidentStatistics stats={stats} />
        )}
      </section>
    </>
  )
}
