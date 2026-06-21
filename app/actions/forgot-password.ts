'use server'

import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { Resend } from 'resend'
import crypto from 'crypto'
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
      // Use raw SQL to query from neon_auth schema
      const queryResult = await db.execute(sql`
        SELECT id, email, name FROM neon_auth."user" WHERE email = ${email.toLowerCase()}
      `)
      
      const rows = (queryResult as any).rows || []
      if (rows && rows.length > 0) {
        existingUser = {
          id: rows[0].id,
          email: rows[0].email,
          name: rows[0].name,
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
    // Hash password with bcrypt (same as Better Auth does internally, 10 rounds)
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    console.log('[v0] Found user:', targetUser.email)

    // Update user password in database - passwords are stored in the account table
    console.log('[v0] Updating hashed password for user:', email)
    
    try {
      const result = await db.execute(sql`
        UPDATE neon_auth."account" 
        SET password = ${hashedPassword}, "updatedAt" = ${new Date().toISOString()}
        WHERE "userId" = ${targetUser.id}
        RETURNING id
      `)
      
      const updatedRows = (result as any).rows || []
      
      if (!updatedRows || updatedRows.length === 0) {
        // If no account exists, create one with hashed password
        console.log('[v0] Creating new account for user:', targetUser.id)
        await db.execute(sql`
          INSERT INTO neon_auth."account" (
            id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt"
          ) VALUES (
            ${crypto.randomUUID()}, ${targetUser.id}, 'credential', ${targetUser.id}, ${hashedPassword}, ${new Date().toISOString()}, ${new Date().toISOString()}
          )
        `)
      }
    } catch (err: any) {
      console.error('[v0] Password update error:', err)
      throw new Error(`Failed to update password: ${err?.message || 'Unknown error'}`)
    }

    console.log('[v0] Password updated in database')

    // Send password reset email using Resend
    let emailSent = false
    let emailError: string | null = null

    if (!process.env.RESEND_API_KEY) {
      emailError = 'Resend API key not configured'
      console.warn('[v0] Resend API key missing - emails disabled')
      // Log password to console for development/testing
      console.log('[v0] PASSWORD RESET - Temporary Password:', newPassword)
      console.log('[v0] PASSWORD RESET - For user:', email)
    } else {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
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

        console.log('[v0] Sending password reset email via Resend to:', email)
        const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
        const { data, error } = await resend.emails.send({
          from: `HSE System <${fromAddress}>`,
          to: [email],
          subject: 'Your Password Has Been Reset - HSE Dashboard',
          html: htmlContent,
        })

        if (error) {
          const errorMsg = error.message || String(error)
          emailError = `Email failed: ${errorMsg}`
          console.error('[v0] Resend email error:', error)
          
          // Log password to console if email fails
          if (errorMsg.includes('invalid') || errorMsg.includes('API')) {
            console.log('[v0] EMAIL FAILED - Password available in UI')
            console.log('[v0] TEMPORARY PASSWORD:', newPassword)
            console.log('[v0] USER EMAIL:', email)
          }
        } else {
          console.log('[v0] Password reset email sent successfully:', data?.id)
          emailSent = true
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err)
        console.error('[v0] Email send error:', errMsg)
        emailError = `Email failed: ${errMsg}`
        
        // Log password to console if exception occurs
        console.log('[v0] PASSWORD RESET EXCEPTION - Using console fallback')
        console.log('[v0] TEMPORARY PASSWORD:', newPassword)
        console.log('[v0] USER EMAIL:', email)
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
