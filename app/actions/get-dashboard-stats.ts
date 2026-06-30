'use server'

import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export interface DashboardStats {
  daysWithoutIncident: number
  daysWithoutIncidentChange: string
  inspectionCompliance: string
  inspectionComplianceChange: string
  trainingCompletion: string
  trainingCompletionChange: string
  nearMissesReported: number
  nearMissesChange: string
  incidentTrend: { month: string; incidents: number; nearMisses: number }[]
  incidentsByType: { name: string; value: number; color: string }[]
  incidentsBySeverity: { severity: string; count: number }[]
  summaryStats: {
    ltiCount: number
    medicalTreatments: number
    nearMissTotal: number
    observationsTotal: number
  }
}

const TYPE_COLORS: Record<string, string> = {
  'Lost Time Injury': 'var(--color-chart-4)',
  'Medical Treatment': 'var(--color-chart-2)',
  'First Aid': 'var(--color-chart-3)',
  'Near Miss': 'var(--color-chart-1)',
  'Property Damage': 'var(--color-chart-5)',
  'Environmental': '#8884d8',
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // --- Days Without Incident ---
    const lastIncResult = await db.execute(sql`
      SELECT MAX(date) as last_date FROM public.incident WHERE near_miss = false
    `)
    const lastIncDate = (lastIncResult as any).rows?.[0]?.last_date
    const daysWithoutIncident = lastIncDate
      ? Math.floor((Date.now() - new Date(lastIncDate).getTime()) / 86400000)
      : 0

    // Previous quarter comparison
    const prevQuarterResult = await db.execute(sql`
      SELECT MAX(date) as last_date FROM public.incident
      WHERE near_miss = false AND date < NOW() - INTERVAL '90 days'
    `)
    const prevDate = (prevQuarterResult as any).rows?.[0]?.last_date
    const prevDays = prevDate
      ? Math.floor((Date.now() - new Date(prevDate).getTime()) / 86400000) - 90
      : null
    const daysChange = prevDays && prevDays > 0
      ? `${daysWithoutIncident > prevDays ? '+' : ''}${Math.round(((daysWithoutIncident - prevDays) / prevDays) * 100)}%`
      : '—'

    // --- Inspection Compliance (last 30 days) ---
    const inspResult = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'Completed' OR status = 'completed') as done,
        COUNT(*) as total
      FROM public.inspection
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
    `)
    const inspRow = (inspResult as any).rows?.[0] ?? { done: 0, total: 0 }
    const inspTotal = Number(inspRow.total)
    const inspDone = Number(inspRow.done)
    const inspCompliance = inspTotal > 0 ? ((inspDone / inspTotal) * 100).toFixed(1) : '—'

    // Prior month compliance for change %
    const prevInspResult = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'Completed' OR status = 'completed') as done,
        COUNT(*) as total
      FROM public.inspection
      WHERE "createdAt" >= NOW() - INTERVAL '60 days' AND "createdAt" < NOW() - INTERVAL '30 days'
    `)
    const prevInspRow = (prevInspResult as any).rows?.[0] ?? { done: 0, total: 0 }
    const prevInspTotal = Number(prevInspRow.total)
    const prevInspDone = Number(prevInspRow.done)
    const prevInspPct = prevInspTotal > 0 ? (prevInspDone / prevInspTotal) * 100 : null
    const currInspPct = inspTotal > 0 ? (inspDone / inspTotal) * 100 : null
    const inspChange = prevInspPct && currInspPct
      ? `${currInspPct >= prevInspPct ? '+' : ''}${(currInspPct - prevInspPct).toFixed(1)}%`
      : '—'

    // --- Training Completion ---
    const trResult = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'Completed') as done,
        COUNT(*) as total
      FROM public.training
    `)
    const trRow = (trResult as any).rows?.[0] ?? { done: 0, total: 0 }
    const trTotal = Number(trRow.total)
    const trDone = Number(trRow.done)
    const trPct = trTotal > 0 ? ((trDone / trTotal) * 100).toFixed(0) : '0'

    // Prior quarter training
    const prevTrResult = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'Completed') as done,
        COUNT(*) as total
      FROM public.training
      WHERE created_at >= NOW() - INTERVAL '6 months' AND created_at < NOW() - INTERVAL '3 months'
    `)
    const prevTrRow = (prevTrResult as any).rows?.[0] ?? { done: 0, total: 0 }
    const prevTrTotal = Number(prevTrRow.total)
    const prevTrDone = Number(prevTrRow.done)
    const prevTrPct = prevTrTotal > 0 ? (prevTrDone / prevTrTotal) * 100 : null
    const currTrPct = trTotal > 0 ? (trDone / trTotal) * 100 : null
    const trChange = prevTrPct && currTrPct
      ? `${currTrPct >= prevTrPct ? '+' : ''}${(currTrPct - prevTrPct).toFixed(1)}%`
      : '—'

    // --- Near Misses (observations + incidents) ---
    const nmResult = await db.execute(sql`
      SELECT COUNT(*) as cnt FROM public.incident WHERE near_miss = true
    `)
    const nmObs = await db.execute(sql`
      SELECT COUNT(*) as cnt FROM public.observation WHERE "nearMiss" = true
    `)
    const nearMissTotal =
      Number((nmResult as any).rows?.[0]?.cnt ?? 0) +
      Number((nmObs as any).rows?.[0]?.cnt ?? 0)

    const prevNmResult = await db.execute(sql`
      SELECT COUNT(*) as cnt FROM public.incident
      WHERE near_miss = true AND date >= NOW() - INTERVAL '60 days' AND date < NOW() - INTERVAL '30 days'
    `)
    const prevNm = Number((prevNmResult as any).rows?.[0]?.cnt ?? 0)
    const nmChange = prevNm > 0
      ? `${nearMissTotal >= prevNm ? '+' : ''}${Math.round(((nearMissTotal - prevNm) / prevNm) * 100)}%`
      : '—'

    // --- Incident Trend (last 12 months, combine incident + observation) ---
    const trendResult = await db.execute(sql`
      SELECT
        to_char(date, 'Mon') as month,
        EXTRACT(MONTH FROM date)::int as m,
        EXTRACT(YEAR FROM date)::int as y,
        COUNT(*) FILTER (WHERE near_miss = false) as incidents,
        COUNT(*) FILTER (WHERE near_miss = true) as near_misses
      FROM public.incident
      WHERE date >= NOW() - INTERVAL '12 months'
      GROUP BY month, m, y
      ORDER BY y, m
    `)
    const obsTrendResult = await db.execute(sql`
      SELECT
        to_char(date, 'Mon') as month,
        EXTRACT(MONTH FROM date)::int as m,
        EXTRACT(YEAR FROM date)::int as y,
        COUNT(*) FILTER (WHERE "nearMiss" = false) as incidents,
        COUNT(*) FILTER (WHERE "nearMiss" = true) as near_misses
      FROM public.observation
      WHERE date >= NOW() - INTERVAL '12 months'
      GROUP BY month, m, y
      ORDER BY y, m
    `)

    // Merge incident + observation monthly
    const trendMap = new Map<string, { month: string; incidents: number; nearMisses: number }>()
    for (const row of [...((trendResult as any).rows ?? []), ...((obsTrendResult as any).rows ?? [])]) {
      const key = `${row.y}-${String(row.m).padStart(2, '0')}`
      const existing = trendMap.get(key) ?? { month: row.month, incidents: 0, nearMisses: 0 }
      existing.incidents += Number(row.incidents)
      existing.nearMisses += Number(row.near_misses)
      trendMap.set(key, existing)
    }
    const incidentTrend = Array.from(trendMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v)

    // --- Incidents by Type ---
    const byTypeResult = await db.execute(sql`
      SELECT incident_type as name, COUNT(*) as value
      FROM public.incident
      GROUP BY incident_type
      ORDER BY value DESC
    `)
    const incidentsByType = ((byTypeResult as any).rows ?? []).map((r: any) => ({
      name: r.name ?? 'Unknown',
      value: Number(r.value),
      color: TYPE_COLORS[r.name] ?? 'var(--color-chart-1)',
    }))

    // Fallback: use observation categories if no incident types
    if (incidentsByType.length === 0) {
      const obsByCat = await db.execute(sql`
        SELECT COALESCE(category, 'Uncategorized') as name, COUNT(*) as value
        FROM public.observation
        GROUP BY category ORDER BY value DESC
      `)
      incidentsByType.push(...((obsByCat as any).rows ?? []).map((r: any) => ({
        name: r.name,
        value: Number(r.value),
        color: TYPE_COLORS[r.name] ?? 'var(--color-chart-1)',
      })))
    }

    // --- Incidents by Severity ---
    const bySevResult = await db.execute(sql`
      SELECT COALESCE(severity, 'Unknown') as severity, COUNT(*) as count
      FROM public.incident
      GROUP BY severity ORDER BY count DESC
    `)
    const incidentsBySeverity = ((bySevResult as any).rows ?? []).map((r: any) => ({
      severity: r.severity,
      count: Number(r.count),
    }))

    // --- Summary Stats ---
    const ltiResult = await db.execute(sql`SELECT COUNT(*) as cnt FROM public.incident WHERE incident_type ILIKE '%lost time%' OR severity ILIKE '%serious%'`)
    const medResult = await db.execute(sql`SELECT COUNT(*) as cnt FROM public.incident WHERE incident_type ILIKE '%medical%'`)
    const obsTotal = await db.execute(sql`SELECT COUNT(*) as cnt FROM public.observation`)

    return {
      daysWithoutIncident,
      daysWithoutIncidentChange: daysChange,
      inspectionCompliance: inspTotal > 0 ? `${inspCompliance}%` : '—',
      inspectionComplianceChange: inspChange,
      trainingCompletion: `${trPct}%`,
      trainingCompletionChange: trChange,
      nearMissesReported: nearMissTotal,
      nearMissesChange: nmChange,
      incidentTrend,
      incidentsByType,
      incidentsBySeverity,
      summaryStats: {
        ltiCount: Number((ltiResult as any).rows?.[0]?.cnt ?? 0),
        medicalTreatments: Number((medResult as any).rows?.[0]?.cnt ?? 0),
        nearMissTotal,
        observationsTotal: Number((obsTotal as any).rows?.[0]?.cnt ?? 0),
      },
    }
  } catch (err) {
    console.error('[getDashboardStats]', err)
    // Return zeros on error — UI shows real shape
    return {
      daysWithoutIncident: 0,
      daysWithoutIncidentChange: '—',
      inspectionCompliance: '—',
      inspectionComplianceChange: '—',
      trainingCompletion: '—',
      trainingCompletionChange: '—',
      nearMissesReported: 0,
      nearMissesChange: '—',
      incidentTrend: [],
      incidentsByType: [],
      incidentsBySeverity: [],
      summaryStats: { ltiCount: 0, medicalTreatments: 0, nearMissTotal: 0, observationsTotal: 0 },
    }
  }
}
