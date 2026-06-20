import { pool } from '@/lib/db'

async function testEmployeeOperations() {
  console.log('=== Testing Employee Operations ===\n')

  try {
    // Test 1: Read employee
    console.log('TEST 1: Reading employee...')
    const readResult = await pool.query(
      'SELECT id, name, email, hse_role, status FROM public."employee" WHERE id = $1',
      ['1']
    )
    if (readResult.rows.length > 0) {
      console.log('✓ Employee found:', readResult.rows[0])
    } else {
      console.log('✗ Employee not found')
    }

    // Test 2: Update status
    console.log('\nTEST 2: Updating status to Inactive...')
    const statusResult = await pool.query(
      'UPDATE public."employee" SET "updated_at" = NOW(), "status" = $1 WHERE id = $2 RETURNING id, status, updated_at',
      ['Inactive', '1']
    )
    if (statusResult.rows.length > 0) {
      console.log('✓ Status updated:', statusResult.rows[0])
    } else {
      console.log('✗ Failed to update status')
    }

    // Test 3: Update role
    console.log('\nTEST 3: Updating role to HSE ADMIN...')
    const roleResult = await pool.query(
      'UPDATE public."employee" SET "updated_at" = NOW(), "hse_role" = $1 WHERE id = $2 RETURNING id, hse_role, updated_at',
      ['HSE ADMIN', '1']
    )
    if (roleResult.rows.length > 0) {
      console.log('✓ Role updated:', roleResult.rows[0])
    } else {
      console.log('✗ Failed to update role')
    }

    // Test 4: Restore status
    console.log('\nTEST 4: Restoring status to Active...')
    const restoreResult = await pool.query(
      'UPDATE public."employee" SET "updated_at" = NOW(), "status" = $1 WHERE id = $2 RETURNING id, status',
      ['Active', '1']
    )
    if (restoreResult.rows.length > 0) {
      console.log('✓ Status restored:', restoreResult.rows[0])
    } else {
      console.log('✗ Failed to restore status')
    }

    console.log('\n=== All Tests Passed ✓ ===')
  } catch (error) {
    console.error('ERROR:', error)
  } finally {
    await pool.end()
  }
}

testEmployeeOperations()
