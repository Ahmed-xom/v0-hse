import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

const COOKIE = "amnko_mvp_session";
function secret() { const s = process.env.APP_SESSION_SECRET; if (!s || s.length < 32) throw new Error("APP_SESSION_SECRET must contain at least 32 characters"); return s; }
function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("hex"); }

export async function createSession(userId: string, membershipId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHmac("sha256", secret()).update(token).digest("hex");
  await db().query("INSERT INTO user_sessions(user_id, membership_id, token_hash, expires_at) VALUES ($1,$2,$3,now()+interval '7 days')", [userId, membershipId, tokenHash]);
  const value = token + "." + sign(token);
  (await cookies()).set(COOKIE, value, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
}

export async function currentUser() {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return null;
  const [token, signature] = value.split(".");
  if (!token || !signature) return null;
  const expected = sign(token);
  const a = Buffer.from(signature), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a,b)) return null;
  const tokenHash = createHmac("sha256", secret()).update(token).digest("hex");
  const result = await db().query(
    "SELECT u.id,u.email,u.display_name,m.id AS membership_id,m.company_id,m.branch_id, (SELECT array_agg(r.code) FROM membership_roles mr JOIN roles r ON r.id=mr.role_id WHERE mr.membership_id=m.id) AS roles FROM user_sessions s JOIN app_users u ON u.id=s.user_id JOIN memberships m ON m.id=s.membership_id AND m.user_id=u.id AND m.active JOIN companies c ON c.id=m.company_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active LIMIT 1",
    [tokenHash]
  );
  return result.rows[0] ?? null;
}

export async function destroySession() {
  const jar = await cookies();
  const value = jar.get(COOKIE)?.value;
  if (value) {
    const [token] = value.split(".");
    if (token) {
      const tokenHash = createHmac("sha256", secret()).update(token).digest("hex");
      await db().query("DELETE FROM user_sessions WHERE token_hash=$1", [tokenHash]);
    }
  }
  jar.delete(COOKIE);
}
