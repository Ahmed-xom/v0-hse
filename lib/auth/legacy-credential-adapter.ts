import type { drizzleAdapter } from "better-auth/adapters/drizzle"

type AuthAdapter = ReturnType<ReturnType<typeof drizzleAdapter>>

export function withLegacyCredentialIssuer(adapter: AuthAdapter): AuthAdapter {
  return new Proxy(adapter, {
    get(target, property, receiver) {
      if (property !== "findOne") return Reflect.get(target, property, receiver)
      return async (query: Parameters<AuthAdapter["findOne"]>[0]) => {
        const result = await target.findOne<Record<string, unknown>>(query)
        if (query.model !== "user" || !result || !Array.isArray(result.account)) return result
        return {
          ...result,
          account: result.account.map((account: Record<string, unknown>) => {
            // Better Auth 1.7 requires an issuer absent from the legacy schema; never relabel OAuth or a different user's account.
            if (account.providerId !== "credential" || account.issuer != null || account.accountId !== result.id || account.userId !== result.id) return account
            return { ...account, issuer: "local:credential" }
          }),
        }
      }
    },
  })
}
