# Investigation: Imported HSE Documents vs `public.document`

Generated from read-only Neon inspection. No database writes, DDL, uploads, storage changes, auth changes, or deployment actions were performed.

## Executive conclusion

The two rows in `public.document` are not the complete Aegis document inventory. The imported source contains document/file metadata in multiple source tables, most notably:

- `dbo.tblAttachments`: 1,791 rows; 1,007 are `TrainingCert` attachments and 879 of those are not deleted.
- `dbo.tblLibrary`: 657 rows; 487 are not deleted, and 504 rows have a file extension/file-object marker.
- `dbo.tblPTWDocument`: 2 document-type lookup rows, but no file content or path.
- `dbo.tblImportFileHistory`: 52 historical import-file metadata rows with relative paths.
- `dbo.tblMonthlySheet`: 588 rows with file names and paths.
- `dbo.tblInvestigation_Has_Papers`: 8 rows with `OtherDocument` metadata.

The source export contains metadata and relative file references, not the actual binary files. No base64 payloads or HTTP URLs were found. Therefore this is primarily a missing-file-artifact and missing-application-mapping problem, not evidence that the source database had only two documents.

## 1. Staging schema and storage shape

`aegis_import.source_rows` has exactly three columns:

| Column | Type | Nullable |
|---|---|---|
| `source_table` | `text` | no |
| `row_number` | `integer` | no |
| `data` | `jsonb` | no |

Source table names are stored as strings such as `dbo__tblAttachments`; each source row's complete exported record is stored in `data` as JSONB.

The staging inventory contains 269 distinct source tables and 139,123 rows, consistent with the prior export audit.

## 2. Likely document/file source tables

| Source table | Rows | Document-related fields/evidence | File-content evidence |
|---|---:|---|---|
| `dbo.tblAttachments` | 1,791 | `AttachmentId`, `AttachmentName`, `AttachmentPath`, `ParentId`, `ParentGroup`, `Is_Deleted` | Filename and relative Windows path only; no binary/content column |
| `dbo.tblLibrary` | 657 | `FileExt`, `FolerFileType`; 504 file-object rows; 487 active rows | File extension/type marker, but sampled rows have no populated file name/path/content fields |
| `dbo.tblPTWDocument` | 2 | `Document`, `Description`, `DocId` | Document lookup metadata only; no file reference |
| `dbo.tblImportFileHistory` | 52 | `FileName`, `FilePath`, `EntityName`, import notes | Historical source filename and relative path only |
| `dbo.tblMonthlySheet` | 588 | `FileName`, `FilePath` | Filename and relative path only |
| `dbo.tblInvestigation_Has_Papers` | 8 | `OtherDocument`, `Papers_Id` | Text metadata only in inspected fields |
| `dbo.tblCertificates` | 1 | `CertificateName`, `CertificateShortName` | Certificate type definition only; no certificate file |
| `dbo.tblRiskMatrix` | 4 | `HelpFileName`, `HelpFilePath` | Help-file metadata/path only |
| `dbo.tblExcelTemplate` | 10 | `FileAliasName`, `FileName` | Template filename metadata only |
| `dbo.tblCompany` | 1 | `Cmp_Logo_File`, `Cmp_Logo` | Logo fields are empty/null in the verified source payload |

Attachment parent groups include `TrainingCert` (1,007), `AuditQuestion` (144), `Meeting` (141), `AIAuditTo` (122), `SBO` (57), `HSEINCMaster` (41), `AIMeetTo` (36), `MOCReviewMaster` (33), `MOCMaster` (32), and other HSE/inspection/investigation groups.

## 3. Representative source evidence

Examples from `dbo.tblAttachments` include:

```text
AttachmentName: RAG Report - SP2000 V5 (79).pdf
AttachmentPath: XOM\\AuditQuestion\\b49ced8f-f903-426a-9cea-e91f860bed72.pdf

AttachmentName: AKHILASH CHOPRA FTW certificate. Exp 04-08-2026.pdf
AttachmentPath: XOM\\TrainingCERT\\512eb789-9f6f-4c99-9407-a24df92988c4.pdf
```

These values prove that source rows reference files by name and relative path. They do not prove that the corresponding file bytes were exported or are still available.

`dbo.tblImportFileHistory` similarly contains values such as:

```text
FileName: Observations May 2026.xls
FilePath: XOM\\Imports\\dd48291c1-de1-474c-9185-c52079fc2271.xls
```

`dbo.tblPTWDocument` contains only lookup-style records such as `Job Safety Analysis` and `Risk Assessment`, without a file name, path, URL, or content field.

## 4. File-content and reference analysis

Across values in fields whose names indicate files, attachments, paths, URLs, documents, scans, images, permits, certificates, or licenses:

- Candidate values inspected: 10,223.
- Base64-like payloads: 0.
- HTTP URLs: 0.
- Filename/path-like values: 4,188.
- Source paths are predominantly relative Windows paths such as `XOM\\TrainingCERT\\...pdf`.
- No source row was verified to contain actual PDF/image/office bytes in JSONB.

The ZIP/export diagnostics also establish that the export package contains JSON table data and metadata, not the referenced file directories or blobs. Therefore the source rows cannot by themselves recreate the missing files.

## 5. Export and import evidence

The existing export diagnostics report confirms:

- The ZIP was read-only inspected and not modified.
- Export entries are JSON table payloads generated by the SQL Server exporter.
- The original ZIP contains source table data and metadata, not the external file artifacts referenced by relative paths.
- The prior import process populated `aegis_import.source_rows`; it did not create document mappings from these source file tables into `public.document`.
- Migration mappings remain unapproved and no Neon writes were executed.

No separate application-level file import log was found that verifies copying the legacy file root into Vercel Blob. `tblImportFileHistory` is source-system history, not proof that those source files were transferred.

## 6. Current application storage path

The application reads library documents exclusively from `public.document`:

- Admin/company reads use `SELECT * FROM public.document` or `WHERE company_id = $1` in `app/actions/manage-documents.ts`.
- Non-admin reads are also scoped to `public.document` and its `is_public`/`allowed_emails` fields.
- Uploads use Vercel Blob via `uploadFileAction` and insert the resulting URL/pathname into `public.document`.
- The upload route also writes to Vercel Blob, but it is a separate upload path and does not read or import `aegis_import.source_rows`.
- Existing uploads use public Blob access; this is current application behavior and was not changed during this investigation.

There is no existing application query that reads `dbo.tblAttachments`, `dbo.tblLibrary`, or another source table for the document-library page.

## 7. Comparison with current application records

`public.document` currently contains exactly two records:

1. `hse` — `XOM May Audit Report Summary.pdf`, a Vercel Blob URL.
2. `Documents and Records Control Procedure` — `FAL-HSEQ-SOP-001 Documents and Records Control Procedure V4.pdf`, a Vercel Blob URL.

Neither record has a verified source-table key or source attachment ID linking it to `dbo.tblAttachments` or `dbo.tblLibrary`. Their names do not establish that they came from the Aegis export. They are therefore treated as existing application uploads with no verified source mapping.

The source attachment inventory has no destination mapping into `public.document` in the current application or approved migration ledger. The relative source paths also do not resolve to Vercel Blob URLs without an independently supplied legacy file root and an explicit copy/mapping process.

## 8. Distinguish the failure modes

- **Missing source metadata:** not the main issue. The export contains substantial document/file metadata.
- **Missing file artifacts:** confirmed for this export package. Referenced PDFs, images, certificates, and spreadsheets are not present as bytes in the JSON/ZIP staging data.
- **Missing application mapping:** confirmed. The app only exposes `public.document`, while source attachments/library records remain in `aegis_import.source_rows`.
- **Broken current files:** not indicated for the two current app records; both previously verified Blob URLs returned HTTP 200 and `application/pdf`.
- **Complete source document inventory:** cannot be reconstructed from the SQL/JSON export alone because the external file root was not included.

## 9. Recommended next steps, pending approval

1. Obtain a read-only copy or manifest of the legacy file root corresponding to paths such as `XOM\\TrainingCERT`, `XOM\\AuditQuestion`, `XOM\\SBOFiles`, and `XOM\\Imports`.
2. Hash and inventory those files without uploading or changing production storage.
3. Build a source-to-file reconciliation report using normalized relative path, source attachment ID, parent group, filename, and SHA-256.
4. Define approved mappings for each intended application area: document library, training certificates, audit attachments, PTW records, investigation papers, and import history.
5. Decide whether each destination should be `public.document`, a dedicated attachment table, or a read-only legacy archive view. Do not collapse all source attachments into `public.document` without preserving parent context and access rules.
6. Run a dry-run against a verified disposable Neon target and a non-production/private Blob target only after explicit approval.
7. Keep unmatched metadata, missing files, duplicate paths, and ambiguous parent references quarantined; do not invent URLs or claim files exist.

## Safety result

This investigation used read-only SQL and file/code inspection only. No rows, tables, schemas, authentication records, storage configuration, or environment variables were changed. The report stops here pending approval of the legacy file-root acquisition and destination mapping plan.
