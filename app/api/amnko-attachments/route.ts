import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { pool } from '@/lib/db'

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await pool.query(`
    SELECT attachment_id, original_name, archive_path, sha256, byte_size,
           target_table, target_id, legacy_parent_group, legacy_parent_id,
           legacy_rowguid, is_deleted
    FROM public.attachment_records
    WHERE is_deleted = false
    ORDER BY attachment_id
  `)

  return NextResponse.json({
    attachments: result.rows.map((row) => ({
      ...row,
      parentStatus: row.target_id ? 'LINKED' : 'UNLINKED',
    })),
  })
}
