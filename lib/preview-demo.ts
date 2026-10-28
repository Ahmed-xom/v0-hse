// Temporary, branch-local switch. Revert this change or set false to remove the gallery.
export const PREVIEW_DEMO_MODE = true

export const DEMO_PAGE_PATHS = [
  "/", "/journey-tracker", "/profile", "/settings",
  "/admin/amnko-library", "/admin/amnko-attachments",
  "/admin/data-migration", "/admin/database-migration",
  "/sign-in", "/forgot-password", "/reset-password", "/login-help",
] as const

export type DemoPagePath = (typeof DEMO_PAGE_PATHS)[number]

export function isPreviewDemoMode(
  environment: string | undefined = process.env.VERCEL_ENV,
  enabled: boolean = PREVIEW_DEMO_MODE,
): boolean {
  return environment === "preview" && enabled === true
}

export function isDemoPagePath(path: string): path is DemoPagePath {
  return (DEMO_PAGE_PATHS as readonly string[]).includes(path)
}

export type DemoRequestPolicy = "pass" | "page" | "deny" | "not-found"

export function previewDemoRequestPolicy(
  path: string,
  method: string,
  hasServerAction: boolean,
  environment: string | undefined = process.env.VERCEL_ENV,
): DemoRequestPolicy {
  if (!isPreviewDemoMode(environment)) return "pass"
  if (hasServerAction || !["GET", "HEAD"].includes(method)) return "deny"
  if (isDemoPagePath(path) || path === "/preview-demo") return "page"
  if (path.startsWith("/_next/static/") || path === "/amnko-hse-logo.png" || path === "/favicon.ico") return "pass"
  if (path === "/api" || path.startsWith("/api/") || path.startsWith("/.well-known/")) return "deny"
  return "not-found"
}
