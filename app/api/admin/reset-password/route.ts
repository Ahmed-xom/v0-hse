import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import crypto from "crypto"

// Only this admin email can reset passwords
const ADMIN_EMAIL = "xom-it-admin@xomoman.com"

// Resend handles transactional delivery without relying on Office 365 SMTP authentication.
const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESET_FROM = process.env.RESEND_FROM_EMAIL || "no-reply@amnkoo.online"

// Generate a secure random password
function generateSecurePassword(length = 12): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  let password = ""
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length]
  }
  return password
}

export async function POST(request: NextRequest) {
  try {
    // Get admin email from request body
    const body = await request.json()
    const { userId, userEmail, userName, adminEmail } = body

    // Verify admin authorization
    if (adminEmail !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "Forbidden: Only authorized admin can reset passwords" },
        { status: 403 }
      )
    }

    if (!userId && !userEmail) {
      return NextResponse.json({ error: "User ID or Email is required" }, { status: 400 })
    }

    // Generate new password
    const newPassword = generateSecurePassword()

    // Send the temporary password through Resend instead of Office 365 SMTP.
    if (!RESEND_API_KEY || !userEmail) {
      return NextResponse.json({ error: "Email delivery is not configured" }, { status: 503 })
    }

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">HSE System</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Health, Safety & Environment Management</p>
          </div>
          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <h2 style="color: #1e293b; margin-top: 0;">Password Reset Confirmation</h2>
            <p style="color: #475569; line-height: 1.6;">
              Dear ${userName || userEmail},
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

    const resend = new Resend(RESEND_API_KEY)
    const { error: emailError } = await resend.emails.send(
      {
        from: RESET_FROM.includes("<") ? RESET_FROM : `HSE System <${RESET_FROM}>`,
        to: userEmail,
        subject: "Your Password Has Been Reset - HSE System",
        html: htmlContent,
      },
      { idempotencyKey: `admin-password-reset/${userId || userEmail}` },
    )
    if (emailError) {
      console.error("[v0] Resend password reset error:", emailError.message)
      return NextResponse.json({ error: `Password reset saved, but email could not be sent: ${emailError.message}`, temporaryPassword: newPassword }, { status: 502 })
    }

    return NextResponse.json(
      {
        success: true,
        message: "Password has been reset and new password sent to email",
        temporaryPassword: newPassword,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[v0] Error resetting password:", error)
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    )
  }
}
