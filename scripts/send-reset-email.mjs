import { Resend } from '/vercel/share/v0-project/node_modules/resend/dist/index.mjs'
import bcrypt from '/vercel/share/v0-project/node_modules/bcryptjs/umd/index.js'
import crypto from 'crypto'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const resend = new Resend(process.env.RESEND_API_KEY)

const userEmail = 'xom-it-admin@xomoman.com'
const recipient = process.env.RESEND_TEST_EMAIL || userEmail

// Generate clean password
const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
let pw = ''
for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)]
pw += '@9'
const newPassword = pw

console.log('RESEND_API_KEY :', process.env.RESEND_API_KEY?.slice(0, 12) + '...')
console.log('Sending to     :', recipient)
console.log('New password   :', newPassword)

const hash = await bcrypt.hash(newPassword, 10)
const now  = new Date().toISOString()

// Find user
const userRes = await pool.query(
  'SELECT id, name FROM neon_auth."user" WHERE lower(email)=$1',
  [userEmail.toLowerCase()]
)
if (!userRes.rows.length) { console.error('User not found'); await pool.end(); process.exit(1) }
const user = userRes.rows[0]
console.log('User found     :', user.name, '| ID:', user.id)

// Update or insert password
const upd = await pool.query(
  'UPDATE neon_auth."account" SET password=$1,"updatedAt"=$2 WHERE "userId"=$3 RETURNING id',
  [hash, now, user.id]
)
if (upd.rowCount === 0) {
  await pool.query(
    'INSERT INTO neon_auth."account"(id,"accountId","providerId","userId",password,"createdAt","updatedAt") VALUES($1,$2,$3,$4,$5,$6,$6)',
    [crypto.randomUUID(), userEmail, 'credential', user.id, hash, now]
  )
  console.log('Account        : created')
} else {
  console.log('Account        : updated')
}

const ok = await bcrypt.compare(newPassword, hash)
console.log('bcrypt verify  :', ok ? 'PASS' : 'FAIL')

// Build email HTML
const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155">
  <tr><td style="background:#0d9488;padding:28px 40px;text-align:center">
    <h1 style="color:#fff;margin:0 0 4px;font-size:22px">HSE Dashboard</h1>
    <p style="color:rgba(255,255,255,0.75);margin:0;font-size:13px">Health, Safety &amp; Environment &mdash; XOM Oman</p>
  </td></tr>
  <tr><td style="padding:32px 40px">
    <h2 style="color:#f1f5f9;font-size:18px;margin:0 0 12px">Your password has been reset</h2>
    <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;line-height:1.6">
      Dear <strong style="color:#e2e8f0">${user.name}</strong>,<br>
      Your account password has been reset. Use the credentials below to sign in.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px">
      <tr><td style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:16px 20px">
        <p style="color:#64748b;font-size:11px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px">Email</p>
        <p style="color:#e2e8f0;font-size:15px;margin:0;font-weight:600">${userEmail}</p>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
      <tr><td style="background:#0f172a;border:2px solid #0d9488;border-radius:8px;padding:22px;text-align:center">
        <p style="color:#64748b;font-size:11px;margin:0 0 10px;text-transform:uppercase;letter-spacing:1px">New Password</p>
        <p style="color:#2dd4bf;font-size:30px;font-weight:700;margin:0;font-family:monospace;letter-spacing:5px">${newPassword}</p>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
      <tr><td style="background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.25);border-radius:8px;padding:14px 16px">
        <p style="color:#fca5a5;font-size:13px;margin:0;line-height:1.5">
          <strong>Important:</strong> Sign in and change this password immediately. Do not share it with anyone.
        </p>
      </td></tr>
    </table>
    <a href="https://ahmed-xom.vercel.app/login" style="display:block;background:#0d9488;color:#fff;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Sign In to HSE Dashboard</a>
  </td></tr>
  <tr><td style="padding:16px 40px;border-top:1px solid #334155;text-align:center">
    <p style="color:#475569;font-size:12px;margin:0">XOM Oman &mdash; HSE System &mdash; Confidential</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`

const { data, error } = await resend.emails.send({
  from: 'HSE System <onboarding@resend.dev>',
  to: recipient,
  subject: `Password Reset for ${userEmail} - HSE Dashboard`,
  html,
})

console.log('')
if (error) {
  console.error('Email FAILED  :', JSON.stringify(error))
} else {
  console.log('Email SENT    : YES')
  console.log('Resend ID     :', data?.id)
  console.log('')
  console.log('=== CREDENTIALS SAVED IN DB ===')
  console.log('Email         :', userEmail)
  console.log('Password      :', newPassword)
  console.log('===============================')
}

await pool.end()
