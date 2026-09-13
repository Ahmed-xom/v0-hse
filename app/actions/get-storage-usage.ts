'use server'

import { list } from '@vercel/blob'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export type StorageUsage = {
  databaseBytes: number
  databaseLabel: string
  blobBytes: number
  blobCount: number
  checkedAt: string
}

export async function getStorageUsage(): Promise<StorageUsage> {
  const [{ rows }] = await Promise.all([
    pool.query<{ size_bytes: string }>(
      'SELECT pg_database_size(current_database())::text AS size_bytes'
    ),
  ])

  let blobBytes = 0
  let blobCount = 0
  let cursor: string | undefined

  do {
    const result = await list({ cursor, limit: 1000 })
    blobBytes += result.blobs.reduce((total, blob) => total + (blob.size ?? 0), 0)
    blobCount += result.blobs.length
    cursor = result.cursor
  } while (cursor)

  const databaseBytes = Number(rows[0]?.size_bytes ?? 0)

  return {
    databaseBytes,
    databaseLabel: formatBytes(databaseBytes),
    blobBytes,
    blobCount,
    checkedAt: new Date().toISOString(),
  }
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}
