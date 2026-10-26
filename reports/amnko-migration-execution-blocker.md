# AMNKO HSE migration execution decision

## Decision
STOP. Do not upload or link any of the 46 attachments.

## Blocking evidence
The current manifest/crosswalk contains 46 attachment rows and 29 distinct parents, but every `TargetId` is blank and every mapping is `UNRESOLVED_NEON_ID`. The available Neon export contains current/test rows without AMNKO legacy keys or Rowguid values, and the migration-record export is empty. Numeric equality, title similarity, and test/demo rows are not proof.

## Prepared change
`reports/amnko-attachment-records-migration-proposal.sql` is a review-only up/down proposal. It adds a separate `public.attachment_records` table and indexes, preserves all existing `incident`/`journey` fields, and provides a commented rollback. It has not been executed.

## Shortest trusted-source request
Obtain one read-only source-to-target ledger from the AMNKO HSE SQL Server migration owner containing, per relevant row: `source_table`, legacy primary-key value, `Rowguid`, `target_table`, actual Neon `target_id`, import status, and exact evidence row/log reference. Exclude test/demo rows. Populate only proven rows in the local crosswalk.

## Current execution counts
- Verified parent mappings: 0/29
- Safely linkable attachments: 0/46
- Blob uploads: 0
- Database writes: 0

No schema, data, Blob, environment, deployment, commit, or push operation was performed.
