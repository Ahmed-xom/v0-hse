import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { DemoWorkspace } from "@/components/preview-demo/demo-workspace"
import { isDemoPagePath, isPreviewDemoMode } from "@/lib/preview-demo"

export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "AMNKO HSE | Preview Demo — Read-only",
  description: "Isolated interface gallery with fictional DEMO DATA. No live data or authenticated access.",
  robots: { index: false, follow: false },
}

export default async function PreviewDemoPage({ searchParams }: {
  searchParams: Promise<{ view?: string }>
}) {
  if (!isPreviewDemoMode()) notFound()
  const { view = "/" } = await searchParams
  if (!isDemoPagePath(view)) notFound()
  return <DemoWorkspace view={view} />
}
