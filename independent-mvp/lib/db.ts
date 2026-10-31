import { Pool } from "pg";

declare global { var amnkoPool: Pool | undefined; }

export function db(): Pool {
  const url = process.env.AMNKO_DATABASE_URL;
  if (!url) throw new Error("AMNKO_DATABASE_URL is not configured for the independent MVP.");
  if (!globalThis.amnkoPool) globalThis.amnkoPool = new Pool({ connectionString: url, max: 5, ssl: { rejectUnauthorized: true } });
  return globalThis.amnkoPool;
}
