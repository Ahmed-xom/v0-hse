'use server'

import { db } from '@/lib/db'
import { passwordResetOtp } from '@/lib/db/schema'
import { sql, eq, and, gt } from 'drizzle-orm'
import { Resend } from 'resend'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

function generateOtp(): string {
  // 6-digit numeric OTP
  const buf = new Uint8Array(4)
  crypto.getRandomValues(buf)
  const num = ((buf[0] << 24) | (buf[1] << 16) | (buf[2] << 8) | buf[3]) >>> 0
  return String(num % 1_000_000).padStart(6, '0')
}

export async function sendPasswordResetOtp(email: string) {
  try {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Invalid email address.' }
    }

    // Check user exists
    const result = await db.execute(sql`
      SELECT id, email, name FROM neon_auth."user"
      WHERE lower(email) = ${email.toLowerCase()}
    `)
    const rows = (result as any).rows ?? []
    if (rows.length === 0) {
      // Security: don't reveal if email exists
      return { success: true, message: 'If that email is registered, an OTP has been sent.' }
    }

    const user = rows[0]
    const otp = generateOtp()
    const otpHash = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Invalidate any previous unused OTPs for this email
    await db.execute(sql`
      UPDATE public.password_reset_otp
      SET used = true
      WHERE lower(email) = ${email.toLowerCase()} AND used = false
    `)

    // Insert new OTP
    await db.insert(passwordResetOtp).values({
      email: email.toLowerCase(),
      otpHash,
      expiresAt,
    })

    // Send email
    if (!process.env.RESEND_API_KEY) {
      console.log('[v0] OTP (no email configured):', otp, 'for', email)
      return {
        success: true,
        message: 'OTP generated. Email not configured — check server logs.',
        _devOtp: process.env.NODE_ENV === 'development' ? otp : undefined,
      }
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const from = process.env.RESEND_FROM_EMAIL
      ? `HSE System <${process.env.RESEND_FROM_EMAIL}>`
      : 'HSE System <onboarding@resend.dev>'
    const to = email

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:20px">
        <div style="background:#0d9488;padding:28px 30px;border-radius:10px 10px 0 0">
          <h1 style="color:#fff;margin:0;font-size:22px">HSE Dashboard</h1>
          <p style="color:rgba(255,255,255,.85);margin:6px 0 0">Health, Safety &amp; Environment</p>
        </div>
        <div style="background:#f8fafc;padding:30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
          <h2 style="color:#1e293b;margin-top:0">Password Reset OTP</h2>
          <p style="color:#475569;line-height:1.6">Hi <strong>${user.name || user.email}</strong>,</p>
          <p style="color:#475569;line-height:1.6">
            Use the code below to reset your password. It expires in <strong>10 minutes</strong>.
          </p>
          <div style="background:#fff;border:2px solid #0d9488;border-radius:8px;padding:20px;text-align:center;margin:24px 0">
            <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px">Your OTP</p>
            <p style="margin:0;color:#0d9488;font-size:36px;font-weight:700;letter-spacing:8px;font-family:monospace">${otp}</p>
          </div>
          <p style="color:#94a3b8;font-size:13px">
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    `

    const { error } = await resend.emails.send({
      from,
      to,
      subject: 'Your HSE Dashboard password reset OTP',
      html,
    })

    if (error) {
      console.error('[password-reset-otp] Resend error:', error)
      return { success: false, error: 'Failed to send OTP email. Please try again.' }
    }

    return { success: true, message: 'OTP sent to your email address.' }
  } catch (err: any) {
    console.error('[password-reset-otp] sendOtp error:', err)
    return { success: false, error: err.message ?? 'Unexpected error.' }
  }
}

export async function verifyOtpAndResetPassword(
  email: string,
  otp: string,
  newPassword: string,
) {
  try {
    if (!email || !otp || !newPassword) {
      return { success: false, error: 'All fields are required.' }
    }
    if (newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters.' }
    }

    // Find the latest valid OTP for this email
    const rows = await db
      .select()
      .from(passwordResetOtp)
      .where(
        and(
          eq(passwordResetOtp.email, email.toLowerCase()),
          eq(passwordResetOtp.used, false),
          gt(passwordResetOtp.expiresAt, new Date()),
        ),
      )
      .orderBy(passwordResetOtp.createdAt)

    if (rows.length === 0) {
      return { success: false, error: 'OTP has expired or is invalid. Please request a new one.' }
    }

    // Check most-recent valid OTP
    const record = rows[rows.length - 1]
    const valid = await bcrypt.compare(otp, record.otpHash)
    if (!valid) {
      return { success: false, error: 'Incorrect OTP. Please try again.' }
    }

    // Mark OTP as used
    await db
      .update(passwordResetOtp)
      .set({ used: true })
      .where(eq(passwordResetOtp.id, record.id))

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    const now = new Date().toISOString()

    const updateResult = await db.execute(sql`
      UPDATE neon_auth."account"
      SET password = ${hashedPassword}, "updatedAt" = ${now}
      WHERE "userId" = (
        SELECT id FROM neon_auth."user" WHERE lower(email) = ${email.toLowerCase()}
      )
      RETURNING id
    `)
    const updated = (updateResult as any).rows ?? []

    if (updated.length === 0) {
      // No account row yet — create one
      const userRes = await db.execute(sql`
        SELECT id FROM neon_auth."user" WHERE lower(email) = ${email.toLowerCase()}
      `)
      const userId = ((userRes as any).rows ?? [])[0]?.id
      if (userId) {
        await db.execute(sql`
          INSERT INTO neon_auth."account"
            (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
          VALUES (
            gen_random_uuid(), ${email.toLowerCase()}, 'credential', ${userId},
            ${hashedPassword}, ${now}, ${now}
          )
        `)
      }
    }

    return { success: true }
  } catch (err: any) {
    console.error('[password-reset-otp] verifyOtp error:', err)
    return { success: false, error: err.message ?? 'Unexpected error.' }
  }
}
