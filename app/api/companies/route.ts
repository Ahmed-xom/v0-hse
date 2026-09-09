import { NextResponse } from 'next/server'
import { createCompany, listCompanies, updateCompany } from '@/app/actions/companies'

export async function GET(request: Request) {
  const actorEmail = request.headers.get('x-user-email') ?? undefined
  return NextResponse.json(await listCompanies(actorEmail), { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  try {
    const input = await request.json()
    const result = await createCompany({
      name: String(input.name ?? ''),
      code: input.code ? String(input.code) : undefined,
      actorEmail: request.headers.get('x-user-email') ?? undefined,
    })
    return NextResponse.json(result, { status: result.success ? 200 : 403 })
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid company request' }, { status: 400 })
  }
}

export async function PATCH(request: Request) {
  try {
    const input = await request.json()
    const result = await updateCompany({
      id: String(input.id ?? ''),
      name: String(input.name ?? ''),
      code: input.code ? String(input.code) : undefined,
      status: input.status ? String(input.status) : undefined,
      actorEmail: request.headers.get('x-user-email') ?? undefined,
    })
    return NextResponse.json(result, { status: result.success ? 200 : 403 })
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid company update' }, { status: 400 })
  }
}

