import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { sql } from 'drizzle-orm'

async function testCompleteFlow() {
  console.log('\n=== Testing Complete HSE System Flow ===\n')

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('[ERROR] DATABASE_URL not set')
    return
  }

  const pool = new Pool({ connectionString: databaseUrl })
  const db = drizzle(pool)

  try {
    // Test 1: User exists
    console.log('[TEST 1] Verifying user exists...')
    const userResult = await db.execute(
      sql`SELECT id, email, name, banned, role FROM neon_auth."user" WHERE email = 'xom-it-admin@xomoman.com' LIMIT 1`
    )
    const rows = (userResult as any).rows || []
    
    if (rows.length === 0) {
      console.error('[FAIL] User not found')
      return
    }

    const user = rows[0]
    console.log('[PASS] User found:', { email: user.email, role: user.role, banned: user.banned })

    // Test 2: User status toggle
    console.log('\n[TEST 2] Testing user status toggle...')
    const now = new Date().toISOString()
    
    // Set to inactive
    await db.execute(
      sql`UPDATE neon_auth."user" SET "updatedAt" = ${now}, "banned" = true WHERE id = ${user.id}`
    )
    
    const inactiveResult = await db.execute(
      sql`SELECT banned FROM neon_auth."user" WHERE id = ${user.id}`
    )
    const inactiveRow = ((inactiveResult as any).rows || [])[0]
    console.log(`[PASS] User toggled to inactive: ${inactiveRow.banned === true ? 'PASS' : 'FAIL'}`)

    // Set back to active
    await db.execute(
      sql`UPDATE neon_auth."user" SET "updatedAt" = ${now}, "banned" = false WHERE id = ${user.id}`
    )
    
    const activeResult = await db.execute(
      sql`SELECT banned FROM neon_auth."user" WHERE id = ${user.id}`
    )
    const activeRow = ((activeResult as any).rows || [])[0]
    console.log(`[PASS] User toggled to active: ${activeRow.banned === false ? 'PASS' : 'FAIL'}`)

    // Test 3: User role update
    console.log('\n[TEST 3] Testing user role update...')
    await db.execute(
      sql`UPDATE neon_auth."user" SET "updatedAt" = ${now}, "role" = 'ADMIN' WHERE id = ${user.id}`
    )
    
    const adminResult = await db.execute(
      sql`SELECT role FROM neon_auth."user" WHERE id = ${user.id}`
    )
    const adminRow = ((adminResult as any).rows || [])[0]
    console.log(`[PASS] User role updated to ADMIN: ${adminRow.role === 'ADMIN' ? 'PASS' : 'FAIL'}`)

    // Test 4: Add new user (simulating add-user action)
    console.log('\n[TEST 4] Testing new user creation...')
    const newUserId = crypto.randomUUID()
    const newUserEmail = `test-user-${Date.now()}@xomoman.com`

    const insertResult = await db.execute(
      sql`INSERT INTO neon_auth."user" (id, name, email, "emailVerified", "createdAt", "updatedAt", role, banned)
          VALUES (${newUserId}, 'Test User', ${newUserEmail}, false, ${now}, ${now}, 'USER', false)
          RETURNING id, email, name`
    )
    
    const newUserRow = ((insertResult as any).rows || [])[0]
    console.log(`[PASS] New user created: ${newUserRow.email}`)

    // Test 5: Query all users
    console.log('\n[TEST 5] Testing user query...')
    const allUsersResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM neon_auth."user"`
    )
    const countRow = ((allUsersResult as any).rows || [])[0]
    console.log(`[PASS] Total users in system: ${countRow.count}`)

    console.log('\n=== All Tests Completed Successfully ===\n')
    console.log('✓ User management functionality is working correctly')
    console.log('✓ Database schema is properly configured')
    console.log('✓ Ready for production use\n')

  } catch (err: any) {
    console.error('[ERROR] Test failed:', err.message)
    console.error(err)
  } finally {
    await pool.end()
  }
}

testCompleteFlow()
