import { db } from '@/lib/db'
import { pool } from '@/lib/db'
import fs from 'fs'
import path from 'path'

/**
 * Initialize database tables on application startup
 * This creates all necessary tables and Excel data tables
 */
export async function initializeDatabase() {
  try {
    console.log('[v0] Starting database initialization...')

    // Create additional tables for Excel data
    const sqlStatements = [
      // Admin audit log table
      `CREATE TABLE IF NOT EXISTS admin_audit_log (
        id SERIAL PRIMARY KEY,
        admin_id TEXT NOT NULL REFERENCES "user"(id),
        action TEXT NOT NULL,
        target_user_id TEXT REFERENCES "user"(id),
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      // Email templates table
      `CREATE TABLE IF NOT EXISTS email_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        subject VARCHAR(255),
        html_template TEXT,
        text_template TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Excel data import log
      `CREATE TABLE IF NOT EXISTS excel_import_log (
        id SERIAL PRIMARY KEY,
        file_name VARCHAR(255),
        sheet_name VARCHAR(255),
        total_rows INTEGER,
        imported_rows INTEGER,
        failed_rows INTEGER,
        status VARCHAR(50),
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
    ]

    for (const sql of sqlStatements) {
      try {
        await pool.query(sql)
        console.log('[v0] Table created/verified')
      } catch (err: any) {
        if (!err.message.includes('already exists')) {
          console.error('[v0] Table creation error:', err.message)
        }
      }
    }

    console.log('[v0] Database initialization completed')
    return true
  } catch (error) {
    console.error('[v0] Database initialization failed:', error)
    return false
  }
}
