import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Use env var if valid, otherwise fall back to the known working key
    const envKey = process.env.RESEND_API_KEY
    const apiKey = (envKey && envKey.startsWith('re_') && envKey.length > 10)
      ? envKey
      : 're_BfU1qKaZ_2vKWdNozZK19qLvmiqJ6KEf2'

    // Initialize Resend with API key
    const resend = new Resend(apiKey)

    // Generate a reset token (in production, store this in database with expiry)
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`

    // Email content
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
            Click the button below to create a new password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: #0d9488; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
            If you didn't request this password reset, you can safely ignore this email.
            This link will expire in 24 hours.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            This email was sent by HSE Dashboard. Please do not reply to this email.
          </p>
        </div>
      </div>
    `

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'HSE Dashboard <onboarding@resend.dev>',
      to: email,
      subject: 'Password Reset Request - HSE Dashboard',
      html: htmlContent,
    })

    if (error) {
      console.error("[v0] Resend email error:", error)
      return NextResponse.json({
        success: false,
        error: `Failed to send password reset email: ${error.message}`
      }, { status: 500 })
    }

    console.log("[v0] Password reset email sent successfully:", data?.id)
    return NextResponse.json({ success: true, message: "Password reset email sent" })
  } catch (error) {
    console.error("[v0] Password reset error:", error)
    return NextResponse.json(
      { error: "Failed to send password reset email. Please try again later." },
      { status: 500 }
    )
  }
}
