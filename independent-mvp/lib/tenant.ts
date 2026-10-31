export type TenantContext = { userId: string; companyId: string; membershipId: string };

export function requireTenantMembership(rows: Array<{ user_id: string; company_id: string; membership_id: string; active: boolean }>, userId: string, companyId: string): TenantContext {
  const row = rows.find((r) => r.user_id === userId && r.company_id === companyId && r.active);
  if (!row) throw new Error("TENANT_ACCESS_DENIED");
  return { userId: row.user_id, companyId: row.company_id, membershipId: row.membership_id };
}
