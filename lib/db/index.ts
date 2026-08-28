import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

export const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// Set search_path so Better Auth finds its tables in neon_auth schema
// and app tables stay in public schema
pool.on('connect', (client) => {
  client.query("SET search_path = neon_auth, public")
})

export const db = drizzle(pool, { schema })
