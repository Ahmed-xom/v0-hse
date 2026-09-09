import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import crypto from "crypto"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

const secret = () => process.env.BETTER_AUTH_SECRET || "development-reset-secret"
const sign = (value: string) => crypto.createHmac("sha256", secret()).update(value).digest("hex")

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json().catch(() => ({}))
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : ""
  const genericMessage = "If an account with that email exists, a password reset link has been sent."
  if (!normalizedEmail || !normalizedEmail.includes("@")) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })

  const result = await db.execute(sql`SELECT id, email, name FROM neon_auth."user" WHERE lower(email) = ${normalizedEmail} LIMIT 1`)
  const user = ((result as any).rows || [])[0]
  if (!user) return NextResponse.json({ success: true, message: genericMessage })

  const expires = Date.now() + 60 * 60 * 1000
  const payload = `${user.id}.${user.email}.${expires}`
  const token = Buffer.from(`${payload}.${sign(payload)}`).toString("base64url")
  const baseUrl = process.env.BETTER_AUTH_URL || "https://amnkoo.online"
  const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: "AMNKO HSE <no-replay@amnkoo.online>",
    to: user.email,
    subject: "Reset your AMNKO HSE password",
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px"><h1 style="color:#059669">AMNKO HSE</h1><h2>Password reset request</h2><p>Hello ${user.name || "there"},</p><p>Click below to choose a new password. This link expires in one hour.</p><p><a href="${resetLink}" style="display:inline-block;background:#059669;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">Reset password</a></p><p>If you did not request this, you can ignore this email.</p></div>`,
  })
  if (error) return NextResponse.json({ error: "Unable to send the reset email right now." }, { status: 500 })
    return NextResponse.json({ success: true, message: genericMessage })
  } catch {
    return NextResponse.json({ error: "Unable to send the reset email right now." }, { status: 500 })
  }
}
