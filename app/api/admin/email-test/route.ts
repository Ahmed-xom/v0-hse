import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { sendEmail } from '@/lib/send-email'

const adminRoles = new Set(['ADMIN', 'ADMIN SYSTEM', 'SYSTEM ADMINISTRATOR', 'MANAGEMENT', 'HSE ADMIN'])

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = String((session?.user as unknown as { role?: string } | undefined)?.role || '').toUpperCase()
  if (!session?.user || !adminRoles.has(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { recipient } = await request.json().catch(() => ({}))
  if (typeof recipient !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.trim())) return NextResponse.json({ error: 'Enter a valid recipient email.' }, { status: 400 })
  const result = await sendEmail({ to: recipient.trim(), subject: 'AMNKO HSE - Email Configuration Test', html: '<p>This is a test email from the AMNKO HSE Management System.</p><p>Provider: Hostinger SMTP<br>Status: Email service is working.</p>' })
  if (result.sent) return NextResponse.json({ success: true, message: 'Test email sent successfully.' })
  const message = /auth|credentials|login|535|authentication/i.test(result.error || '') ? 'SMTP authentication failed. Please verify the Hostinger email address and password.' : 'Unable to send the test email.'
  return NextResponse.json({ error: message }, { status: 502 })
}
