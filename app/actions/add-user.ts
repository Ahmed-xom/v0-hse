'use server'

import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { sql } from 'drizzle-orm'

const EMAIL_USER = process.env.EMAIL_USER || 'hse-system@gmail.com'
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

export async function addNewUser(userData: {
  name: string
  email: string
  payrollNo?: string
  designation?: string
  businessUnit?: string
  hseRole?: string
  status?: string
  adminEmail?: string
}) {
  try {
    // Sanitize email - trim and lowercase
    const cleanEmail = userData.email.trim().toLowerCase()
    
    console.log('[v0] Adding new user:', { name: userData.name, email: cleanEmail, originalEmail: userData.email, adminEmail: userData.adminEmail })

    // Verify admin is authenticated
    const callerEmail = userData.adminEmail

    if (!callerEmail) {
      return { success: false, error: 'Unauthorized: Admin email required' }
    }

    if (callerEmail !== ADMIN_EMAIL) {
      console.log('[v0] Unauthorized attempt:', { caller: callerEmail, admin: ADMIN_EMAIL })
      return { success: false, error: 'Forbidden: Only authorized admin can add users' }
    }

    console.log('[v0] Admin verified:', callerEmail)

    // Validate required fields
    if (!userData.name || !userData.email) {
      return { success: false, error: 'Name and email are required' }
    }

    // Generate temporary password
    const temporaryPassword = generateSecurePassword()

    // Create user record in Neon
    const newUserId = crypto.randomUUID()
    const now = new Date()
    const role = userData.hseRole || 'USER'
    
    console.log('[v0] Inserting user:', { id: newUserId, name: userData.name, email: userData.email, role })

    // Create user in database using raw SQL to avoid Drizzle ORM schema issues
    const isoNow = now.toISOString()
    let newUserResult
    let newUser
    
    try {
      newUserResult = await db.execute(
        sql`INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt", role, banned)
            VALUES (${newUserId}, ${userData.name}, ${cleanEmail}, false, ${isoNow}, ${isoNow}, ${role}, false)
            RETURNING *`
      )
      
      newUser = newUserResult.rows?.[0] || newUserResult[0]
      console.log('[v0] User created successfully:', newUser)
    } catch (dbError: any) {
      // Check if it's a unique constraint violation on email
      if (dbError.message?.includes('unique') || dbError.message?.includes('email')) {
        return {
          success: false,
          error: `A user with email ${userData.email} already exists. Please use a different email address.`,
        }
      }
      throw dbError
    }

    // Send welcome email with temporary password
    let emailSent = false
    let emailError: string | null = null

    if (!EMAIL_PASSWORD) {
      emailError = 'Email credentials not configured. Please set EMAIL_USER and EMAIL_PASSWORD environment variables.'
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
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1f2937;">Welcome to HSE System</h2>
            <p>Dear <strong>${userData.name}</strong>,</p>
            <p>Your account has been created in the HSE (Health, Safety & Environment) system.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Login Credentials:</strong></p>
              <p><strong>Email:</strong> ${cleanEmail}</p>
              <p><strong>Temporary Password:</strong> <code style="background: #fff; padding: 5px 10px; border-radius: 4px; font-family: monospace;">${temporaryPassword}</code></p>
              <p><strong>Role:</strong> ${userData.hseRole || 'User'}</p>
              <p><strong>Business Unit:</strong> ${userData.businessUnit || 'XOM Oman'}</p>
            </div>
            
            <p style="color: #ef4444;"><strong>⚠️ Important:</strong> Please change your password immediately after your first login.</p>
            
            <p>You can log in here: <a href="${process.env.BETTER_AUTH_URL || `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || 'hse.xomoman.com'}`}/sign-in">HSE System Login</a></p>
            
            <p>If you have any questions, please contact the HSE administrator.</p>
            
            <p>Best regards,<br><strong>HSE System</strong></p>
            
            <hr style="margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
              This is an automated email. Please do not reply to this email.
            </p>
          </div>
        `

        console.log('[v0] Sending email to:', cleanEmail)
        const info = await transporter.sendMail({
          from: `"HSE System" <${EMAIL_USER}>`,
          to: cleanEmail,
          subject: 'Welcome to HSE System - Account Created',
          html: htmlContent,
        })

        console.log('[v0] Email sent successfully:', info.messageId)
        emailSent = true
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err)
        console.error('[v0] Email send error:', errMsg)
        emailError = `Email failed: ${errMsg}`
      }
    }

    return {
      success: true,
      message: 'User created successfully',
      user: newUser[0],
      temporaryPassword,
      emailSent,
      emailError: emailError || (emailSent ? 'Email sent successfully' : 'Email not sent'),
    }
  } catch (error) {
    console.error('[v0] Error adding user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add user',
    }
  }
}
