import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function runSetup() {
  const client = await pool.connect()

  try {
    console.log('Setting up admin tables...')

    // Read the SQL migration file
    const sqlPath = path.join(process.cwd(), 'scripts', 'create-admin-tables.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')

    // Execute the SQL
    const statements = sql.split(';').filter(stmt => stmt.trim())
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 80)}...`)
        await client.query(statement)
      }
    }

    console.log('✓ Admin tables created successfully!')

    // Verify tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('business_units', 'inspection_types', 'master_categories', 'master_sections', 'master_items')
    `)

    console.log('\nCreated tables:')
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`)
    })

  } catch (error) {
    console.error('Error setting up admin tables:', error)
    process.exit(1)
  } finally {
    await client.end()
    await pool.end()
  }
}

runSetup()
