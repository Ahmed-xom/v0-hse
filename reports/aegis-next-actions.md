# HSE — next actions for the 335 unresolved tables

## Scope

This is a focused follow-up to `config/aegis-final-mapping-review.json`. No source inventory or prior report was regenerated, and no service was contacted. The authoritative per-table membership is the 335 entries whose `classification` is `unresolved` in that config; their exact source names and row counts are retained there.

Existing evidence reviewed locally:

- `config/aegis-final-mapping-review.json`
- `reports/aegis-migration-final-status.md`
- `reports/aegis-migration-readiness-plan.md`
- `reports/aegis-code-based-mapping-review.md`
- `reports/aegis-neon-staging-schema-evidence.md`
- `lib/legacy-migration-contracts.ts`
- `lib/aegis-field-mapping.ts`
- application actions/routes and migration scripts referenced by the code review
- historical PK/FK metadata already cited by the readiness plan

## What can be resolved with current evidence

No additional table can be safely resolved beyond the existing six non-approved entries:

- Evidence-backed proposals: `dbo.tblCompany`, `dbo.tblBusinessUnit`, `dbo.tblEmployee`.
- Candidates requiring review: `dbo.tblLibrary`, `dbo.tblLibraryHierarchy`, `dbo.tblLibraryAccess`.
- The remaining **335** entries have no target table supported simultaneously by target schema evidence, source key evidence, and application lineage. Name similarity, row counts, generic domain nouns, and import-script presence are insufficient.

These six entries remain proposals/candidates; none is approved.

## Exact classification of every unresolved entry

The classification below is calculated per unresolved entry from the current config and the historical source-key metadata. It is not a new mapping.

| Missing evidence class | Number of tables | Exact meaning |
|---|---:|---|
| Target table + columns + transformation + business rule | 146 | PK and at least one source FK are recorded in historical metadata, but target identity, target columns, conversion rules, and business semantics are absent. |
| Target table + columns + transformation + business rule + FK | 81 | A source PK is recorded, but no source FK metadata is recorded for that table; target relationship and orphan/null policy still need evidence. |
| Target table + columns + transformation + business rule + PK + FK | 64 | Neither a source PK nor a source FK is recorded for the table; identity and relationships must be decided before mapping. |
| Target table + columns + transformation + business rule + PK | 44 | Source FK metadata exists, but no source PK metadata is recorded; the target identity and FK translation cannot be established. |
| **Total** | **335** | Every unresolved entry is included exactly once. |

The per-table assignment is deterministic: start with the entry’s `source_qualified_name` in `config/aegis-final-mapping-review.json`; add `PK` when that table is absent from the historical primary-key metadata, add `FK` when absent from historical foreign-key metadata, and always require the four target/column/transformation/business-rule classes because no reviewed target contract exists. This prevents a table with metadata from being mistaken for a mapped table.

## One-to-many and business-rule gaps

Source FK presence does not prove target cardinality. For all 146 + 81 + 44 tables with an FK record, the missing decision is the target relationship contract: parent key, child key, nullable/root behavior, uniqueness, cascade policy, and whether the source relationship is one-to-many, many-to-many through a link table, or a denormalized repeated field. For the 64 tables without source PK/FK metadata, this relationship classification is additionally blocked by missing source constraints.

Tables whose names suggest audit/history, import, dashboard, router, tenant, attachment, lookup, or link behavior must not be assigned a target based on the name. Each needs an explicit business disposition: migrate, archive-only, exclude, or reconstruct as a derived table.

## Human decisions required

1. Supply one reviewed disposition for every unresolved entry: target schema/table, archive-only, or explicit exclusion.
2. For each proposed target, choose source-key retention versus translated UUID/key and define collision handling.
3. Decide every source FK’s target FK, null/root behavior, orphan handling, and cycle strategy.
4. Decide column casts, enum/status normalization, default values, generated fields, split/merge/denormalization rules, attachments/blob treatment, and soft-delete/history retention.
5. For tables with missing source PK metadata, choose a stable identity or explicitly classify the table as non-entity/derived/archive-only.
6. For tables with missing source FK metadata, provide relationship evidence or explicitly mark relationships as absent/unresolved.
7. Define a non-PII keyed validation key for each table before any import approval.

## Exact evidence still required

The shortest evidence package that can close the gaps is:

- A reviewed source-to-target mapping manifest covering all 335 entries, including explicit archive/exclude dispositions.
- Source `columns.json`, `primary_keys.json`, and `foreign_keys.json` entries paired to each manifest row; where PK/FK metadata is absent, a source DBA constraint extract or approved natural-key decision.
- Target Neon schema/constraint extract for each named target, including columns, types, PKs, FKs, unique constraints, and nullable/default behavior.
- A transformation contract per non-trivial table: casts, lookup translation, split/merge, link-table cardinality, soft-delete, history, tenant scope, and attachment handling.
- Application lineage evidence only where the app actually reads/writes that source concept; current queries do not establish historical lineage for the 335.

## Shortest path to keyed read-only validation

1. Produce and review the 335-row mapping/disposition manifest; do not approve writes.
2. Resolve PK/FK and target-column decisions for the smallest dependency-safe pilot: `tblBusinessUnit`, then `tblCompany`, then `tblEmployee`.
3. Record the approved stable key or HMAC input and normalization rule for each pilot table.
4. Run read-only source/target projections that return only aggregate counts: total keys, null keys, duplicate keys, matched, source-only, target-only, and FK orphan counts. Never return names, emails, or full rows.
5. Store branch identity, query hashes, mapping version, and aggregate results as evidence. Counts alone remain insufficient without keyed comparison.

## Single next action

Provide a reviewed 335-row mapping/disposition manifest with PK/FK and target-column evidence. This is the only missing artifact that unlocks a deterministic keyed read-only audit; until it exists, no additional target mapping can be responsibly inferred and no approval or import should occur.
