import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const html = `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
  <div style="background:#0f766e;padding:24px 30px;border-radius:10px 10px 0 0;">
    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-vHrWHaXI9ba92huTDLKeBtYeO6j0ov.webp"
         alt="XOM" style="height:36px;width:auto;background:#fff;padding:4px 8px;border-radius:6px;" />
    <h1 style="color:#fff;margin:14px 0 0;font-size:20px;">HSE System — Login Credentials</h1>
  </div>
  <div style="background:#f8fafc;padding:30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;">
    <p style="color:#475569;font-size:15px;margin:0 0 20px;">Dear IT Admin,</p>
    <p style="color:#475569;font-size:14px;margin:0 0 20px;">
      Your admin account for the <strong>XOM Oman HSE System</strong> has been set up.
      Below are your login credentials:
    </p>
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
      <table style="width:100%;font-size:14px;border-collapse:collapse;">
        <tr>
          <td style="color:#64748b;padding:8px 0;width:110px;">Email</td>
          <td style="color:#0f172a;font-weight:600;">xom-it-admin@xomoman.com</td>
        </tr>
        <tr>
          <td style="color:#64748b;padding:8px 0;">Password</td>
          <td style="color:#0f172a;font-weight:600;letter-spacing:1px;">Xom@2026</td>
        </tr>
        <tr>
          <td style="color:#64748b;padding:8px 0;">Role</td>
          <td style="color:#0f172a;font-weight:600;">ADMIN SYSTEM</td>
        </tr>
      </table>
    </div>
    <p style="color:#e11d48;font-size:12px;margin:0 0 8px;font-weight:600;">
      For security, please change your password after your first login.
    </p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />
    <p style="color:#94a3b8;font-size:11px;margin:0;">
      This is an automated notification from the XOM Oman HSE System (hsesystem.xom@outlook.com).
    </p>
  </div>
</div>`

export async function GET() {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: 'xom-it-admin@xomoman.com',
      subject: 'XOM Oman HSE System — Your Admin Login Credentials',
      html,
    })

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: 'Credentials email sent to xom-it-admin@xomoman.com',
    })
  } catch (err: any) {
    console.error('[v0] SMTP send error:', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
