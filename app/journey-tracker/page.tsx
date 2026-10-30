import type { Metadata } from "next"
import { JourneyTracker } from "@/components/dashboard/journey-tracker"

export const metadata: Metadata = {
  title: "Journey Trucker | AMNKO HSE",
  description:
    "Company-scoped journey planning, ordered HSE and management approvals, and transport safety readiness. Staged code preview; operational activation is pending.",
  alternates: { canonical: "/journey-tracker" },
  robots: { index: false, follow: false },
}

export default function JourneyTrackerPage() {
  return (
    <main>
      <JourneyTracker />
    </main>
  )
}
