import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Apply before the first query so Better Auth resolves its unqualified
  // user/account/session tables in neon_auth without a connection race.
  options: '-c search_path=neon_auth,public',
})

export const db = drizzle(pool, { schema })
