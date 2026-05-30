"use client"

import { ShieldCheck, TrendingDown, TrendingUp, AlertTriangle, ClipboardCheck, Users, HardHat } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

const kpiData: KPICardProps[] = [
  {
    title: "Days Without Incident",
    value: "127",
    change: "+15%",
    trend: "up",
    icon: <ShieldCheck className="h-5 w-5" />,
    description: "vs last quarter",
  },
  {
    title: "Total Incidents (YTD)",
    value: "23",
    change: "-32%",
    trend: "up",
    icon: <AlertTriangle className="h-5 w-5" />,
    description: "vs same period",
  },
  {
    title: "Inspection Compliance",
    value: "94.2%",
    change: "+2.1%",
    trend: "up",
    icon: <ClipboardCheck className="h-5 w-5" />,
    description: "this month",
  },
  {
    title: "Training Completion",
    value: "89%",
    change: "-3%",
    trend: "down",
    icon: <Users className="h-5 w-5" />,
    description: "target: 95%",
  },
  {
    title: "Near Misses Reported",
    value: "47",
    change: "+18%",
    trend: "up",
    icon: <HardHat className="h-5 w-5" />,
    description: "good reporting",
  },
]

export function KPICards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {kpiData.map((kpi, index) => (
        <KPICard key={index} {...kpi} />
      ))}
    </div>
  )
}
