import { createHash } from "node:crypto"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/lib/db"
import { account, session, user, verification } from "@/lib/db/schema"
import { verifyCompatiblePassword } from "@/lib/auth/password-compatibility"

const configuredSecret = process.env.BETTER_AUTH_SECRET
const authSecret = configuredSecret && configuredSecret.length >= 32
  ? configuredSecret
  : configuredSecret
    ? createHash("sha256").update(configuredSecret).digest("hex")
    : undefined

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema: { user, session, account, verification } }),
  emailAndPassword: {
    enabled: true,
    password: { verify: verifyCompatiblePassword },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 0,
  },
  baseURL: process.env.NODE_ENV === "production"
    ? "https://www.amnkoo.online"
    : process.env.BETTER_AUTH_URL
    ? process.env.BETTER_AUTH_URL
    : process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : `${process.env.V0_RUNTIME_URL || "http://localhost:3000"}`,
  trustedOrigins: [
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.NODE_ENV === "development"
      ? ["http://localhost:3000", ...[process.env.V0_RUNTIME_URL, process.env.V0_DEV_APP_URL, process.env.V0_BUILD_URL, process.env.V0_SANDBOX_URL].filter((origin): origin is string => Boolean(origin))]
      : []),
  ],
  secret: authSecret,
  ...(process.env.NODE_ENV === "development"
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
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
          },
        },
      }),
})
