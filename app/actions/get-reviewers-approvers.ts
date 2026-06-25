"use server"

import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

export type ReviewerApproverUser = {
  id: string
  email: string
  name: string
  role: "REVIEWER" | "APPROVER"
  status: "active" | "inactive"
  createdAt: string
}

export async function getReviewersApprovers(): Promise<{
  success: boolean
  users: ReviewerApproverUser[]
  error?: string
}> {
  try {
    const result = await db.execute(sql`
      SELECT 
        id,
        email,
        name,
        role,
        "emailVerified",
        "createdAt"
      FROM neon_auth."user"
      WHERE role IN ('REVIEWER', 'APPROVER')
      ORDER BY role DESC, name ASC
    `)

    const rows = (result as any).rows as any[]

    const users: ReviewerApproverUser[] = rows.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name || u.email,
      role: u.role as "REVIEWER" | "APPROVER",
      status: u.emailVerified ? "active" : "inactive",
      createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-GB") : "—",
    }))

    return { success: true, users }
  } catch (error) {
    console.error("[v0] getReviewersApprovers error:", error)
    return { success: false, users: [], error: (error as Error).message }
  }
}

export async function updateReviewerApproverStatus(
  userId: string,
  status: "active" | "inactive"
): Promise<{ success: boolean; error?: string }> {
  try {
    // For now, status is tracked via emailVerified flag
    await db.execute(sql`
      UPDATE neon_auth."user"
      SET "emailVerified" = ${status === "active"}
      WHERE id = ${userId}
      AND role IN ('REVIEWER', 'APPROVER')
    `)
    return { success: true }
  } catch (error) {
    console.error("[v0] updateReviewerApproverStatus error:", error)
    return { success: false, error: (error as Error).message }
  }
}
