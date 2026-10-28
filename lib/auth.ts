import { createHash } from "node:crypto"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/lib/db"
import { account, session, user, verification } from "@/lib/db/schema"

const configuredSecret = process.env.BETTER_AUTH_SECRET
const authSecret = configuredSecret && configuredSecret.length >= 32
  ? configuredSecret
  : configuredSecret
    ? createHash("sha256").update(configuredSecret).digest("hex")
    : undefined

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 0,
  },
  baseURL: process.env.BETTER_AUTH_URL
    ? process.env.BETTER_AUTH_URL
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : `${process.env.V0_RUNTIME_URL || "http://localhost:3000"}`,
  trustedOrigins: [
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    "https://sb-21xwitowwlwq.vercel.run",
    "https://hse-dashboard-44gy9uuf-1.v0.build",
    process.env.V0_RUNTIME_URL || "http://localhost:3000",
  ],
  secret: authSecret,
  ...(process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview"
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
            httpOnly: true,
          },
        },
      }
    : {
        advanced: {
          defaultCookieAttributes: {
            sameSite: "lax" as const,
            secure: true,
            httpOnly: true,
          },
        },
      }),
})
