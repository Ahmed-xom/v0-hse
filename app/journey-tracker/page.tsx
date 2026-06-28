"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { useAuth } from "@/lib/auth-context"
import { Loader2, Shield, Route, MapPin, Clock, CheckCircle2, AlertCircle, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function JourneyTrackerPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/sign-in")
    }
    if (!isLoading && user && !user.journeyAccess) {
      router.push("/")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary">
            <Shield className="h-9 w-9 text-primary-foreground" />
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !user.journeyAccess) {
    return null
  }

  const stats = [
    { label: "Total Journeys", value: "0", icon: Route, color: "text-primary" },
    { label: "In Progress", value: "0", icon: Clock, color: "text-yellow-500" },
    { label: "Completed", value: "0", icon: CheckCircle2, color: "text-emerald-500" },
    { label: "Flagged", value: "0", icon: AlertCircle, color: "text-destructive" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">

        {/* Page Title */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Journey Tracker</h1>
              <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                <Route className="mr-1 h-3 w-3" />
                Active
              </Badge>
            </div>
            <p className="mt-1 text-muted-foreground">
              Track and manage your journeys safely.
            </p>
          </div>
          <Button className="mt-4 gap-2 sm:mt-0">
            <Plus className="h-4 w-4" />
            New Journey
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty state */}
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-semibold">No journeys yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Click "New Journey" to log your first journey record.
              </p>
            </div>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              New Journey
            </Button>
          </CardContent>
        </Card>

      </main>
    </div>
  )
}
