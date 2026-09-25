import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { sendEmail } from '@/lib/send-email'

const genericMessage = 'If an account with that email exists, a password reset link has been sent.'
const secret = () => process.env.BETTER_AUTH_SECRET || (() => { throw new Error('BETTER_AUTH_SECRET is not configured') })()
const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex')
const sign = (value: string) => crypto.createHmac('sha256', secret()).update(value).digest('hex')

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json().catch(() => ({}))
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    const result = await db.execute(sql`SELECT id, email, name FROM neon_auth."user" WHERE lower(email) = ${normalizedEmail} LIMIT 1`)
    const user = ((result as unknown as { rows?: Array<{ id: string; email: string; name?: string }> }).rows || [])[0]
    if (!user) return NextResponse.json({ success: true, message: genericMessage })

    const expiresAt = Date.now() + 60 * 60 * 1000
    const rawToken = crypto.randomBytes(32).toString('base64url')
    const signedToken = `${rawToken}.${sign(`${user.id}.${expiresAt}.${rawToken}`)}`
    await db.execute(sql`INSERT INTO public.password_reset_token (token_hash, user_id, expires_at) VALUES (${hashToken(rawToken)}, ${user.id}, to_timestamp(${expiresAt} / 1000.0))`)
    const baseUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://amnkoo.online'
    const resetLink = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(signedToken)}`
    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#1f2937"><h1 style="color:#059669">AMNKO HSE</h1><p>Hello ${user.name || 'there'},</p><p>We received a request to reset your AMNKO HSE password.</p><p><a href="${resetLink}" style="display:inline-block;background:#059669;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">Reset Password</a></p><p>This link expires in one hour and can only be used once.</p><p>If you did not request this, you can safely ignore this email.</p><hr><small>This is an automated security message from the AMNKO HSE Management System.</small></div>`
    const sent = await sendEmail({ to: user.email, subject: 'Reset Your AMNKO HSE Password', html })
    if (!sent.sent) return NextResponse.json({ error: 'Email delivery is unavailable.' }, { status: 503 })
    return NextResponse.json({ success: true, message: genericMessage })
  } catch {
    return NextResponse.json({ error: 'Unable to send the reset email right now.' }, { status: 500 })
  }
}
