'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user, hseUser } from '@/lib/db/schema'
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

export async function addNewUser(userData: {
  name: string
  email: string
  payrollNo?: string
  designation?: string
  businessUnit?: string
  hseRole?: string
  status?: string
}) {
  try {
    // Verify admin is authenticated
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session?.user) {
      return { success: false, error: 'Unauthorized: Not authenticated' }
    }

    if (session.user.email !== ADMIN_EMAIL) {
      return { success: false, error: 'Forbidden: Only authorized admin can add users' }
    }

    // Validate required fields
    if (!userData.name || !userData.email) {
      return { success: false, error: 'Name and email are required' }
    }

    // Generate temporary password
    const temporaryPassword = generateSecurePassword()

    // Create user record in Better Auth
    const newUserId = `user_${Date.now()}`

    const newUser = await db
      .insert(user)
      .values({
        id: newUserId,
        name: userData.name,
        email: userData.email,
        emailVerified: false,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    // Create HSE user record with app-specific data
    const hseUserRecord = await db
      .insert(hseUser)
      .values({
        id: `hse_${newUserId}`,
        userId: newUserId,
        payrollNo: userData.payrollNo || `P${Date.now()}`,
        designation: userData.designation || '',
        businessUnit: userData.businessUnit || 'XOM Oman',
        hseRole: userData.hseRole || 'USER',
        status: userData.status || 'Active',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    // Send welcome email with temporary password
    let emailSent = false
    let emailError: string | null = null

    if (!EMAIL_PASSWORD) {
      emailError = 'Email credentials not configured. Please set EMAIL_USER and EMAIL_PASSWORD environment variables.'
      console.warn('[v0] Email credentials missing:', { EMAIL_USER, hasPassword: !!EMAIL_PASSWORD })
    } else {
      try {
        console.log('[v0] Creating email transporter with:', { host: 'smtp.office365.com', port: 587, user: EMAIL_USER })

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
              <p><strong>Email:</strong> ${userData.email}</p>
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

        console.log('[v0] Sending email to:', userData.email)
        const info = await transporter.sendMail({
          from: EMAIL_USER,
          to: userData.email,
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
      hseUser: hseUserRecord[0],
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
