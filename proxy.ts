import { NextRequest, NextResponse } from "next/server"
import { previewDemoRequestPolicy } from "@/lib/preview-demo"

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const policy = previewDemoRequestPolicy(path, request.method, request.headers.has("next-action"))

  if (policy === "pass") return NextResponse.next()

  const headers = {
    "Cache-Control": "private, no-store, max-age=0",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    "X-AMNKO-Preview-Demo": "read-only",
  }

  if (policy === "deny") {
    return NextResponse.json({
      code: "PREVIEW_DEMO_READ_ONLY",
      message: "Preview Demo is read-only. Live data, authentication requests and server actions are unavailable.",
    }, { status: 403, headers })
  }

  if (policy === "not-found") {
    return new NextResponse("This route is not available in the isolated Preview Demo.", { status: 404, headers })
  }

  if (path === "/preview-demo") return NextResponse.next({ headers })

  const destination = request.nextUrl.clone()
  destination.pathname = "/preview-demo"
  destination.search = ""
  destination.searchParams.set("view", path)
  return NextResponse.rewrite(destination, { headers })
}

// No exclusions: POST Server Actions, API reads and internal workflow endpoints must all be denied in demo mode.
export const config = { matcher: "/:path*" }
