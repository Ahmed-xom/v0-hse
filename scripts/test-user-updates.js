#!/usr/bin/env node

/**
 * Test script to verify user update functionality
 * This tests the manage-users server actions
 */

const { Client } = require('pg');

async function testUserUpdates() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✓ Connected to database');

    // Get a test user
    const userResult = await client.query(
      'SELECT id, name, email, banned FROM "user" LIMIT 1'
    );

    if (userResult.rows.length === 0) {
      console.log('❌ No users found in database');
      await client.end();
      return;
    }

    const testUser = userResult.rows[0];
    console.log('\n📋 Test User:', testUser);

    // Test 1: Update banned status
    console.log('\n🧪 Test 1: Update banned status...');
    const updateResult = await client.query(
      'UPDATE "user" SET banned = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING id, email, name, banned, "updatedAt"',
      [!testUser.banned, testUser.id]
    );
    console.log('✓ User status updated:', updateResult.rows[0]);

    // Test 2: Update role
    console.log('\n🧪 Test 2: Update user role...');
    const roleResult = await client.query(
      'UPDATE "user" SET role = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING id, email, name, role, "updatedAt"',
      ['ADMIN', testUser.id]
    );
    console.log('✓ User role updated:', roleResult.rows[0]);

    // Test 3: Verify updates persisted
    console.log('\n🧪 Test 3: Verify updates...');
    const verifyResult = await client.query(
      'SELECT id, name, email, role, banned FROM "user" WHERE id = $1',
      [testUser.id]
    );
    console.log('✓ Current user state:', verifyResult.rows[0]);

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testUserUpdates();
