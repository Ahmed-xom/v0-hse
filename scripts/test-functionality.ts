import { Resend } from 'resend'

async function testResendEmail() {
  console.log('\n=== Testing Resend Email Service ===')
  
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[ERROR] RESEND_API_KEY not set')
    return false
  }

  const resend = new Resend(apiKey)
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'HSE System <onboarding@resend.dev>',
      to: 'xom-it-admin@xomoman.com',
      subject: '[TEST] Password Reset - HSE System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>Test Password Reset Email</h2>
          <p>This is a test email to verify Resend is working correctly.</p>
          <div style="background: #f0f0f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p><strong>Temporary Password:</strong> TEST12345</p>
          </div>
          <p>If you received this email, Resend is properly configured!</p>
        </div>
      `,
    })

    if (error) {
      console.error('[ERROR] Resend email failed:', error)
      return false
    }

    console.log('[SUCCESS] Test email sent successfully!')
    console.log('[INFO] Email ID:', data?.id)
    return true
  } catch (err: any) {
    console.error('[ERROR] Exception during email send:', err.message)
    return false
  }
}

async function testDatabaseQuery() {
  console.log('\n=== Testing Database Query ===')
  
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('[ERROR] DATABASE_URL not set')
    return false
  }

  try {
    // Dynamic import to avoid errors if pool is not available
    const { Pool } = await import('pg')
    const { sql } = await import('drizzle-orm')
    const { drizzle } = await import('drizzle-orm/node-postgres')

    const pool = new Pool({ connectionString: databaseUrl })
    const db = drizzle(pool)

    // Test query to neon_auth.user table
    const result = await db.execute(
      sql`SELECT id, email, name FROM neon_auth."user" WHERE email = 'xom-it-admin@xomoman.com' LIMIT 1`
    )

    const rows = (result as any).rows || []
    
    if (rows.length === 0) {
      console.log('[WARNING] User not found in database')
      return false
    }

    console.log('[SUCCESS] User found in database!')
    console.log('[INFO] User:', {
      id: rows[0].id,
      email: rows[0].email,
      name: rows[0].name,
    })

    await pool.end()
    return true
  } catch (err: any) {
    console.error('[ERROR] Database query failed:', err.message)
    return false
  }
}

async function runTests() {
  console.log('Starting comprehensive functionality tests...\n')

  const emailTest = await testResendEmail()
  const dbTest = await testDatabaseQuery()

  console.log('\n=== Test Summary ===')
  console.log(`Resend Email: ${emailTest ? '✓ PASSED' : '✗ FAILED'}`)
  console.log(`Database Query: ${dbTest ? '✓ PASSED' : '✗ FAILED'}`)
  console.log('')

  if (emailTest && dbTest) {
    console.log('✓ All tests passed! System is ready for use.')
    process.exit(0)
  } else {
    console.log('✗ Some tests failed. Please check the errors above.')
    process.exit(1)
  }
}

runTests()
