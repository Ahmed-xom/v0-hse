'use server'

import { pool } from '@/lib/db'

export type ReportType = 'observations' | 'inspections' | 'training' | 'incidents'
export type DateRange = '7d' | '30d' | '90d' | '1y' | 'all'

export interface ReportSummary {
  observations: {
    total: number
    open: number
    closed: number
    high: number
    medium: number
    low: number
    thisMonth: number
    lastMonth: number
  }
  training: {
    total: number
    passed: number
    failed: number
    appeared: number
  }
  employees: {
    total: number
    active: number
  }
  passwordResets: {
    total: number
  }
}

export interface ObservationReportRow {
  id: string
  description: string
  severity: string
  location: string
  status: string
  createdAt: string
  businessUnit: string
}

export interface TrainingReportRow {
  id: string
  employeeName: string
  employeeCode: string | null
  courseName: string
  status: string
  result: string
  completedDate: string
}

export interface JourneyReportRow {
  id: string
  userName: string
  userEmail: string
  origin: string
  destination: string
  purpose: string
  vehicleType: string
  vehiclePlate: string | null
  departureDate: string
  departureTime: string
  estimatedReturn: string | null
  passengers: number
  status: string
  notes: string | null
  createdAt: string
}

function getDateFilter(range: DateRange): string {
  if (range === 'all') return ''
  const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[range]
  return `AND "createdAt" >= NOW() - INTERVAL '${days} days'`
}

export async function getReportSummary(): Promise<{ success: boolean; data?: ReportSummary; error?: string }> {
  try {
    const [obsResult, trainingResult, employeeResult, resetResult] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'Open')::int AS open,
          COUNT(*) FILTER (WHERE status = 'Closed')::int AS closed,
          COUNT(*) FILTER (WHERE severity = 'High')::int AS high,
          COUNT(*) FILTER (WHERE severity = 'Medium')::int AS medium,
          COUNT(*) FILTER (WHERE severity = 'Low')::int AS low,
          COUNT(*) FILTER (WHERE DATE_TRUNC('month', "createdAt") = DATE_TRUNC('month', NOW()))::int AS this_month,
          COUNT(*) FILTER (WHERE DATE_TRUNC('month', "createdAt") = DATE_TRUNC('month', NOW() - INTERVAL '1 month'))::int AS last_month
        FROM public.observation
      `),
      pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE upper(result) = 'PASSED')::int AS passed,
          COUNT(*) FILTER (WHERE upper(result) = 'FAILED')::int AS failed,
          COUNT(*) FILTER (WHERE upper(status) = 'APPEAR')::int AS appeared
        FROM public.training
      `),
      pool.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'Active')::int AS active FROM public.employee`),
      pool.query(`SELECT COUNT(*)::int AS total FROM public.password_reset`),
    ])

    return {
      success: true,
      data: {
        observations: {
          total: obsResult.rows[0].total,
          open: obsResult.rows[0].open,
          closed: obsResult.rows[0].closed,
          high: obsResult.rows[0].high,
          medium: obsResult.rows[0].medium,
          low: obsResult.rows[0].low,
          thisMonth: obsResult.rows[0].this_month,
          lastMonth: obsResult.rows[0].last_month,
        },
        training: {
          total: trainingResult.rows[0].total,
          passed: trainingResult.rows[0].passed,
          failed: trainingResult.rows[0].failed,
          appeared: trainingResult.rows[0].appeared,
        },
        employees: {
          total: employeeResult.rows[0].total,
          active: employeeResult.rows[0].active,
        },
        passwordResets: {
          total: resetResult.rows[0].total,
        },
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getObservationsReport(
  range: DateRange = 'all',
  severity?: string,
  status?: string,
): Promise<{ success: boolean; data?: ObservationReportRow[]; error?: string }> {
  try {
    let where = 'WHERE 1=1'
    const params: any[] = []
    let idx = 1

    if (range !== 'all') {
      const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[range]
      where += ` AND o."createdAt" >= NOW() - INTERVAL '${days} days'`
    }
    if (severity && severity !== 'all') {
      where += ` AND o.severity = $${idx++}`
      params.push(severity)
    }
    if (status && status !== 'all') {
      where += ` AND o.status = $${idx++}`
      params.push(status)
    }

    const result = await pool.query(
      `SELECT
        o.id,
        COALESCE(o.description, 'N/A') AS description,
        COALESCE(o.severity, 'Unknown') AS severity,
        COALESCE(o.location, 'N/A') AS location,
        COALESCE(o.status, 'Open') AS status,
        o."createdAt",
        COALESCE(o."businessUnitId", 'N/A') AS "businessUnit"
      FROM public.observation o
      ${where}
      ORDER BY o."createdAt" DESC`,
      params,
    )

    return {
      success: true,
      data: result.rows.map((r) => ({
        id: r.id,
        description: r.description,
        severity: r.severity,
        location: r.location,
        status: r.status,
        createdAt: r.createdAt,
        businessUnit: r.businessUnit,
      })),
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getJourneysReport(
  range: DateRange = 'all',
  status?: string,
  purpose?: string,
): Promise<{ success: boolean; data?: JourneyReportRow[]; error?: string }> {
  try {
    let where = 'WHERE 1=1'
    const params: any[] = []
    let idx = 1

    if (range !== 'all') {
      const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[range]
      where += ` AND created_at >= NOW() - INTERVAL '${days} days'`
    }
    if (status && status !== 'all') {
      where += ` AND status = $${idx++}`
      params.push(status)
    }
    if (purpose && purpose !== 'all') {
      where += ` AND purpose = $${idx++}`
      params.push(purpose)
    }

    const res = await pool.query(
      `SELECT id, user_name, user_email, origin, destination, purpose,
              vehicle_type, vehicle_plate, departure_date, departure_time,
              estimated_return, passengers, status, notes, created_at
       FROM public.journey
       ${where}
       ORDER BY created_at DESC`,
      params,
    )

    return {
      success: true,
      data: res.rows.map((r) => ({
        id: r.id,
        userName: r.user_name,
        userEmail: r.user_email,
        origin: r.origin,
        destination: r.destination,
        purpose: r.purpose,
        vehicleType: r.vehicle_type,
        vehiclePlate: r.vehicle_plate,
        departureDate: r.departure_date,
        departureTime: r.departure_time,
        estimatedReturn: r.estimated_return,
        passengers: r.passengers,
        status: r.status,
        notes: r.notes,
        createdAt: r.created_at,
      })),
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getTrainingReport(
  range: DateRange = 'all',
  result?: string,
): Promise<{ success: boolean; data?: TrainingReportRow[]; error?: string }> {
  try {
    let where = 'WHERE 1=1'
    const params: any[] = []
    let idx = 1

    if (range !== 'all') {
      const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[range]
      where += ` AND completed_date >= NOW() - INTERVAL '${days} days'`
    }
    if (result && result !== 'all') {
      where += ` AND upper(result) = $${idx++}`
      params.push(result.toUpperCase())
    }

    const res = await pool.query(
      `SELECT id, employee_name, employee_code, course_name, status, result, completed_date
       FROM public.training
       ${where}
       ORDER BY completed_date DESC`,
      params,
    )

    return {
      success: true,
      data: res.rows.map((r) => ({
        id: r.id,
        employeeName: r.employee_name,
        employeeCode: r.employee_code,
        courseName: r.course_name,
        status: r.status,
        result: r.result,
        completedDate: r.completed_date,
      })),
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
