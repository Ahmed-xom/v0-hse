'use server'

import { Pool } from 'pg'
import { revalidatePath } from 'next/cache'
import { sendEmail } from '@/lib/send-email'
import { trainingExpiryHtml } from '@/lib/send-email'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// ── Supervisor assignment CRUD ───────────────────────────────────────────────

export async function getAllSupervisorAssignments(): Promise<{
  success: boolean
  data: { id: string; userEmail: string; userName: string; supervisorEmail: string; supervisorName: string }[]
}> {
  try {
    const r = await pool.query(
      `SELECT id, user_email, user_name, supervisor_email, supervisor_name FROM public.supervisor_assignment ORDER BY user_name`
    )
    return {
      success: true,
      data: r.rows.map(row => ({
        id: row.id,
        userEmail: row.user_email,
        userName: row.user_name ?? row.user_email,
        supervisorEmail: row.supervisor_email,
        supervisorName: row.supervisor_name ?? row.supervisor_email,
      })),
    }
  } catch (e: any) {
    console.error('[v0] getAllSupervisorAssignments error:', e.message)
    return { success: false, data: [] }
  }
}

export async function setSupervisorForUser(input: {
  userEmail: string
  userName: string
  supervisorEmail: string
  supervisorName: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { userEmail, userName, supervisorEmail, supervisorName } = input
    await pool.query(
      `INSERT INTO public.supervisor_assignment (user_email, user_name, supervisor_email, supervisor_name, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_email, supervisor_email)
       DO UPDATE SET supervisor_name = $4, user_name = $2, updated_at = NOW()`,
      [userEmail.toLowerCase(), userName, supervisorEmail.toLowerCase(), supervisorName]
    )
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    console.error('[v0] setSupervisorForUser error:', e.message)
    return { success: false, error: e.message }
  }
}

export async function removeSupervisorAssignment(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await pool.query(`DELETE FROM public.supervisor_assignment WHERE id = $1`, [id])
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    console.error('[v0] removeSupervisorAssignment error:', e.message)
    return { success: false, error: e.message }
  }
}

// ── Training expiry email sending ────────────────────────────────────────────

/**
 * Send training expiry emails to supervisors.
 * alertType = '3month': training expiring within 60–90 days
 * alertType = '1month': training expiring within 0–30 days
 * Skips records already emailed for the same alert type (idempotent).
 */
export async function sendTrainingExpiryEmails(alertType: '3month' | '1month'): Promise<{
  success: boolean
  emailsSent: number
  recordsFound: number
  error?: string
}> {
  try {
    const today = new Date()

    // Calculate date window
    let fromDays: number, toDays: number, alertLabel: string
    if (alertType === '3month') {
      fromDays = 60
      toDays = 90
      alertLabel = '3-Month Training Expiry Warning'
    } else {
      fromDays = 0
      toDays = 30
      alertLabel = '1-Month Training Expiry Warning'
    }

    const fromDate = new Date(today); fromDate.setDate(today.getDate() + fromDays)
    const toDate   = new Date(today); toDate.setDate(today.getDate() + toDays)

    const fromStr = fromDate.toISOString().split('T')[0]
    const toStr   = toDate.toISOString().split('T')[0]

    // Fetch training records expiring in the window
    const trainingRows = await pool.query(
      `SELECT id, employee_name, employee_code, course_name, status, expiry_date, completed_date
       FROM public.training
       WHERE expiry_date >= $1 AND expiry_date <= $2`,
      [fromStr, toStr]
    )

    if (trainingRows.rows.length === 0) {
      return { success: true, emailsSent: 0, recordsFound: 0 }
    }

    // Group training records by employee_code / employee_name to find supervisors
    const employeeNames: string[] = [...new Set(trainingRows.rows.map((r: any) => r.employee_name as string))]

    // Fetch supervisor assignments for these employees
    const assignments = await pool.query(
      `SELECT sa.user_email, sa.user_name, sa.supervisor_email, sa.supervisor_name
       FROM public.supervisor_assignment sa
       WHERE lower(sa.user_name) = ANY($1::text[])
          OR lower(sa.user_email) = ANY($1::text[])`,
      [employeeNames.map(n => n.toLowerCase())]
    )

    // Also include admin-role employees as fallback recipients
    const adminRows = await pool.query(
      `SELECT name, email FROM public.employee
       WHERE hse_role IN ('HSE', 'HSE ADMIN', 'ADMIN SYSTEM', 'MASTER USER', 'MANAGEMENT', 'SITE MANAGER')
         AND status = 'Active' AND email IS NOT NULL AND email <> ''`
    )

    // Build a map: supervisorEmail -> { supervisorName, records[] }
    const supervisorMap = new Map<string, { supervisorName: string; records: typeof trainingRows.rows }>()

    // Add assigned supervisors
    for (const asgn of assignments.rows) {
      const supEmail = (asgn.supervisor_email as string).toLowerCase()
      const empName  = (asgn.user_name as string).toLowerCase()
      const relevantRecords = trainingRows.rows.filter(
        (r: any) => r.employee_name.toLowerCase() === empName
      )
      if (relevantRecords.length === 0) continue
      if (!supervisorMap.has(supEmail)) {
        supervisorMap.set(supEmail, { supervisorName: asgn.supervisor_name, records: [] })
      }
      supervisorMap.get(supEmail)!.records.push(...relevantRecords)
    }

    // Add admins who get ALL records
    for (const admin of adminRows.rows) {
      const adminEmail = (admin.email as string).toLowerCase()
      if (!supervisorMap.has(adminEmail)) {
        supervisorMap.set(adminEmail, { supervisorName: admin.name, records: [] })
      }
      supervisorMap.get(adminEmail)!.records.push(...trainingRows.rows)
    }

    const generatedAt = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Muscat' })
    let emailsSent = 0

    for (const [supervisorEmail, { supervisorName, records }] of supervisorMap.entries()) {
      if (records.length === 0) continue

      // De-duplicate records
      const uniqueRecords = Array.from(new Map(records.map(r => [r.id, r])).values())

      // Filter out already-sent records for this supervisor+alertType
      const alreadySentResult = await pool.query(
        `SELECT training_id FROM public.training_expiry_email_log
         WHERE supervisor_email = $1 AND alert_type = $2 AND training_id = ANY($3::text[])`,
        [supervisorEmail, alertType, uniqueRecords.map(r => r.id)]
      )
      const alreadySentIds = new Set(alreadySentResult.rows.map(r => r.training_id))
      const newRecords = uniqueRecords.filter(r => !alreadySentIds.has(r.id))
      if (newRecords.length === 0) continue

      const html = trainingExpiryHtml({
        supervisorName,
        alertType,
        records: newRecords.map(r => ({
          employeeName:  r.employee_name,
          employeeCode:  r.employee_code ?? '',
          courseName:    r.course_name,
          status:        r.status,
          completedDate: r.completed_date ? new Date(r.completed_date).toLocaleDateString('en-GB') : undefined,
          expiryDate:    r.expiry_date    ? new Date(r.expiry_date).toLocaleDateString('en-GB')    : undefined,
          daysUntilExpiry: r.expiry_date
            ? Math.ceil((new Date(r.expiry_date).getTime() - today.getTime()) / 86400000)
            : null,
        })),
        generatedAt,
      })

      const result = await sendEmail({
        to: supervisorEmail,
        subject: `HSE Training Alert — ${alertLabel} (${newRecords.length} record${newRecords.length > 1 ? 's' : ''})`,
        html,
      })

      if (result.sent) {
        emailsSent++
        // Log to prevent duplicate sends
        for (const rec of newRecords) {
          await pool.query(
            `INSERT INTO public.training_expiry_email_log (training_id, supervisor_email, alert_type)
             VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
            [rec.id, supervisorEmail, alertType]
          )
        }
      } else {
        console.error('[v0] Failed to send to', supervisorEmail, result.error)
      }
    }

    return { success: true, emailsSent, recordsFound: trainingRows.rows.length }
  } catch (e: any) {
    console.error('[v0] sendTrainingExpiryEmails error:', e.message)
    return { success: false, emailsSent: 0, recordsFound: 0, error: e.message }
  }
}

// Get all employees for the assignment picker
export async function getEmployeesForAssignment(): Promise<{
  id: string; name: string; email: string; designation: string; businessUnit: string
}[]> {
  try {
    const r = await pool.query(
      `SELECT id, name, email, designation, business_unit
       FROM public.employee WHERE status = 'Active' ORDER BY name`
    )
    return r.rows.map(row => ({
      id: row.id,
      name: row.name ?? '',
      email: row.email ?? '',
      designation: row.designation ?? '',
      businessUnit: row.business_unit ?? '',
    }))
  } catch (e: any) {
    console.error('[v0] getEmployeesForAssignment error:', e.message)
    return []
  }
}
