import test from "node:test";
import assert from "node:assert/strict";
import { requireTenantMembership } from "../lib/tenant";

test("permits only active membership for the requested company", () => {
  const rows = [{ user_id: "u1", company_id: "c1", membership_id: "m1", active: true }];
  assert.equal(requireTenantMembership(rows, "u1", "c1").companyId, "c1");
  assert.throws(() => requireTenantMembership(rows, "u1", "c2"), /TENANT_ACCESS_DENIED/);
  assert.throws(() => requireTenantMembership([{ ...rows[0], active: false }], "u1", "c1"), /TENANT_ACCESS_DENIED/);
});
