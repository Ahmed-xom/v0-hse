import { createHash } from "node:crypto"
import { betterAuth } from "better-auth"
import { pool } from "@/lib/db"

const configuredSecret = process.env.BETTER_AUTH_SECRET
const authSecret = configuredSecret && configuredSecret.length >= 32
  ? configuredSecret
  : configuredSecret
    ? createHash("sha256").update(configuredSecret).digest("hex")
    : undefined

export const auth = betterAuth({
  // Pass the pg Pool directly — Better Auth uses its built-in pg adapter.
  // The Pool's search_path (set in lib/db/index.ts) routes queries to neon_auth schema.
  database: pool,
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 0,
  },
  baseURL: process.env.BETTER_AUTH_URL
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
    process.env.V0_RUNTIME_URL || "http://localhost:3000",
  ],
  secret: authSecret,
  advanced: {
    ...(process.env.NODE_ENV === "development" && {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
      },
    }),
  },
})
