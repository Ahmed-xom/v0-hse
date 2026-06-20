#!/usr/bin/env node

/**
 * Setup script to create default admin user in the database
 * Run with: node scripts/setup-default-user.js
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL environment variable not set');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function setupDefaultUser() {
  const client = await pool.connect();
  
  try {
    // Check if admin user already exists
    const result = await client.query(
      'SELECT id, email FROM "user" WHERE email = $1',
      ['xom-it-admin@xomoman.com']
    );

    if (result.rows.length > 0) {
      console.log('✓ Admin user already exists:', result.rows[0].email);
      return;
    }

    // Create default admin user
    const adminId = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertResult = await client.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", role, banned, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, name`,
      [
        adminId,
        'XOM IT Admin',
        'xom-it-admin@xomoman.com',
        true, // emailVerified
        'ADMIN',
        false,
        now,
        now,
      ]
    );

    console.log('✓ Created default admin user:');
    console.log('  ID:', insertResult.rows[0].id);
    console.log('  Email:', insertResult.rows[0].email);
    console.log('  Name:', insertResult.rows[0].name);
    console.log('\nNext steps:');
    console.log('  1. Use the forgot password flow to set a password');
    console.log('  2. Or use the login page and set password there');
    console.log('  3. Email will be sent to the configured admin email');

  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setupDefaultUser();
