import { MasterSettings } from "@/components/dashboard/master-settings"
import { DashboardHeader } from "@/components/dashboard/header"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <MasterSettings />
      </main>
    </div>
  )
}
