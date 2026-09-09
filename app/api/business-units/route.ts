import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

const ADMIN_ROLES = ["MASTER USER", "ADMIN SYSTEM", "ADMIN", "HSE ADMIN"]

async function getActor(request: Request) {
  const email = request.headers.get("x-user-email")
  if (!email) return null
  const result = await pool.query('SELECT id, role FROM neon_auth."user" WHERE lower(email) = lower($1) LIMIT 1', [email])
  return result.rows[0] ?? null
}

async function requireAdmin(actor: { role?: string }) {
  return ADMIN_ROLES.includes(String(actor.role ?? "").trim().toUpperCase())
}

async function getCompanyId(request: Request, actorId: string) {
  const requested = request.headers.get("x-company-id")
  const actor = await pool.query('SELECT role FROM neon_auth."user" WHERE id = $1 LIMIT 1', [actorId])
  const role = String(actor.rows[0]?.role ?? "").trim().toUpperCase()
  if (ADMIN_ROLES.includes(role) && requested) return requested
  const result = await pool.query("SELECT company_id FROM public.company_membership WHERE user_id = $1 AND status = 'Active' ORDER BY company_id LIMIT 1", [actorId])
  return result.rows[0]?.company_id ?? null
}

export async function GET(request: Request) {
  const actor = await getActor(request)
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const companyId = await getCompanyId(request, actor.id)
  if (!companyId) return NextResponse.json([])
  let result = await pool.query("SELECT id, name, code, description, manager, email, type, status, created_at AS \"createdAt\", updated_at AS \"updatedAt\" FROM public.business_unit WHERE company_id = $1 ORDER BY name", [companyId])
  if (result.rows.length === 0) {
    await pool.query(
      "INSERT INTO public.business_unit (id, company_id, name, code, description, type, status) VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6) ON CONFLICT (company_id, name) DO NOTHING",
      [companyId, "Default Business Unit", "DEFAULT", "Default business unit", "Business Unit", "Active"]
    )
    result = await pool.query("SELECT id, name, code, description, manager, email, type, status, created_at AS \"createdAt\", updated_at AS \"updatedAt\" FROM public.business_unit WHERE company_id = $1 ORDER BY name", [companyId])
  }
  return NextResponse.json(result.rows, { headers: { "Cache-Control": "no-store" } })
}

export async function POST(request: Request) {
  const actor = await getActor(request)
  if (!actor) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  if (!(await requireAdmin(actor))) return NextResponse.json({ success: false, error: "Only company admins can create business units" }, { status: 403 })
  const companyId = await getCompanyId(request, actor.id)
  if (!companyId) return NextResponse.json({ success: false, error: "No company assigned" }, { status: 400 })
  const body = await request.json()
  if (!body.name || !body.email) return NextResponse.json({ success: false, error: "Name and email are required" }, { status: 400 })
  const result = await pool.query("INSERT INTO public.business_unit (id, company_id, name, description, manager, email, type, status) VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7) RETURNING id, name, description, manager, email, type, status", [companyId, body.name, body.description ?? null, body.manager ?? null, body.email, body.type ?? "Business Unit", body.status ?? "Active"])
  return NextResponse.json({ success: true, data: result.rows[0] })
}

export async function PATCH(request: Request) {
  const actor = await getActor(request)
  if (!actor || !(await requireAdmin(actor))) return NextResponse.json({ success: false, error: "Only company admins can edit business units" }, { status: 403 })
  const companyId = await getCompanyId(request, actor.id)
  const body = await request.json()
  if (!companyId || !body.id || !body.name || !body.email) return NextResponse.json({ success: false, error: "Name and email are required" }, { status: 400 })
  const result = await pool.query(
    "UPDATE public.business_unit SET name = $1, description = $2, manager = $3, email = $4, type = $5, status = $6, updated_at = now() WHERE id = $7 AND company_id = $8 RETURNING id, name, description, manager, email, type, status",
    [body.name, body.description ?? null, body.manager ?? null, body.email, body.type ?? "Business Unit", body.status ?? "Active", body.id, companyId]
  )
  return result.rows[0] ? NextResponse.json({ success: true, data: result.rows[0] }) : NextResponse.json({ success: false, error: "Business unit not found" }, { status: 404 })
}

export async function DELETE(request: Request) {
  const actor = await getActor(request)
  if (!actor) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  if (!(await requireAdmin(actor))) return NextResponse.json({ success: false, error: "Only company admins can delete business units" }, { status: 403 })
  const companyId = await getCompanyId(request, actor.id)
  const id = new URL(request.url).searchParams.get("id")
  if (!companyId || !id) return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 })
  await pool.query("DELETE FROM public.business_unit WHERE id = $1 AND company_id = $2", [id, companyId])
  return NextResponse.json({ success: true })
}
