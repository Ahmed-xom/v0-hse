"use client"

import { ShieldCheck, TrendingDown, TrendingUp, ClipboardCheck, Users, HardHat } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardStats } from "@/app/actions/get-dashboard-stats"

interface KPICardProps {
  title: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
  icon: React.ReactNode
  description?: string
}

function KPICard({ title, value, change, trend, icon, description }: KPICardProps) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="rounded-md bg-secondary p-2 text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <div className="flex items-center gap-2 pt-1">
          {trend === "up" ? (
            <TrendingUp className="h-4 w-4 text-success" />
          ) : trend === "down" ? (
            <TrendingDown className="h-4 w-4 text-destructive" />
          ) : null}
          <span
            className={`text-sm ${
              trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {change}
          </span>
          {description && <span className="text-sm text-muted-foreground">• {description}</span>}
        </div>
      </CardContent>
    </Card>
  )
}

interface KPICardsProps {
  stats?: DashboardStats
}

export function KPICards({ stats }: KPICardsProps) {
  const parseTrend = (change: string): "up" | "down" | "neutral" => {
    if (!change || change === "—") return "neutral"
    return change.startsWith("+") ? "up" : "down"
  }

  const kpiData: KPICardProps[] = [
    {
      title: "Days Without Incident",
      value: stats ? String(stats.daysWithoutIncident) : "—",
      change: stats?.daysWithoutIncidentChange ?? "—",
      trend: stats ? parseTrend(stats.daysWithoutIncidentChange) : "neutral",
      icon: <ShieldCheck className="h-5 w-5" />,
      description: "vs last quarter",
    },
    {
      title: "Inspection Compliance",
      value: stats?.inspectionCompliance ?? "—",
      change: stats?.inspectionComplianceChange ?? "—",
      trend: stats ? parseTrend(stats.inspectionComplianceChange) : "neutral",
      icon: <ClipboardCheck className="h-5 w-5" />,
      description: "this month",
    },
    {
      title: "Training Completion",
      value: stats?.trainingCompletion ?? "—",
      change: stats?.trainingCompletionChange ?? "—",
      trend: stats ? parseTrend(stats.trainingCompletionChange) : "neutral",
      icon: <Users className="h-5 w-5" />,
      description: "target: 95%",
    },
    {
      title: "Near Misses Reported",
      value: stats ? String(stats.nearMissesReported) : "—",
      change: stats?.nearMissesChange ?? "—",
      trend: stats ? parseTrend(stats.nearMissesChange) : "neutral",
      icon: <HardHat className="h-5 w-5" />,
      description: "good reporting",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((kpi, index) => (
        <KPICard key={index} {...kpi} />
      ))}
    </div>
  )
}
