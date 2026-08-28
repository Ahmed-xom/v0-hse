import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

async function createTable() {
  try {
    console.log('[v0] Creating password_reset table...')
    
    // Create the password_reset table directly with SQL
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "public"."password_reset" (
        "id" text PRIMARY KEY NOT NULL,
        "userId" text NOT NULL REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE,
        "resetBy" text NOT NULL REFERENCES "neon_auth"."user"("id"),
        "newPassword" text NOT NULL,
        "resetAt" timestamp with time zone DEFAULT now() NOT NULL,
        "ipAddress" text
      )
    `)
    
    // Create index for faster lookups
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "password_reset_user_idx" ON "public"."password_reset"("userId")
    `)
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "password_reset_reset_by_idx" ON "public"."password_reset"("resetBy")
    `)
    
    console.log('[v0] password_reset table created successfully')
    
    // Verify the table exists
    const result = await db.execute(sql`
      SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'password_reset'
      )
    `)
    
    const exists = (result as any).rows?.[0]?.exists
    console.log('[v0] Table exists:', exists ? 'YES' : 'NO')
    
    process.exit(0)
  } catch (error) {
    console.error('[v0] Error creating table:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

createTable()
