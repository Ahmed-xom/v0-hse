# HSE complete source-to-Neon mapping review

## Scope and safety

Read-only review of the validated historical export and existing local mapping/application evidence. No Neon connection, production access, import, write, migration, DDL, environment change, deployment, or approval was performed.

## Evidence used

- `reports/aegis-historical-export-manifest.json`: 341 source tables, 139,123 documented rows, 269 populated payloads, 72 empty tables; per-table declared and parsed counts.
- `.tmp/aegis-source-table-inventory.json`: source table names and verified source row counts.
- Historical export metadata in Git blob `d0958240c73b1a4fed16ca186b58108c4518ec1a:.tmp/Aegis_XOM_Export.zip`: `columns.json`, `primary_keys.json`, `foreign_keys.json`, and `tables.json`.
- `reports/aegis-mapping-gap-review.md` and `reports/aegis-staging-audit-final.md`.
- Existing mapping proposals and application query/migration contracts, including `config/aegis-table-mapping-proposal.json`, `config/aegis-core-mapping-review.json`, `lib/legacy-migration-contracts.ts`, `lib/aegis-field-mapping.ts`, and relevant scripts.

## Consolidated result

| Category | Count | Meaning |
|---|---:|---|
| Source tables reviewed | 341 | Every inventory entry was retained; no names were fabricated. |
| Evidence-backed mapping proposals | 3 | `tblCompany`, `tblBusinessUnit`, `tblEmployee`; all remain unapproved. |
| Actual target count checks | 3 | Read-only counts previously obtained for the three proposals. |
| Count matches | 1 | `tblBusinessUnit`: 7 source vs 7 staging. |
| Count mismatches | 2 | `tblCompany`: 1 vs 3; `tblEmployee`: 378 vs 369. |
| Unresolved mappings | 338 | No defensible target can be assigned without target schema/lineage evidence and mapping decisions. |
| Approved mappings | 0 | This review never auto-approves. |

## Evidence-backed proposals (not approvals)

| Source table | Source row count | Source schema evidence | Proposed target | Target evidence | Confidence | Status |
|---|---:|---|---|---|---|---|
| `dbo.tblCompany` | 1 | Columns/PK/FK available in historical metadata; proposal identifies `Cmp_Id`, `Cmp_Name`, `Cmp_Code` | `public.company` | Existing staging schema/table and application usage | Medium | Unapproved; count mismatch (+2 staging) |
| `dbo.tblBusinessUnit` | 7 | Columns/PK/FK available in historical metadata; proposal identifies `BU_Id`, `BU_Name`, `BU_Desc`, `BU_Under_Id` | `public.business_unit` | Existing staging schema/table and application usage | Medium | Unapproved; count match only |
| `dbo.tblEmployee` | 378 | Columns/PK/FK available in historical metadata; proposal identifies `Emp_Id`, `Emp_Payroll_No`, `Emp_Name`, `Emp_EmailId`, `BU_Id` | `public.employee` | Existing staging schema/table and application usage | Medium | Unapproved; count mismatch (-9 staging) |

The existing application queries support destination usage, not complete legacy lineage. Counts are not record-level proof.

## Metadata coverage for all 341 source tables

The historical metadata is available for every source-table review: `columns.json` supplies actual column names, SQL Server data types, nullability, identity/computed/default flags; `primary_keys.json` supplies primary-key columns where defined; `foreign_keys.json` supplies source/target columns and constraints; `tables.json` supplies table classification and source row count. The authoritative per-table names and counts remain the 341 entries in `.tmp/aegis-source-table-inventory.json` and `reports/aegis-historical-export-manifest.json`; this report does not duplicate sensitive row payloads.

For the remaining 338 tables, the metadata proves source shape only. It does not prove a Neon target. Existing target schema evidence and application queries do not provide a one-to-one target for those source tables, and name similarity alone is insufficient. Therefore they remain unresolved rather than being guessed or marked missing.

## Known count findings

- `tblCompany`: source 1; staging `public.company` 3; difference +2 staging rows.
- `tblBusinessUnit`: source 7; staging `public.business_unit` 7; difference 0.
- `tblEmployee`: source 378; staging `public.employee` 369; difference -9 staging rows.

### Minimum additional read-only evidence for record-level comparison

For `tblCompany`, obtain the source column definition plus a source-row projection containing only the stable key and non-sensitive matching fields (for example `Cmp_Id`, `Cmp_Code`, and normalized name), and a target projection of `public.company` stable key/code/name plus creation/import lineage if present. Do not expose row payloads in the report. This is the minimum needed to distinguish pre-existing target rows, transformations, and true extra rows.

For `tblEmployee`, obtain the source primary key and documented stable business key (prefer `Emp_Id`, `Emp_Payroll_No`, or an approved equivalent), plus a target projection of employee stable key/payroll identifier and import lineage. Exclude names, emails, and other personal fields from the report; retain only hashed/redacted comparison outcomes and counts. This is the minimum needed to classify the nine-row difference as missing, duplicate, filtered, or transformed.

## Unresolved schema evidence

The following exact evidence is missing for each of the 338 unresolved mappings:

1. An approved target schema/table candidate, not merely a table-name resemblance.
2. Target column definitions and constraints for that candidate, including target primary/unique keys and foreign keys.
3. A source-column-to-target-column transformation contract, including exclusions and split/merge behavior.
4. A safe identity/matching key and read-only count query for that source-target pair.
5. Evidence that the candidate is the intended staging target rather than an application table with unrelated semantics.

No report can responsibly resolve these 338 mappings from the available artifacts. Source PK/FK metadata describes legacy relationships but cannot establish target ownership or transformation semantics.

## Exact next action

Obtain an approved source-to-target mapping contract and target schema snapshot for the 338 unresolved tables. Then run a separately approved, read-only per-table audit using stable keys and redacted comparison outputs. Do not import, write, alter schemas, or treat aggregate counts as migration proof before that evidence exists.

## Conclusion

The current artifacts resolve **3 evidence-backed, unapproved proposals**, leave **338 mappings unresolved**, and establish only the three stated count comparisons. No mapping is approved and no record-level migration success is proven.
