# HSE Document Library Audit

Audit date: 10 October 2026. Scope: read-only inspection of the live `public.document` table, existing library code, and stored Blob references. No document rows, files, permissions, storage settings, or credentials were changed.

## Current implementation

- Metadata is stored in `public.document` and accessed by `app/actions/manage-documents.ts`.
- The Library UI is `components/dashboard/documents-library.tsx` and is rendered from `app/page.tsx`.
- Files are uploaded through the server action to Vercel Blob under `hse-files/...`.
- The current upload action uses `access: 'public'`. This is a security finding for confidential HSE records; it was not changed in this audit because changing existing Blob access requires an approved storage migration and access-path design.
- Manager actions require Better Auth session roles (`MASTER USER`, `ADMIN SYSTEM`, `HSE ADMIN`, `ADMIN`). Viewer queries apply company and `is_public`/`allowed_emails` filters, but the stored Blob URL itself is publicly addressable.

## Inventory summary

| Measure | Count |
| --- | ---: |
| Documents | 2 |
| With file URL | 2 |
| Missing file URL | 0 |
| Missing file name | 0 |
| Missing expiry date | 0 |
| Expired as of audit date | 1 |
| Expiring within 30 days | 0 |
| Duplicate file references | 0 |
| Broken links found by HEAD check | 0 |

Both current Blob URLs returned HTTP 200 and `application/pdf` during the read-only availability check.

## Category and status summary

| Category | Status | Count | Expired | Expiring soon | Missing file |
| --- | --- | ---: | ---: | ---: | ---: |
| Policy | Active | 1 | 1 | 0 | 0 |
| Procedure | Active | 1 | 0 | 0 | 0 |

## Controlled-document review

| Document | Classification | Evidence |
| --- | --- | --- |
| `hse` / `DOC-2026-0001` — XOM May Audit Report Summary | Expired | Existing expiry date `2026-06-30`; file is available and verified HTTP 200. Do not mark renewed without an approved replacement. |
| `Documents and Records Control Procedure` / `DOC-2026-0002` | Valid | Existing expiry date `2026-11-22`; file is available and verified HTTP 200. It is not within 30 days of expiry at audit date. |

No certificate, permit, or license records were present in the current `public.document` result set. This is an inventory finding, not proof that none exist outside this table or in other HSE attachment tables.

## Proposed update list — approval required

| Record | Current value | Proposed value | Reason | Approval |
| --- | --- | --- | --- | --- |
| `DOC-2026-0001` expiry | `2026-06-30` | No automatic replacement | Mark for manual review/renewal evidence; preserve current record and file | Authorized document owner |
| Blob access policy | Public Blob URL | Evaluate private Blob + authenticated download route | Prevent direct unauthorised downloads of confidential HSE documents | Security/storage owner |
| Library metadata | Search only title/doc no/owner/tags | Search also file name/category/business unit; add expiry filters and summary | Improve auditability without changing records | Implemented as safe UI-only change |

## Files changed

- `components/dashboard/documents-library.tsx`
  - Added file name, category, business unit, owner, and document-number search coverage.
  - Added expiry filters: valid, expiring soon, expired, and missing expiry.
  - Added audit summary counts for active, expired, expiring soon, and missing file/expiry metadata.
  - Added a visible expiry state in document details.
- `config/hse-document-library-audit.md`
  - Added this read-only inventory, findings, and proposed update list.

## Validation performed

- Read the live document metadata and category/status aggregates through Neon read-only SQL.
- Checked duplicate normalized file URLs; none found.
- Verified both stored Blob URLs with HTTP HEAD; both returned 200/application/pdf.
- Ran `git diff --check` and the project lint/build checks after implementation.

## Pending approval

No file contents, document metadata, expiry dates, status values, company assignments, permissions, Blob access settings, or database rows were changed. Replacement, deletion, renewal marking, private-storage migration, and any bulk metadata correction remain pending explicit authorized approval.

The current UI still uses direct Blob URLs for downloads because changing that safely requires a separate approved storage/access migration. 
