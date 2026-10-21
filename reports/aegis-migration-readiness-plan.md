# HSE migration readiness plan

## Scope and evidence

This is a repository-only planning artifact. It uses the validated source export and the existing reviews:

- `reports/aegis-historical-export-manifest.json` — 341 tables, 139,123 documented rows, 269 populated payloads, 72 empty tables.
- `reports/aegis-code-based-mapping-review.md` — application/query and contract evidence.
- `reports/aegis-complete-mapping-review.md` — source metadata and prior staging evidence.
- `reports/aegis-neon-staging-schema-evidence.md` — staging catalog evidence; it is schema evidence, not approval or import proof.
- Historical metadata in Git blob `d0958240c73b1a4fed16ca186b58108c4518ec1a:.tmp/Aegis_XOM_Export.zip`: `tables.json`, `columns.json`, `primary_keys.json`, `foreign_keys.json`.
- Source relationship metadata: 253 primary-key entries and 535 foreign-key entries across the 341-table export.

No mapping is approved by this plan. No service was contacted and no write/import is authorized.

## Complete grouping of all 341 tables

The grouping is exhaustive and mutually exclusive. The authoritative membership is the 341 `table` keys in `reports/aegis-historical-export-manifest.json`; the rules below classify every one without name guessing.

| Group | Count | Membership | State |
|---|---:|---|---|
| Evidence-backed proposals | 3 | `dbo.tblCompany`, `dbo.tblBusinessUnit`, `dbo.tblEmployee` | Proposed, unapproved |
| Candidates requiring review | 3 | `dbo.tblLibrary`, `dbo.tblLibraryHierarchy`, `dbo.tblLibraryAccess` | Candidate only, unapproved |
| Unresolved | 335 | Every other manifest table key | No target may be inferred |
| **Total** | **341** | All manifest entries | **0 approved** |

The three evidence-backed proposals are not successful imports: Company is 1 source vs 3 staging, BusinessUnit 7 vs 7, and Employee 378 vs 369. The three candidates come from `lib/legacy-migration-contracts.ts:43-55`; their target schema/columns are not sufficient for approval. The 335 unresolved set includes all audit, action, incident, training, lookup, history, system-log, tenant, attachment, and other tables unless they are one of the six named entries above.

## Dependency order

The source FK graph in `foreign_keys.json` must be topologically ordered before any future import design. The safe logical phases are:

1. **Contract and identity phase:** resolve source PKs from `primary_keys.json`; classify tables with no PK as review-required. Decide whether source IDs are retained, namespaced, or translated.
2. **Root/reference phase:** tables with no unresolved incoming FK, including approved target reference candidates such as Company and BusinessUnit, after their target keys and uniqueness rules are confirmed.
3. **Identity phase:** Employee and Login/auth-related source tables only after the identity-key and privacy contract is approved.
4. **Parent/master phase:** source tables referenced by other tables, including library folders and document parents, after target parent keys are established.
5. **Child/business phase:** ActionItems, audits, incidents, training, observations, and other tables after every FK target is resolved.
6. **History/audit/system phase:** `_AuditTrail`, history, import, router, tenant, and log tables only after a retention decision; many may be archive-only or excluded.
7. **Empty tables:** preserve as an explicit zero-row classification; do not create targets solely because an empty source table exists.

This is a dependency policy, not an executable import order. The exact order still requires a generated FK DAG report with cycle handling for the 535 source FK edges and actual target constraint definitions. Cycles require deferrable constraints or a staged key-only pass; neither is approved here.

## Mapped-group transformation decisions

### `dbo.tblCompany -> public.company` (proposal)
Evidence: `config/aegis-table-mapping-proposal.json`, `app/actions/companies.ts:41-83`, staging audit. Decisions required: retain `Cmp_Id` or create a translation key; define uniqueness for `Cmp_Code`; map/normalize name fields; decide tenant scope; define soft-delete source column and target representation; document whether the two extra staging rows are pre-existing or imported. Validation must use keyed hashes/counts, not names.

### `dbo.tblBusinessUnit -> public.business_unit` (proposal)
Evidence: proposal JSON, `app/api/business-units/route.ts:22-74`, 7-to-7 count. Decisions required: retain `BU_Id`; map `BU_Under_Id` to a self-FK or explicit root; define company/tenant FK; define null/root semantics; define soft-delete behavior; confirm uniqueness and orphan handling.

### `dbo.tblEmployee -> public.employee` (proposal)
Evidence: proposal JSON, `scripts/import-users.mjs:315-334`, `scripts/verify-employee-operations.ts:9-46`, staging audit. Decisions required: choose `Emp_Id` versus approved payroll key; map BusinessUnit FK; define identity/auth linkage without copying credentials; define duplicate payroll behavior; define inactive/soft-delete semantics; explain nine-row difference before approval. The report must never emit names or emails.

### Library candidates
`tblLibrary -> public.document` and `tblLibraryHierarchy -> public.document_folder` require target column/constraint evidence, parent-key transformation, ordering/path semantics, and attachment/blob policy. `tblLibraryAccess` has no established target; decide ACL model, principal identity, deny/allow precedence, and whether it is imported or retained as audit-only. All remain unapproved.

## Decisions required for unresolved groups

For each of the 335 unresolved tables, the minimum decision record is: target schema/table or explicit archive/exclude disposition; source PK to target identity rule; every source FK to target FK or null policy; column conversion/default/exclusion rules; split/merge/denormalization rule; soft-delete and history retention rule; PII classification; and an approved non-PII validation key. Source names, row counts, or similar application nouns are not enough.

## Non-PII validation procedure

1. Validate source/manifest counts per table, treating singleton JSON objects and 72 zero-byte empty payloads according to export metadata.
2. For each approved pair, run read-only counts only after the target mapping is approved.
3. Build stable-key projections in the source and target; normalize only documented casts/trims/case rules.
4. Compare aggregate counts of total, null key, duplicate key, source-only, target-only, and matched key hashes. Return counts and salted/HMAC digests only; never return names, emails, payroll values, or full rows.
5. Validate FK orphan counts and parent-before-child coverage. Validate soft-deleted rows separately from active rows.
6. Store query text hashes, timestamp, branch/database identity, mapping version, and result counts as evidence. Aggregate totals never substitute for per-table results.

For Company, minimum evidence is a keyed digest comparison over an approved stable company ID/code plus collision/null counts. For Employee, minimum evidence is a keyed digest comparison over an approved stable employee/payroll identifier plus duplicate/null/source-only/target-only counts; all personal fields remain suppressed.

## Smallest safe pilot

The smallest useful pilot is the existing three-domain proposal set, limited to read-only validation: BusinessUnit first (7 vs 7), then Company (1 vs 3), then Employee (378 vs 369), with no writes. It exercises root/reference, identity, FK, mismatch, and privacy handling while remaining small. A future write/import pilot, if separately approved, must be isolated to a non-production staging branch, insert-only, idempotent, fully logged, and stopped on any key/FK/count mismatch.

## Read-only versus future write phase

**Read-only now:** inspect metadata, exact counts where approved, key-hash aggregates, FK/orphan aggregates, and redacted evidence artifacts. No DDL, DML, import, migration, or approval.

**Future write/import only after explicit approval:** finalize mapping manifest, apply any schema changes, create/import records, reconcile per-table results, and obtain sign-off. Approval must name the branch, tables, mapping version, transformation rules, and rollback/cleanup plan.

## Concrete decisions needed

1. Approve the identity-key strategy for Company, BusinessUnit, and Employee.
2. Decide whether Company/Employee staging extras/missing rows are pre-existing, filtered, duplicate, or transformed using the non-PII keyed comparison procedure.
3. Approve or reject the three library candidate directions and provide the ACL target for `tblLibraryAccess`.
4. Provide a reviewed target mapping manifest for the 335 unresolved tables, including target schema/columns/constraints and archive/exclude dispositions.
5. Approve the read-only pilot evidence procedure separately; do not approve writes by implication.

Until those decisions and artifacts exist, readiness is **not approved** and the 335 unresolved tables must not be imported or treated as mapped.
