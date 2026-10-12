import { NextRequest, NextResponse } from "next/server"
import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto"
import { hashPassword } from "@better-auth/utils/password"
import { db } from "@/lib/db"
import { resetPasswordInTransaction } from "@/lib/auth/reset-password-transaction"

function getSecret() {
  if (!process.env.BETTER_AUTH_SECRET) throw new Error("BETTER_AUTH_SECRET is not configured")
  return process.env.BETTER_AUTH_SECRET
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function validSignature(userId: string, expiresAt: string | Date, rawToken: string, signature: string) {
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
      const result = await resetPasswordInTransaction(tx, {
        tokenHash,
        rawToken,
        signature,
        passwordHash,
        validSignature: validSignature,
      })
      console.info("[password-reset] credential update", { requestId, outcome: "validated", affectedRows: result.updatedCount })
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
