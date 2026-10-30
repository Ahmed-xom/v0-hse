import { sql, type SQLWrapper } from "drizzle-orm"

export type ResetTransaction = {
  execute: (query: string | SQLWrapper) => PromiseLike<unknown>
}

type ResetRecord = {
  user_id: string
  expires_at: string | Date
}

type QueryResult = {
  rows?: ResetRecord[]
  rowCount?: number
}

export async function resetPasswordInTransaction(
  tx: ResetTransaction,
  options: {
    tokenHash: string
    rawToken: string
    signature: string
    passwordHash: string
    validSignature: (userId: string, expiresAt: string | Date, rawToken: string, signature: string) => boolean
  },
) {
  const result = (await tx.execute(sql`SELECT user_id, expires_at FROM public.password_reset_token WHERE token_hash = ${options.tokenHash} AND used_at IS NULL AND expires_at > now() FOR UPDATE`)) as QueryResult
  const reset = result.rows?.[0]
  if (!reset || !options.validSignature(reset.user_id, reset.expires_at, options.rawToken, options.signature)) {
    throw new Error("invalid reset token")
  }

  const updated = (await tx.execute(sql`UPDATE neon_auth."account" SET password = ${options.passwordHash}, "updatedAt" = now() WHERE "userId" = ${reset.user_id} AND "providerId" = 'credential'`)) as QueryResult
  const updatedCount = Number(updated.rowCount || 0)
  if (updatedCount < 1) throw new Error("credential account not found")

  const consumed = (await tx.execute(sql`UPDATE public.password_reset_token SET used_at = now() WHERE token_hash = ${options.tokenHash} AND used_at IS NULL AND expires_at > now()`)) as QueryResult
  const consumedCount = Number(consumed.rowCount || 0)
  if (consumedCount !== 1) throw new Error("reset token already used")

  await tx.execute(sql`DELETE FROM neon_auth.session WHERE "userId" = ${reset.user_id}`)
  return { userId: reset.user_id, updatedCount, consumedCount }
}
