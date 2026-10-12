import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { randomUUID } from 'node:crypto'
import { auth } from '@/lib/auth'
import { sendEmail } from '@/lib/send-email'
import { getEmailConfiguration } from '@/lib/send-email'

const adminRoles = new Set(['ADMIN', 'ADMIN SYSTEM', 'SYSTEM ADMINISTRATOR', 'MANAGEMENT', 'HSE ADMIN'])
const authorizedRecipient = 'xom-it-admin@xomoman.com'
let lastDiagnosticAt = 0

export async function POST(_request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = String((session?.user as unknown as { role?: string } | undefined)?.role || '').toUpperCase()
  if (!session?.user || !adminRoles.has(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (Date.now() - lastDiagnosticAt < 60_000) return NextResponse.json({ error: 'Email diagnostic is rate limited. Try again shortly.' }, { status: 429 })

  const testId = randomUUID()
  const configuration = getEmailConfiguration()
  console.info('[email-test] starting SMTP diagnostic', {
    testId,
    recipient: authorizedRecipient,
    provider: configuration.provider,
    host: configuration.host,
    port: configuration.port,
    secure: configuration.secure,
    senderConfigured: Boolean(configuration.senderEmail),
    usernameConfigured: Boolean(configuration.username),
    missing: configuration.missing || null,
    at: new Date().toISOString(),
  })
  lastDiagnosticAt = Date.now()

  const result = await sendEmail({
    to: authorizedRecipient,
    subject: `AMNKO HSE - SMTP Diagnostic ${testId}`,
    html: `<p>This is an authorized AMNKO HSE SMTP diagnostic.</p><p>Test ID: ${testId}</p><p>SMTP submission was accepted only if this request returns success.</p>`,
  })
  if (result.sent) {
    console.info('[email-test] SMTP submission accepted', { testId, recipient: authorizedRecipient, at: new Date().toISOString() })
    return NextResponse.json({ success: true, testId, recipient: authorizedRecipient, message: 'SMTP accepted the diagnostic message. Inbox delivery must be confirmed separately.' })
  }
  console.error('[email-test] SMTP diagnostic failed', { testId, reason: result.error || 'unknown', at: new Date().toISOString() })
  const status = configuration.missing ? 503 : 502
  return NextResponse.json({ error: 'SMTP diagnostic failed.', testId, missing: configuration.missing || undefined }, { status })
}
