import { NextRequest, NextResponse } from "next/server"
import { randomBytes, createHash, createHmac, randomUUID } from "node:crypto"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { sendEmail } from "@/lib/send-email"

const genericMessage = "If an account with that email exists, a password reset link has been sent."
const expirationMs = 60 * 60 * 1000

function getSecret() {
  if (!process.env.BETTER_AUTH_SECRET) throw new Error("BETTER_AUTH_SECRET is not configured")
  return process.env.BETTER_AUTH_SECRET
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function signToken(userId: string, expiresAt: number, token: string) {
  return createHmac("sha256", getSecret()).update(`${userId}.${expiresAt}.${token}`).digest("hex")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
    }

    const userResult = await db.execute(sql`SELECT id, email, name FROM neon_auth."user" WHERE lower(email) = ${email} LIMIT 1`)
    const user = (userResult as unknown as { rows?: Array<{ id: string; email: string; name: string }> }).rows?.[0]
    if (!user) return NextResponse.json({ success: true, message: genericMessage })

    const recentResult = await db.execute(sql`SELECT count(*)::int AS count FROM public.password_reset_token WHERE user_id = ${user.id} AND created_at > now() - interval '15 minutes'`)
    const recentCount = Number((recentResult as unknown as { rows?: Array<{ count: number }> }).rows?.[0]?.count || 0)
    if (recentCount >= 3) return NextResponse.json({ success: true, message: genericMessage })

    const expiresAt = Date.now() + expirationMs
    const rawToken = randomBytes(32).toString("base64url")
    const signedToken = `${rawToken}.${signToken(user.id, expiresAt, rawToken)}`
    await db.execute(sql`INSERT INTO public.password_reset_token (id, user_id, token_hash, expires_at) VALUES (${randomUUID()}, ${user.id}, ${hashToken(rawToken)}, to_timestamp(${expiresAt} / 1000.0))`)

    const baseUrl = process.env.BETTER_AUTH_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || process.env.V0_RUNTIME_URL || "http://localhost:3000"
    const origin = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`
    const resetLink = `${origin.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(signedToken)}`
    const safeName = user.name.replace(/[<>]/g, "") || "there"
    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#1f2937"><h1 style="color:#059669">AMNKO HSE</h1><p>Hello ${safeName},</p><p>We received a request to reset your password.</p><p><a href="${resetLink}" style="display:inline-block;background:#059669;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">Reset Password</a></p><p>This link expires in one hour and can only be used once.</p><p>If you did not request this, you can safely ignore this email.</p></div>`
    const sent = await sendEmail({ to: user.email, subject: "Reset Your AMNKO HSE Password", html })
    if (!sent.sent) return NextResponse.json({ error: "Unable to send password reset email. Please try again later." }, { status: 503 })
    return NextResponse.json({ success: true, message: genericMessage })
  } catch (error) {
    console.error("[password-reset] request failed", { error: error instanceof Error ? error.message : "unknown" })
    return NextResponse.json({ error: "Unable to send password reset email. Please try again later." }, { status: 500 })
  }
}
