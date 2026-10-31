import bcrypt from "bcryptjs";
import { db } from "../lib/db";

const required = ["BOOTSTRAP_COMPANY_CODE","BOOTSTRAP_COMPANY_NAME","BOOTSTRAP_ADMIN_EMAIL","BOOTSTRAP_ADMIN_NAME","BOOTSTRAP_ADMIN_PASSWORD"] as const;
for (const key of required) if (!process.env[key]) throw new Error(`Missing ${key}`);
const code = process.env.BOOTSTRAP_COMPANY_CODE!.trim().toUpperCase();
const companyName = process.env.BOOTSTRAP_COMPANY_NAME!.trim();
const email = process.env.BOOTSTRAP_ADMIN_EMAIL!.trim().toLowerCase();
const displayName = process.env.BOOTSTRAP_ADMIN_NAME!.trim();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD!;
if (!/^[A-Z0-9_-]{2,24}$/.test(code)) throw new Error("Company code must be 2-24 uppercase letters, digits, _ or -");
if (password.length < 14) throw new Error("Bootstrap password must be at least 14 characters");
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid admin email");

const client = await db().connect();
try {
  await client.query("BEGIN");
  const company = await client.query(
    "INSERT INTO companies(code,name) VALUES($1,$2) ON CONFLICT(code) DO UPDATE SET code=EXCLUDED.code RETURNING id",
    [code, companyName]
  );
  const user = await client.query(
    "INSERT INTO app_users(email,password_hash,display_name) VALUES($1,$2,$3) ON CONFLICT(email) DO UPDATE SET email=EXCLUDED.email RETURNING id",
    [email, await bcrypt.hash(password, 12), displayName]
  );
  const membership = await client.query(
    "INSERT INTO memberships(user_id,company_id,branch_id) VALUES($1,$2,NULL) ON CONFLICT DO NOTHING RETURNING id",
    [user.rows[0].id, company.rows[0].id]
  );
  const activeMembership = membership.rows[0] ?? (await client.query(
    "SELECT id FROM memberships WHERE user_id=$1 AND company_id=$2 AND branch_id IS NULL AND active=true LIMIT 1",
    [user.rows[0].id, company.rows[0].id]
  )).rows[0];
  if (!activeMembership) throw new Error("Unable to establish company membership");
  const role = await client.query("SELECT id FROM roles WHERE code='COMPANY_ADMIN' LIMIT 1");
  if (!role.rowCount) throw new Error("COMPANY_ADMIN role is missing; apply db/schema.sql first");
  await client.query("INSERT INTO membership_roles(membership_id,role_id) VALUES($1,$2) ON CONFLICT DO NOTHING",[activeMembership.id,role.rows[0].id]);
  await client.query("COMMIT");
  process.stdout.write(`Bootstrap complete for company ${code} and admin ${email}.\n`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
}
