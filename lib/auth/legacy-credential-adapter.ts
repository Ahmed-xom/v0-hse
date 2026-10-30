import type { drizzleAdapter } from "better-auth/adapters/drizzle"

type AuthAdapter = ReturnType<ReturnType<typeof drizzleAdapter>>

export function selectCredentialAccount(
  user: { id: unknown; email?: unknown },
  accounts: Record<string, unknown>[],
): Record<string, unknown> | null {
  const email = typeof user.email === "string" ? user.email.trim().toLowerCase() : null
  const timestamp = (account: Record<string, unknown>) => {
    const value = new Date(account.updatedAt as string | Date).getTime()
    return Number.isFinite(value) ? value : 0
  }
  const eligible = accounts.filter((account) =>
    account.providerId === "credential" && account.userId === user.id &&
    (account.issuer == null || account.issuer === "local:credential") &&
    (account.accountId === user.id || (email !== null && typeof account.accountId === "string" && account.accountId.trim().toLowerCase() === email)),
  ).sort((a, b) => timestamp(b) - timestamp(a) || String(a.id).localeCompare(String(b.id)))
  const selected = eligible[0]
  if (!selected) return null
  // Never guess between equally recent, conflicting credentials or fall back to an older password.
  if (eligible.some((account) => timestamp(account) === timestamp(selected) && account.password !== selected.password)) return null
  return { ...selected, accountId: user.id, issuer: "local:credential" }
}

export function withLegacyCredentialIssuer(adapter: AuthAdapter): AuthAdapter {
  return new Proxy(adapter, {
    get(target, property, receiver) {
      if (property !== "findOne") return Reflect.get(target, property, receiver)
      return async (query: Parameters<AuthAdapter["findOne"]>[0]) => {
        const result = await target.findOne<Record<string, unknown>>(query)
        if (query.model !== "user" || !result || !Array.isArray(result.account)) return result
        const selected = selectCredentialAccount({ id: result.id, email: result.email }, result.account)
        return {
          ...result,
          account: [
            ...(selected ? [selected] : []),
            ...result.account.filter((account: Record<string, unknown>) => account.providerId !== "credential"),
          ],
        }
      }
    },
  })
}
