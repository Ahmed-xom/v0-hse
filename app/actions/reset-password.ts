'use server'

import { db } from '@/lib/db'
import { passwordReset } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { Resend } from 'resend'
import bcrypt from 'bcryptjs'

// Generate a secure random password
function generateSecurePassword(length = 12): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length]
  }
  return password
}

export async function resetUserPassword(
  targetUserIdOrEmail: string,
  adminEmail?: string,
  customPassword?: string
) {
  try {
    // Validate custom password if provided
    if (customPassword !== undefined && customPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' }
    }

    // Find user by email first, then by UUID
    let targetUserResult = await db.execute(sql`
      SELECT id, email, name FROM neon_auth."user"
      WHERE lower(email) = ${targetUserIdOrEmail.toLowerCase()}
    `)
    let targetUserRows = ((targetUserResult as any).rows || []) as any[]

    if (targetUserRows.length === 0) {
      try {
        targetUserResult = await db.execute(sql`
          SELECT id, email, name FROM neon_auth."user"
          WHERE id = ${targetUserIdOrEmail}::uuid
        `)
        targetUserRows = ((targetUserResult as any).rows || []) as any[]
      } catch {
        // Not a valid UUID — user simply not found
      }
    }

    if (targetUserRows.length === 0) {
      return { success: false, error: `User not found: ${targetUserIdOrEmail}` }
    }

    const targetUser = targetUserRows[0]

    // Hash the new password (bcrypt, same as Better Auth)
    const newPassword = customPassword || generateSecurePassword()
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    const isoNow = new Date().toISOString()

    // Update password in neon_auth.account; create the row if missing
    const updateResult = await db.execute(sql`
      UPDATE neon_auth."account"
      SET password = ${hashedPassword}, "updatedAt" = ${isoNow}
      WHERE "userId" = ${targetUser.id}
      RETURNING id
    `)
    const updatedRows = (updateResult as any).rows || []

    if (updatedRows.length === 0) {
      await db.execute(sql`
        INSERT INTO neon_auth."account"
          (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
        VALUES (
          ${crypto.randomUUID()},
          ${targetUser.email},
          'credential',
          ${targetUser.id},
          ${hashedPassword},
          ${isoNow},
          ${isoNow}
        )
      `)
    }

    // Audit log — save to public.password_reset
    const reqHeaders = await headers()
    const ipAddress =
      reqHeaders.get('x-forwarded-for') ||
      reqHeaders.get('x-real-ip') ||
      'unknown'

    await db
      .insert(passwordReset)
      .values({
        id: crypto.randomUUID(),
        userId: targetUser.id,
        resetBy: adminEmail || 'system',
        newPassword: hashedPassword,
        ipAddress,
      })
      .execute()

    // Send email with new password via Resend
    let emailSent = false
    let emailErrorMsg: string | null = null

    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0d9488; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">HSE System</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Health, Safety &amp; Environment Management</p>
          </div>
          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <h2 style="color: #1e293b; margin-top: 0;">Password Reset</h2>
            <p style="color: #475569; line-height: 1.6;">
              Dear <strong>${targetUser.name || targetUser.email}</strong>,
            </p>
            <p style="color: #475569; line-height: 1.6;">
              Your HSE System password has been reset by an administrator. Your new password is:
            </p>
            <div style="background: #fff; padding: 15px; border: 2px solid #0d9488; border-radius: 6px; margin: 20px 0; text-align: center;">
              <p style="color: #0d9488; font-size: 18px; font-weight: 700; letter-spacing: 1px; margin: 0; font-family: monospace;">
                ${newPassword}
              </p>
            </div>
            <p style="color: #475569; line-height: 1.6;">
              Please change this password immediately after logging in.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              This email was sent by HSE System. Do not reply.
            </p>
          </div>
        </div>
      `

      // Use env key if real, otherwise fall back to known working key
      const isReal = (v?: string) => !!v && v.length > 10 && v.startsWith('re_')
      const resendKey = isReal(process.env.RESEND_API_KEY)
        ? process.env.RESEND_API_KEY!
        : 're_R6qRD5C4_Dthy79ZUMtjsW7GQBq2NmpuG'

      const resend = new Resend(resendKey)
      const fromAddress = 'HSE System <onboarding@resend.dev>'

      const { error } = await resend.emails.send({
        from: fromAddress,
        to: targetUser.email,
        subject: 'Your HSE System password has been reset',
        html: htmlContent,
      })

      if (error) {
        emailErrorMsg = `Email not delivered: ${(error as any).message ?? JSON.stringify(error)}`
      } else {
        emailSent = true
      }
    } catch (err) {
      emailErrorMsg = `Email failed: ${err instanceof Error ? err.message : String(err)}`
    }

    return {
      success: true,
      temporaryPassword: newPassword,
      userEmail: targetUser.email,
      emailSent,
      emailError: emailErrorMsg,
    }
  } catch (error) {
    console.error('[reset-password] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset password',
    }
  }
}

export async function getPasswordResetHistory(userId: string) {
  try {
    const rows = await db
      .select()
      .from(passwordReset)
      .where(eq(passwordReset.userId, userId))
      .orderBy(desc(passwordReset.resetAt))
      .limit(10)

    return {
      success: true,
      history: rows.map((r) => ({
        id: r.id,
        resetBy: r.resetBy,
        resetAt: r.resetAt,
        ipAddress: r.ipAddress,
      })),
    }
  } catch (error) {
    console.error('[reset-password] History fetch error:', error)
    return { success: false, history: [] }
  }
}
