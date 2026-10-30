export type Capability =
  | "journey.read"
  | "journey.create"
  | "journey.assign"
  | "journey.approve.hse"
  | "journey.approve.management"
  | "journey.execute"
  | "journey.export"
export type Scope = {
  userId: string
  companyId: string
  unitIds: readonly string[]
  capabilities: readonly Capability[]
  active: boolean
}
export type OwnedJourney = {
  companyId: string
  businessUnitId: string
  creatorId: string
}
export type ApprovalState =
  | "DRAFT"
  | "PENDING_HSE"
  | "PENDING_MANAGEMENT"
  | "APPROVED"
  | "RETURNED"
  | "REJECTED"
export type ExecutionState =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUSPENDED"
  | "ARRIVED"
  | "COMPLETED"
  | "CLOSED"
  | "CANCELLED"
  | "ABORTED"
export type Approval = {
  revision: number
  stage: "hse" | "management"
  actorId: string
  decision: "approved" | "returned" | "rejected"
  comment: string
  at: string
}
export type Revision = OwnedJourney & {
  version: number
  state: ApprovalState
  approvals: readonly Approval[]
}
export type Decision = { allowed: true } | { allowed: false; reason: string }
const no = (reason: string): Decision => ({ allowed: false, reason })

// These pure rules are not an authorization boundary: a server adapter must resolve identity and scope from a verified session and apply decisions atomically.
export function authorize(
  scope: Scope,
  journey: OwnedJourney,
  capability: Capability
): Decision {
  if (!scope.active || !scope.userId || !scope.companyId)
    return no("inactive-scope")
  if (scope.companyId !== journey.companyId) return no("company-mismatch")
  if (
    !journey.businessUnitId ||
    !scope.unitIds.includes(journey.businessUnitId)
  )
    return no("unit-denied")
  if (!scope.capabilities.includes(capability)) return no("capability-denied")
  return { allowed: true }
}

export function decideApproval(
  scope: Scope,
  revision: Revision,
  input: {
    version: number
    stage: Approval["stage"]
    decision: Approval["decision"]
    comment: string
  }
): Decision {
  if (!["hse", "management"].includes(input.stage)) return no("invalid-stage")
  const permission = authorize(
    scope,
    revision,
    input.stage === "hse" ? "journey.approve.hse" : "journey.approve.management"
  )
  if (!permission.allowed) return permission
  if (input.version !== revision.version) return no("stale-revision")
  if (scope.userId === revision.creatorId) return no("self-approval")
  if (!input.comment.trim()) return no("decision-comment-required")
  if (!["approved", "returned", "rejected"].includes(input.decision))
    return no("invalid-decision")
  const expected = input.stage === "hse" ? "PENDING_HSE" : "PENDING_MANAGEMENT"
  if (revision.state !== expected) return no("wrong-stage")
  const current = revision.approvals.filter(
    (approval) => approval.revision === revision.version
  )
  if (current.some((approval) => approval.stage === input.stage))
    return no("duplicate-decision")
  if (input.stage === "management") {
    const hse = current.find(
      (approval) => approval.stage === "hse" && approval.decision === "approved"
    )
    if (!hse) return no("hse-required")
    if (hse.actorId === scope.userId) return no("separate-approvers-required")
  }
  return { allowed: true }
}

export function approvalStateAfter(
  stage: Approval["stage"],
  decision: Approval["decision"]
): ApprovalState {
  if (decision === "returned") return "RETURNED"
  if (decision === "rejected") return "REJECTED"
  return stage === "hse" ? "PENDING_MANAGEMENT" : "APPROVED"
}

export function hasValidApprovals(revision: Revision): boolean {
  if (revision.state !== "APPROVED") return false
  const current = revision.approvals.filter(
    (approval) => approval.revision === revision.version
  )
  const hse = current.find(
    (approval) => approval.stage === "hse" && approval.decision === "approved"
  )
  const management = current.find(
    (approval) =>
      approval.stage === "management" && approval.decision === "approved"
  )
  return Boolean(
    hse &&
      management &&
      hse.actorId &&
      management.actorId &&
      hse.actorId !== management.actorId &&
      hse.actorId !== revision.creatorId &&
      management.actorId !== revision.creatorId &&
      current.length === 2 &&
      Number.isFinite(Date.parse(hse.at)) &&
      Number.isFinite(Date.parse(management.at)) &&
      Date.parse(hse.at) <= Date.parse(management.at)
  )
}

const transitions: Record<ExecutionState, readonly ExecutionState[]> = {
  NOT_STARTED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["SUSPENDED", "ARRIVED", "ABORTED"],
  SUSPENDED: ["IN_PROGRESS", "ABORTED"],
  ARRIVED: ["COMPLETED", "ABORTED"],
  COMPLETED: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
  ABORTED: ["CLOSED"],
}
export function canTransition(
  from: ExecutionState,
  to: ExecutionState,
  conditions: {
    approved: boolean
    safetyReady: boolean
    safeStopConfirmed: boolean
    reason?: string
  }
): Decision {
  if (!transitions[from]?.includes(to)) return no("invalid-transition")
  if (to === "IN_PROGRESS" && (!conditions.approved || !conditions.safetyReady))
    return no("departure-gates-required")
  if (
    ["SUSPENDED", "ABORTED", "CANCELLED"].includes(to) &&
    !conditions.reason?.trim()
  )
    return no("reason-required")
  if ((to === "ABORTED" || to === "SUSPENDED") && !conditions.safeStopConfirmed)
    return no("safe-stop-required")
  return { allowed: true }
}

export type Resource = { id: string; companyId: string; active: boolean }
export function checkOwnership(
  companyId: string,
  resources: readonly Resource[]
): Decision {
  if (!companyId || !resources.length) return no("unverified-ownership")
  if (
    resources.some(
      (resource) =>
        !resource.id || !resource.companyId || resource.companyId !== companyId
    )
  )
    return no("company-mismatch")
  if (resources.some((resource) => !resource.active))
    return no("inactive-resource")
  if (
    new Set(resources.map((resource) => resource.id)).size !== resources.length
  )
    return no("duplicate-resource")
  return { allowed: true }
}

export type Booking = {
  resourceId: string
  companyId: string
  start: number
  end: number
  active: boolean
  executionOpen: boolean
}
export function hasConflict(
  candidate: Booking,
  bookings: readonly Booking[],
  now: number
): boolean {
  if (
    !candidate.companyId ||
    !candidate.resourceId ||
    !Number.isFinite(now) ||
    !Number.isFinite(candidate.start) ||
    !Number.isFinite(candidate.end) ||
    candidate.end <= candidate.start
  )
    return true
  return bookings.some((booking) => {
    if (!booking.active || booking.resourceId !== candidate.resourceId)
      return false
    if (booking.companyId !== candidate.companyId) return true
    if (
      !Number.isFinite(booking.start) ||
      !Number.isFinite(booking.end) ||
      booking.end <= booking.start
    )
      return true
    const end =
      booking.executionOpen && booking.end <= now ? Infinity : booking.end
    return candidate.start < end && booking.start < candidate.end
  })
}

export type DocumentKind =
  | "driving-license"
  | "vehicle-registration"
  | "insurance"
  | "technical-inspection"
export type ResourceDocument = {
  kind: DocumentKind
  resourceId: string
  companyId: string
  verified: boolean
  validFrom: number
  validUntil: number
}
export function documentsCover(
  companyId: string,
  resourceId: string,
  kinds: readonly DocumentKind[],
  documents: readonly ResourceDocument[],
  start: number,
  end: number
): Decision {
  if (
    !companyId ||
    !resourceId ||
    !kinds.length ||
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    end <= start
  )
    return no("invalid-document-window")
  for (const kind of kinds) {
    const covered = documents.some(
      (doc) =>
        doc.kind === kind &&
        doc.companyId === companyId &&
        doc.resourceId === resourceId &&
        doc.verified &&
        Number.isFinite(doc.validFrom) &&
        Number.isFinite(doc.validUntil) &&
        doc.validFrom <= start &&
        doc.validUntil >= end
    )
    if (!covered) return no(`missing-or-expired:${kind}`)
  }
  return { allowed: true }
}

export const materialFields = [
  "companyId",
  "businessUnitId",
  "purpose",
  "driverId",
  "secondDriverId",
  "vehicleId",
  "startLocal",
  "endLocal",
  "timezone",
  "stops",
  "services",
  "scope",
  "roundTrip",
  "multiStop",
  "emergency",
  "hazards",
  "controls",
  "nightReason",
] as const
export function requiresReapproval(
  changedFields: readonly string[],
  cargoSafetyChanged: boolean
): boolean {
  return (
    cargoSafetyChanged ||
    changedFields.some((field) =>
      (materialFields as readonly string[]).includes(field)
    )
  )
}
