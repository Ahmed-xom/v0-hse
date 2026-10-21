# HSE final review batch

## Scope

This is a review checklist only. No mapping is approved and every source table remains `approved: false`. Evidence considered: `config/aegis-335-disposition-draft.json`, `reports/aegis-next-actions.md`, `reports/aegis-neon-staging-schema-evidence.md`, `reports/aegis-code-based-mapping-review.md`, and local Git export metadata. No service or SQL query was executed.

## Decision summary

| Batch | Count | Evidence currently available | Missing to decide |
|---|---:|---|---|
| Business decision required | 64 | Source columns; no proven target, PK, or FK contract | Owner decision on disposition, target domain, retention, and business semantics |
| Map candidate review | 81 | Source columns and PK metadata | Target table/columns, target key, FK contract, transformations, approval |
| Split/merge review | 190 | Source columns; 146 have PK metadata and all 190 have FK metadata | Cardinality, target model, split/merge rules, key translations, approval |
| **Total** | **335** | Complete source list | No automatic approval |

## Evidence-backed links

**0 links are proven enough to establish a source-to-target mapping.** The current draft has no non-empty proposed target fields for unresolved tables. Source PK/FK metadata proves source structure only; target schema evidence and application code do not prove targets for these 335 tables. Similar names or counts are deliberately not treated as evidence.

## Business decisions — 64 tables

Options for each: `retain-and-map`, `archive-only`, `exclude-with-rationale`, or `split/merge-review`; decision owner must also specify retention/soft-delete policy and sensitivity classification. Evidence available: source columns only; no target contract.

- `dbo.ActionItemParent` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.AegisTenant_dbo_tblEmailRouterStatus` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.AuditCheckListImport` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.AuditDashboardSummary` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.AuditOptionDetail` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.AuditOptionMain` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.InspectionCheckListImport` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.InspectionDashboardSummary` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.InspectionOptionDetail` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.InspectionOptionMain` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.MFCategory` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblActionListGroup` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblActionListQuickMenu` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblAegisModule` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblAegisReviewerApproverSub` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblBIStrategicKPI` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblBulkDeleteMaster` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblCustomLog` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblDashboardLaggingIndicatorCompanyLTI` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblDashboardSafetyPyramid` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblDashboardTargets` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblDashboardTrainingComplianceChart` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblEmailRouterBusinessDate` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblEmailRouterFieldObjects` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblEmailRouterObjects` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblEmailRouterRule` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblEmailRouterStatus` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblEquipmentSort` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblExcelTemplate` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblExtensionData` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblFrequencyReportData` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblFrequencyReportSetting` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblGenrateEmailRouterQueue` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblHEMPStatus` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblInsightsSettings` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblKBInsightConfigMain` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblKBInsightDashboardSetting` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblKBInsightsDataDetail` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblMOCApprover` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblMOCMBApprover` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblMOCMBStatges` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblMOCMMBExpiryHistory` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblMOCStatges` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblNonConformance_Has_AuditingParty` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblOCMasters` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblOCWSAccess` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblPTWStatus` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblParameterGroup` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblRIAStatus` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblRMRiskTypeAS` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblRMRiskType_tmp` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblReportEngineWorkArea` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblReportEventDetailKPI` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblRiskMatrixY_tmp` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblRiskMatrixx_tmp` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblScheduleMail_AI` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblScheduleMail_KPI` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblScheduleMail_Training` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblSettings` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblTempTraning_Course_Compliance_dashboard` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblTrainingDashboardbreakup` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblUserLogExt` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tblfncTrainingCourseGet` — decision: target disposition, retention/soft-delete rule, and business owner.
- `dbo.tmpdata` — decision: target disposition, retention/soft-delete rule, and business owner.

## Map-candidate review — 81 tables

Options: retain a one-to-one target mapping only if target schema/columns and key correspondence are supplied; otherwise move to `split_merge_review`, `archive-only`, or `exclude-with-rationale`. Current evidence is source PK plus columns, not target proof.

- `dbo.ActionItemPriority` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.ActionItemType` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.AegisTenant_dbo_tblTenant` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.AuditCategory` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.AuditInspectionCat` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.AuditInspectionSec` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.ImmediateCauseCategory` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.InspectionCategory` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.InspectionInspectionCat` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.Inspectionsec` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.SQNotification` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.SQRootCauseCategory` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblActionList` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblActivityType` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblAegisStatus` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblAsset` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblAssetCategory` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblAttachments` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblBI_DashboardDataMaster` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblBreach` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblBulkImportMaster` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblBusinessUnit_History` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblCity` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblClient` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblCountry` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblCourseCategory` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblCourses` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblCrew` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblCurrency` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblDamage` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblDepartment` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblDesignation` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblEmailRouterMaster` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblEqpCriteria` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblEqpSort` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblEquipmentDBMailSent` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblExtensionMaster` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblFrequencyofactivity` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblHazardCategory` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblImpact` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblIncidentType` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblInjuryType` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblInstitute` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblInstituteHasCourses` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblJobPosition` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblLocation` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblMeetingType` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblMeetingVenues` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblNotification` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblNotificationType` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblNumberofPeople` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblOutcome` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblParameterDetail` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblParameterHeader` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblParameterMaster` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblPosition` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblPotentialSeverity` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblProbability` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblRelationMaster` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblReportEngineMaster` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblRoadCondition` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblSQCategory` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblSQFailureType` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblSafeObservation` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblSafeTrackLocation` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblSafeTrackStatus` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblSeverity` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblShareMaster` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblSite` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblState` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblStatus` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblSubstandardActs` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblSubstandardCondition` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblTimeLossType` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblTraCompliance` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblTraCriteria` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblType` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblUnSafeObservation` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblUserRole_History` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblVehicle` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.
- `dbo.tblWorkArea` — source PK/columns available; missing target table, target columns, target PK correspondence, FK/transformation rules, and approval.

## Split/merge review — 190 tables

Options: one-to-one, one-to-many split, many-to-one merge, archive-only, or exclude-with-rationale. Required decisions: parent/child cardinality, FK translation, identity preservation, null/orphan behavior, ordering, and soft deletes.

- `dbo.ActionItems` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.ActionItems_AuditTrail` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.AuditAssignment` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.AuditChecklist` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.AuditHasCategories` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.AuditInspectionDetails` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.AuditInspectionsHeader` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.AuditQuestions` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.AuditSections` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.AuditSubCategory` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.Audits` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.InspectionAssignment` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.InspectionChecklist` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.InspectionHasCategories` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.InspectionInspectionDetails` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.InspectionQuestions` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.InspectionSections` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.InspectionSubCategory` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.Inspections` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.InspectionsHeader` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.SQImmediateCause` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.SQInvestigation` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.SQManagementFailure` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.SQRootCause` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblAIPossibleRootCause` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblAegisReviewerApproverDetails` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblAegisReviewerApproverHeader` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblAegisStageComments` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblAssetLoss` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblAutomotiveLoss` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblBI_DashboardDetails` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblBI_DashboardMaster` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblBulkImportDetail` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblCertiBody` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblCertiBodyHasCertificates` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblCertificates` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblCertificationCategory` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblCertificationDetail` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblContractors` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblDailySheetDetail` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblDailySheetEventAR` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblDailySheetMaster` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblDashboardLaggingIndicatorBULTI` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblDashboardLaggingIndicatorYears` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblDashboardRAG` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblDevExpressDetails` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblDevExpressMaster` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblEmailRouterGroup` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblEmailRouterSchedule` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblEnvironmentalLoss` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblEqpCompliance` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblEqpComplianceMatrix` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblEquipment` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblEquipmentType` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblEquipmentTypeConfigDetail` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblEquipmentTypeConfigMaster` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblExtensionDetail` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblFTWDetail` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblForum` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblHEMP` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblHEMP_Has_HazardRiskControl` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblHSEINC` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblHSESafetyAlert` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblImmediateCauseSA` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblImmediateCauseSC` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblImportFileHistory` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblInvestigation` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblInvestigation_Has_Papers` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblInvestigation_Has_Parts` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblInvestigation_Has_Processes` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblInvestigation_has_PeopleAndPositions` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblJM` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblJMDriver` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblJMInspectionChecklist` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblJMVehicleDetail` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblJM_Has_InspectionChecklist` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblJM_Has_Passengers` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblJM_Has_RoadCondition` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblJM_Has_RouteBreakdown` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblJM_Has_WeatherCondition` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblJobFactor` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblKBInsightDashboardSettingWeightage` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblKBInsightsDataHeader` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblKBTicker` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblKPIGroupMaster` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblLogin` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblLoginAccess` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblMOC` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblMOCApproverHistory` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblMOCAreaAffected` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblMOCCategory` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblMOCMB` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblMOCMBApproverHistory` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblMOCSubType` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblManagementFactor` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblMaterialReleased` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblMeeting_Has_Incidents` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblMeeting_Has_Notes` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblMeeting_Has_Participants` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblMeeting_Has_ParticipantsExternal` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblMeetings` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblMonthlySheet` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblMonthlySheetDateDetail` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblMonthlySheetDateMaster` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblMonthlySheetImports` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblNCAffectedSystem` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblNCPossibleCause` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblNCType` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblNonConformance` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblObservationCategory` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblObservationType` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblPTW` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblPTWApprover` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblPTWApproverHistory` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblPTWDocument` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblPTWPrecautionSubType` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblPTWPrecautionType` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblPTWScopeofWork` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblPTWType` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblPTWWorkArea` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblPTW_Has_Document` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblPTW_Has_Precaution` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblParameterDetails` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblPasswordSetting` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblPersonalFactor` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblPersonalLoss` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblRIA` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblRIAActivity` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblRIAApprover` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblRIAApproverHistory` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblRIAHazard` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblRIAHazardCategory` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblRIAHazardsImpacts` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblRIAPPMeasures` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblRIARiskMatrix` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblRIARiskMatrixX` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblRIARiskMatrixY` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblRIARiskType` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblRIA_Has_AdditionalPreventative` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblRIA_Has_ExistingPreventative` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblRIA_has_Hazard` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblRMPotentialSeverity` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblRMRiskType` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblRelationDetail` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblReportEngineFields` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblReportEngineRelation` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblReportEngineRelationExclude` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblReportEngineSortMapping` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblReportEngineUserDisplayFields` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblReportEngineUserDisplayFieldsSort` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblReportEngineUserFilters` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblReportEngineUserMaster` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblReportEngineUserRelations` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblReportEngineUserReportGroup` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblReportEventDetail` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblReportEventHeader` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblResetPassword` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblRiskMatrix` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblRiskMatrixX` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblRiskMatrixY` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblSQFailureSubType` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblSQINCFailure` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblSafeTrack` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblSafeTrackO` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblSafeTrack_Has_SafeObservation` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblSafeTrack_Has_Types` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblSafeTrack_Has_UnSafeObservation` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblScheduleMail` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblSearchEngineFieldMapping` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblSearchEngineFields` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblSearchEngineFieldsSort` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblSearchEngineFilters` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblSearchEngineMaster` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblShareDetail` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblSubType` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblTaskManager` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblTaskSource` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblTeamLead` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblTraComplianceMatrix` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblTrainingDBMailSent` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblTrainingDetail` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblTrainingSetting` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblUnSafeSpecific` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblUnSafeSubCategory` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblUserLog` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblUserPasswordHistory` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblUserRights` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblUserRights_History` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblUserRole` — source FK metadata available; missing target relationship model, cardinality and transformation contract.
- `dbo.tblWeatherCondition` — source FK metadata available; missing target relationship model, cardinality and transformation contract.

## Shortest path to keyed read-only validation

1. Supply one reviewed disposition row for each of the 335 tables: target or archive/exclude, source-to-target key, target PK/FK, transformation/cardinality, and soft-delete rule.
2. Approve only the mapping batch explicitly reviewed by the owner; leave all others unapproved.
3. Run read-only keyed validation on the non-production branch using aggregate counts and keyed/HMAC identity summaries only; never return employee names, emails, or full rows.
4. Investigate mismatches before any separate, explicit write/import approval.

## Coverage and approval state

- Entries covered: **335**.
- Unique source tables: **335**.
- Approved entries: **0**.
- Proven source-to-target links: **0**.
- The checklist does not create or approve mappings.
