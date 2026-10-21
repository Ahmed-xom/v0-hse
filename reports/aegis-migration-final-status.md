# HSE migration final status

## Scope and safety

This is the implementation-readiness result from the validated historical export and existing repository evidence. No import, DDL, DML, environment change, deployment, production access, or approval was performed. The source archive was not extracted.

- Source: 341 tables, documented 139,123 rows.
- Evidence: `reports/aegis-historical-export-manifest.json`, `reports/aegis-code-based-mapping-review.md`, `reports/aegis-neon-staging-schema-evidence.md`, `reports/aegis-migration-readiness-plan.md`.
- Target evidence is limited to the existing non-production staging branch evidence; target counts are only populated for the three previously audited proposals.

## Summary

| Status | Count | Meaning |
|---|---:|---|
| Evidence-backed proposal, verified count match | 1 | `dbo.tblBusinessUnit → public.business_unit` (7 vs 7); count is not record proof |
| Evidence-backed proposal, count mismatch | 2 | Company 1 vs 3; Employee 378 vs 369 |
| Candidate requiring review | 3 | Library, hierarchy, access; target semantics not proven |
| Unresolved | 335 | No defensible target mapping without a reviewed manifest/schema contract |
| Approved/imported | 0 | No mapping or import was approved |
| Total source tables | 341 | Exhaustive register below |

## Dependency and transformation gates

Source metadata contains 253 primary-key entries and 535 foreign-key edges. Future work must order roots/reference tables before parents and children, resolve cycles explicitly, retain or translate source identities, map every FK, define split/merge and soft-delete rules, and decide archive/exclude treatment for audit/history/system tables. Actual target constraints must be paired with each mapping before any write phase.

## Read-only validation

For an approved mapping only: compare exact per-table counts; compare salted/HMAC keyed identity digests and only aggregate matched/source-only/target-only/duplicate/null counts; validate FK orphans and soft-delete partitions; record branch/database identity and query hashes. Never output names, emails, payroll values, or full rows. Counts alone do not prove identity.

## Detailed 341-table register

| Source table | Target | Source rows | Observed target rows | Difference | Status | Required decision |
|---|---|---:|---:|---:|---|---|
| `dbo.ActionItemParent` | — | 12 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.ActionItemPriority` | — | 5 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.ActionItems` | — | 669 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.ActionItems_AuditTrail` | — | 1109 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.ActionItemType` | — | 3 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.AegisTenant_dbo_tblEmailRouterStatus` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.AegisTenant_dbo_tblTenant` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.AuditAssignment` | — | 491 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.AuditCategory` | — | 11 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.AuditChecklist` | — | 97 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.AuditCheckListImport` | — | 3429 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.AuditDashboardSummary` | — | 97 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.AuditHasCategories` | — | 238 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.AuditInspectionCat` | — | 185 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.AuditInspectionDetails` | — | 4414 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.AuditInspectionSec` | — | 983 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.AuditInspectionsHeader` | — | 97 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.AuditOptionDetail` | — | 3 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.AuditOptionMain` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.AuditQuestions` | — | 3408 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.Audits` | — | 104 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.AuditSections` | — | 878 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.AuditSubCategory` | — | 71 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.ImmediateCauseCategory` | — | 21 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.InspectionAssignment` | — | 78 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.InspectionCategory` | — | 3 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.InspectionChecklist` | — | 21 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.InspectionCheckListImport` | — | 2069 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.InspectionDashboardSummary` | — | 29 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.InspectionHasCategories` | — | 49 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.InspectionInspectionCat` | — | 62 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.InspectionInspectionDetails` | — | 1496 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.InspectionOptionDetail` | — | 3 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.InspectionOptionMain` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.InspectionQuestions` | — | 950 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.Inspections` | — | 29 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.Inspectionsec` | — | 218 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.InspectionSections` | — | 98 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.InspectionsHeader` | — | 33 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.InspectionSubCategory` | — | 30 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.MFCategory` | — | 43 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.SQImmediateCause` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.SQInvestigation` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.SQManagementFailure` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.SQNotification` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.SQRootCause` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.SQRootCauseCategory` | — | 146 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblActionList` | — | 430 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblActionListGroup` | — | 2 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblActionListQuickMenu` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblActivityType` | — | 2 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblAegisModule` | — | 13 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblAegisReviewerApproverDetails` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblAegisReviewerApproverHeader` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblAegisReviewerApproverSub` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblAegisStageComments` | — | 280 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblAegisStatus` | — | 30 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblAIPossibleRootCause` | — | 4 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblAsset` | — | 4 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblAssetCategory` | — | 5 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblAssetLoss` | — | 14 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblAttachments` | — | 1791 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblAutomotiveLoss` | — | 4 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblBI_DashboardDataMaster` | — | 15 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblBI_DashboardDetails` | — | 14 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblBI_DashboardMaster` | — | 19 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblBIStrategicKPI` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblBreach` | — | 11 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblBulkDeleteMaster` | — | 115 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblBulkImportDetail` | — | 450 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblBulkImportMaster` | — | 94 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblBusinessUnit` | `public.business_unit` | 7 | 7 | 0 | evidence-backed proposal; unapproved | Preserve BU_Id; resolve self/company FK and root/null semantics. |
| `dbo.tblBusinessUnit_History` | — | 54 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblCertiBody` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblCertiBodyHasCertificates` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblCertificates` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblCertificationCategory` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblCertificationDetail` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblCity` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblClient` | — | 5 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblCompany` | `public.company` | None | 3 | count mismatch | evidence-backed proposal; unapproved | Preserve Cmp_Id/Cmp_Code; resolve +2 target rows; keyed non-PII comparison before approval. |
| `dbo.tblContractors` | — | 4 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblCountry` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblCourseCategory` | — | 6 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblCourses` | — | 111 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblCrew` | — | 7 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblCurrency` | — | 2 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblCustomLog` | — | 27259 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblDailySheetDetail` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblDailySheetEventAR` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblDailySheetMaster` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblDamage` | — | 5 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblDashboardLaggingIndicatorBULTI` | — | 4 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblDashboardLaggingIndicatorCompanyLTI` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblDashboardLaggingIndicatorYears` | — | 84 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblDashboardRAG` | — | 54 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblDashboardSafetyPyramid` | — | 5 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblDashboardTargets` | — | 6 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblDashboardTrainingComplianceChart` | — | 12 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblDepartment` | — | 20 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblDesignation` | — | 100 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblDevExpressDetails` | — | 28 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblDevExpressMaster` | — | 28 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblEmailRouterBusinessDate` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblEmailRouterFieldObjects` | — | 906 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblEmailRouterGroup` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblEmailRouterMaster` | — | 58 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblEmailRouterObjects` | — | 35 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblEmailRouterRule` | — | 41 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblEmailRouterSchedule` | — | 5 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblEmailRouterStatus` | — | 25827 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblEmployee` | `public.employee` | 378 | 369 | -9 | evidence-backed proposal; unapproved | Preserve approved employee key; resolve 9-row difference and identity/auth policy; suppress PII. |
| `dbo.tblEnvironmentalLoss` | — | 4 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblEqpCompliance` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblEqpComplianceMatrix` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblEqpCriteria` | — | 4 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblEqpSort` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblEquipment` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblEquipmentDBMailSent` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblEquipmentSort` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblEquipmentType` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblEquipmentTypeConfigDetail` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblEquipmentTypeConfigMaster` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblExcelTemplate` | — | 10 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblExtensionData` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblExtensionDetail` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblExtensionMaster` | — | 15 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblfncTrainingCourseGet` | — | 2401 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblForum` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblFrequencyofactivity` | — | 5 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblFrequencyReportData` | — | 508 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblFrequencyReportSetting` | — | 4 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblFTWDetail` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblGenrateEmailRouterQueue` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblHazardCategory` | — | 42 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblHEMP` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblHEMP_Has_HazardRiskControl` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblHEMPStatus` | — | 2 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblHSEINC` | — | 23 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblHSESafetyAlert` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblImmediateCauseSA` | — | 14 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblImmediateCauseSC` | — | 7 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblImpact` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblImportFileHistory` | — | 52 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblIncidentType` | — | 25 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblInjuryType` | — | 35 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblInsightsSettings` | — | 6 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblInstitute` | — | 5 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblInstituteHasCourses` | — | 95 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblInvestigation` | — | 8 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblInvestigation_Has_Papers` | — | 8 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblInvestigation_Has_Parts` | — | 6 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblInvestigation_has_PeopleAndPositions` | — | 9 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblInvestigation_Has_Processes` | — | 8 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblJM` | — | 92 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblJM_Has_InspectionChecklist` | — | 2208 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblJM_Has_Passengers` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblJM_Has_RoadCondition` | — | 1380 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblJM_Has_RouteBreakdown` | — | 330 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblJM_Has_WeatherCondition` | — | 920 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblJMDriver` | — | 87 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblJMInspectionChecklist` | — | 24 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblJMVehicleDetail` | — | 54 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblJobFactor` | — | 9 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblJobPosition` | — | 121 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblKBInsightConfigMain` | — | 29 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblKBInsightDashboardSetting` | — | 28 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblKBInsightDashboardSettingWeightage` | — | 6 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblKBInsightsDataDetail` | — | 1672 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblKBInsightsDataHeader` | — | 474 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblKBTicker` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblKPIGroupMaster` | — | 3 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblLibrary` | `public.document` | 657 | — | — | candidate; unapproved | Verify target columns, parent and attachment/blob rules. |
| `dbo.tblLibraryAccess` | `review_required_acl` | 32 | — | — | candidate; unapproved | No target table established; decide ACL/principal model. |
| `dbo.tblLibraryHierarchy` | `public.document_folder` | 1903 | — | — | candidate; unapproved | Verify parent/path/order semantics and target constraints. |
| `dbo.tblLocation` | — | 6 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblLogin` | — | 266 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblLoginAccess` | — | 114 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblManagementFactor` | — | 9 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblMaterialReleased` | — | 3 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblMeeting_Has_Incidents` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblMeeting_Has_Notes` | — | 6 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblMeeting_Has_Participants` | — | 507 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblMeeting_Has_ParticipantsExternal` | — | 10 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblMeetings` | — | 123 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblMeetingType` | — | 54 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblMeetingVenues` | — | 7 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblMOC` | — | 55 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblMOCApprover` | — | 100 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblMOCApproverHistory` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblMOCAreaAffected` | — | 5 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblMOCCategory` | — | 11 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblMOCMB` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblMOCMBApprover` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblMOCMBApproverHistory` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblMOCMBStatges` | — | 12 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblMOCMMBExpiryHistory` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblMOCStatges` | — | 10 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblMOCSubType` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblMonthlySheet` | — | 588 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblMonthlySheetDateDetail` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblMonthlySheetDateMaster` | — | 38 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblMonthlySheetImports` | — | 43 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblNCAffectedSystem` | — | 11 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblNCPossibleCause` | — | 34 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblNCType` | — | 7 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblNonConformance` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblNonConformance_Has_AuditingParty` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblNotification` | — | 4482 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblNotificationType` | — | 130 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblNumberofPeople` | — | 4 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblObservationCategory` | — | 105 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblObservationType` | — | 5 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblOCMasters` | — | 258 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblOCWSAccess` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblOutcome` | — | 30 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblParameterDetail` | — | 143 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblParameterDetails` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblParameterGroup` | — | 30 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblParameterHeader` | — | 142 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblParameterMaster` | — | 5 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblPasswordSetting` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblPersonalFactor` | — | 7 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblPersonalLoss` | — | 3 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblPosition` | — | 27 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblPotentialSeverity` | — | 5 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblProbability` | — | 5 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblPTW` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblPTW_Has_Document` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblPTW_Has_Precaution` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblPTWApprover` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblPTWApproverHistory` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblPTWDocument` | — | 2 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblPTWPrecautionSubType` | — | 3 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblPTWPrecautionType` | — | 3 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblPTWScopeofWork` | — | 2 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblPTWStatus` | — | 8 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblPTWType` | — | 2 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblPTWWorkArea` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRelationDetail` | — | 509 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRelationMaster` | — | 108 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblReportEngineFields` | — | 1062 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblReportEngineMaster` | — | 66 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblReportEngineRelation` | — | 142 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblReportEngineRelationExclude` | — | 13 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblReportEngineSortMapping` | — | 2 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblReportEngineUserDisplayFields` | — | 28 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblReportEngineUserDisplayFieldsSort` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblReportEngineUserFilters` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblReportEngineUserMaster` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblReportEngineUserRelations` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblReportEngineUserReportGroup` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblReportEngineWorkArea` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblReportEventDetail` | — | 55 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblReportEventDetailKPI` | — | 158 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblReportEventHeader` | — | 5 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblResetPassword` | — | 267 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRIA` | — | 39 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRIA_Has_AdditionalPreventative` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRIA_Has_ExistingPreventative` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRIA_has_Hazard` | — | 232 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRIAActivity` | — | 44 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRIAApprover` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRIAApproverHistory` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRIAHazard` | — | 148 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRIAHazardCategory` | — | 4 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRIAHazardsImpacts` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRIAPPMeasures` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRIARiskMatrix` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRIARiskMatrixX` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRIARiskMatrixY` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRIARiskType` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRIAStatus` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRiskMatrix` | — | 4 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRiskMatrixX` | — | 36 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRiskMatrixx_tmp` | — | 10 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRiskMatrixY` | — | 23 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRiskMatrixY_tmp` | — | 12 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRMPotentialSeverity` | — | 20 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRMRiskType` | — | 14 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRMRiskType_tmp` | — | 8 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRMRiskTypeAS` | — | 83 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblRoadCondition` | — | 15 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblSafeObservation` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblSafeTrack` | — | 1858 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblSafeTrack_Has_SafeObservation` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblSafeTrack_Has_Types` | — | 1963 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblSafeTrack_Has_UnSafeObservation` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblSafeTrackLocation` | — | 7 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblSafeTrackO` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblSafeTrackStatus` | — | 2 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblScheduleMail` | — | 5 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblScheduleMail_AI` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblScheduleMail_KPI` | — | 2 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblScheduleMail_Training` | — | 3 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblSearchEngineFieldMapping` | — | 326 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblSearchEngineFields` | — | 2086 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblSearchEngineFieldsSort` | — | 105 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblSearchEngineFilters` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblSearchEngineMaster` | — | 183 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblSettings` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblSeverity` | — | 3 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblShareDetail` | — | 2 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblShareMaster` | — | 8 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblSite` | — | 10 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblSQCategory` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblSQFailureSubType` | — | 5 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblSQFailureType` | — | 5 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblSQINCFailure` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblState` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblStatus` | — | 4 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblSubstandardActs` | — | 38 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblSubstandardCondition` | — | 39 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblSubType` | — | 228 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblTaskManager` | — | 34 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblTaskSource` | — | 2 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblTeamLead` | — | 4 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblTempTraning_Course_Compliance_dashboard` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblTimeLossType` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblTraCompliance` | — | 23 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblTraComplianceMatrix` | — | 1237 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblTraCriteria` | — | 4 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblTrainingDashboardbreakup` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblTrainingDBMailSent` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblTrainingDetail` | — | 3120 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblTrainingSetting` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblType` | — | 26 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblUnSafeObservation` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblUnSafeSpecific` | — | None | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblUnSafeSubCategory` | — | 186 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblUserLog` | — | 2810 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblUserLogExt` | — | 0 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblUserPasswordHistory` | — | 416 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblUserRights` | — | 3097 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblUserRights_History` | — | 17232 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblUserRole` | — | 11 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblUserRole_History` | — | 70 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblVehicle` | — | 28 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblWeatherCondition` | — | 10 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tblWorkArea` | — | 16 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |
| `dbo.tmpdata` | — | 3 | — | — | unresolved | Provide target, key/FK, column, transformation, soft-delete, PII, and non-PII validation decisions. |

## Smallest safe pilot and blocker

The smallest useful pilot remains read-only BusinessUnit → Company → Employee. BusinessUnit exercises a count match; Company and Employee exercise mismatch handling and non-PII identity validation. The exact blocker preventing further progress is the absence of a reviewed source-to-target mapping manifest and transformation/identity contract for 335 tables, plus unresolved record-level evidence for Company and Employee.

## Single next action

Provide and approve a reviewed mapping manifest for the 335 unresolved tables and the non-PII identity rules for Company/Employee; then run a read-only per-table keyed validation. Any write/import phase remains a separate, explicit approval step.
