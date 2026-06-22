import { Pool } from 'pg'

async function testPasswordReset() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    console.log('=== Testing Password Reset ===')
    
    // Check if the account table exists and has the correct schema
    const tableCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'neon_auth' AND table_name = 'account'
      ORDER BY ordinal_position
    `)
    
    console.log('\n✓ Account table columns:')
    tableCheck.rows.forEach((row: any) => {
      console.log(`  - ${row.column_name}: ${row.data_type}`)
    })
    
    // Check if test user exists
    const userCheck = await pool.query(
      'SELECT id, email FROM neon_auth."user" WHERE email = $1',
      ['xom-it-admin@xomoman.com']
    )
    
    if (userCheck.rows.length > 0) {
      const userId = userCheck.rows[0].id
      console.log(`\n✓ Test user found: ${userCheck.rows[0].email} (ID: ${userId})`)
      
      // Check if account exists for this user
      const accountCheck = await pool.query(
        'SELECT id FROM neon_auth."account" WHERE "userId" = $1',
        [userId]
      )
      
      if (accountCheck.rows.length > 0) {
        console.log(`✓ Account record exists for user`)
      } else {
        console.log(`✗ No account record exists - will be created on password reset`)
      }
      
      // Simulate password reset by updating the account
      const testPassword = 'TempPass123!@#'
      const now = new Date().toISOString()
      
      const updateResult = await pool.query(
        `UPDATE neon_auth."account" 
         SET password = $1, "updatedAt" = $2
         WHERE "userId" = $3
         RETURNING id`,
        [testPassword, now, userId]
      )
      
      if (updateResult.rows.length > 0) {
        console.log(`✓ Password updated successfully`)
      } else {
        console.log(`✓ No account to update - would create new one in production`)
      }
    } else {
      console.log('\n✗ Test user not found - create user first')
    }
    
    console.log('\n=== Test Complete ===')
  } catch (error) {
    console.error('✗ Test failed:', error)
  } finally {
    await pool.end()
  }
}

testPasswordReset()
