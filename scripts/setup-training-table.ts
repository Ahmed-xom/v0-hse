import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import crypto from 'crypto'

// Training data extracted from the CSV export
const trainingRecords = [
  { employee: 'Abdullah Said Salim Al Hinai (L-FWM-0050)', course: '(OPAL HSEI) - HSE Induction', status: 'APPEAR', result: 'PASSED', date: '1994-11-17' },
  { employee: 'Gibi John (E-FWM-0104)', course: '(OPAL HSEI) - HSE Induction', status: 'APPEAR', result: 'PASSED', date: '1997-03-12' },
  { employee: 'Fouad Ibrahim (E-SHE-0001)', course: '(OPAL HSEI) - HSE Induction', status: 'APPEAR', result: 'PASSED', date: '2003-01-09' },
  { employee: 'Hashil Humaid Mohammed Amri (L-FWM-0067)', course: '(OPAL GR) - Defensive Driving Graded Road', status: 'APPEAR', result: 'PASSED', date: '2003-02-15' },
  { employee: 'Bati Al yaqoubi (L-HIRC-0001)', course: '(Pressure Level 1) - Pressure Level 1 (Legacy)', status: 'APPEAR', result: 'PASSED', date: '2003-04-13' },
  { employee: 'Sultan Hamed Sultan Al Duree (L-FWM-0090)', course: '(OPAL HSEI) - HSE Induction', status: 'APPEAR', result: 'PASSED', date: '2003-07-17' },
  { employee: 'Zahran Al Aufi (L-SHE-0001)', course: '(OPAL HSEI) - HSE Induction', status: 'APPEAR', result: 'PASSED', date: '2003-09-03' },
  { employee: 'Mohamed Salim Al Sulaimani (L-HIR-0019)', course: '(OPAL HSEI) - HSE Induction', status: 'APPEAR', result: 'PASSED', date: '2003-10-20' },
  { employee: 'Gibi John (E-FWM-0104)', course: '(OPAL GR) - Defensive Driving Graded Road', status: 'APPEAR', result: 'PASSED', date: '2004-04-22' },
  { employee: 'Ali Mohamed Murad Al Bulushi (L-FWM-0058)', course: '(OPAL GR) - Defensive Driving Graded Road', status: 'APPEAR', result: 'PASSED', date: '2004-04-26' },
  { employee: 'Bati Al yaqoubi (L-HIRC-0001)', course: '(Explosives Level 1) - Explosives Level 1', status: 'APPEAR', result: 'PASSED', date: '2004-08-13' },
  { employee: 'Bati Al yaqoubi (L-HIRC-0001)', course: '(RA LV-1) - Radiation level 1', status: 'APPEAR', result: 'PASSED', date: '2004-08-15' },
]

async function setupTrainingTable() {
  try {
    console.log('[v0] Creating training table...')
    
    // Create table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "public"."training" (
        "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "employee_name" text NOT NULL,
        "employee_code" text,
        "course_name" text NOT NULL,
        "status" text NOT NULL,
        "result" text NOT NULL,
        "completed_date" date NOT NULL,
        "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('[v0] Table created successfully')
    
    // Extract employee code (e.g., "L-FWM-0050" from "Abdullah Said Salim Al Hinai (L-FWM-0050)")
    const extractCode = (name: string): string | null => {
      const match = name.match(/\(([A-Z]-[A-Z]{3}-\d+)\)/)
      return match ? match[1] : null
    }
    
    // Insert records
    console.log(`[v0] Inserting ${trainingRecords.length} training records...`)
    
    for (const record of trainingRecords) {
      const code = extractCode(record.employee)
      
      await db.execute(sql`
        INSERT INTO "public"."training" 
        ("id", "employee_name", "employee_code", "course_name", "status", "result", "completed_date")
        VALUES (
          ${crypto.randomUUID()},
          ${record.employee},
          ${code},
          ${record.course},
          ${record.status},
          ${record.result},
          ${record.date}::date
        )
      `)
    }
    
    console.log('[v0] All training records inserted successfully')
    
    // Verify insert
    const result = await db.execute(sql`
      SELECT COUNT(*) as count FROM "public"."training"
    `)
    
    const count = (result as any).rows?.[0]?.count || 0
    console.log(`[v0] Total training records in database: ${count}`)
    
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('[v0] Table already exists, skipping creation')
      
      // Still insert if records don't exist
      const result = await db.execute(sql`
        SELECT COUNT(*) as count FROM "public"."training"
      `)
      const count = (result as any).rows?.[0]?.count || 0
      
      if (count === 0) {
        console.log('[v0] Inserting training records into existing table...')
        
        const extractCode = (name: string): string | null => {
          const match = name.match(/\(([A-Z]-[A-Z]{3}-\d+)\)/)
          return match ? match[1] : null
        }
        
        for (const record of trainingRecords) {
          const code = extractCode(record.employee)
          
          await db.execute(sql`
            INSERT INTO "public"."training" 
            ("id", "employee_name", "employee_code", "course_name", "status", "result", "completed_date")
            VALUES (
              ${crypto.randomUUID()},
              ${record.employee},
              ${code},
              ${record.course},
              ${record.status},
              ${record.result},
              ${record.date}::date
            )
          `)
        }
        console.log('[v0] Records inserted successfully')
      } else {
        console.log(`[v0] Database already has ${count} training records`)
      }
    } else {
      console.error('[v0] Error:', error.message)
      throw error
    }
  }
}

setupTrainingTable()
  .then(() => {
    console.log('[v0] Setup completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('[v0] Setup failed:', error)
    process.exit(1)
  })
