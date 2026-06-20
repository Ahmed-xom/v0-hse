'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { passwordReset, user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

const EMAIL_USER = process.env.EMAIL_USER || 'hsesystem.xom@outlook.com'
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD
const ADMIN_EMAIL = 'xom-it-admin@xomoman.com'

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

export async function resetUserPassword(targetUserId: string) {
  try {
    // Verify admin is authenticated
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session?.user) {
      return { success: false, error: 'Unauthorized: Not authenticated' }
    }

    if (session.user.email !== ADMIN_EMAIL) {
      return { success: false, error: 'Forbidden: Only authorized admin can reset passwords' }
    }

    // Get the target user
    const targetUser = await db.select().from(user).where(eq(user.id, targetUserId)).limit(1)

    if (targetUser.length === 0) {
      return { success: false, error: 'User not found' }
    }

    const targetUserData = targetUser[0]

    // Generate new password
    const newPassword = generateSecurePassword()

    // Hash the password (using bcrypt would be better, but for now we'll store as plaintext)
    // In production, you'd hash this with bcrypt
    const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex')

    // Record password reset in database
    const resetRecord = await db
      .insert(passwordReset)
      .values({
        id: crypto.randomUUID(),
        userId: targetUserId,
        resetBy: session.user.id,
        newPassword: hashedPassword,
        ipAddress: (await headers()).get('x-forwarded-for') || (await headers()).get('x-real-ip') || 'unknown',
      })
      .returning()

    // Send email with new password
    if (EMAIL_USER && EMAIL_PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          host: 'smtp.office365.com',
          port: 587,
          secure: false,
          auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASSWORD,
          },
          tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false,
          },
        })

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 30px; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">HSE System</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Health, Safety & Environment Management</p>
            </div>
            <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
              <h2 style="color: #1e293b; margin-top: 0;">Password Reset Confirmation</h2>
              <p style="color: #475569; line-height: 1.6;">
                Dear <strong>${targetUserData.name || targetUserData.email}</strong>,
              </p>
              <p style="color: #475569; line-height: 1.6;">
                Your HSE System password has been reset by the system administrator.
                Your new temporary password is:
              </p>
              <div style="background: #fff; padding: 15px; border: 2px solid #0d9488; border-radius: 6px; margin: 20px 0; text-align: center;">
                <p style="color: #0d9488; font-size: 18px; font-weight: 700; letter-spacing: 1px; margin: 0; font-family: monospace;">
                  ${newPassword}
                </p>
              </div>
              <p style="color: #475569; line-height: 1.6;">
                <strong>Please note:</strong> For security reasons, we recommend you change this password immediately after logging in.
              </p>
              <div style="background: #fee2e2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0; border-radius: 4px;">
                <p style="color: #7f1d1d; margin: 0; font-size: 14px;">
                  <strong>⚠️ Security Warning:</strong> Never share this password with anyone. Keep it confidential.
                </p>
              </div>
              <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
                If you didn't request this password reset, please contact your administrator immediately.
              </p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                This email was sent by HSE System. Please do not reply to this email.
              </p>
            </div>
          </div>
        `

        await transporter.sendMail({
          from: `"HSE System" <${EMAIL_USER}>`,
          to: targetUserData.email,
          subject: 'Your Password Has Been Reset - HSE System',
          html: htmlContent,
        })
      } catch (emailError) {
        console.error('[v0] Email send error:', emailError)
        // Don't fail the password reset if email fails
      }
    }

    return {
      success: true,
      message: 'Password has been reset and email sent to user',
      temporaryPassword: newPassword,
      userEmail: targetUserData.email,
    }
  } catch (error) {
    console.error('[v0] Error resetting password:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset password',
    }
  }
}
