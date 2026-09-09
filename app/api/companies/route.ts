import { NextResponse } from 'next/server'
import { createCompany, listCompanies } from '@/app/actions/companies'

export async function GET() {
  return NextResponse.json(await listCompanies())
}

export async function POST(request: Request) {
  try {
    const input = await request.json()
    const result = await createCompany({
      name: String(input.name ?? ''),
      code: input.code ? String(input.code) : undefined,
    })
    return NextResponse.json(result, { status: result.success ? 200 : 403 })
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid company request' }, { status: 400 })
  }
}
