import { pool } from '@/lib/db'
import crypto from 'crypto'

async function simulatePasswordReset() {
  console.log('=== Password Reset Simulation ===\n')
  
  const email = 'xom-it-admin@xomoman.com'
  console.log('Email:', email)
  
  // Check if user exists
  console.log('\n1. Checking if user exists...')
  const userResult = await pool.query(
    'SELECT id, email, name FROM neon_auth."user" WHERE email = $1',
    [email.toLowerCase()]
  )
  
  if (userResult.rows.length === 0) {
    console.log('   ✗ User not found')
    return
  }
  
  const user = userResult.rows[0]
  console.log('   ✓ User found:', user.id)
  console.log('   Name:', user.name)
  
  // Generate password
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  const randomValues = new Uint8Array(12)
  crypto.getRandomValues(randomValues)
  let tempPassword = ''
  for (let i = 0; i < 12; i++) {
    tempPassword += charset[randomValues[i] % charset.length]
  }
  
  console.log('\n2. Generated temporary password:')
  console.log('   ' + tempPassword)
  
  // Check if account exists
  console.log('\n3. Checking account table...')
  const accountResult = await pool.query(
    'SELECT id FROM neon_auth."account" WHERE "userId" = $1',
    [user.id]
  )
  
  if (accountResult.rows.length > 0) {
    console.log('   ✓ Account exists, updating password...')
    await pool.query(
      'UPDATE neon_auth."account" SET password = $1, "updatedAt" = $2 WHERE "userId" = $3',
      [tempPassword, new Date().toISOString(), user.id]
    )
    console.log('   ✓ Password updated')
  } else {
    console.log('   ✓ No account exists, creating one...')
    await pool.query(
      `INSERT INTO neon_auth."account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [crypto.randomUUID(), email, 'credential', user.id, tempPassword, new Date().toISOString(), new Date().toISOString()]
    )
    console.log('   ✓ Account created')
  }
  
  // Simulate email sending
  console.log('\n4. Email sending status:')
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_')) {
    console.log('   ✓ Would send via Resend')
  } else {
    console.log('   ✗ Resend API key invalid (will show password in UI instead)')
  }
  
  console.log('\n=== RESULT ===')
  console.log('Status: SUCCESS')
  console.log('User:', email)
  console.log('Temporary Password: ' + tempPassword)
  console.log('\nUI will display the temporary password in a yellow box')
  console.log('User can copy and use it to sign in')
  
  process.exit(0)
}

simulatePasswordReset().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
