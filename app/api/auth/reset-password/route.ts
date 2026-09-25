import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

const secret = () => process.env.BETTER_AUTH_SECRET || (() => { throw new Error('BETTER_AUTH_SECRET is not configured') })()
const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex')
const sign = (value: string) => crypto.createHmac('sha256', secret()).update(value).digest('hex')

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json().catch(() => ({}))
    if (typeof token !== 'string' || typeof password !== 'string' || password.length < 8) return NextResponse.json({ error: 'A valid token and password of at least 8 characters are required.' }, { status: 400 })
    const [rawToken, signature] = token.split('.')
    if (!rawToken || !signature) throw new Error('invalid token')
    const result = await db.execute(sql`SELECT user_id, expires_at FROM public.password_reset_token WHERE token_hash = ${hashToken(rawToken)} AND used_at IS NULL AND expires_at > now() LIMIT 1`)
    const reset = ((result as unknown as { rows?: Array<{ user_id: string; expires_at: string }> }).rows || [])[0]
    if (!reset) throw new Error('expired token')
    const expected = sign(`${reset.user_id}.${new Date(reset.expires_at).getTime()}.${rawToken}`)
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error('invalid token')
    const hash = await bcrypt.hash(password, 12)
    await db.execute(sql`UPDATE neon_auth."account" SET password = ${hash}, "updatedAt" = now() WHERE "userId" = ${reset.user_id} AND "providerId" = 'credential'`)
    await db.execute(sql`UPDATE public.password_reset_token SET used_at = now() WHERE token_hash = ${hashToken(rawToken)} AND used_at IS NULL`)
    await db.execute(sql`DELETE FROM neon_auth.session WHERE "userId" = ${reset.user_id}`)
    return NextResponse.json({ success: true, message: 'Your password has been updated successfully.' })
  } catch {
    return NextResponse.json({ error: 'Reset link is invalid or expired.' }, { status: 400 })
  }
}
