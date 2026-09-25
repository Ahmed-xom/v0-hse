import crypto from 'crypto'
import { sendEmail } from '@/lib/send-email'

export function generateTemporaryPassword(): string {
  return crypto.randomBytes(12).toString('hex').slice(0, 16).toUpperCase()
}

export async function sendPasswordResetEmail(userEmail: string, userName: string, temporaryPassword: string): Promise<boolean> {
  const result = await sendEmail({
    to: userEmail,
    subject: 'AMNKO HSE Password Reset',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px"><h1 style="color:#059669">AMNKO HSE</h1><p>Hello ${userName || 'there'},</p><p>Your administrator issued a temporary password:</p><p style="font-size:20px;font-weight:700;letter-spacing:2px">${temporaryPassword}</p><p>Change it after signing in. If you did not request this, contact your administrator.</p></div>`,
  })
  return result.sent
}

export async function verifyEmailConnection(): Promise<boolean> {
  const result = await sendEmail({ to: process.env.SMTP_USER || '', subject: 'AMNKO HSE SMTP verification', html: '<p>SMTP verification</p>' })
  return result.sent
}
