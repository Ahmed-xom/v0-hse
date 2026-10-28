import { randomUUID } from "node:crypto"
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

const handler = toNextJsHandler(auth)

export const GET = handler.GET

export async function POST(request: Request) {
  const correlationId = randomUUID()
  const response = await handler.POST(request)
  const isEmailSignIn = new URL(request.url).pathname.endsWith("/sign-in/email")

  if (isEmailSignIn && process.env.VERCEL_ENV === "preview") {
    console.log("[v0] Preview auth diagnostic", {
      correlationId,
      credentialVerificationSucceeded: response.status >= 200 && response.status < 300,
      sessionCreation: response.status >= 200 && response.status < 300 ? "success" : "error",
      sanitizedErrorCode: response.status >= 200 && response.status < 300 ? undefined : `HTTP_${response.status}`,
      sessionCookieIssued: response.headers.has("set-cookie"),
    })
  }

  return response
}
