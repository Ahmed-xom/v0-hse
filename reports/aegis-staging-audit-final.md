# HSE staging audit final

## Scope and safety

- Target: Neon project `spring-surf-19710398`, branch `aegis-pilot-20261009` (`br-wispy-hill-apxr32tq`), confirmed non-default and ready.
- Operation: read-only SQL queries only. No migration, import, DDL, or data mutation was run.
- Source evidence: validated 341-table export and `.tmp/aegis-source-table-inventory.json`.
- This report does not treat aggregate totals as proof of per-table import success.

## Result summary

| Category | Tables |
|---|---:|
| Verified matches | 2 |
| Missing target tables | 0 |
| Count mismatches | 1 |
| Unresolved mappings | 338 |
| **Total source tables** | **341** |

The only reliable source-to-target mappings present in the current reviewed mapping evidence are the three core mappings below. The project mapping file remains `approved: false`; therefore “verified match” means only that the source and actual staging `COUNT(*)` matched, not that migration correctness or row identity was proven.

| Source table | Target schema/table | Source row count | Actual staging row count | Difference | Mapping confidence | Verification status |
|---|---|---:|---:|---:|---|---|
| `dbo.tblCompany` | `public.company` | 1 | 3 | +2 | reviewed proposal; unapproved | count mismatch |
| `dbo.tblBusinessUnit` | `public.business_unit` | 7 | 7 | 0 | reviewed proposal; unapproved | verified count match only |
| `dbo.tblEmployee` | `public.employee` | 369 | 369 | 0 | reviewed proposal; unapproved | verified count match only |

## Missing target tables

None among the three reliable mappings: all three target tables exist on the staging branch. No target table was assigned to the other 338 source tables, so they are unresolved rather than missing.

## Count mismatches

- `dbo.tblCompany → public.company`: source inventory reports 1 row; staging has 3 rows; difference is +2 staging rows. This is not evidence of a missing source record or a successful import. The mapping review itself flags that source company values were unavailable and that existing destination uniqueness/conflict policy requires review.

## Unresolved mappings

The following 338 source tables have no reliable, approved source-to-target mapping in the current local evidence. Each remains unresolved; no staging count was queried or inferred for it.

| Source table | Target schema/table | Source row count | Actual staging row count | Difference | Mapping confidence | Verification status |
|---|---|---:|---:|---:|---|---|
| All source tables not listed in the three-row table above | — | As recorded in `.tmp/aegis-source-table-inventory.json` | — | — | no reliable mapping | unresolved |

The complete per-table source inventory is preserved in `.tmp/aegis-source-table-inventory.json`; this report intentionally does not fabricate 338 target names or counts.

## Neon evidence queried

On the explicitly resolved branch, the read-only query found:

- `public.company`: 3 rows
- `public.business_unit`: 7 rows
- `public.employee`: 369 rows
- `information_schema.tables` (non-system schemas): 120 tables
- `public.aegis_migration_import`: no rows
- `public.aegis_migration_mapping`: no rows
- `public.aegis_migration_record`: no rows
- `public.aegis_migration_issue`: no rows

The empty migration-evidence tables mean there is no recorded per-table import/verification evidence in those tables on this branch. Their absence does not prove that no other unrecorded activity occurred.

## Conclusion and next action

A complete 341-table staging verification is **not provable** from the current mapping evidence. Two of three reviewed mappings have matching counts, one mismatches, and 338 mappings are unresolved. The smallest safe next action is to obtain an explicitly approved, per-table source-to-target mapping (including target schema/table and mapping confidence), then run a new read-only count audit on this same non-production branch. No import or write should occur until the company mismatch and mapping approvals are resolved.

## Complete 341-table source register

Every source table is listed below. Target counts are shown only where the mapping was reliable enough to query.

| Source table | Target schema/table | Source row count | Actual staging row count | Difference | Mapping confidence | Verification status |
|---|---|---:|---:|---:|---|---|
| `dbo.ActionItemParent` | — | 12 | — | — | no reliable mapping | unresolved |
| `dbo.ActionItemPriority` | — | 5 | — | — | no reliable mapping | unresolved |
| `dbo.ActionItemType` | — | 3 | — | — | no reliable mapping | unresolved |
| `dbo.ActionItems` | — | 669 | — | — | no reliable mapping | unresolved |
| `dbo.ActionItems_AuditTrail` | — | 1109 | — | — | no reliable mapping | unresolved |
| `dbo.AegisTenant_dbo_tblEmailRouterStatus` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.AegisTenant_dbo_tblTenant` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.AuditAssignment` | — | 491 | — | — | no reliable mapping | unresolved |
| `dbo.AuditCategory` | — | 11 | — | — | no reliable mapping | unresolved |
| `dbo.AuditCheckListImport` | — | 3429 | — | — | no reliable mapping | unresolved |
| `dbo.AuditChecklist` | — | 97 | — | — | no reliable mapping | unresolved |
| `dbo.AuditDashboardSummary` | — | 97 | — | — | no reliable mapping | unresolved |
| `dbo.AuditHasCategories` | — | 238 | — | — | no reliable mapping | unresolved |
| `dbo.AuditInspectionCat` | — | 185 | — | — | no reliable mapping | unresolved |
| `dbo.AuditInspectionDetails` | — | 4414 | — | — | no reliable mapping | unresolved |
| `dbo.AuditInspectionSec` | — | 983 | — | — | no reliable mapping | unresolved |
| `dbo.AuditInspectionsHeader` | — | 97 | — | — | no reliable mapping | unresolved |
| `dbo.AuditOptionDetail` | — | 3 | — | — | no reliable mapping | unresolved |
| `dbo.AuditOptionMain` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.AuditQuestions` | — | 3408 | — | — | no reliable mapping | unresolved |
| `dbo.AuditSections` | — | 878 | — | — | no reliable mapping | unresolved |
| `dbo.AuditSubCategory` | — | 71 | — | — | no reliable mapping | unresolved |
| `dbo.Audits` | — | 104 | — | — | no reliable mapping | unresolved |
| `dbo.ImmediateCauseCategory` | — | 21 | — | — | no reliable mapping | unresolved |
| `dbo.InspectionAssignment` | — | 78 | — | — | no reliable mapping | unresolved |
| `dbo.InspectionCategory` | — | 3 | — | — | no reliable mapping | unresolved |
| `dbo.InspectionCheckListImport` | — | 2069 | — | — | no reliable mapping | unresolved |
| `dbo.InspectionChecklist` | — | 21 | — | — | no reliable mapping | unresolved |
| `dbo.InspectionDashboardSummary` | — | 29 | — | — | no reliable mapping | unresolved |
| `dbo.InspectionHasCategories` | — | 49 | — | — | no reliable mapping | unresolved |
| `dbo.InspectionInspectionCat` | — | 62 | — | — | no reliable mapping | unresolved |
| `dbo.InspectionInspectionDetails` | — | 1496 | — | — | no reliable mapping | unresolved |
| `dbo.InspectionOptionDetail` | — | 3 | — | — | no reliable mapping | unresolved |
| `dbo.InspectionOptionMain` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.InspectionQuestions` | — | 950 | — | — | no reliable mapping | unresolved |
| `dbo.InspectionSections` | — | 98 | — | — | no reliable mapping | unresolved |
| `dbo.InspectionSubCategory` | — | 30 | — | — | no reliable mapping | unresolved |
| `dbo.Inspections` | — | 29 | — | — | no reliable mapping | unresolved |
| `dbo.InspectionsHeader` | — | 33 | — | — | no reliable mapping | unresolved |
| `dbo.Inspectionsec` | — | 218 | — | — | no reliable mapping | unresolved |
| `dbo.MFCategory` | — | 43 | — | — | no reliable mapping | unresolved |
| `dbo.SQImmediateCause` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.SQInvestigation` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.SQManagementFailure` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.SQNotification` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.SQRootCause` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.SQRootCauseCategory` | — | 146 | — | — | no reliable mapping | unresolved |
| `dbo.tblAIPossibleRootCause` | — | 4 | — | — | no reliable mapping | unresolved |
| `dbo.tblActionList` | — | 430 | — | — | no reliable mapping | unresolved |
| `dbo.tblActionListGroup` | — | 2 | — | — | no reliable mapping | unresolved |
| `dbo.tblActionListQuickMenu` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblActivityType` | — | 2 | — | — | no reliable mapping | unresolved |
| `dbo.tblAegisModule` | — | 13 | — | — | no reliable mapping | unresolved |
| `dbo.tblAegisReviewerApproverDetails` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblAegisReviewerApproverHeader` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblAegisReviewerApproverSub` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblAegisStageComments` | — | 280 | — | — | no reliable mapping | unresolved |
| `dbo.tblAegisStatus` | — | 30 | — | — | no reliable mapping | unresolved |
| `dbo.tblAsset` | — | 4 | — | — | no reliable mapping | unresolved |
| `dbo.tblAssetCategory` | — | 5 | — | — | no reliable mapping | unresolved |
| `dbo.tblAssetLoss` | — | 14 | — | — | no reliable mapping | unresolved |
| `dbo.tblAttachments` | — | 1791 | — | — | no reliable mapping | unresolved |
| `dbo.tblAutomotiveLoss` | — | 4 | — | — | no reliable mapping | unresolved |
| `dbo.tblBIStrategicKPI` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblBI_DashboardDataMaster` | — | 15 | — | — | no reliable mapping | unresolved |
| `dbo.tblBI_DashboardDetails` | — | 14 | — | — | no reliable mapping | unresolved |
| `dbo.tblBI_DashboardMaster` | — | 19 | — | — | no reliable mapping | unresolved |
| `dbo.tblBreach` | — | 11 | — | — | no reliable mapping | unresolved |
| `dbo.tblBulkDeleteMaster` | — | 115 | — | — | no reliable mapping | unresolved |
| `dbo.tblBulkImportDetail` | — | 450 | — | — | no reliable mapping | unresolved |
| `dbo.tblBulkImportMaster` | — | 94 | — | — | no reliable mapping | unresolved |
| `dbo.tblBusinessUnit` | `public.business_unit` | 7 | 7 | +0 | reviewed proposal; unapproved | verified count match only |
| `dbo.tblBusinessUnit_History` | — | 54 | — | — | no reliable mapping | unresolved |
| `dbo.tblCertiBody` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblCertiBodyHasCertificates` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblCertificates` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblCertificationCategory` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblCertificationDetail` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblCity` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblClient` | — | 5 | — | — | no reliable mapping | unresolved |
| `dbo.tblCompany` | `public.company` | 1 | 3 | +2 | reviewed proposal; unapproved | count mismatch |
| `dbo.tblContractors` | — | 4 | — | — | no reliable mapping | unresolved |
| `dbo.tblCountry` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblCourseCategory` | — | 6 | — | — | no reliable mapping | unresolved |
| `dbo.tblCourses` | — | 111 | — | — | no reliable mapping | unresolved |
| `dbo.tblCrew` | — | 7 | — | — | no reliable mapping | unresolved |
| `dbo.tblCurrency` | — | 2 | — | — | no reliable mapping | unresolved |
| `dbo.tblCustomLog` | — | 27259 | — | — | no reliable mapping | unresolved |
| `dbo.tblDailySheetDetail` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblDailySheetEventAR` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblDailySheetMaster` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblDamage` | — | 5 | — | — | no reliable mapping | unresolved |
| `dbo.tblDashboardLaggingIndicatorBULTI` | — | 4 | — | — | no reliable mapping | unresolved |
| `dbo.tblDashboardLaggingIndicatorCompanyLTI` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblDashboardLaggingIndicatorYears` | — | 84 | — | — | no reliable mapping | unresolved |
| `dbo.tblDashboardRAG` | — | 54 | — | — | no reliable mapping | unresolved |
| `dbo.tblDashboardSafetyPyramid` | — | 5 | — | — | no reliable mapping | unresolved |
| `dbo.tblDashboardTargets` | — | 6 | — | — | no reliable mapping | unresolved |
| `dbo.tblDashboardTrainingComplianceChart` | — | 12 | — | — | no reliable mapping | unresolved |
| `dbo.tblDepartment` | — | 20 | — | — | no reliable mapping | unresolved |
| `dbo.tblDesignation` | — | 100 | — | — | no reliable mapping | unresolved |
| `dbo.tblDevExpressDetails` | — | 28 | — | — | no reliable mapping | unresolved |
| `dbo.tblDevExpressMaster` | — | 28 | — | — | no reliable mapping | unresolved |
| `dbo.tblEmailRouterBusinessDate` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblEmailRouterFieldObjects` | — | 906 | — | — | no reliable mapping | unresolved |
| `dbo.tblEmailRouterGroup` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblEmailRouterMaster` | — | 58 | — | — | no reliable mapping | unresolved |
| `dbo.tblEmailRouterObjects` | — | 35 | — | — | no reliable mapping | unresolved |
| `dbo.tblEmailRouterRule` | — | 41 | — | — | no reliable mapping | unresolved |
| `dbo.tblEmailRouterSchedule` | — | 5 | — | — | no reliable mapping | unresolved |
| `dbo.tblEmailRouterStatus` | — | 25827 | — | — | no reliable mapping | unresolved |
| `dbo.tblEmployee` | `public.employee` | 378 | 369 | -9 | reviewed proposal; unapproved | verified count match only |
| `dbo.tblEnvironmentalLoss` | — | 4 | — | — | no reliable mapping | unresolved |
| `dbo.tblEqpCompliance` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblEqpComplianceMatrix` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblEqpCriteria` | — | 4 | — | — | no reliable mapping | unresolved |
| `dbo.tblEqpSort` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblEquipment` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblEquipmentDBMailSent` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblEquipmentSort` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblEquipmentType` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblEquipmentTypeConfigDetail` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblEquipmentTypeConfigMaster` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblExcelTemplate` | — | 10 | — | — | no reliable mapping | unresolved |
| `dbo.tblExtensionData` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblExtensionDetail` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblExtensionMaster` | — | 15 | — | — | no reliable mapping | unresolved |
| `dbo.tblFTWDetail` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblForum` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblFrequencyReportData` | — | 508 | — | — | no reliable mapping | unresolved |
| `dbo.tblFrequencyReportSetting` | — | 4 | — | — | no reliable mapping | unresolved |
| `dbo.tblFrequencyofactivity` | — | 5 | — | — | no reliable mapping | unresolved |
| `dbo.tblGenrateEmailRouterQueue` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblHEMP` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblHEMPStatus` | — | 2 | — | — | no reliable mapping | unresolved |
| `dbo.tblHEMP_Has_HazardRiskControl` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblHSEINC` | — | 23 | — | — | no reliable mapping | unresolved |
| `dbo.tblHSESafetyAlert` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblHazardCategory` | — | 42 | — | — | no reliable mapping | unresolved |
| `dbo.tblImmediateCauseSA` | — | 14 | — | — | no reliable mapping | unresolved |
| `dbo.tblImmediateCauseSC` | — | 7 | — | — | no reliable mapping | unresolved |
| `dbo.tblImpact` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblImportFileHistory` | — | 52 | — | — | no reliable mapping | unresolved |
| `dbo.tblIncidentType` | — | 25 | — | — | no reliable mapping | unresolved |
| `dbo.tblInjuryType` | — | 35 | — | — | no reliable mapping | unresolved |
| `dbo.tblInsightsSettings` | — | 6 | — | — | no reliable mapping | unresolved |
| `dbo.tblInstitute` | — | 5 | — | — | no reliable mapping | unresolved |
| `dbo.tblInstituteHasCourses` | — | 95 | — | — | no reliable mapping | unresolved |
| `dbo.tblInvestigation` | — | 8 | — | — | no reliable mapping | unresolved |
| `dbo.tblInvestigation_Has_Papers` | — | 8 | — | — | no reliable mapping | unresolved |
| `dbo.tblInvestigation_Has_Parts` | — | 6 | — | — | no reliable mapping | unresolved |
| `dbo.tblInvestigation_Has_Processes` | — | 8 | — | — | no reliable mapping | unresolved |
| `dbo.tblInvestigation_has_PeopleAndPositions` | — | 9 | — | — | no reliable mapping | unresolved |
| `dbo.tblJM` | — | 92 | — | — | no reliable mapping | unresolved |
| `dbo.tblJMDriver` | — | 87 | — | — | no reliable mapping | unresolved |
| `dbo.tblJMInspectionChecklist` | — | 24 | — | — | no reliable mapping | unresolved |
| `dbo.tblJMVehicleDetail` | — | 54 | — | — | no reliable mapping | unresolved |
| `dbo.tblJM_Has_InspectionChecklist` | — | 2208 | — | — | no reliable mapping | unresolved |
| `dbo.tblJM_Has_Passengers` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblJM_Has_RoadCondition` | — | 1380 | — | — | no reliable mapping | unresolved |
| `dbo.tblJM_Has_RouteBreakdown` | — | 330 | — | — | no reliable mapping | unresolved |
| `dbo.tblJM_Has_WeatherCondition` | — | 920 | — | — | no reliable mapping | unresolved |
| `dbo.tblJobFactor` | — | 9 | — | — | no reliable mapping | unresolved |
| `dbo.tblJobPosition` | — | 121 | — | — | no reliable mapping | unresolved |
| `dbo.tblKBInsightConfigMain` | — | 29 | — | — | no reliable mapping | unresolved |
| `dbo.tblKBInsightDashboardSetting` | — | 28 | — | — | no reliable mapping | unresolved |
| `dbo.tblKBInsightDashboardSettingWeightage` | — | 6 | — | — | no reliable mapping | unresolved |
| `dbo.tblKBInsightsDataDetail` | — | 1672 | — | — | no reliable mapping | unresolved |
| `dbo.tblKBInsightsDataHeader` | — | 474 | — | — | no reliable mapping | unresolved |
| `dbo.tblKBTicker` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblKPIGroupMaster` | — | 3 | — | — | no reliable mapping | unresolved |
| `dbo.tblLibrary` | — | 657 | — | — | no reliable mapping | unresolved |
| `dbo.tblLibraryAccess` | — | 32 | — | — | no reliable mapping | unresolved |
| `dbo.tblLibraryHierarchy` | — | 1903 | — | — | no reliable mapping | unresolved |
| `dbo.tblLocation` | — | 6 | — | — | no reliable mapping | unresolved |
| `dbo.tblLogin` | — | 266 | — | — | no reliable mapping | unresolved |
| `dbo.tblLoginAccess` | — | 114 | — | — | no reliable mapping | unresolved |
| `dbo.tblMOC` | — | 55 | — | — | no reliable mapping | unresolved |
| `dbo.tblMOCApprover` | — | 100 | — | — | no reliable mapping | unresolved |
| `dbo.tblMOCApproverHistory` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblMOCAreaAffected` | — | 5 | — | — | no reliable mapping | unresolved |
| `dbo.tblMOCCategory` | — | 11 | — | — | no reliable mapping | unresolved |
| `dbo.tblMOCMB` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblMOCMBApprover` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblMOCMBApproverHistory` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblMOCMBStatges` | — | 12 | — | — | no reliable mapping | unresolved |
| `dbo.tblMOCMMBExpiryHistory` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblMOCStatges` | — | 10 | — | — | no reliable mapping | unresolved |
| `dbo.tblMOCSubType` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblManagementFactor` | — | 9 | — | — | no reliable mapping | unresolved |
| `dbo.tblMaterialReleased` | — | 3 | — | — | no reliable mapping | unresolved |
| `dbo.tblMeetingType` | — | 54 | — | — | no reliable mapping | unresolved |
| `dbo.tblMeetingVenues` | — | 7 | — | — | no reliable mapping | unresolved |
| `dbo.tblMeeting_Has_Incidents` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblMeeting_Has_Notes` | — | 6 | — | — | no reliable mapping | unresolved |
| `dbo.tblMeeting_Has_Participants` | — | 507 | — | — | no reliable mapping | unresolved |
| `dbo.tblMeeting_Has_ParticipantsExternal` | — | 10 | — | — | no reliable mapping | unresolved |
| `dbo.tblMeetings` | — | 123 | — | — | no reliable mapping | unresolved |
| `dbo.tblMonthlySheet` | — | 588 | — | — | no reliable mapping | unresolved |
| `dbo.tblMonthlySheetDateDetail` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblMonthlySheetDateMaster` | — | 38 | — | — | no reliable mapping | unresolved |
| `dbo.tblMonthlySheetImports` | — | 43 | — | — | no reliable mapping | unresolved |
| `dbo.tblNCAffectedSystem` | — | 11 | — | — | no reliable mapping | unresolved |
| `dbo.tblNCPossibleCause` | — | 34 | — | — | no reliable mapping | unresolved |
| `dbo.tblNCType` | — | 7 | — | — | no reliable mapping | unresolved |
| `dbo.tblNonConformance` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblNonConformance_Has_AuditingParty` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblNotification` | — | 4482 | — | — | no reliable mapping | unresolved |
| `dbo.tblNotificationType` | — | 130 | — | — | no reliable mapping | unresolved |
| `dbo.tblNumberofPeople` | — | 4 | — | — | no reliable mapping | unresolved |
| `dbo.tblOCMasters` | — | 258 | — | — | no reliable mapping | unresolved |
| `dbo.tblOCWSAccess` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblObservationCategory` | — | 105 | — | — | no reliable mapping | unresolved |
| `dbo.tblObservationType` | — | 5 | — | — | no reliable mapping | unresolved |
| `dbo.tblOutcome` | — | 30 | — | — | no reliable mapping | unresolved |
| `dbo.tblPTW` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblPTWApprover` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblPTWApproverHistory` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblPTWDocument` | — | 2 | — | — | no reliable mapping | unresolved |
| `dbo.tblPTWPrecautionSubType` | — | 3 | — | — | no reliable mapping | unresolved |
| `dbo.tblPTWPrecautionType` | — | 3 | — | — | no reliable mapping | unresolved |
| `dbo.tblPTWScopeofWork` | — | 2 | — | — | no reliable mapping | unresolved |
| `dbo.tblPTWStatus` | — | 8 | — | — | no reliable mapping | unresolved |
| `dbo.tblPTWType` | — | 2 | — | — | no reliable mapping | unresolved |
| `dbo.tblPTWWorkArea` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblPTW_Has_Document` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblPTW_Has_Precaution` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblParameterDetail` | — | 143 | — | — | no reliable mapping | unresolved |
| `dbo.tblParameterDetails` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblParameterGroup` | — | 30 | — | — | no reliable mapping | unresolved |
| `dbo.tblParameterHeader` | — | 142 | — | — | no reliable mapping | unresolved |
| `dbo.tblParameterMaster` | — | 5 | — | — | no reliable mapping | unresolved |
| `dbo.tblPasswordSetting` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblPersonalFactor` | — | 7 | — | — | no reliable mapping | unresolved |
| `dbo.tblPersonalLoss` | — | 3 | — | — | no reliable mapping | unresolved |
| `dbo.tblPosition` | — | 27 | — | — | no reliable mapping | unresolved |
| `dbo.tblPotentialSeverity` | — | 5 | — | — | no reliable mapping | unresolved |
| `dbo.tblProbability` | — | 5 | — | — | no reliable mapping | unresolved |
| `dbo.tblRIA` | — | 39 | — | — | no reliable mapping | unresolved |
| `dbo.tblRIAActivity` | — | 44 | — | — | no reliable mapping | unresolved |
| `dbo.tblRIAApprover` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblRIAApproverHistory` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblRIAHazard` | — | 148 | — | — | no reliable mapping | unresolved |
| `dbo.tblRIAHazardCategory` | — | 4 | — | — | no reliable mapping | unresolved |
| `dbo.tblRIAHazardsImpacts` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblRIAPPMeasures` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblRIARiskMatrix` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblRIARiskMatrixX` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblRIARiskMatrixY` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblRIARiskType` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblRIAStatus` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblRIA_Has_AdditionalPreventative` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblRIA_Has_ExistingPreventative` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblRIA_has_Hazard` | — | 232 | — | — | no reliable mapping | unresolved |
| `dbo.tblRMPotentialSeverity` | — | 20 | — | — | no reliable mapping | unresolved |
| `dbo.tblRMRiskType` | — | 14 | — | — | no reliable mapping | unresolved |
| `dbo.tblRMRiskTypeAS` | — | 83 | — | — | no reliable mapping | unresolved |
| `dbo.tblRMRiskType_tmp` | — | 8 | — | — | no reliable mapping | unresolved |
| `dbo.tblRelationDetail` | — | 509 | — | — | no reliable mapping | unresolved |
| `dbo.tblRelationMaster` | — | 108 | — | — | no reliable mapping | unresolved |
| `dbo.tblReportEngineFields` | — | 1062 | — | — | no reliable mapping | unresolved |
| `dbo.tblReportEngineMaster` | — | 66 | — | — | no reliable mapping | unresolved |
| `dbo.tblReportEngineRelation` | — | 142 | — | — | no reliable mapping | unresolved |
| `dbo.tblReportEngineRelationExclude` | — | 13 | — | — | no reliable mapping | unresolved |
| `dbo.tblReportEngineSortMapping` | — | 2 | — | — | no reliable mapping | unresolved |
| `dbo.tblReportEngineUserDisplayFields` | — | 28 | — | — | no reliable mapping | unresolved |
| `dbo.tblReportEngineUserDisplayFieldsSort` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblReportEngineUserFilters` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblReportEngineUserMaster` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblReportEngineUserRelations` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblReportEngineUserReportGroup` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblReportEngineWorkArea` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblReportEventDetail` | — | 55 | — | — | no reliable mapping | unresolved |
| `dbo.tblReportEventDetailKPI` | — | 158 | — | — | no reliable mapping | unresolved |
| `dbo.tblReportEventHeader` | — | 5 | — | — | no reliable mapping | unresolved |
| `dbo.tblResetPassword` | — | 267 | — | — | no reliable mapping | unresolved |
| `dbo.tblRiskMatrix` | — | 4 | — | — | no reliable mapping | unresolved |
| `dbo.tblRiskMatrixX` | — | 36 | — | — | no reliable mapping | unresolved |
| `dbo.tblRiskMatrixY` | — | 23 | — | — | no reliable mapping | unresolved |
| `dbo.tblRiskMatrixY_tmp` | — | 12 | — | — | no reliable mapping | unresolved |
| `dbo.tblRiskMatrixx_tmp` | — | 10 | — | — | no reliable mapping | unresolved |
| `dbo.tblRoadCondition` | — | 15 | — | — | no reliable mapping | unresolved |
| `dbo.tblSQCategory` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblSQFailureSubType` | — | 5 | — | — | no reliable mapping | unresolved |
| `dbo.tblSQFailureType` | — | 5 | — | — | no reliable mapping | unresolved |
| `dbo.tblSQINCFailure` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblSafeObservation` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblSafeTrack` | — | 1858 | — | — | no reliable mapping | unresolved |
| `dbo.tblSafeTrackLocation` | — | 7 | — | — | no reliable mapping | unresolved |
| `dbo.tblSafeTrackO` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblSafeTrackStatus` | — | 2 | — | — | no reliable mapping | unresolved |
| `dbo.tblSafeTrack_Has_SafeObservation` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblSafeTrack_Has_Types` | — | 1963 | — | — | no reliable mapping | unresolved |
| `dbo.tblSafeTrack_Has_UnSafeObservation` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblScheduleMail` | — | 5 | — | — | no reliable mapping | unresolved |
| `dbo.tblScheduleMail_AI` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblScheduleMail_KPI` | — | 2 | — | — | no reliable mapping | unresolved |
| `dbo.tblScheduleMail_Training` | — | 3 | — | — | no reliable mapping | unresolved |
| `dbo.tblSearchEngineFieldMapping` | — | 326 | — | — | no reliable mapping | unresolved |
| `dbo.tblSearchEngineFields` | — | 2086 | — | — | no reliable mapping | unresolved |
| `dbo.tblSearchEngineFieldsSort` | — | 105 | — | — | no reliable mapping | unresolved |
| `dbo.tblSearchEngineFilters` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblSearchEngineMaster` | — | 183 | — | — | no reliable mapping | unresolved |
| `dbo.tblSettings` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblSeverity` | — | 3 | — | — | no reliable mapping | unresolved |
| `dbo.tblShareDetail` | — | 2 | — | — | no reliable mapping | unresolved |
| `dbo.tblShareMaster` | — | 8 | — | — | no reliable mapping | unresolved |
| `dbo.tblSite` | — | 10 | — | — | no reliable mapping | unresolved |
| `dbo.tblState` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblStatus` | — | 4 | — | — | no reliable mapping | unresolved |
| `dbo.tblSubType` | — | 228 | — | — | no reliable mapping | unresolved |
| `dbo.tblSubstandardActs` | — | 38 | — | — | no reliable mapping | unresolved |
| `dbo.tblSubstandardCondition` | — | 39 | — | — | no reliable mapping | unresolved |
| `dbo.tblTaskManager` | — | 34 | — | — | no reliable mapping | unresolved |
| `dbo.tblTaskSource` | — | 2 | — | — | no reliable mapping | unresolved |
| `dbo.tblTeamLead` | — | 4 | — | — | no reliable mapping | unresolved |
| `dbo.tblTempTraning_Course_Compliance_dashboard` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblTimeLossType` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblTraCompliance` | — | 23 | — | — | no reliable mapping | unresolved |
| `dbo.tblTraComplianceMatrix` | — | 1237 | — | — | no reliable mapping | unresolved |
| `dbo.tblTraCriteria` | — | 4 | — | — | no reliable mapping | unresolved |
| `dbo.tblTrainingDBMailSent` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblTrainingDashboardbreakup` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblTrainingDetail` | — | 3120 | — | — | no reliable mapping | unresolved |
| `dbo.tblTrainingSetting` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblType` | — | 26 | — | — | no reliable mapping | unresolved |
| `dbo.tblUnSafeObservation` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblUnSafeSpecific` | — | 1 | — | — | no reliable mapping | unresolved |
| `dbo.tblUnSafeSubCategory` | — | 186 | — | — | no reliable mapping | unresolved |
| `dbo.tblUserLog` | — | 2810 | — | — | no reliable mapping | unresolved |
| `dbo.tblUserLogExt` | — | 0 | — | — | no reliable mapping | unresolved |
| `dbo.tblUserPasswordHistory` | — | 416 | — | — | no reliable mapping | unresolved |
| `dbo.tblUserRights` | — | 3097 | — | — | no reliable mapping | unresolved |
| `dbo.tblUserRights_History` | — | 17232 | — | — | no reliable mapping | unresolved |
| `dbo.tblUserRole` | — | 11 | — | — | no reliable mapping | unresolved |
| `dbo.tblUserRole_History` | — | 70 | — | — | no reliable mapping | unresolved |
| `dbo.tblVehicle` | — | 28 | — | — | no reliable mapping | unresolved |
| `dbo.tblWeatherCondition` | — | 10 | — | — | no reliable mapping | unresolved |
| `dbo.tblWorkArea` | — | 16 | — | — | no reliable mapping | unresolved |
| `dbo.tblfncTrainingCourseGet` | — | 2401 | — | — | no reliable mapping | unresolved |
| `dbo.tmpdata` | — | 3 | — | — | no reliable mapping | unresolved |
