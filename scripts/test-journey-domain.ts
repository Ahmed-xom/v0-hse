import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import {
  createJourneyPlan,
  validatePlan,
  resolveWallTime,
  costSubtotals,
  positiveDecimal,
  type JourneyPlan,
  type Expense,
} from "../lib/journeys/domain"
import {
  authorize,
  decideApproval,
  hasValidApprovals,
  approvalStateAfter,
  canTransition,
  checkOwnership,
  hasConflict,
  documentsCover,
  requiresReapproval,
  type Scope,
  type Revision,
  type Approval,
  type Booking,
  type ResourceDocument,
} from "../lib/journeys/policy"

const scope: Scope = {
  userId: "hse-reviewer",
  companyId: "company-a",
  unitIds: ["unit-a"],
  capabilities: [
    "journey.read",
    "journey.create",
    "journey.approve.hse",
    "journey.approve.management",
  ],
  active: true,
}
const journey = {
  companyId: "company-a",
  businessUnitId: "unit-a",
  creatorId: "requester",
}
const revision: Revision = {
  ...journey,
  version: 2,
  state: "PENDING_HSE",
  approvals: [],
}
const hse: Approval = {
  revision: 2,
  stage: "hse",
  actorId: "hse-reviewer",
  decision: "approved",
  comment: "Reviewed",
  at: "2026-10-30T08:00:00Z",
}
const management: Approval = {
  revision: 2,
  stage: "management",
  actorId: "manager",
  decision: "approved",
  comment: "Reviewed",
  at: "2026-10-30T09:00:00Z",
}
const decision = {
  version: 2,
  stage: "hse" as const,
  decision: "approved" as const,
  comment: "Reviewed",
}
const ready = {
  approved: true,
  safetyReady: true,
  safeStopConfirmed: true,
  reason: "Operational reason",
}
const booking: Booking = {
  resourceId: "driver-a",
  companyId: "company-a",
  start: 1000,
  end: 2000,
  active: true,
  executionOpen: false,
}
function localPlan(): JourneyPlan {
  return {
    ...createJourneyPlan(),
    ...journey,
    services: ["goods"],
    scope: "intercity",
    purpose: "Equipment delivery",
    timezone: "Asia/Muscat",
    startLocal: "2026-11-02T08:00",
    endLocal: "2026-11-02T18:00",
    driverId: "driver-a",
    vehicleId: "vehicle-a",
    stops: [
      { id: "a", name: "Origin", kind: "origin" },
      { id: "b", name: "Destination", kind: "destination" },
    ],
  }
}

test("draft starts without assumed company, time zone, service or resource", () => {
  const plan = createJourneyPlan()
  assert.equal(plan.companyId, "")
  assert.equal(plan.timezone, "")
  assert.deepEqual(plan.services, [])
  assert.equal(plan.driverId, "")
  assert.deepEqual(validatePlan(plan, "draft"), [])
  assert.ok(validatePlan(plan).some((issue) => issue.code === "company"))
})
test("local completeness does not require optional passengers, cargo or costs", () => {
  const plan = localPlan()
  assert.deepEqual(validatePlan(plan), [])
  assert.deepEqual(costSubtotals(plan.expenses), [])
  for (const service of ["passengers", "goods", "equipment"] as const)
    assert.deepEqual(validatePlan({ ...plan, services: [service] }), [])
})
test("service and characteristics are independent", () => {
  const plan = {
    ...localPlan(),
    services: ["passengers", "goods", "equipment"] as JourneyPlan["services"],
    emergency: true,
    emergencyReason: "Reason",
    roundTrip: true,
    multiStop: true,
  }
  plan.stops = [
    { id: "a", name: "Origin", kind: "origin" },
    { id: "c", name: "Stop", kind: "stop" },
    { id: "b", name: "Destination", kind: "destination" },
    { id: "r", name: "Origin", kind: "return" },
  ]
  assert.deepEqual(validatePlan(plan), [])
})
test("emergency needs reason and does not skip required scope or resources", () => {
  const issues = validatePlan({ ...createJourneyPlan(), emergency: true })
  for (const code of ["company", "unit", "driver", "vehicle", "emergency"])
    assert.ok(issues.some((issue) => issue.code === code))
})
test("round trip must return to the origin", () => {
  assert.ok(
    validatePlan({ ...localPlan(), roundTrip: true }).some(
      (issue) => issue.code === "return"
    )
  )
  const plan = localPlan()
  plan.roundTrip = true
  plan.stops.push({ id: "r", name: "Wrong site", kind: "return" })
  assert.ok(validatePlan(plan).some((issue) => issue.code === "return"))
})
test("multi-stop needs a named intermediate stop", () => {
  assert.ok(
    validatePlan({ ...localPlan(), multiStop: true }).some(
      (issue) => issue.code === "multi-stop"
    )
  )
  const plan = localPlan()
  plan.stops.splice(1, 0, { id: "c", name: "", kind: "stop" })
  assert.ok(validatePlan(plan).some((issue) => issue.code === "stop-name"))
})
test("invalid and duplicate service values fail", () => {
  assert.ok(
    validatePlan({ ...localPlan(), services: ["goods", "goods"] }).some(
      (issue) => issue.code === "invalid-service"
    )
  )
  assert.ok(
    validatePlan({ ...localPlan(), services: ["bad"] as never }).some(
      (issue) => issue.code === "invalid-service"
    )
  )
})
test("secondary driver cannot be the primary driver", () => {
  assert.ok(
    validatePlan({ ...localPlan(), secondDriverId: "driver-a" }).some(
      (issue) => issue.code === "same-driver"
    )
  )
})
test("time-zone conversion uses the supplied zone, not the machine zone", () => {
  assert.deepEqual(resolveWallTime("2026-11-02T08:00", "Asia/Muscat"), {
    state: "valid",
    instant: Date.parse("2026-11-02T04:00:00Z"),
  })
  assert.deepEqual(resolveWallTime("2026-11-02T08:00", ""), {
    state: "missing-zone",
  })
  assert.deepEqual(resolveWallTime("2026-11-02T08:00", "Not/AZone"), {
    state: "missing-zone",
  })
})
test("invalid calendar dates and daylight-saving gaps are rejected", () => {
  for (const value of [
    "2026-02-30T08:00",
    "2026-13-01T08:00",
    "2026-01-01T25:00",
    "2026-01-01T08:60",
    "not-a-date",
  ])
    assert.deepEqual(resolveWallTime(value, "Asia/Muscat"), {
      state: "invalid",
    })
  assert.deepEqual(resolveWallTime("2026-03-08T02:30", "America/New_York"), {
    state: "invalid",
  })
})
test("repeated DST clock time is rejected instead of silently choosing an offset", () => {
  assert.deepEqual(resolveWallTime("2026-11-01T01:30", "America/New_York"), {
    state: "ambiguous",
  })
})
test("planned end must follow departure", () => {
  for (const endLocal of ["2026-11-02T08:00", "2026-11-01T18:00"])
    assert.ok(
      validatePlan({ ...localPlan(), endLocal }).some(
        (issue) => issue.code === "end-before-start"
      )
    )
  assert.equal(
    validatePlan({
      ...localPlan(),
      startLocal: "2026-11-02T23:00",
      endLocal: "2026-11-03T08:00",
    }).some((issue) => issue.section === "schedule"),
    false
  )
})
test("blank optional load weight is unknown, while entered nonpositive weight fails", () => {
  const plan = localPlan()
  plan.cargo = [
    {
      id: "load",
      description: "Equipment",
      quantity: "",
      unit: "",
      weightKg: "",
    },
  ]
  assert.deepEqual(validatePlan(plan), [])
  plan.cargo[0].weightKg = "0"
  assert.ok(validatePlan(plan).some((issue) => issue.code === "cargo-weight"))
  plan.cargo[0].weightKg = "-3"
  assert.ok(validatePlan(plan).some((issue) => issue.code === "cargo-weight"))
})
test("optional entered manifest rows must have names and matching service", () => {
  const plan = localPlan()
  plan.passengers.push({ id: "p", name: "", reference: "" })
  assert.ok(validatePlan(plan).some((issue) => issue.code === "passenger-name"))
  assert.ok(
    validatePlan(plan).some((issue) => issue.code === "passenger-service")
  )
})
test("money parser rejects nonfinite, exponent, negative and overprecision inputs", () => {
  for (const value of [
    "",
    "0",
    "0.000",
    "-1",
    "1e5",
    "Infinity",
    "NaN",
    "1,000",
    "1.0001",
    "1 OR 1=1",
  ])
    assert.equal(positiveDecimal(value), false, value)
  for (const value of ["1", "1.1", "0.001", "100.125"])
    assert.equal(positiveDecimal(value), true, value)
})
test("money subtotals are exact and separated by estimate/actual and currency", () => {
  const rows: Expense[] = [
    {
      id: "1",
      description: "A",
      amount: "0.1",
      currency: "OMR",
      kind: "estimated",
    },
    {
      id: "2",
      description: "B",
      amount: "0.2",
      currency: "OMR",
      kind: "estimated",
    },
    {
      id: "3",
      description: "C",
      amount: "1.125",
      currency: "OMR",
      kind: "actual",
    },
    { id: "4", description: "D", amount: "3", currency: "USD", kind: "actual" },
  ]
  assert.deepEqual(costSubtotals(rows), [
    { currency: "OMR", kind: "estimated", amount: "0.30" },
    { currency: "OMR", kind: "actual", amount: "1.125" },
    { currency: "USD", kind: "actual", amount: "3.00" },
  ])
  assert.deepEqual(costSubtotals([{ ...rows[0], amount: "NaN" }]), [])
})
test("every entered cost is validated but no row is required", () => {
  const plan = localPlan()
  assert.deepEqual(validatePlan(plan), [])
  plan.expenses.push({
    id: "bad",
    description: "",
    amount: "-1",
    currency: "",
    kind: "estimated",
  })
  assert.equal(
    validatePlan(plan).filter((issue) => issue.section === "costs").length,
    3
  )
})
test("scope denies cross-company access even with every capability", () => {
  assert.equal(authorize(scope, journey, "journey.read").allowed, true)
  assert.deepEqual(
    authorize(scope, { ...journey, companyId: "company-b" }, "journey.read"),
    { allowed: false, reason: "company-mismatch" }
  )
})
test("scope denies inactive membership, unauthorized unit and missing capability", () => {
  assert.equal(
    authorize({ ...scope, active: false }, journey, "journey.read").allowed,
    false
  )
  assert.equal(
    authorize(scope, { ...journey, businessUnitId: "unit-b" }, "journey.read")
      .allowed,
    false
  )
  assert.equal(
    authorize({ ...scope, capabilities: [] }, journey, "journey.read").allowed,
    false
  )
  assert.equal(
    authorize(scope, { ...journey, businessUnitId: "" }, "journey.read")
      .allowed,
    false
  )
})
test("HSE decision requires current revision, comment and independent actor", () => {
  assert.equal(decideApproval(scope, revision, decision).allowed, true)
  assert.equal(
    decideApproval(scope, revision, { ...decision, version: 1 }).allowed,
    false
  )
  assert.equal(
    decideApproval(scope, revision, { ...decision, comment: " " }).allowed,
    false
  )
  assert.equal(
    decideApproval({ ...scope, userId: journey.creatorId }, revision, decision)
      .allowed,
    false
  )
  assert.equal(
    decideApproval(scope, revision, { ...decision, stage: "unknown" as never })
      .allowed,
    false
  )
})
test("management cannot approve before HSE", () => {
  assert.equal(
    decideApproval({ ...scope, userId: "manager" }, revision, {
      ...decision,
      stage: "management",
    }).allowed,
    false
  )
  assert.equal(
    decideApproval(
      { ...scope, userId: "manager" },
      { ...revision, state: "PENDING_MANAGEMENT" },
      { ...decision, stage: "management" }
    ).allowed,
    false
  )
})
test("management requires a different approver on the same revision", () => {
  const pending: Revision = {
    ...revision,
    state: "PENDING_MANAGEMENT",
    approvals: [hse],
  }
  assert.equal(
    decideApproval({ ...scope, userId: "manager" }, pending, {
      ...decision,
      stage: "management",
    }).allowed,
    true
  )
  assert.equal(
    decideApproval(scope, pending, { ...decision, stage: "management" })
      .allowed,
    false
  )
  assert.equal(
    decideApproval(
      { ...scope, userId: "manager" },
      { ...pending, approvals: [{ ...hse, revision: 1 }] },
      { ...decision, stage: "management" }
    ).allowed,
    false
  )
})
test("duplicate decisions and old revisions never clear the journey", () => {
  assert.equal(
    decideApproval(scope, { ...revision, approvals: [hse] }, decision).allowed,
    false
  )
  assert.equal(
    hasValidApprovals({
      ...revision,
      state: "APPROVED",
      approvals: [hse, management],
    }),
    true
  )
  assert.equal(
    hasValidApprovals({
      ...revision,
      version: 3,
      state: "APPROVED",
      approvals: [hse, management],
    }),
    false
  )
  assert.equal(
    hasValidApprovals({
      ...revision,
      state: "APPROVED",
      approvals: [hse, { ...management, actorId: hse.actorId }],
    }),
    false
  )
  assert.equal(
    hasValidApprovals({
      ...revision,
      state: "APPROVED",
      approvals: [hse, management, management],
    }),
    false
  )
})
test("approval order and timestamps are checked", () => {
  const approved: Revision = {
    ...revision,
    state: "APPROVED",
    approvals: [hse, management],
  }
  assert.equal(
    hasValidApprovals({
      ...approved,
      approvals: [hse, { ...management, at: "2026-10-30T07:00:00Z" }],
    }),
    false
  )
  assert.equal(
    hasValidApprovals({
      ...approved,
      approvals: [hse, { ...management, at: "invalid" }],
    }),
    false
  )
  assert.equal(
    hasValidApprovals({
      ...approved,
      approvals: [hse, { ...management, actorId: journey.creatorId }],
    }),
    false
  )
})
test("return and reject are distinct from final approval", () => {
  assert.equal(approvalStateAfter("hse", "approved"), "PENDING_MANAGEMENT")
  assert.equal(approvalStateAfter("management", "approved"), "APPROVED")
  assert.equal(approvalStateAfter("hse", "returned"), "RETURNED")
  assert.equal(approvalStateAfter("management", "rejected"), "REJECTED")
})
test("departure and resumption fail closed without approval or readiness", () => {
  assert.equal(canTransition("NOT_STARTED", "IN_PROGRESS", ready).allowed, true)
  assert.equal(
    canTransition("NOT_STARTED", "IN_PROGRESS", { ...ready, approved: false })
      .allowed,
    false
  )
  assert.equal(
    canTransition("NOT_STARTED", "IN_PROGRESS", {
      ...ready,
      safetyReady: false,
    }).allowed,
    false
  )
  assert.equal(
    canTransition("SUSPENDED", "IN_PROGRESS", { ...ready, approved: false })
      .allowed,
    false
  )
})
test("abort and suspension require a reason and safe-stop confirmation", () => {
  assert.equal(canTransition("IN_PROGRESS", "ABORTED", ready).allowed, true)
  assert.equal(
    canTransition("IN_PROGRESS", "ABORTED", { ...ready, reason: "" }).allowed,
    false
  )
  assert.equal(
    canTransition("IN_PROGRESS", "SUSPENDED", {
      ...ready,
      safeStopConfirmed: false,
    }).allowed,
    false
  )
  assert.equal(canTransition("IN_PROGRESS", "CANCELLED", ready).allowed, false)
})
test("terminal states cannot silently restart", () => {
  for (const terminal of ["CLOSED", "CANCELLED", "ABORTED"] as const)
    assert.equal(canTransition(terminal, "IN_PROGRESS", ready).allowed, false)
  assert.equal(canTransition("ARRIVED", "COMPLETED", ready).allowed, true)
  assert.equal(canTransition("COMPLETED", "CLOSED", ready).allowed, true)
})
test("unknown, cross-company and inactive resource ownership fail", () => {
  assert.equal(
    checkOwnership("company-a", [
      { id: "d", companyId: "company-a", active: true },
    ]).allowed,
    true
  )
  assert.equal(checkOwnership("company-a", []).allowed, false)
  for (const resource of [
    { id: "d", companyId: "", active: true },
    { id: "d", companyId: "company-b", active: true },
    { id: "d", companyId: "company-a", active: false },
  ])
    assert.equal(checkOwnership("company-a", [resource]).allowed, false)
})
test("overlap uses half-open ranges, with driver and vehicle identity kept explicit", () => {
  assert.equal(
    hasConflict({ ...booking, start: 1500, end: 2500 }, [booking], 1200),
    true
  )
  assert.equal(
    hasConflict({ ...booking, start: 2000, end: 3000 }, [booking], 1200),
    false
  )
  assert.equal(
    hasConflict({ ...booking, resourceId: "different" }, [booking], 1200),
    false
  )
  assert.equal(
    hasConflict(booking, [{ ...booking, active: false }], 1200),
    false
  )
})
test("overdue journeys block later reservations until actual release", () => {
  assert.equal(
    hasConflict(
      { ...booking, start: 4000, end: 5000 },
      [{ ...booking, executionOpen: true }],
      3000
    ),
    true
  )
  assert.equal(
    hasConflict(
      { ...booking, start: 4000, end: 5000 },
      [{ ...booking, executionOpen: false }],
      3000
    ),
    false
  )
})
test("malformed reservation windows fail closed", () => {
  assert.equal(hasConflict({ ...booking, end: booking.start }, [], 0), true)
  assert.equal(hasConflict({ ...booking, start: NaN }, [], 0), true)
  assert.equal(hasConflict(booking, [{ ...booking, end: NaN }], 0), true)
  assert.equal(
    hasConflict(booking, [{ ...booking, companyId: "company-b" }], 0),
    true
  )
})
test("documents must be verified and cover the whole journey including return", () => {
  const doc: ResourceDocument = {
    kind: "driving-license",
    resourceId: "driver-a",
    companyId: "company-a",
    verified: true,
    validFrom: 0,
    validUntil: 2000,
  }
  assert.equal(
    documentsCover(
      "company-a",
      "driver-a",
      ["driving-license"],
      [doc],
      1000,
      2000
    ).allowed,
    true
  )
  for (const changed of [
    { ...doc, verified: false },
    { ...doc, validUntil: 1999 },
    { ...doc, companyId: "company-b" },
    { ...doc, resourceId: "other" },
    { ...doc, validUntil: NaN },
  ])
    assert.equal(
      documentsCover(
        "company-a",
        "driver-a",
        ["driving-license"],
        [changed],
        1000,
        2000
      ).allowed,
      false
    )
  assert.equal(
    documentsCover(
      "company-a",
      "vehicle-a",
      ["vehicle-registration", "insurance", "technical-inspection"],
      [],
      1000,
      2000
    ).allowed,
    false
  )
})
test("material changes require reapproval, optional descriptive changes do not", () => {
  for (const field of [
    "driverId",
    "vehicleId",
    "startLocal",
    "endLocal",
    "stops",
    "services",
    "hazards",
    "nightReason",
  ])
    assert.equal(requiresReapproval([field], false), true)
  assert.equal(requiresReapproval(["notes"], false), false)
  assert.equal(requiresReapproval(["cargo"], true), true)
})
test("staged workspace has no data-access, storage, messaging or fake persistence path", () => {
  const root = join(process.cwd(), "components", "journeys")
  for (const file of readdirSync(root).filter((name) => /\.tsx?$/.test(name))) {
    const source = readFileSync(join(root, file), "utf8")
    for (const forbidden of [
      /from ["']@\/app\/actions\//,
      /\bfetch\s*\(/,
      /localStorage/,
      /sessionStorage/,
      /@vercel\/blob/,
      /@neondatabase/,
      /resend/,
      /nodemailer/,
    ])
      assert.equal(forbidden.test(source), false, `${file}: ${forbidden}`)
  }
  const shell = readFileSync(
    join(process.cwd(), "components/dashboard/journey-tracker.tsx"),
    "utf8"
  )
  assert.equal(shell.includes("manage-journeys"), false)
})
