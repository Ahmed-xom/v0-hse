import { randomUUID } from "node:crypto"
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

const handler = toNextJsHandler(auth)
export const GET = handler.GET

export async function POST(request: Request) {
  const response = await handler.POST(request)
  const path = new URL(request.url).pathname
  if (process.env.VERCEL_ENV === "preview" && path.endsWith("/sign-in/email")) {
    const correlationId = randomUUID()
    console.log("[v0] Preview Better Auth diagnostic", {
      correlationId,
      environment: process.env.VERCEL_ENV,
      responseStatus: response.status,
      sessionResponse: response.status >= 200 && response.status < 300 ? "success" : "error",
      sanitizedErrorCode: response.status >= 200 && response.status < 300 ? "NONE" : `HTTP_${response.status}`,
      sessionCookieIssued: response.headers.has("set-cookie"),
    })
  }
  return response
}
