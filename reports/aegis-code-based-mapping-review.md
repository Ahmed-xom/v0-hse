# HSE code-based mapping review

## Scope and safety

Read-only repository analysis only. No Neon/service connection, application row reads, import, write, schema change, deployment, environment change, production access, commit, or push.

Evidence reviewed:

- `reports/aegis-complete-mapping-review.md`
- `reports/aegis-mapping-gap-review.md`
- `reports/aegis-staging-audit-final.md`
- `reports/aegis-historical-export-manifest.json`
- `.tmp/aegis-source-table-inventory.json`
- `config/aegis-table-mapping-proposal.json` (generated proposal; `approved:false`)
- `config/aegis-table-mapping.json` (empty approved mapping list; `approved:false`)
- `lib/legacy-migration-contracts.ts`
- `lib/aegis-field-mapping.ts`
- `scripts/import-users.mjs`
- `scripts/plan-aegis-import.mjs`
- application actions/routes found by repository search, including `app/actions/companies.ts`, `app/api/business-units/route.ts`, and `app/actions/manage-users.ts`.

## Result

| Classification | Count | Meaning |
|---|---:|---|
| Evidence-backed, unapproved | 3 | Existing source/target proposals plus application usage and prior staging count evidence: `tblCompany`, `tblBusinessUnit`, `tblEmployee`. |
| Additional code-supported candidates | 3 | Explicit legacy contract mappings for `tblLibrary`, `tblLibraryHierarchy`, `tblLibraryAccess`; target semantics are named, but target schema/columns and execution evidence are not sufficient for approval. |
| Unresolved | 335 | No defensible source-to-target mapping from code and local artifacts without guessing. |
| Approved | 0 | No mapping is auto-approved. |

The three additional candidates are classified as **candidate**, not evidence-backed imports:

| Source table | Candidate target | Evidence | Confidence | Status |
|---|---|---|---|---|
| `dbo.tblLibrary` | `public.document` | `lib/legacy-migration-contracts.ts:43-55`, `legacyLibraryMapping.tables.tblLibrary`; repository document actions use the current document domain. | Medium | Candidate; unapproved |
| `dbo.tblLibraryHierarchy` | `public.document_folder` | `lib/legacy-migration-contracts.ts:43-55`, explicit contract and parent-before-document rule. | Medium | Candidate; unapproved |
| `dbo.tblLibraryAccess` | `review_required_acl` | `lib/legacy-migration-contracts.ts:43-55`; explicitly says review-required ACL rather than a Neon table. | Low/Medium | Candidate; no target table established |

## Existing evidence-backed proposals

| Source table | Target | Evidence paths and lines | Count evidence | Status |
|---|---|---|---|---|
| `dbo.tblCompany` | `public.company` | `config/aegis-table-mapping-proposal.json` proposal; `app/actions/companies.ts:41-83`; `reports/aegis-staging-audit-final.md` table register | 1 source vs 3 staging | Evidence-backed proposal; unapproved |
| `dbo.tblBusinessUnit` | `public.business_unit` | `config/aegis-table-mapping-proposal.json`; `app/api/business-units/route.ts:22-74`; `reports/aegis-staging-audit-final.md` | 7 vs 7 | Evidence-backed proposal; unapproved |
| `dbo.tblEmployee` | `public.employee` | `config/aegis-table-mapping-proposal.json`; `scripts/import-users.mjs:4-6,315-334`; `scripts/verify-employee-operations.ts:9-46`; `reports/aegis-staging-audit-final.md` | 378 vs 369 | Evidence-backed proposal; unapproved |

Application code confirms target-domain usage, not historical lineage or successful import. `scripts/import-users.mjs:315-334` is an import implementation and must not be treated as execution evidence.

## Other code findings

- `lib/aegis-field-mapping.ts:1-2,` defines incident field-level proposals and explicitly marks unresolved lookup references as `BLOCKED`/`REVIEW`; it does not establish source table-to-Neon table mappings.
- `lib/legacy-migration-contracts.ts:57-72` contains a training contract, but its source names are generic (`records`, `employees`, `courses`, etc.) and do not match validated source table names sufficiently to map additional inventory entries without a source-table contract.
- `scripts/plan-aegis-import.mjs:25-27` performs exact `public.<sourceTable>` lookup against target metadata; this is planning logic, not evidence that a target exists or was populated.
- `scripts/verify-aegis-import.mjs:21-24` can create a verification artifact, but no completed artifact was found. Its existence is not execution evidence.
- `config/aegis-table-mapping.json` has `tables:[]`; no approved mapping manifest exists.
- Existing application queries reference current Neon tables and business domains, but do not contain legacy-table identifiers for the remaining 335 source tables.

## `tblCompany` and `tblEmployee` safe checks

No personal row data was read or exposed. The minimum safe future read-only checks are:

1. `tblCompany`: compare a keyed digest set built from stable source `Cmp_Id`/`Cmp_Code` and target company key/code, plus aggregate counts by null/non-null key and collision counts. Do not return names, tax numbers, logo data, or full rows.
2. `tblEmployee`: compare keyed digest sets using approved stable `Emp_Id` or `Emp_Payroll_No`; report only counts of source-only, target-only, matched, duplicate, and null-key groups. Do not select or output names, emails, dates of birth, or other personal fields.

These checks would distinguish pre-existing rows, filtering, duplicate/conflict handling, and key transformation, but require explicit approval and a documented source-to-target key contract.

## Missing transformation logic

The repository does not provide, for the unresolved source tables:

- a source-table-to-target-table manifest;
- target column/constraint definitions paired with each source table;
- source-to-target key and foreign-key transformations;
- rules for split/merge, soft-delete, audit-only, attachment/blob, or derived tables;
- a non-PII record-level comparison contract;
- a completed import/verification artifact.

Therefore the 335 unresolved tables remain unresolved. Name similarity, source metadata alone, application aggregate counts, and the presence of an import script were not used as proof.

## Exact next action

Obtain a reviewed mapping manifest and target schema/column evidence for the 335 unresolved tables. Then, with explicit approval, run a read-only per-table audit using stable-key hashes and redacted aggregate outcomes. Keep all proposals unapproved until that evidence and transformation contract are reviewed.
