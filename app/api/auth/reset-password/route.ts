import { NextRequest, NextResponse } from "next/server"
import { createHash, createHmac, timingSafeEqual } from "node:crypto"
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
  try {
    const body = await request.json().catch(() => ({}))
    const token = typeof body.token === "string" ? body.token : ""
    const password = typeof body.password === "string" ? body.password : ""
    if (!token || password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: "A valid reset link and a password between 8 and 128 characters are required." }, { status: 400 })
    }

    const [rawToken, signature] = token.split(".")
    if (!rawToken || !signature) throw new Error("invalid reset token")
    const tokenHash = hashToken(rawToken)
    const result = await db.execute(sql`SELECT user_id, expires_at FROM public.password_reset_token WHERE token_hash = ${tokenHash} AND used_at IS NULL AND expires_at > now() LIMIT 1`)
    const reset = (result as unknown as { rows?: Array<{ user_id: string; expires_at: string }> }).rows?.[0]
    if (!reset || !validSignature(reset.user_id, reset.expires_at, rawToken, signature)) throw new Error("invalid reset token")

    const passwordHash = await hashPassword(password)
    await db.transaction(async (tx) => {
      const updated = await tx.execute(sql`UPDATE neon_auth."account" SET password = ${passwordHash}, "updatedAt" = now() WHERE "userId" = ${reset.user_id} AND "providerId" = 'credential'`)
      const updatedCount = Number((updated as unknown as { rowCount?: number }).rowCount || 0)
      if (updatedCount !== 1) throw new Error("credential account not found")
      await tx.execute(sql`UPDATE public.password_reset_token SET used_at = now() WHERE token_hash = ${tokenHash} AND used_at IS NULL`)
      await tx.execute(sql`DELETE FROM neon_auth.session WHERE "userId" = ${reset.user_id}`)
    })

    return NextResponse.json({ success: true, message: "Password updated successfully." })
  } catch (error) {
    console.error("[password-reset] update failed", { error: error instanceof Error ? error.message : "unknown" })
    return NextResponse.json({ error: "Reset link is invalid or expired." }, { status: 400 })
  }
}
