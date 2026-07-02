import { Resend } from 'resend'

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key || !key.startsWith('re_')) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  return new Resend(key)
}

const FROM = 'HSE System <onboarding@resend.dev>'

export async function sendEmail(opts: {
  to: string | string[]
  subject: string
  html: string
}): Promise<{ sent: boolean; error?: string }> {
  try {
    const resend = getResend()
    const { error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    })
    if (error) {
      return { sent: false, error: (error as any).message ?? JSON.stringify(error) }
    }
    return { sent: true }
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ── Email templates ──────────────────────────────────────────────────────────

export function observationCreatedHtml(obs: {
  number: string
  date: string
  businessUnit: string
  observer: string
  location: string
  category: string
  severity: string
  nearMiss: boolean
  description: string
  correctiveActions: string
}): string {
  const severityColor =
    obs.severity === 'Critical' ? '#ef4444'
    : obs.severity === 'High' ? '#f97316'
    : obs.severity === 'Medium' ? '#eab308'
    : '#22c55e'

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:#0d9488;padding:24px 30px;border-radius:10px 10px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:22px;">HSE System — New Observation</h1>
        <p style="color:rgba(255,255,255,.85);margin:6px 0 0;">${obs.number}</p>
      </div>
      <div style="background:#f8fafc;padding:30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;">
        ${obs.nearMiss ? `<div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:6px;padding:10px 14px;margin-bottom:20px;">
          <strong style="color:#92400e;">Near Miss Reported</strong>
        </div>` : ''}
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#64748b;width:140px;">Date</td><td style="padding:8px 0;color:#1e293b;">${obs.date}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Business Unit</td><td style="padding:8px 0;color:#1e293b;">${obs.businessUnit}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Observer</td><td style="padding:8px 0;color:#1e293b;">${obs.observer}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Location</td><td style="padding:8px 0;color:#1e293b;">${obs.location}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Category</td><td style="padding:8px 0;color:#1e293b;">${obs.category}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Severity</td>
            <td style="padding:8px 0;">
              <span style="background:${severityColor};color:#fff;padding:2px 10px;border-radius:12px;font-size:12px;">${obs.severity}</span>
            </td>
          </tr>
        </table>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;"/>
        <p style="color:#64748b;font-size:13px;margin:0 0 6px;font-weight:600;">Description</p>
        <p style="color:#1e293b;font-size:14px;margin:0 0 20px;line-height:1.6;">${obs.description || '—'}</p>
        ${obs.correctiveActions ? `
        <p style="color:#64748b;font-size:13px;margin:0 0 6px;font-weight:600;">Corrective Actions</p>
        <p style="color:#1e293b;font-size:14px;margin:0 0 20px;line-height:1.6;">${obs.correctiveActions}</p>` : ''}
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://hse.dash.xomoman.com'}" style="display:inline-block;background:#0d9488;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-size:14px;">View in HSE System</a>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:25px 0 10px;"/>
        <p style="color:#94a3b8;font-size:12px;margin:0;">This is an automated notification from the HSE System. Do not reply to this email.</p>
      </div>
    </div>`
}

export function incompleteTrainingHtml(opts: {
  supervisorName: string
  records: { employeeName: string; employeeCode: string; courseName: string; status: string; expiryDate?: string }[]
  generatedAt: string
}): string {
  const rows = opts.records.map((r) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#1e293b;">${r.employeeName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;">${r.employeeCode ?? '—'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#1e293b;">${r.courseName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">
        <span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:10px;font-size:12px;">${r.status}</span>
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;">${r.expiryDate ?? '—'}</td>
    </tr>`).join('')

  return `
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:20px;">
      <div style="background:#0d9488;padding:24px 30px;border-radius:10px 10px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:22px;">HSE System — Incomplete Training Alert</h1>
        <p style="color:rgba(255,255,255,.85);margin:6px 0 0;">Generated: ${opts.generatedAt}</p>
      </div>
      <div style="background:#f8fafc;padding:30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;">
        <p style="color:#475569;font-size:15px;margin:0 0 20px;">Dear ${opts.supervisorName},</p>
        <p style="color:#475569;font-size:14px;margin:0 0 20px;line-height:1.6;">
          The following training records are <strong>not yet completed</strong>. Please follow up with the relevant employees to ensure compliance.
        </p>
        <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:6px;padding:10px 14px;margin-bottom:20px;">
          <strong style="color:#856404;">Total Incomplete Records: ${opts.records.length}</strong>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#e2e8f0;">
              <th style="padding:10px 12px;text-align:left;color:#475569;font-weight:600;">Employee</th>
              <th style="padding:10px 12px;text-align:left;color:#475569;font-weight:600;">Code</th>
              <th style="padding:10px 12px;text-align:left;color:#475569;font-weight:600;">Course</th>
              <th style="padding:10px 12px;text-align:left;color:#475569;font-weight:600;">Status</th>
              <th style="padding:10px 12px;text-align:left;color:#475569;font-weight:600;">Expiry</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <br/>
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://hse.dash.xomoman.com'}" style="display:inline-block;background:#0d9488;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-size:14px;">View Training in HSE System</a>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:25px 0 10px;"/>
        <p style="color:#94a3b8;font-size:12px;margin:0;">This is an automated notification from the HSE System. Do not reply to this email.</p>
      </div>
    </div>`
}

export function observationStatusUpdatedHtml(obs: {
  number: string
  oldStatus: string
  newStatus: string
  updatedBy?: string
}): string {
  const statusColor =
    obs.newStatus === 'Closed' ? '#22c55e'
    : obs.newStatus === 'In Progress' ? '#3b82f6'
    : '#f97316'

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:#0d9488;padding:24px 30px;border-radius:10px 10px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:22px;">HSE System — Observation Updated</h1>
        <p style="color:rgba(255,255,255,.85);margin:6px 0 0;">${obs.number}</p>
      </div>
      <div style="background:#f8fafc;padding:30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;">
        <p style="color:#475569;font-size:15px;line-height:1.6;">The status of observation <strong>${obs.number}</strong> has been updated.</p>
        <div style="display:flex;align-items:center;gap:12px;margin:20px 0;">
          <span style="background:#e2e8f0;color:#475569;padding:4px 14px;border-radius:12px;font-size:13px;">${obs.oldStatus}</span>
          <span style="color:#64748b;font-size:18px;">→</span>
          <span style="background:${statusColor};color:#fff;padding:4px 14px;border-radius:12px;font-size:13px;">${obs.newStatus}</span>
        </div>
        ${obs.updatedBy ? `<p style="color:#64748b;font-size:13px;">Updated by: <strong>${obs.updatedBy}</strong></p>` : ''}
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://hse.dash.xomoman.com'}" style="display:inline-block;background:#0d9488;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-size:14px;">View in HSE System</a>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:25px 0 10px;"/>
        <p style="color:#94a3b8;font-size:12px;margin:0;">This is an automated notification from the HSE System. Do not reply to this email.</p>
      </div>
    </div>`
}
