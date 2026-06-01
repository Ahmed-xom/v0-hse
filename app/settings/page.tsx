"use client"

import { MasterSettings } from "@/components/dashboard/master-settings"
import { DashboardHeader } from "@/components/dashboard/header"
import { ProtectedRoute } from "@/components/protected-route"

export default function SettingsPage() {
  return (
    <ProtectedRoute requiredRoles={["ADMIN SYSTEM", "MASTER USER"]}>
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <MasterSettings />
        </main>
      </div>
    </ProtectedRoute>
  )
}
