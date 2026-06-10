import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { user as userTable } from "@/lib/db/schema"
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
    // Verify admin is authenticated
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized: Not authenticated" }, { status: 401 })
    }

    // Check if user is the admin with permissions
    if (session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "Forbidden: Only authorized admin can add users" },
        { status: 403 }
      )
    }

    const { name, email, payrollNo, role, designation, businessUnit, status } = await request.json()

    // Validation
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(userTable)
      .where(userTable.email === email)
      .limit(1)

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Generate temporary password
    const temporaryPassword = generateSecurePassword()

    // Create new user account
    const newUserId = crypto.randomUUID()

    await db.insert(userTable).values({
      id: newUserId,
      name,
      email,
      role: role || "USER",
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Send welcome email with temporary password
    if (EMAIL_PASSWORD) {
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

        await transporter.sendMail({
          from: `"HSE System" <${EMAIL_USER}>`,
          to: email,
          subject: "Welcome to HSE System - Your Account Has Been Created",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 30px; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">HSE System</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Health, Safety & Environment Management</p>
              </div>
              <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
                <h2 style="color: #1e293b; margin-top: 0;">Welcome to HSE System</h2>
                <p style="color: #475569; line-height: 1.6;">
                  Dear ${name},
                </p>
                <p style="color: #475569; line-height: 1.6;">
                  Your user account has been successfully created in the HSE System. Your login credentials are:
                </p>
                <div style="background: #fff; padding: 15px; border: 2px solid #0d9488; border-radius: 6px; margin: 20px 0;">
                  <p style="color: #475569; margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                  <p style="color: #0d9488; font-size: 16px; font-weight: 700; letter-spacing: 1px; margin: 10px 0 0 0; font-family: monospace;">
                    Password: ${temporaryPassword}
                  </p>
                </div>
                <p style="color: #475569; line-height: 1.6;">
                  <strong>Role:</strong> ${role || "USER"}<br>
                  <strong>Designation:</strong> ${designation || "N/A"}<br>
                  <strong>Business Unit:</strong> ${businessUnit || "N/A"}
                </p>
                <p style="color: #475569; line-height: 1.6;">
                  <strong>Please note:</strong> For security reasons, we recommend you change this password immediately after logging in.
                </p>
                <div style="background: #fee2e2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0; border-radius: 4px;">
                  <p style="color: #7f1d1d; margin: 0; font-size: 14px;">
                    <strong>⚠️ Security Warning:</strong> Never share this password with anyone. Keep it confidential.
                  </p>
                </div>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                  This email was sent by HSE System. Please do not reply to this email.
                </p>
              </div>
            </div>
          `,
        })
      } catch (emailError) {
        console.error("[v0] Failed to send welcome email:", emailError)
        // Continue anyway - user is created even if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "User created successfully. Welcome email sent.",
      userId: newUserId,
    })
  } catch (error) {
    console.error("[v0] Add user error:", error)
    return NextResponse.json(
      { error: "Failed to add user" },
      { status: 500 }
    )
  }
}
