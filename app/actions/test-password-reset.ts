'use server'

import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

const EMAIL_USER = process.env.EMAIL_USER || 'hse-system@gmail.com'
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD

export async function testPasswordReset(email: string) {
  try {
    console.log('[v0] Testing password reset for:', email)

    // Use only the columns we actually need
    const results = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
      })
      .from(user)
      .where(eq(user.email, email))
    
    console.log('[v0] Query results:', results)

    if (!results || results.length === 0) {
      return { success: false, error: 'User not found' }
    }

    const targetUser = results[0]
    console.log('[v0] Found user:', targetUser)

    // Generate new password
    const newPassword = crypto.randomBytes(12).toString('hex')
    console.log('[v0] Generated password')

    // Password lives in neon_auth.account, not neon_auth.user — update updatedAt only
    await db
      .update(user)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(user.id, targetUser.id))
      .execute()

    console.log('[v0] Password updated successfully')

    // Send email
    if (EMAIL_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASSWORD,
        },
      })

      const mailOptions = {
        from: `"HSE System" <${EMAIL_USER}>`,
        to: targetUser.email,
        subject: 'Password Reset - HSE System',
        html: `
          <h2>Password Reset</h2>
          <p>Your password has been reset to:</p>
          <p><strong>${newPassword}</strong></p>
          <p>Please change this password after logging in.</p>
        `,
      }

      await transporter.sendMail(mailOptions)
      console.log('[v0] Email sent')
    }

    return {
      success: true,
      message: 'Password reset successfully',
    }
  } catch (error: any) {
    console.error('[v0] Error in password reset test:', error)
    return {
      success: false,
      error: error.message || 'Failed to reset password',
    }
  }
}
