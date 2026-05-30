"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const incidentTrendData = [
  { month: "Jan", incidents: 8, nearMisses: 12 },
  { month: "Feb", incidents: 6, nearMisses: 15 },
  { month: "Mar", incidents: 4, nearMisses: 18 },
  { month: "Apr", incidents: 5, nearMisses: 14 },
  { month: "May", incidents: 3, nearMisses: 20 },
  { month: "Jun", incidents: 2, nearMisses: 22 },
  { month: "Jul", incidents: 4, nearMisses: 19 },
  { month: "Aug", incidents: 3, nearMisses: 25 },
  { month: "Sep", incidents: 2, nearMisses: 21 },
  { month: "Oct", incidents: 1, nearMisses: 28 },
  { month: "Nov", incidents: 2, nearMisses: 24 },
  { month: "Dec", incidents: 1, nearMisses: 30 },
]

const incidentByTypeData = [
  { name: "Slips & Falls", value: 35, color: "var(--color-chart-1)" },
  { name: "Equipment", value: 25, color: "var(--color-chart-2)" },
  { name: "Chemical", value: 15, color: "var(--color-chart-3)" },
  { name: "Ergonomic", value: 15, color: "var(--color-chart-4)" },
  { name: "Other", value: 10, color: "var(--color-chart-5)" },
]

const incidentBySeverityData = [
  { severity: "Minor", count: 15 },
  { severity: "Moderate", count: 6 },
  { severity: "Serious", count: 2 },
  { severity: "Critical", count: 0 },
]

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-popover p-3 shadow-lg">
        <p className="font-medium text-foreground">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function IncidentStatistics() {
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {/* Incident Trend Chart */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm xl:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Incident Trends
          </CardTitle>
          <CardDescription>Monthly incidents and near-miss reports over the past year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={incidentTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incidentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-4)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-chart-4)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="nearMissGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Area
                  type="monotone"
                  dataKey="incidents"
                  name="Incidents"
                  stroke="var(--color-chart-4)"
                  fillOpacity={1}
                  fill="url(#incidentGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="nearMisses"
                  name="Near Misses"
                  stroke="var(--color-chart-1)"
                  fillOpacity={1}
                  fill="url(#nearMissGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Incident by Type - Pie Chart */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-chart-2" />
            Incidents by Type
          </CardTitle>
          <CardDescription>Distribution of incidents by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incidentByTypeData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {incidentByTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="rounded-lg border border-border bg-popover p-3 shadow-lg">
                          <p className="font-medium text-foreground">{data.name}</p>
                          <p className="text-sm text-muted-foreground">{data.value}%</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {incidentByTypeData.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Severity Distribution */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm lg:col-span-2 xl:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-chart-3" />
            Severity Distribution
          </CardTitle>
          <CardDescription>Incidents categorized by severity level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incidentBySeverityData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} horizontal={false} />
                <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="severity" type="category" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Count" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Safety Performance Summary
          </CardTitle>
          <CardDescription>Key safety metrics at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
              <div className="text-sm text-muted-foreground">TRIR</div>
              <div className="text-2xl font-bold text-primary">1.2</div>
              <div className="text-xs text-success">Below industry avg (2.8)</div>
            </div>
            <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
              <div className="text-sm text-muted-foreground">LTIR</div>
              <div className="text-2xl font-bold text-primary">0.4</div>
              <div className="text-xs text-success">-25% vs last year</div>
            </div>
            <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
              <div className="text-sm text-muted-foreground">EMR</div>
              <div className="text-2xl font-bold text-primary">0.85</div>
              <div className="text-xs text-success">Below benchmark (1.0)</div>
            </div>
            <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
              <div className="text-sm text-muted-foreground">First Aid Cases</div>
              <div className="text-2xl font-bold text-chart-3">18</div>
              <div className="text-xs text-muted-foreground">This quarter</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
