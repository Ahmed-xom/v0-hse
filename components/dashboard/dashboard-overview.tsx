"use client"

import { useState, useEffect } from "react"
import { KPICards } from "./kpi-cards"
import { IncidentStatistics } from "./incident-statistics"
import { getDashboardStats } from "@/app/actions/get-dashboard-stats"
import type { DashboardStats } from "@/app/actions/get-dashboard-stats"

export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getDashboardStats().then((s) => {
      setStats(s)
      setIsLoading(false)
    })
  }, [])

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
