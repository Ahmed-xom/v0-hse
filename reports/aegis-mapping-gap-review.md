# HSE mapping gap review

## Scope and safety

- Source evidence: `reports/aegis-historical-export-manifest.json`, `.tmp/aegis-source-table-inventory.json`, and `reports/aegis-staging-audit-final.md`.
- Target evidence: read-only catalog/schema evidence from Neon project `spring-surf-19710398`, non-production branch `aegis-pilot-20261009` (`br-wispy-hill-apxr32tq`).
- No imports, writes, DDL, migrations, environment changes, production access, or deployment were performed.
- Existing mapping files remain proposals with `approved: false`.

## Result

| Category | Count |
|---|---:|
| Source tables | 341 |
| Proposed mappings with evidence | 3 |
| Proposed mappings re-counted read-only | 3 |
| Still unresolved | 338 |
| Target tables missing for evidence-backed proposals | 0 |

The three evidence-backed proposals are only semantic/name mappings already present in the reviewed project mapping evidence. Neon confirms that their target tables exist. Neon migration evidence tables contain no import/mapping/record/issue rows, so none is approved or proven as an import.

| Source | Proposed target | Evidence | Confidence | Source count | Staging count | Difference | Status |
|---|---|---|---|---:|---:|---:|---|
| `dbo.tblCompany` | `public.company` | Existing reviewed mapping; application uses `company`; target exists | medium, unapproved | 1 | 3 | +2 | mismatch |
| `dbo.tblBusinessUnit` | `public.business_unit` | Existing reviewed mapping; application uses `business_unit`; target exists | medium, unapproved | 7 | 7 | 0 | count match only |
| `dbo.tblEmployee` | `public.employee` | Existing reviewed mapping; application uses `employee`; target exists | medium, unapproved | **378** | 369 | -9 | mismatch |

## Important source-count correction

The previous staging report stated `tblEmployee` source count as 369 in its summary, but the validated source inventory and historical manifest record **378**. The complete register in that report also shows 378. The read-only comparison therefore treats `tblEmployee` as a 9-row mismatch, not a verified match. The earlier “2 verified matches / 1 mismatch” summary is stale and must not be used as migration evidence.

## Why the 338 tables remain unresolved

The recovered source inventory provides table names, row counts, and provenance, but no source column definitions. The historical ZIP payload was not extracted, and no source SQL Server access was used. Neon provides the destination catalog and target column definitions, but column similarity cannot establish a source-to-target mapping when the source schema is absent. Existing application queries identify current destination tables and fields, not the legacy source table/column lineage.

Accordingly, name-based candidates such as `tblCourses → public.course`, `tblAttachments → public.document`, or similarly named tables are **not promoted to evidence-backed mappings**. They lack a source-column/target-column compatibility check and an explicit mapping decision.

The 338 unresolved source tables are exactly the source inventory entries not equal to the three proposals above. Their names and source row counts remain available in `.tmp/aegis-source-table-inventory.json`; no target names or counts were fabricated.

## `tblCompany` mismatch

The only provable facts are:

- source inventory: 1 row;
- staging `public.company`: 3 rows;
- difference: 2 extra staging rows;
- migration evidence tables on the branch are empty.

The cause is **not provable** from available evidence. Possible explanations include pre-existing staging rows, a different source snapshot, or a source-to-target transformation/seed operation, but none may be selected without row identity/lineage evidence. The safe required evidence is a source `tblCompany` row payload/column definition plus non-sensitive target identity fields and creation/import lineage for the three staging rows. No delete or update is authorized by this review.

## Additional evidence gap

The same issue affects `tblBusinessUnit` and `tblEmployee`: matching or differing counts alone do not prove row identity, completeness, or transformation correctness. The current branch has no recorded import run or per-table verification records.

## Exact next evidence needed

1. A read-only source schema artifact for all 341 tables: column names, types, nullability, and primary/foreign-key metadata.
2. The approved source-to-target mapping contract, including transformations and exclusions.
3. For each proposed mapping, a read-only identity comparison using stable keys or documented matching fields.
4. For `tblCompany`, source row identity and staging `public.company` identity/lineage fields sufficient to classify the two extra rows.

Until those artifacts exist, the 338 tables remain unresolved and the three proposals remain unapproved.
