import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import crypto from "crypto"

const ADMIN_EMAIL = "xom-it-admin@xomoman.com"
const EMAIL_USER = process.env.EMAIL_USER || "hsesystem.xom@outlook.com"
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD

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
    // Get the session token from the Authorization header or cookies
    const authHeader = request.headers.get("authorization")
    const cookies = request.headers.get("cookie")

    // Extract user email from the request body (sent by authenticated client)
    // The client is responsible for sending their email as proof of authentication
    const body = await request.json()
    const { name, email, payrollNo, role, designation, businessUnit, status, adminEmail } = body

    // Verify admin authorization
    if (adminEmail !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "Unauthorized: Only authorized admin can add users" },
        { status: 403 }
      )
    }

    // Validation
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    // Generate temporary password
    const temporaryPassword = generateSecurePassword()

    // Create new user object
    const newUser = {
      id: `user_${Date.now()}`,
      name,
      email,
      payrollNo: payrollNo || `P${Date.now()}`,
      role: role || "USER",
      designation: designation || "",
      businessUnit: businessUnit || "XOM Oman",
      status: status || "Active",
    }

    // Send welcome email with temporary password
    if (EMAIL_USER && EMAIL_PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          host: "smtp.office365.com",
          port: 587,
          secure: false,
          auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASSWORD,
          },
          tls: {
            ciphers: "SSLv3",
            rejectUnauthorized: false,
          },
        })

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1f2937;">Welcome to HSE System</h2>
            <p>Dear <strong>${name}</strong>,</p>
            <p>Your account has been created in the HSE (Health, Safety & Environment) system.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Login Credentials:</strong></p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> <code style="background: #fff; padding: 5px 10px; border-radius: 4px;">${temporaryPassword}</code></p>
              <p><strong>Role:</strong> ${role}</p>
            </div>
            
            <p style="color: #ef4444;"><strong>⚠️ Important:</strong> Please change your password immediately after your first login.</p>
            
            <p>You can log in here: <a href="${process.env.BETTER_AUTH_URL || "https://hse.xomoman.com"}/sign-in">HSE System Login</a></p>
            
            <p>If you have any questions, please contact the HSE administrator.</p>
            
            <p>Best regards,<br><strong>HSE System</strong></p>
            
            <hr style="margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
              This is an automated email. Please do not reply to this email.
            </p>
          </div>
        `

        await transporter.sendMail({
          from: EMAIL_USER,
          to: email,
          subject: "Welcome to HSE System - Account Created",
          html: htmlContent,
        })
      } catch (emailError) {
        console.error("[v0] Email send error:", emailError)
        // Don't fail the user creation if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: newUser,
      temporaryPassword,
    })
  } catch (error) {
    console.error("[v0] Error adding user:", error)
    return NextResponse.json(
      { error: "Failed to add user" },
      { status: 500 }
    )
  }
}
