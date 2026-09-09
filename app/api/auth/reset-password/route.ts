import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

const secret = () => process.env.BETTER_AUTH_SECRET || "development-reset-secret"
const sign = (value: string) => crypto.createHmac("sha256", secret()).update(value).digest("hex")

export async function POST(request: NextRequest) {
  const { token, password } = await request.json().catch(() => ({}))
  if (typeof token !== "string" || typeof password !== "string" || password.length < 8) return NextResponse.json({ error: "A valid token and password of at least 8 characters are required." }, { status: 400 })
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8")
    const parts = decoded.split(".")
    if (parts.length < 4) throw new Error("invalid token")
    const signature = parts.pop()!
    const expires = parts.pop()!
    const email = parts.pop()!
    const userId = parts.join(".")
    const payload = `${userId}.${email}.${expires}`
    if (Number(expires) < Date.now() || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(sign(payload)))) throw new Error("expired token")
    const hash = await bcrypt.hash(password, 10)
    const now = new Date().toISOString()
    const result = await db.execute(sql`UPDATE neon_auth."account" SET password = ${hash}, "updatedAt" = ${now} WHERE "userId" = ${userId} AND "providerId" = 'credential' RETURNING id`)
    if (!((result as any).rows || []).length) return NextResponse.json({ error: "Reset link is invalid or expired." }, { status: 400 })
    await db.execute(sql`DELETE FROM neon_auth.session WHERE "userId" = ${userId}`)
    return NextResponse.json({ success: true, message: "Your password has been updated successfully." })
  } catch {
    return NextResponse.json({ error: "Reset link is invalid or expired." }, { status: 400 })
  }
}
