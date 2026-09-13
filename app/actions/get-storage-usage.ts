'use server'

import { list } from '@vercel/blob'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export type StorageUsage = {
  databaseBytes: number
  databaseLabel: string
  blobBytes: number
  blobCount: number
  recordCounts: {
    incidents: number
    inspections: number
    training: number
    observations: number
    users: number
  }
  checkedAt: string
}

export async function getStorageUsage(): Promise<StorageUsage> {
  const [{ rows }, { rows: countRows }] = await Promise.all([
    pool.query<{ size_bytes: string }>(
      'SELECT pg_database_size(current_database())::text AS size_bytes'
    ),
    pool.query<{ incidents: string; inspections: string; training: string; observations: string; users: string }>(`
      SELECT
        (SELECT COUNT(*) FROM public.incident)::text AS incidents,
        (SELECT COUNT(*) FROM public.inspection)::text AS inspections,
        (SELECT COUNT(*) FROM public.training)::text AS training,
        (SELECT COUNT(*) FROM public.observation)::text AS observations,
        (SELECT COUNT(*) FROM neon_auth."user")::text AS users
    `),
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
    recordCounts: {
      incidents: Number(countRows[0]?.incidents ?? 0),
      inspections: Number(countRows[0]?.inspections ?? 0),
      training: Number(countRows[0]?.training ?? 0),
      observations: Number(countRows[0]?.observations ?? 0),
      users: Number(countRows[0]?.users ?? 0),
    },
    checkedAt: new Date().toISOString(),
  }
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}
