# Aegis source/export/staging comparison

Status: `BLOCKED_MISSING_EXPORT_AND_STAGING_INVENTORIES`

## Verified source inventory

- File: `.tmp/aegis-source-table-inventory.json`
- Source tables: 341
- Populated tables: 269
- Empty tables: 72
- Total source rows: 139,123
- Classification: unknown for all entries

## Export inventory

- File: `.tmp/aegis-local-export-manifest.json`
- JSON table files found: 0
- Complete per-table export evidence: unavailable
- The original archive/table_data directory is not available in the local workspace. No archive extraction was performed.

## Neon staging inventory

- File: `.tmp/aegis-existing-staging-import-inventory.json`
- Verified per-table records: 0
- Status: `unverified`
- No Neon query was performed. Historical references to staging tables/import totals were not treated as evidence.

## Comparison

### Source tables missing from export

- Confirmed missing: none.
- Not verifiable: all 341 source tables, because no per-table export inventory exists.

### Exported tables missing from recorded Neon staging

- Confirmed missing: none.
- Not verifiable: no exported table entries are available.

### Row-count mismatches

- Confirmed mismatches: none.
- Not verifiable: per-table export and Neon staging row counts are unavailable. The 139,123 figure is source inventory total only.

### Empty source tables

- Count: 72.
- Exact names, read from `.tmp/aegis-source-table-inventory.json`:

```text
dbo.AegisTenant_dbo_tblEmailRouterStatus
dbo.AegisTenant_dbo_tblTenant
dbo.SQImmediateCause
dbo.SQInvestigation
dbo.SQManagementFailure
dbo.SQNotification
dbo.SQRootCause
dbo.tblActionListQuickMenu
dbo.tblBIStrategicKPI
dbo.tblCertiBodyHasCertificates
dbo.tblCertificationDetail
dbo.tblCity
dbo.tblCountry
dbo.tblDailySheetDetail
dbo.tblDailySheetEventAR
dbo.tblDailySheetMaster
dbo.tblEmailRouterGroup
dbo.tblEqpCompliance
dbo.tblEqpComplianceMatrix
dbo.tblEqpSort
dbo.tblEquipmentDBMailSent
dbo.tblEquipmentTypeConfigDetail
dbo.tblEquipmentTypeConfigMaster
dbo.tblExtensionData
dbo.tblExtensionDetail
dbo.tblFTWDetail
dbo.tblForum
dbo.tblGenrateEmailRouterQueue
dbo.tblHEMP
dbo.tblHEMP_Has_HazardRiskControl
dbo.tblMOCApproverHistory
dbo.tblMOCMB
dbo.tblMOCMBApprover
dbo.tblMOCMBApproverHistory
dbo.tblMOCMMBExpiryHistory
dbo.tblMOCSubType
dbo.tblMonthlySheetDateDetail
dbo.tblNonConformance
dbo.tblNonConformance_Has_AuditingParty
dbo.tblOCWSAccess
dbo.tblPTW
dbo.tblPTWApprover
dbo.tblPTWApproverHistory
dbo.tblPTW_Has_Document
dbo.tblPTW_Has_Precaution
dbo.tblParameterDetails
dbo.tblRIAApprover
dbo.tblRIAApproverHistory
dbo.tblRIAHazardsImpacts
dbo.tblRIAPPMeasures
dbo.tblRIARiskMatrix
dbo.tblRIARiskMatrixX
dbo.tblRIARiskMatrixY
dbo.tblRIARiskType
dbo.tblRIAStatus
dbo.tblRIA_Has_AdditionalPreventative
dbo.tblRIA_Has_ExistingPreventative
dbo.tblReportEngineUserReportGroup
dbo.tblSQCategory
dbo.tblSQINCFailure
dbo.tblSafeObservation
dbo.tblSafeTrackO
dbo.tblSafeTrack_Has_SafeObservation
dbo.tblSafeTrack_Has_UnSafeObservation
dbo.tblScheduleMail_AI
dbo.tblSearchEngineFilters
dbo.tblState
dbo.tblTempTraning_Course_Compliance_dashboard
dbo.tblTimeLossType
dbo.tblTrainingDBMailSent
dbo.tblUnSafeObservation
dbo.tblUserLogExt
```

### Unresolved mappings

All source-to-target mappings and import statuses remain unverified. Existing proposals and pilot/review artifacts were not treated as completed imports.

## Exact missing artifacts

1. Complete export table JSON inventory (341 files or equivalent machine-readable manifest with source table name, evidence filename, parsed row count, and validation status).
2. Independent per-table Neon staging/import inventory with `source_schema`, `source_table`, `target_schema`, `target_table`, `imported_row_count`, `evidence_file`, and `verification_status`.

## Safety and validation

No SQL Server or Neon access, database writes, Blob access, archive extraction, import, deployment, environment change, or production change occurred. Only repository files, Git history, and existing local reports were inspected.

Next step: attach the exact export table JSON inventory and independent Neon staging inventory, then rerun this comparison read-only.
