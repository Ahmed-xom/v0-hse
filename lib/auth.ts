import { betterAuth } from "better-auth"
import { pool } from "@/lib/db"

export const auth = betterAuth({
  // Pass the pg Pool directly — Better Auth uses its built-in pg adapter.
  // The Pool's search_path (set in lib/db/index.ts) routes queries to neon_auth schema.
  database: pool,
  emailAndPassword: {
    enabled: true,
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
  secret: process.env.BETTER_AUTH_SECRET,
  advanced: {
    ...(process.env.NODE_ENV === "development" && {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
      },
    }),
  },
})
