import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).origin !== new URL(req.url).origin) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  try {
    const form = await req.formData();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    if (!email || email.length > 254 || password.length > 1024) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const result = await db().query(
      "SELECT id,password_hash FROM app_users WHERE email=$1 AND active=true",
      [email]
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const membership = await db().query(
      "SELECT id FROM memberships WHERE user_id=$1 AND active=true ORDER BY created_at LIMIT 1",
      [user.id]
    );
    if (!membership.rowCount) {
      return NextResponse.json({ error: "No active company membership" }, { status: 403 });
    }

    await createSession(user.id, membership.rows[0].id);
    return NextResponse.redirect(new URL("/", req.url), 303);
  } catch (error) {
    console.error("Independent MVP login unavailable:", error);
    return NextResponse.json(
      { error: "Login service is not configured. A dedicated AMNKO database must be connected first." },
      { status: 503 }
    );
  }
}
