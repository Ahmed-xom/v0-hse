'use server'

import { db } from '@/lib/db'
import { user, account } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

const EMAIL_USER = process.env.EMAIL_USER || 'hse-system@gmail.com'
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD

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

export async function requestPasswordReset(email: string) {
  try {
    console.log('[v0] Password reset requested for email:', email)

    // Validate email
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Invalid email address' }
    }

    // Check if user exists in database
    console.log('[v0] Querying user with email:', email.toLowerCase())
    let existingUser = null
    
    try {
      // Use raw SQL to avoid Drizzle ORM issues
      const queryResult = await db.execute(`
        SELECT id, email, name FROM "user" WHERE email = $1
      `, [email.toLowerCase()])
      
      if (queryResult.rows && queryResult.rows.length > 0) {
        existingUser = {
          id: (queryResult.rows[0] as any).id,
          email: (queryResult.rows[0] as any).email,
          name: (queryResult.rows[0] as any).name,
        }
      }
      
      console.log('[v0] Query result:', existingUser ? 'User found' : 'User not found')
    } catch (err: any) {
      console.error('[v0] Database query error:', {
        name: err?.name,
        message: err?.message,
        code: err?.code,
        detail: err?.detail,
        fullError: String(err),
      })
      return { 
        success: false, 
        error: `Database query failed: ${err?.message || 'Unknown error'}. Please try again later.` 
      }
    }

    if (!existingUser) {
      console.log('[v0] User not found for email:', email)
      // For security, don't reveal if email exists
      return { success: true, message: 'If an account with that email exists, a password reset link has been sent.' }
    }

    const targetUser = existingUser
    const newPassword = generateSecurePassword()

    console.log('[v0] Found user:', targetUser.email)

    // Update user password in database - passwords are stored in the account table
    console.log('[v0] Updating password for user:', email)
    
    // First, find the account for this user
    const userAccount = await db
      .select({ id: account.id })
      .from(account)
      .where(eq(account.userId, targetUser.id))
    
    if (userAccount && userAccount.length > 0) {
      await db
        .update(account)
        .set({
          password: newPassword,
          updatedAt: new Date(),
        })
        .where(eq(account.userId, targetUser.id))
        .execute()
    } else {
      // If no account exists, create one
      await db
        .insert(account)
        .values({
          id: crypto.randomUUID(),
          accountId: targetUser.id,
          providerId: 'credential',
          userId: targetUser.id,
          password: newPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .execute()
    }

    console.log('[v0] Password updated in database')

    // Send password reset email
    let emailSent = false
    let emailError: string | null = null

    if (!EMAIL_PASSWORD) {
      emailError = 'Email credentials not configured'
      console.warn('[v0] Email credentials missing:', { EMAIL_USER, hasPassword: !!EMAIL_PASSWORD })
    } else {
      try {
        console.log('[v0] Creating email transporter with:', { host: 'smtp.gmail.com', port: 587, user: EMAIL_USER })

        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASSWORD,
          },
        })

        // Verify connection
        console.log('[v0] Verifying email connection...')
        await transporter.verify()
        console.log('[v0] Email connection verified')

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 30px; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">HSE Dashboard</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Health, Safety & Environment Management</p>
            </div>
            <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
              <h2 style="color: #1e293b; margin-top: 0;">Password Reset Request</h2>
              <p style="color: #475569; line-height: 1.6;">
                We received a request to reset your password for your HSE Dashboard account.
              </p>
              <p style="color: #475569; line-height: 1.6;">
                Your new temporary password is:
              </p>
              <div style="background: #fff; padding: 15px; border: 2px solid #0d9488; border-radius: 6px; margin: 20px 0; text-align: center;">
                <p style="color: #0d9488; font-size: 18px; font-weight: 700; letter-spacing: 1px; margin: 0; font-family: monospace;">
                  ${newPassword}
                </p>
              </div>
              <p style="color: #475569; line-height: 1.6;">
                Use this password to sign in to your account.
              </p>
              <p style="color: #475569; line-height: 1.6;">
                <strong>Please change this password immediately after logging in.</strong>
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
                This email was sent by HSE Dashboard. Please do not reply to this email.
              </p>
            </div>
          </div>
        `

        console.log('[v0] Sending password reset email to:', email)
        const info = await transporter.sendMail({
          from: `"HSE System" <${EMAIL_USER}>`,
          to: email,
          subject: 'Your Password Has Been Reset - HSE Dashboard',
          html: htmlContent,
        })

        console.log('[v0] Password reset email sent successfully:', info.messageId)
        emailSent = true
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err)
        console.error('[v0] Email send error:', errMsg)
        emailError = `Email failed: ${errMsg}`
      }
    }

    return {
      success: true,
      message: emailSent
        ? 'Password has been reset and sent to your email'
        : 'Password has been reset but email sending failed. Please contact your administrator.',
      emailSent,
      emailError: emailError || (emailSent ? 'Email sent successfully' : 'Email not configured'),
      temporaryPassword: newPassword, // Return for UI display if needed
    }
  } catch (error) {
    console.error('[v0] Password reset error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      error: `Password reset failed: ${errMsg}`,
    }
  }
}
