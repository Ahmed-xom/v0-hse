/**
 * provision-users.mjs
 * Creates REVIEWER / APPROVER accounts and resets passwords for all real DB users.
 * Sends a branded welcome/reset email to each one (via Resend).
 * Run: node --env-file-if-exists=/vercel/share/.env.project scripts/provision-users.mjs
 */

import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import { randomUUID, getRandomValues } from 'crypto'
import { Resend } from 'resend'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const resend = new Resend(process.env.RESEND_API_KEY)

// ── helpers ──────────────────────────────────────────────────────────────────

function generatePassword (len = 12) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = new Uint8Array(len)
  getRandomValues(bytes)
  let pw = Array.from(bytes).map(b => chars[b % chars.length]).join('')
  // ensure one digit + one uppercase already in charset, add special
  return pw + '@8'
}

function buildEmailHtml ({ name, email, password, role, loginUrl }) {
  const roleColor = role === 'APPROVER' ? '#7c3aed' : role === 'REVIEWER' ? '#0284c7' : '#0d9488'
  const roleBg   = role === 'APPROVER' ? '#f5f3ff' : role === 'REVIEWER' ? '#e0f2fe' : '#f0fdfa'
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
<tr><td align="center">
<table width="540" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155">
  <!-- header -->
  <tr><td style="background:#0d9488;padding:28px 40px">
    <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:-0.5px">HSE Dashboard</h1>
    <p style="color:rgba(255,255,255,0.75);margin:4px 0 0;font-size:13px">Health, Safety &amp; Environment &mdash; XOM Oman</p>
  </td></tr>
  <!-- body -->
  <tr><td style="padding:32px 40px">
    <h2 style="color:#f1f5f9;font-size:18px;margin:0 0 12px">Welcome to HSE Dashboard</h2>
    <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;line-height:1.6">
      Dear <strong style="color:#e2e8f0">${name}</strong>,<br>
      Your account has been created. Use the credentials below to sign in.
    </p>

    <!-- role badge -->
    <div style="display:inline-block;background:${roleBg};border:1px solid ${roleColor};border-radius:20px;padding:4px 14px;margin-bottom:20px">
      <span style="color:${roleColor};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px">${role}</span>
    </div>

    <!-- email row -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px">
      <tr><td style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:14px 18px">
        <p style="color:#64748b;font-size:11px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px">Email</p>
        <p style="color:#e2e8f0;font-size:15px;margin:0;font-weight:600">${email}</p>
      </td></tr>
    </table>

    <!-- password row -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
      <tr><td style="background:#0f172a;border:2px solid #0d9488;border-radius:8px;padding:20px;text-align:center">
        <p style="color:#64748b;font-size:11px;margin:0 0 10px;text-transform:uppercase;letter-spacing:1px">Your Password</p>
        <p style="color:#2dd4bf;font-size:28px;font-weight:700;margin:0;font-family:monospace;letter-spacing:4px">${password}</p>
      </td></tr>
    </table>

    <!-- warning -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
      <tr><td style="background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.25);border-radius:8px;padding:14px 16px">
        <p style="color:#fca5a5;font-size:13px;margin:0;line-height:1.5">
          <strong>Important:</strong> Sign in and change this password immediately. Do not share it with anyone.
        </p>
      </td></tr>
    </table>

    <!-- CTA -->
    <a href="${loginUrl}" style="display:block;background:#0d9488;color:#fff;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Sign In to HSE Dashboard</a>
  </td></tr>
  <!-- footer -->
  <tr><td style="padding:16px 40px;border-top:1px solid #334155;text-align:center">
    <p style="color:#475569;font-size:12px;margin:0">XOM Oman &mdash; HSE System &mdash; Confidential &mdash; Do not forward</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`
}

// ── new users to create ───────────────────────────────────────────────────────

const NEW_USERS = [
  {
    email: 'ibusaidi@xomoman.com',
    name: 'Ibrahim Hilal Albusaidi',
    role: 'APPROVER',
    designation: 'General Manager',
    businessUnit: 'XOM Oman',
  },
  {
    email: 'madawi@xomoman.com',       // MAdawi@xomoman.com normalised
    name: 'Mohammed Al Adawi',
    role: 'REVIEWER',
    designation: 'HSE Advisor',
    businessUnit: 'XOM Oman',
  },
  {
    email: 'hfarsi@xomoman.com',
    name: 'Hashim Ali Mubarak Al Farsi',
    role: 'REVIEWER',
    designation: 'Service Quality Manager',
    businessUnit: 'XOM Drilling System',
  },
]

// ── main ─────────────────────────────────────────────────────────────────────

async function run () {
  const loginUrl = process.env.BETTER_AUTH_URL || 'https://ahmed-xom.vercel.app/sign-in'
  const testRecipient = process.env.RESEND_TEST_EMAIL   // e.g. hsexomoman@gmail.com
  const results = []

  console.log('\n=== HSE User Provisioning ===')
  console.log('Resend key:', process.env.RESEND_API_KEY?.slice(0, 8) + '...')
  console.log('Test email override:', testRecipient || '(none — sending to real address)')
  console.log('')

  // ── STEP 1: upsert new users into neon_auth.user ─────────────────────────
  for (const u of NEW_USERS) {
    console.log(`\nProcessing: ${u.email} (${u.role})`)
    const now = new Date().toISOString()

    // check if already exists
    const exists = await pool.query(
      `SELECT id, email FROM neon_auth."user" WHERE lower(email) = $1`,
      [u.email.toLowerCase()]
    )

    let userId
    if (exists.rows.length > 0) {
      userId = exists.rows[0].id
      // update role
      await pool.query(
        `UPDATE neon_auth."user" SET role = $1, "updatedAt" = $2 WHERE id = $3`,
        [u.role, now, userId]
      )
      console.log(`  Already exists — updated role to ${u.role}`)
    } else {
      userId = randomUUID()
      await pool.query(
        `INSERT INTO neon_auth."user" (id, name, email, "emailVerified", "createdAt", "updatedAt", role, banned)
         VALUES ($1, $2, $3, false, $4, $4, $5, false)`,
        [userId, u.name, u.email.toLowerCase(), now, u.role]
      )
      console.log(`  Created new user, id: ${userId}`)
    }

    u.id = userId
  }

  // ── STEP 2: collect ALL users (existing + new) ───────────────────────────
  const allUsersRes = await pool.query(
    `SELECT id, email, name, role FROM neon_auth."user" ORDER BY "createdAt"`
  )
  console.log(`\nTotal users in DB: ${allUsersRes.rows.length}`)

  // ── STEP 3: reset passwords + send emails for every user ─────────────────
  for (const u of allUsersRes.rows) {
    const password = generatePassword()
    const hash = await bcrypt.hash(password, 10)
    const now = new Date().toISOString()

    // upsert account record
    const accExists = await pool.query(
      `SELECT id FROM neon_auth.account WHERE "userId" = $1 AND "providerId" = 'credential'`,
      [u.id]
    )
    if (accExists.rows.length > 0) {
      await pool.query(
        `UPDATE neon_auth.account SET password = $1, "updatedAt" = $2 WHERE "userId" = $3 AND "providerId" = 'credential'`,
        [hash, now, u.id]
      )
    } else {
      await pool.query(
        `INSERT INTO neon_auth.account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
         VALUES ($1, $2, 'credential', $3, $4, $5, $5)`,
        [randomUUID(), u.email, u.id, hash, now]
      )
    }

    // audit log
    try {
      await pool.query(
        `INSERT INTO public.password_reset (id, "userId", "resetBy", "newPassword", "ipAddress")
         VALUES ($1, $2, 'system-provision', $3, 'provisioning-script')`,
        [randomUUID(), u.id, hash]
      )
    } catch (e) {
      // non-fatal
    }

    console.log(`  Password set for ${u.email}`)

    // Resend test mode: can only send to own email — use override
    const recipient = testRecipient || u.email
    // rate-limit: wait 600ms between sends
    await new Promise(r => setTimeout(r, 600))
    const html = buildEmailHtml({
      name: u.name || u.email,
      email: u.email,
      password,
      role: u.role || 'USER',
      loginUrl,
    })

    const { data, error } = await resend.emails.send({
      from: 'HSE System <onboarding@resend.dev>',
      to: recipient,
      subject: `HSE Dashboard Access — ${u.email}`,
      html,
    })

    if (error) {
      console.log(`  Email FAILED for ${u.email}: ${error.message}`)
    } else {
      console.log(`  Email sent to ${recipient} (for ${u.email}) — Resend ID: ${data?.id}`)
    }

    results.push({ email: u.email, name: u.name, role: u.role, password, emailSent: !error })
  }

  // ── STEP 4: summary ──────────────────────────────────────────────────────
  console.log('\n\n=== PROVISIONING COMPLETE ===')
  console.log('User'.padEnd(40), 'Role'.padEnd(12), 'Password'.padEnd(16), 'Email')
  console.log('-'.repeat(85))
  results.forEach(r => {
    console.log(
      r.email.padEnd(40),
      (r.role || 'USER').padEnd(12),
      r.password.padEnd(16),
      r.emailSent ? 'SENT' : 'FAILED'
    )
  })

  await pool.end()
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
