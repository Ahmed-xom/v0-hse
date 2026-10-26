# AMNKO HSE attachment linking plan

## Scope and safety

This is a read-only linkage plan for Neon staging branch `br-wispy-hill-apxr32tq` / database `neondb`. No `INSERT`, `UPDATE`, `DELETE`, DDL, Blob upload, overwrite, environment change, commit, push, or deployment was performed.

The supplied archive was available at `/tmp/amnko-attached.zip` and the project copy at `reports/amnko-drive-verified-attachments.zip`. Both are 30,868,850 bytes. The archive contains 46 attachment files plus `index.csv`; the index has 47 lines including its header. All index rows are marked `VERIFIED` and include archive member, byte size, and SHA-256.

## Current database evidence

Read-only schema inspection found:

- `public.attachment_records`: 46 active rows, all with empty `target_id` (`46 UNLINKED`).
- `public.aegis_migration_record`: table exists, but contains 0 rows.
- `public.incident`: only current/test application incidents are present; no row contains a proven AMNKO legacy key or Rowguid.
- `public.journey`: one current/test application journey is present; no row contains a proven AMNKO legacy key or Rowguid.

The current attachment rows also contain `legacy_parent_group`, `legacy_parent_id`, and `legacy_rowguid` as `UNLINKED`, so they do not provide a source-to-target identity. Archive paths identify source groups (`HSEINCMaster`/incident and `JM`/journey), but an archive path or numeric attachment ID is not sufficient to identify the parent HSE record.

## Proposed matches

| Category | Count | Target | Evidence | Status |
|---|---:|---|---|---|
| Confirmed incident links | 0 | `public.incident.id` | No target-side legacy key/Rowguid or migration ledger | `BLOCKED_UNRESOLVED_TARGET_ID` |
| Confirmed journey links | 0 | `public.journey.id` | No target-side legacy key/Rowguid or migration ledger | `BLOCKED_UNRESOLVED_TARGET_ID` |
| Unresolved attachments | 46 | None | All attachment parent identity fields are `UNLINKED`; migration ledger is empty | `UNRESOLVED_TARGET_ID` |

No attachment is linked based on filename similarity, numeric equality, title similarity, aggregate counts, or test records. The source grouping in `index.csv` is retained as evidence of the legacy source family only, not as a target-row mapping.

## Existing application surface

No code changes were needed for the requested read-only planning stage. The existing admin page is `app/admin/amnko-attachments/page.tsx`; it loads `GET /api/amnko-attachments`, displays the current `UNLINKED` state, and uses the protected `/api/amnko-attachments/file?attachmentId=...` route for preview/download. The API routes are:

- `app/api/amnko-attachments/route.ts`
- `app/api/amnko-attachments/file/route.ts`

Both routes use `requireAdmin`; no public file URL or permission bypass was added. The download route intentionally returns 404 for records with a non-empty `target_id`, so it is not a linking mechanism and was not changed.

## Required approval gate

Before any actual link or upload, provide and approve one authoritative source-to-target ledger containing, for every relevant legacy parent:

`source_table`, legacy parent key, `Rowguid`, `target_table`, actual Neon `target_id`, import status, and exact evidence reference.

The ledger must exclude test/demo rows and must not infer identity from numeric equality, approximate titles, or filenames. After the ledger is reviewed, separately approve the existing private, deterministic, non-overwriting attachment-record/Blob execution design. Only then should a write-enabled migration be considered.

## Source-export crosswalk investigation (read-only)

The original source export was inspected rather than relying only on the prior Neon query:

- `.tmp/Aegis_XOM_Export.zip` is a 350-entry read-only export from Git history. Its metadata reports 341 tables, 269 populated tables, and 139,123 rows.
- The original attachment table was found at `table_data\\dbo__tblAttachments.json`. Its discovered columns are `AttachmentId`, `ParentGroup`, `ParentId`, `AttachmentName`, `AttachmentPath`, `SrNo`, `Is_Deleted`, and `Rowguid`.
- The 46 selected attachments are present in that table: 19 rows have `ParentGroup=HSEINCMaster` and 27 have `ParentGroup=JM`. For the selected incident attachments, all parent IDs `{1,4,6,9,11,14,15,18}` exist as `Event_Id` values in `table_data\\dbo__tblHSEINC.json`. For the selected journey attachments, all parent IDs `{72..92}` exist as `JMId` values in `table_data\\dbo__tblJM.json`. This confirms the source parent-key transformation only: `HSEINCMaster.ParentId -> tblHSEINC.Event_Id` and `JM.ParentId -> tblJM.JMId`.
- Important correction: `tblAttachments.Rowguid` is the Rowguid of the attachment row itself. It is not evidence of the parent record's Rowguid. The parent tables have their own identity fields, but the attachment export does not carry a parent Rowguid column.
- The incident source table was found as `table_data\\dbo__tblHSEINC.json`; its identity fields include `Event_Id`, `Event_Number`, and `Rowguid`. The journey source table was found as `table_data\\dbo__tblJM.json`; its identity field is `JMId` (and it has its own source Rowguid field). These source identities do not provide Neon target UUIDs.
- No source-to-Neon target ledger was found in the recovered export artifacts. The recovered Neon crosswalk export has headers but no rows, and `amnko-neon-aegis-migration-record-export.csv` is empty. The available target exports do not contain a proven legacy key/Rowguid cross-reference.

The complete 46-row evidence CSV is `reports/amnko-attachment-source-crosswalk.csv`. It records `AttachmentId`, `AttachmentName`, `ParentGroup`, `ParentId`, the attachment-row `Rowguid`, the source entity/key transformation, target table/ID fields, evidence references, and status for every attachment. Source parent-key identity is evidenced for all 46, but parent Rowguid and target identity are not evidenced for any:

- `CONFIRMED`: 0
- `AMBIGUOUS`: 0
- `UNRESOLVED`: 46

Missing evidence is specifically the source-to-target crosswalk containing the actual Neon `incident.id` or `journey.id` for each legacy parent. No target IDs were inferred from filenames, numeric keys, titles, or counts.

**Current result: 0/46 confirmed mappings; 46/46 unresolved.**
