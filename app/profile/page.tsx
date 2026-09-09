"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { ProtectedRoute } from "@/components/protected-route"
import { ProfileEditor } from "@/components/profile/profile-editor"

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <ProfileEditor />
        </main>
      </div>
    </ProtectedRoute>
  )
}
