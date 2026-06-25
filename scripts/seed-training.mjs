import { createRequire } from 'module'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const require = createRequire(import.meta.url)
const { Pool } = require('pg')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const raw = readFileSync(path.join(__dirname, 'training-data.tsv'), 'utf8')

const MONTH_MAP = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 }

function parseDate(str) {
  if (!str) return null
  const parts = str.trim().split('-')
  if (parts.length !== 3) return null
  const day = parseInt(parts[0], 10)
  const mon = MONTH_MAP[parts[1]]
  let year = parseInt(parts[2], 10)
  if (year < 100) year += (year < 50 ? 2000 : 1900)
  if (isNaN(day) || mon === undefined || isNaN(year)) return null
  return new Date(year, mon, day).toISOString().split('T')[0]
}

function parseEmployee(cell) {
  const m = cell.match(/^(.+?)\s*\(([^)]+)\)\s*$/)
  if (m) return { name: m[1].trim(), code: m[2].trim() }
  return { name: cell.trim(), code: 'UNKNOWN' }
}

function normalizeStatus(s) {
  const v = (s || '').trim().toUpperCase()
  if (v === 'APPEAR') return 'Completed'
  if (v === 'IN PROGRESS') return 'In Progress'
  if (v === 'PENDING') return 'Pending'
  if (v === 'OVERDUE') return 'Overdue'
  return 'Completed'
}

function normalizeResult(r) {
  const v = (r || '').trim().toUpperCase()
  if (v === 'PASSED' || v === 'PASS') return 'PASSED'
  if (v === 'FAILED' || v === 'FAIL') return 'FAILED'
  if (v === 'INCOMPLETE') return 'Incomplete'
  if (v === 'EXEMPTED') return 'Exempted'
  return v || null
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  const lines = raw.split('\n').slice(1).filter(l => l.trim()) // skip header
  console.log(`[seed] Parsing ${lines.length} lines...`)

  const records = []
  for (const line of lines) {
    const cols = line.split('\t')
    if (cols.length < 3) continue
    const { name, code } = parseEmployee(cols[0])
    const courseName = cols[1]?.trim() || ''
    const status = normalizeStatus(cols[2])
    const result = normalizeResult(cols[3])
    const completedDate = parseDate(cols[4])
    if (!name || !courseName) continue
    records.push({ name, code, courseName, status, result, completedDate })
  }

  console.log(`[seed] Inserting ${records.length} records in batches...`)
  let inserted = 0
  let skipped = 0

  // Process in batches of 50 for speed
  const BATCH = 50
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH)
    await Promise.all(batch.map(async (rec) => {
      const id = `tr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const res = await pool.query(`
        INSERT INTO public.training (id, employee_name, employee_code, course_name, status, result, completed_date, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,now(),now())
        ON CONFLICT (employee_code, course_name) DO NOTHING
      `, [id, rec.name, rec.code, rec.courseName, rec.status, rec.result, rec.completedDate])
      if (res.rowCount > 0) inserted++
      else skipped++
    }))
    if ((i / BATCH) % 10 === 0) console.log(`  [seed] Progress: ${i}/${records.length}`)
  }

  await pool.end()
  console.log(`[seed] Done. Inserted: ${inserted}, Skipped (duplicates): ${skipped}`)
}

main().catch(err => { console.error('[seed] ERROR:', err.message); process.exit(1) })
