# AMNKO parent crosswalk export checklist

Purpose: produce the minimum read-only SQL Server evidence needed to map `dbo.tblAttachments.ParentGroup + ParentId` to actual Neon target IDs.

Input already available locally:
- `.tmp/aegis-attachments.csv`
- ParentGroup values are used only to select source parent evidence.
- Attachment rows and `Is_Deleted` values are not re-exported or changed.

Run `scripts/export-amnko-parent-crosswalk-readonly.sql` in SSMS against the authorized legacy `Aegis_XOM` database.

## Minimum workbook output

The SQL returns six result sets. Put them into one Excel workbook with these exact sheet names:

1. `SourceTableMetadata` — columns, PK columns, Rowguid/identity flags
2. `ParentGroupRequirements` — distinct ParentGroups and source row counts
3. `AttachmentParentEvidence` — attachment parent keys and deletion flags
4. `HSEINCMasterRows` — complete source rows
5. `HSEINCMaster2Rows` — complete source rows
6. `JMRows` — complete source rows

This is the minimum practical package: metadata and PK evidence are combined into one result set, while the three candidate parent tables remain separate so no table identity is guessed. If SSMS cannot create one workbook, save exactly six CSVs with these sheet names as filenames. Do not create additional exports.

## Minimum required evidence

- Source table and column metadata.
- Primary-key columns and Rowguid columns where present.
- Complete parent rows needed for every distinct `ParentGroup + ParentId`.
- Identity fields needed to distinguish duplicate or ambiguous legacy rows.
- `AttachmentId`, `ParentGroup`, `ParentId`, `AttachmentPath`, `AttachmentName`, `SrNo`, `Is_Deleted`, and `Rowguid` from `tblAttachments` when validating the export.

Do not infer a Neon ID from a legacy numeric ID. A mapping is VERIFIED only when a traceable legacy key/Rowguid and an actual Neon target ID are present in an approved crosswalk or target export. Unresolved groups remain unresolved.

## Exact SSMS steps

1. Open the SQL script in SSMS and select the authorized `Aegis_XOM` database.
2. Confirm **Results to Grid** and leave **SQLCMD Mode** off.
3. Execute once; do not run individual statements separately.
4. Copy each of the six result grids into one workbook using the sheet names above. If workbook export is unavailable, save exactly these files: `SourceTableMetadata.csv`, `ParentGroupRequirements.csv`, `AttachmentParentEvidence.csv`, `HSEINCMasterRows.csv`, `HSEINCMaster2Rows.csv`, and `JMRows.csv`.
5. Preserve NULLs, GUIDs, numeric precision, `ParentId` values, `AttachmentPath` text, and `Is_Deleted` values. Do not filter out deleted rows.
6. Send only the workbook or six CSVs for local comparison; no production writes or uploads are required.

## Local matching after export

- Match `ParentGroup + ParentId` to the returned parent rows.
- Preserve `ParentId` and `Rowguid` as source evidence.
- Match the legacy key/Rowguid to an approved Neon crosswalk/target export.
- Populate target IDs only for row-level, traceable matches.
- Keep deleted attachments excluded from migration unless separately approved.
