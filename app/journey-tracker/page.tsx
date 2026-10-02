import { JourneyTracker } from "@/components/dashboard/journey-tracker"
import { LanguageProvider } from "@/lib/language-context"

export default function JourneyTrackerPage() {
  return <LanguageProvider><JourneyTracker /></LanguageProvider>
}
