# Aegis row-count discrepancy audit

## Result
The 30-row discrepancy is **not missing source data**. It is a validation/parser artifact in the previously generated manifest report.

The historical exporter script in Git (`scripts/export-aegis-readonly.ps1`, present at the export commit) writes `row_counts.json` from the SQL Server table inventory and computes `manifest.total_rows` from that same row-count set. It writes each table payload with `ConvertTo-Json`.

For a table with exactly one row, PowerShell `ConvertTo-Json` emits a JSON object rather than a one-element JSON array. The existing report parser only counts arrays or object properties named `rows`, `data`, `records`, or `items`; it therefore recorded these singleton files as `parsed_row_count: null` and incorrectly treated their manifest `row_count` as missing.

## Exact 30 affected tables
Every affected table has:

- source inventory `row_count`: 1
- export `row_counts.json` count: 1
- payload JSON type: object
- existing report `declared_row_count`: null due to parser lookup
- existing report `parsed_row_count`: null due to ambiguous singleton-object shape

Affected tables:

```text
dbo.AuditOptionMain
dbo.InspectionOptionMain
dbo.tblAegisReviewerApproverDetails
dbo.tblAegisReviewerApproverHeader
dbo.tblAegisReviewerApproverSub
dbo.tblCertiBody
dbo.tblCertificates
dbo.tblCertificationCategory
dbo.tblCompany
dbo.tblDashboardLaggingIndicatorCompanyLTI
dbo.tblEmailRouterBusinessDate
dbo.tblEquipment
dbo.tblEquipmentSort
dbo.tblEquipmentType
dbo.tblHSESafetyAlert
dbo.tblImpact
dbo.tblJM_Has_Passengers
dbo.tblKBTicker
dbo.tblMeeting_Has_Incidents
dbo.tblPasswordSetting
dbo.tblPTWWorkArea
dbo.tblReportEngineUserDisplayFieldsSort
dbo.tblReportEngineUserFilters
dbo.tblReportEngineUserMaster
dbo.tblReportEngineUserRelations
dbo.tblReportEngineWorkArea
dbo.tblSettings
dbo.tblTrainingDashboardbreakup
dbo.tblTrainingSetting
dbo.tblUnSafeSpecific
```

## Totals by field

| Field | Total |
|---|---:|
| Source inventory `row_count` | 139,123 |
| Export `manifest.json` / `row_counts.json` | 139,123 |
| Existing report declared total | 139,093 |
| Existing report parsed total | 139,093 |

The exact difference is 30 singleton rows omitted by the report parser, not rows absent from the export metadata.

## Empty files
The 72 source tables with zero rows are correctly represented in the export metadata:

- source inventory zero-row tables: 72
- manifest `empty_tables`: 72
- `row_counts.json` zero-row entries: 72
- corresponding payloads: 72 zero-byte files with the SHA-256 of an empty byte string

Those files are not valid JSON `[]`; they are empty files. Their zero counts are independently declared by source inventory and export metadata, so they must remain classified as empty-file payloads rather than parsed JSON.

## Evidence and limitation
The exporter script proves how the row counts were generated: SQL Server `sys.partitions` inventory counts populate `row_counts.json`, while each table query uses `SELECT *` and sets the per-file `row_count` to the returned row collection count. The evidence proves the 30-row discrepancy is caused by the audit report's singleton-object parsing/field mapping. It does not prove anything about Neon import status.

No database, Blob, SQL Server, or Vercel connection was used. No archive was extracted or restored, and no existing report was modified.
