import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { db } from "@/lib/db";
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const form = await req.formData(); const title = String(form.get("title") ?? "").trim(); const details = String(form.get("details") ?? "").trim();
  if (!title || title.length > 200 || details.length > 10000) return NextResponse.json({error:"Title and details must be within allowed limits"},{status:400});
  await db().query("INSERT INTO hse_records(company_id,branch_id,title,details,created_by) VALUES ($1,$2,$3,$4,$5)",[user.company_id,user.branch_id,title,details,user.id]);
  return NextResponse.redirect(new URL("/",req.url),303);
}
