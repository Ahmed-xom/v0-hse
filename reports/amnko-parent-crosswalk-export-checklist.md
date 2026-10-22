# AMNKO parent crosswalk export checklist

Purpose: produce the minimum read-only SQL Server evidence needed to map `dbo.tblAttachments.ParentGroup + ParentId` to actual Neon target IDs.

Input already available locally:
- `.tmp/aegis-attachments.csv`
- ParentGroup values are used only to select source parent evidence.
- Attachment rows and `Is_Deleted` values are not re-exported or changed.

Run `scripts/export-amnko-parent-crosswalk-readonly.sql` in SSMS against the authorized legacy `Aegis_XOM` database.

## Workbook output

Export the result sets into one Excel workbook with these named sheets:

1. `SourceTableMetadata`
2. `ParentGroupRequirements`
3. `ParentTableKeys`
4. `HSEINCMasterRows`
5. `HSEINCMaster2Rows`
6. `JMRows`
7. `AttachmentParentEvidence`

If SSMS cannot produce one workbook directly, save the seven result sets as CSV files with these exact names. Do not create additional exports.

## Minimum required evidence

- Source table and column metadata.
- Primary-key columns and Rowguid columns where present.
- Complete parent rows needed for every distinct `ParentGroup + ParentId`.
- Identity fields needed to distinguish duplicate or ambiguous legacy rows.
- `AttachmentId`, `ParentGroup`, `ParentId`, `AttachmentPath`, `AttachmentName`, `SrNo`, `Is_Deleted`, and `Rowguid` from `tblAttachments` when validating the export.

Do not infer a Neon ID from a legacy numeric ID. A mapping is VERIFIED only when a traceable legacy key/Rowguid and an actual Neon target ID are present in an approved crosswalk or target export. Unresolved groups remain unresolved.

## SSMS steps

1. Open the SQL script in SSMS and select the authorized `Aegis_XOM` database.
2. Execute as Results to Grid; do not use SQLCMD mode.
3. Save each result grid as a CSV, or copy all result sets into one workbook using the sheet names above.
4. Preserve NULLs, GUIDs, numeric precision, and original path text.
5. Send only the workbook/CSVs for local comparison; no production writes or uploads are required.

## Local matching after export

- Match `ParentGroup + ParentId` to the returned parent rows.
- Preserve `ParentId` and `Rowguid` as source evidence.
- Match the legacy key/Rowguid to an approved Neon crosswalk/target export.
- Populate target IDs only for row-level, traceable matches.
- Keep deleted attachments excluded from migration unless separately approved.
