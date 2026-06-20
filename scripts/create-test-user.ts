import { db } from '../lib/db'
import { user } from '../lib/db/schema'
import { hash } from 'bcryptjs'
import crypto from 'crypto'

async function createTestUser() {
  try {
    // Hash a test password
    const testPassword = 'Test@12345'
    const hashedPassword = await hash(testPassword, 12)
    
    // Create test user
    const testUserId = crypto.randomUUID()
    
    console.log('[v0] Creating test user...')
    
    // Insert user directly using raw SQL
    const result = await db.execute(`
      INSERT INTO neon_auth."user" (id, email, name, "emailVerified", role, password, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, name
    `, [testUserId, 'xom-it-admin@xomoman.com', 'Admin User', true, 'ADMIN', hashedPassword])
    
    console.log('[v0] Test user created:', (result as any).rows?.[0])
    console.log('[v0] Email: xom-it-admin@xomoman.com')
    console.log('[v0] Temporary Password: Test@12345')
  } catch (error) {
    console.error('[v0] Error creating test user:', error)
    process.exit(1)
  }
}

createTestUser()
