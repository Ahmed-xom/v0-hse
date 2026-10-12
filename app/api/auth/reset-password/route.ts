import { NextRequest, NextResponse } from "next/server"
import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto"
import { hashPassword } from "@better-auth/utils/password"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

function getSecret() {
  if (!process.env.BETTER_AUTH_SECRET) throw new Error("BETTER_AUTH_SECRET is not configured")
  return process.env.BETTER_AUTH_SECRET
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function validSignature(userId: string, expiresAt: string, rawToken: string, signature: string) {
  const expiresMs = new Date(expiresAt).getTime()
  const expected = createHmac("sha256", getSecret()).update(`${userId}.${expiresMs}.${rawToken}`).digest("hex")
  return signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID()

  try {
    const body = await request.json().catch(() => ({}))
    const token = typeof body.token === "string" ? body.token : ""
    const password = typeof body.password === "string" ? body.password : ""
    if (!token || password.length < 8 || password.length > 128) {
      console.info("[password-reset] request rejected", { requestId, outcome: "invalid_input" })
      return NextResponse.json({ error: "A valid reset link and a password between 8 and 128 characters are required." }, { status: 400 })
    }

    const [rawToken, signature] = token.split(".")
    if (!rawToken || !signature) throw new Error("invalid reset token")
    const tokenHash = hashToken(rawToken)
    const passwordHash = await hashPassword(password)

    await db.transaction(async (tx) => {
      const result = await tx.execute(sql`SELECT user_id, expires_at FROM public.password_reset_token WHERE token_hash = ${tokenHash} AND used_at IS NULL AND expires_at > now() FOR UPDATE`)
      const reset = (result as unknown as { rows?: Array<{ user_id: string; expires_at: string }> }).rows?.[0]
      if (!reset || !validSignature(reset.user_id, reset.expires_at, rawToken, signature)) throw new Error("invalid reset token")

      const updated = await tx.execute(sql`UPDATE neon_auth."account" SET password = ${passwordHash}, "updatedAt" = now() WHERE "userId" = ${reset.user_id} AND "providerId" = 'credential'`)
      const updatedCount = Number((updated as unknown as { rowCount?: number }).rowCount || 0)
      console.info("[password-reset] credential update", { requestId, outcome: "validated", affectedRows: updatedCount })
      if (updatedCount !== 1) throw new Error("credential account not found")

      const consumed = await tx.execute(sql`UPDATE public.password_reset_token SET used_at = now() WHERE token_hash = ${tokenHash} AND used_at IS NULL AND expires_at > now()`)
      const consumedCount = Number((consumed as unknown as { rowCount?: number }).rowCount || 0)
      if (consumedCount !== 1) throw new Error("reset token already used")
      await tx.execute(sql`DELETE FROM neon_auth.session WHERE "userId" = ${reset.user_id}`)
    })

    console.info("[password-reset] request completed", { requestId, outcome: "success" })
    return NextResponse.json({ success: true, message: "Password updated successfully." })
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown"
    const category = message === "invalid reset token" || message === "reset token already used"
      ? "invalid_or_expired_token"
      : message === "credential account not found"
        ? "credential_not_found"
        : "database_or_hash_error"
    console.error("[password-reset] request failed", { requestId, outcome: category })
    return NextResponse.json({ error: "Reset link is invalid or expired." }, { status: 400 })
  }
}
