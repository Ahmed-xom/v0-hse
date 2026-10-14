import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthorizedCompanyIds } from '@/lib/company-access'

export async function GET(request: NextRequest) {
  try {
    const { userId, companyIds } = await getAuthorizedCompanyIds()
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const requestedCompany = request.nextUrl.searchParams.get('companyId')
    const companyId = requestedCompany && companyIds.includes(requestedCompany) ? requestedCompany : companyIds[0]
    if (!companyId) return NextResponse.json({ success: false, error: 'No authorized company' }, { status: 403 })
    const result = await db.execute(sql`SELECT id, company_id, employee_name, employee_code, course_name, status, result, completed_date, expiry_date, created_at, updated_at FROM public.training WHERE company_id = ${companyId} ORDER BY completed_date DESC NULLS LAST, employee_name ASC LIMIT 1000`)
    const records = ((result as { rows?: unknown[] }).rows || [])
    return NextResponse.json({ success: true, count: records.length, companyId, data: records })
  } catch (error) {
    console.error('[v0] Training API error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch training data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, companyIds } = await getAuthorizedCompanyIds()
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const { employeeName, employeeCode, courseName, status, result, completedDate, companyId: requestedCompany } = body
    const companyId = requestedCompany && companyIds.includes(requestedCompany) ? requestedCompany : companyIds[0]
    if (!companyId) return NextResponse.json({ success: false, error: 'No authorized company' }, { status: 403 })
    if (!employeeName || !courseName || !status || !result || !completedDate) return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    await db.execute(sql`INSERT INTO public.training (id, company_id, employee_name, employee_code, course_name, status, result, completed_date, created_at, updated_at) VALUES (gen_random_uuid()::text, ${companyId}, ${employeeName}, ${employeeCode || null}, ${courseName}, ${status}, ${result}, ${completedDate}::date, now(), now())`)
    return NextResponse.json({ success: true, message: 'Training record created', companyId })
  } catch (error) {
    console.error('[v0] Training POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create training record' }, { status: 500 })
  }
}
