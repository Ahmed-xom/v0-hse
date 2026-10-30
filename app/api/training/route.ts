import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const result = await db.execute(sql`
      SELECT 
        id,
        employee_name,
        employee_code,
        course_name,
        status,
        result,
        completed_date,
        created_at,
        updated_at
      FROM "public"."training"
      ORDER BY completed_date DESC, employee_name ASC
      LIMIT 1000
    `)

    const records = ((result as any).rows || []) as Array<{
      id: string
      employee_name: string
      employee_code: string | null
      course_name: string
      status: string
      result: string
      completed_date: string
      created_at: string
      updated_at: string
    }>

    return NextResponse.json({
      success: true,
      count: records.length,
      data: records,
    })
  } catch (error) {
    console.error('[v0] Training API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch training data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeName, employeeCode, courseName, status, result, completedDate } = body

    // Validate required fields
    if (!employeeName || !courseName || !status || !result || !completedDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await db.execute(sql`
      INSERT INTO "public"."training"
      (id, employee_name, employee_code, course_name, status, result, completed_date)
      VALUES (
        gen_random_uuid()::text,
        ${employeeName},
        ${employeeCode || null},
        ${courseName},
        ${status},
        ${result},
        ${completedDate}::date
      )
    `)

    return NextResponse.json({
      success: true,
      message: 'Training record created',
    })
  } catch (error) {
    console.error('[v0] Training POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create training record' },
      { status: 500 }
    )
  }
}
