# AMNKO HSE Library Order Reconciliation

## Current counts

- `config/amnko-library-order.json`: 579 reference items; 273 with confirmed `blobPathname`; 306 unresolved.
- `/api/amnko-library`: 348 database documents; 268 with non-null `referenceOrder`.
- The difference is not a new matching result:
  - 7 confirmed manifest pathnames are absent from the current 348 API rows: `amnko-library/616__d1c89b26-fb7f-45d7-8780-e07689025b2b.pdf`, `5__482aa17c-c9aa-4ebe-8a4e-a3143472b80d.pdf`, `7__6f33b2fe-8e85-4b4f-9cb7-5889fc9a8897.pdf`, `10__9286c6f2-65d4-4f60-b4e5-8e8ce7f4df61.pdf`, `557__82ce8628-6562-42fb-af84-c25d07b9b2dd.pdf`, `528__cab11cbf-235d-4588-af7c-be36b44c50bf.pdf`, and `209__0238fe50-0e8d-43be-a05c-a35a487c5c35.pdf`.
  - 2 API pathnames use `.txt` where the manifest has `.pdf`: `616__d1c89b26-fb7f-45d7-8780-e07689025b2b` and `528__cab11cbf-235d-4588-af7c-be36b44c50bf`.
  - Therefore the net API-confirmed count is 268. No manifest change was made because the absent rows and extension variants require a current database/export reconciliation, not a guess.

## Unresolved 306 classification

All 306 entries currently have `matchEvidence` beginning `UNRESOLVED: no extracted-trace SourceName record`. No duplicate-name match was accepted without a stable identifier. Their unresolved source IDs/names remain in `config/amnko-library-order.json`; none was deleted or merged.

Evidence that could resolve them:

1. The original archive content or a complete source table export containing `LibraryId`, `Rowguid`, original filename/path, and preferably SHA-256. The local `.tmp/aegis-local-export-manifest.json` explicitly reports `sourceArchiveAvailableLocally: false`, `availableJsonFileCount: 0`, and `missingContent: 487`.
2. A complete import manifest containing the 306 missing source IDs and their resulting `document_id`/`blob_pathname`.
3. A current database export of all `public.amnko_library_document_link` rows joined to `public.document`, including `document_id`, `blob_pathname`, `sha256`, and any original source ID. The current API has only 348 rows and cannot prove the absent seven pathnames.
4. For the two extension variants, an explicit export/pathname reconciliation proving `.pdf` and `.txt` are the same stored object; the API currently proves only the `.txt` path.

Files checked in this turn as new evidence: `.tmp/aegis-local-export-manifest.json`, `reports/amnko-required-target-export.csv`, `reports/amnko-library-import-plan.json`, and `reports/amnko-library-link-recovery.csv`. Previously examined crosswalks/Git history were not re-scanned.

## Validation

- API count: 348.
- API reference-ordered count: 268.
- No new confirmed manifest match was added in this turn.
- `pnpm build`: run after this report-only update; result is reported with the task response.
- Neon, Blob, Production, and `DATABASE_URL` were not changed. No commit, push, or deploy was performed.
