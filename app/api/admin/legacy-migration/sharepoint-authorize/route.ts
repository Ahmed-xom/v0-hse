import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { startSharePointAuthorization } from "@/lib/sharepoint-connect"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const authorization = await startSharePointAuthorization(session.user.id)
  return NextResponse.json({ url: authorization.url })
}
