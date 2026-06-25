import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import crypto from 'crypto'

// Training record from CSV
interface TrainingRecord {
  employeeName: string
  courseName: string
  status: string
  result: string
  completedDate: string
}

// Sample data from the CSV (first few rows for testing)
const trainingData: TrainingRecord[] = [
  {
    employeeName: 'Abdullah Said Salim Al Hinai (L-FWM-0050)',
    courseName: '(OPAL HSEI) - HSE Induction',
    status: 'APPEAR',
    result: 'PASSED',
    completedDate: '17-Nov-1994',
  },
  {
    employeeName: 'Gibi John (E-FWM-0104)',
    courseName: '(OPAL HSEI) - HSE Induction',
    status: 'APPEAR',
    result: 'PASSED',
    completedDate: '12-Mar-1997',
  },
  {
    employeeName: 'Fouad Ibrahim (E-SHE-0001)',
    courseName: '(OPAL HSEI) - HSE Induction',
    status: 'APPEAR',
    result: 'PASSED',
    completedDate: '09-Jan-2003',
  },
  {
    employeeName: 'Hashil Humaid Mohammed Amri (L-FWM-0067)',
    courseName: '(OPAL GR) - Defensive Driving Graded Road',
    status: 'APPEAR',
    result: 'PASSED',
    completedDate: '15-Feb-2003',
  },
]

function parseDate(dateStr: string): Date {
  const months: { [key: string]: number } = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11,
  }
  
  const parts = dateStr.split('-')
  const day = parseInt(parts[0])
  const month = months[parts[1]]
  const year = parseInt(parts[2])
  
  return new Date(year, month, day)
}

async function createTrainingTable() {
  try {
    console.log('[v0] Creating training table if it does not exist...')
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "public"."training" (
        "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "employee_name" text NOT NULL,
        "employee_id" text,
        "course_name" text NOT NULL,
        "status" text NOT NULL,
        "result" text NOT NULL,
        "completed_date" timestamp with time zone NOT NULL,
        "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    console.log('[v0] Training table created successfully')
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('[v0] Training table already exists')
    } else {
      throw error
    }
  }
}

async function importTrainingData() {
  try {
    console.log('[v0] Starting training data import...')
    
    // First create the table
    await createTrainingTable()
    
    // Extract employee ID from name (format: "Name (ID)")
    const extractEmployeeId = (name: string): string | null => {
      const match = name.match(/\(([^)]+)\)$/)
      return match ? match[1] : null
    }
    
    // Import each training record
    let successCount = 0
    let errorCount = 0
    
    for (const record of trainingData) {
      try {
        const employeeId = extractEmployeeId(record.employeeName)
        const completedDate = parseDate(record.completedDate)
        
        await db.execute(sql`
          INSERT INTO "public"."training" 
          ("id", "employee_name", "employee_id", "course_name", "status", "result", "completed_date")
          VALUES (
            ${crypto.randomUUID()},
            ${record.employeeName},
            ${employeeId},
            ${record.courseName},
            ${record.status},
            ${record.result},
            ${completedDate.toISOString()}
          )
        `)
        
        successCount++
        console.log(`[v0] Imported: ${record.employeeName} - ${record.courseName}`)
      } catch (error: any) {
        errorCount++
        console.error(`[v0] Error importing ${record.employeeName}:`, error.message)
      }
    }
    
    console.log(`[v0] Import complete. Success: ${successCount}, Errors: ${errorCount}`)
  } catch (error) {
    console.error('[v0] Fatal error during import:', error)
    throw error
  }
}

// Run the import
importTrainingData()
  .then(() => {
    console.log('[v0] Training data import completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('[v0] Training data import failed:', error)
    process.exit(1)
  })
