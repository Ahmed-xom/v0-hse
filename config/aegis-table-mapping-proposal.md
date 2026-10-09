# Aegis_XOM to Neon Mapping Proposal

Generated: 2026-10-09T09:52:03.686Z

**Approval status: NOT APPROVED**

This report is based on the validated read-only export and current Neon/Drizzle schema. It proposes mappings only; it does not authorize import.

## Source scope

- Database: Aegis_XOM
- Tables: 341
- Rows: 139123
- Columns: 3,665 (from inspection report)
- ZIP: .tmp/Aegis_XOM_Export.zip

## Classification counts

- PROPOSED_BUSINESS_MAPPING: 8
- REQUIRES_MANUAL_REVIEW: 6
- LEGACY_OR_AUDIT_DATA: 34
- EMPTY_TABLE: 72
- SECURITY_OR_AUTH_EXCLUDED: 5
- NO_SAFE_DESTINATION: 216

## Highest-priority review mappings

### tblCompany → company

- Area: Companies and business units
- Source rows: 1
- Confidence: HIGH
- Status: PROPOSED_BUSINESS_MAPPING; approved: false
- PK strategy: Preserve source Cmp_Id as prefixed text id; verify collision with existing public.company.
- Import order: 10
- Columns: Cmp_Id → id (numeric to stable text id); Cmp_Name → name (nvarchar to text); Cmp_Code → code (nvarchar to text)
- Concerns: Source has one row; image/blob and tax fields have no current destination. Existing company uniqueness constraints must be checked.
- Manual decision: required

### tblBusinessUnit → business_unit

- Area: Companies and business units
- Source rows: 7
- Confidence: MEDIUM
- Status: PROPOSED_BUSINESS_MAPPING; approved: false
- PK strategy: Preserve source BU_Id as prefixed text id; map companyId only after Cmp_Id/CId relationship is confirmed.
- Import order: 20
- Columns: BU_Id → id (numeric to stable text id); BU_Name → name (nvarchar to text); BU_Desc → description (nvarchar to text); BU_Under_Id → parent relationship (requires explicit hierarchy decision)
- Concerns: BU_Id is numeric and destination companyId is required. Parent hierarchy has no direct destination column.
- Manual decision: required

### tblEmployee → employee

- Area: Employees and user references
- Source rows: 378
- Confidence: MEDIUM
- Status: PROPOSED_BUSINESS_MAPPING; approved: false
- PK strategy: Never target neon_auth.user/account/session. Create/update employee records only after email and role matching is approved.
- Import order: 30
- Columns: Emp_Id → id (numeric to stable text id); Emp_Payroll_No → payrollNo (nvarchar to varchar); Emp_Name → name (nvarchar to varchar); Emp_EmailId → email (nvarchar to varchar); BU_Id → businessUnit (requires BU mapping); Emp_Status → status (int status dictionary required)
- Concerns: 378 rows; email may be null or duplicate. Source employee/user identity is not sufficient to create Better Auth accounts.
- Manual decision: required

### AuditCategory → No destination

- Area: Master/reference data
- Source rows: 11
- Confidence: LOW
- Status: REQUIRES_MANUAL_REVIEW; approved: false
- PK strategy: No safe destination until audit taxonomy is mapped to observation_type/inspection_type or master.
- Import order: 40
- Columns: No column mapping proposed.
- Concerns: Category taxonomy differs from current app tables.
- Manual decision: required

### AuditSubCategory → No destination

- Area: Master/reference data
- Source rows: 71
- Confidence: LOW
- Status: REQUIRES_MANUAL_REVIEW; approved: false
- PK strategy: No safe destination until parent category and semantics are approved.
- Import order: 40
- Columns: No column mapping proposed.
- Concerns: Requires parent category mapping.
- Manual decision: required

### tblIncidentType → master

- Area: Master/reference data
- Source rows: 25
- Confidence: MEDIUM
- Status: PROPOSED_BUSINESS_MAPPING; approved: false
- PK strategy: Use generated stable master ids and type=incident_type; do not reuse source numeric id as primary key without collision check.
- Import order: 40
- Columns: IncType_Id → key (numeric to text); IncType_Name → value (nvarchar to text); IncType_Desc → description (nvarchar to text)
- Concerns: 25 rows; ForHSE/ForSQ flags have no direct master column.
- Manual decision: required

### AuditQuestions → No destination

- Area: Inspections
- Source rows: 3408
- Confidence: LOW
- Status: REQUIRES_MANUAL_REVIEW; approved: false
- PK strategy: Requires manual mapping to inspection_type or a new approved detail model.
- Import order: 50
- Columns: No column mapping proposed.
- Concerns: 3408 rows; no destination question/checklist model identified in current Drizzle schema.
- Manual decision: required

### Inspections → inspection_type

- Area: Inspections
- Source rows: 29
- Confidence: MEDIUM
- Status: PROPOSED_BUSINESS_MAPPING; approved: false
- PK strategy: Preserve source Inspection_Id as prefixed text id after collision check.
- Import order: 50
- Columns: Inspection_Id → id (bigint to stable text id); Inspection_Name → name (nvarchar to varchar); Inspection_Desc → description (nvarchar to text); Threshold → frequency (not compatible; manual decision required); State → isActive (bit to boolean)
- Concerns: Threshold is not a frequency. Category/subcategory references require separate mapping.
- Manual decision: required

### AuditInspectionsHeader → inspection

- Area: Inspections
- Source rows: 97
- Confidence: LOW
- Status: PROPOSED_BUSINESS_MAPPING; approved: false
- PK strategy: Do not import until Emp_Id to approved userId mapping exists.
- Import order: 60
- Columns: AssignAudit_Id → id (bigint to stable text id); Emp_Id → userId (numeric employee identity to Better Auth UUID; unresolved); AuditCompliance → findings (numeric summary to text or structured value); CreatedAt → createdAt (datetime to timestamp)
- Concerns: Required inspectionTypeId and businessUnitId need validated joins.
- Manual decision: required

### InspectionAssignment → No destination

- Area: Inspections
- Source rows: 78
- Confidence: LOW
- Status: REQUIRES_MANUAL_REVIEW; approved: false
- PK strategy: Requires manual review; no safe one-table destination.
- Import order: 60
- Columns: No column mapping proposed.
- Concerns: 78 rows and multiple business-unit/user foreign keys.
- Manual decision: required

### tblCourses → training

- Area: Training and training notifications
- Source rows: 111
- Confidence: LOW
- Status: PROPOSED_BUSINESS_MAPPING; approved: false
- PK strategy: Course catalog cannot map directly to training rows because destination training requires employeeName and employeeCode.
- Import order: 80
- Columns: CourseId → id (bigint to stable text id); CourseTitle → courseName (nvarchar to text); Description → result (not semantically compatible); RecertificationInterval → expiryDate (interval requires employee completion date)
- Concerns: 111 course rows; needs separate course destination or approved denormalization.
- Manual decision: required

### tblEmployee → training

- Area: Training and training notifications
- Source rows: 378
- Confidence: LOW
- Status: PROPOSED_BUSINESS_MAPPING; approved: false
- PK strategy: Not a standalone mapping; requires training completion source tables and employee matching.
- Import order: 80
- Columns: Emp_Name → employeeName (nvarchar to text); Emp_Payroll_No → employeeCode (nvarchar to text)
- Concerns: Do not create training rows from employee rows.
- Manual decision: required

### tblJMVehicleDetail → vehicle

- Area: Journeys and vehicles
- Source rows: 54
- Confidence: MEDIUM
- Status: PROPOSED_BUSINESS_MAPPING; approved: false
- PK strategy: Destination vehicle id is generated identity; match by normalized plate_no, never source numeric id alone.
- Import order: 90
- Columns: VehicleRegistrationNo → plate_no (nvarchar to text); AllowableLoad → allowable_load (nvarchar to text); KMReading → km_reading (nvarchar to text); Description → description (nvarchar to text)
- Concerns: Vehicle table name/row count must be confirmed from source catalog; duplicate plates need review.
- Manual decision: required

### ActionItems → No destination

- Area: Other relevant HSE modules
- Source rows: 669
- Confidence: LOW
- Status: REQUIRES_MANUAL_REVIEW; approved: false
- PK strategy: Requires manual review; likely action-item/audit history and no direct destination table.
- Import order: 100
- Columns: No column mapping proposed.
- Concerns: 669 rows; depends on audits, employees, priorities, statuses and parent objects.
- Manual decision: required

### ActionItems_AuditTrail → No destination

- Area: Other relevant HSE modules
- Source rows: 1109
- Confidence: LOW
- Status: REQUIRES_MANUAL_REVIEW; approved: false
- PK strategy: Legacy/audit data; retain as archive until audit destination is approved.
- Import order: 100
- Columns: No column mapping proposed.
- Concerns: 1109 rows; no safe destination in current schema.
- Manual decision: required

## Safety exclusions

Better Auth users, accounts, sessions, verification records, organization membership, passwords, auth keys, roles, and permissions are excluded. Existing Neon data, schema, authentication, and production configuration are unchanged.

## Required approval before import

Approve mappings table-by-table only after confirming destination columns, source/destination key strategy, FK order, duplicate policy, null/type conversions, and a dry-run reconciliation report.

## Full classification

| Source table | Rows | Classification |
|---|---:|---|
| dbo.ActionItemParent | 12 | NO_SAFE_DESTINATION |
| dbo.ActionItemPriority | 5 | NO_SAFE_DESTINATION |
| dbo.ActionItems | 669 | REQUIRES_MANUAL_REVIEW |
| dbo.ActionItems_AuditTrail | 1109 | REQUIRES_MANUAL_REVIEW |
| dbo.ActionItemType | 3 | NO_SAFE_DESTINATION |
| dbo.AegisTenant_dbo_tblEmailRouterStatus | 0 | EMPTY_TABLE |
| dbo.AegisTenant_dbo_tblTenant | 0 | EMPTY_TABLE |
| dbo.AuditAssignment | 491 | NO_SAFE_DESTINATION |
| dbo.AuditCategory | 11 | REQUIRES_MANUAL_REVIEW |
| dbo.AuditChecklist | 97 | NO_SAFE_DESTINATION |
| dbo.AuditCheckListImport | 3429 | LEGACY_OR_AUDIT_DATA |
| dbo.AuditDashboardSummary | 97 | LEGACY_OR_AUDIT_DATA |
| dbo.AuditHasCategories | 238 | NO_SAFE_DESTINATION |
| dbo.AuditInspectionCat | 185 | NO_SAFE_DESTINATION |
| dbo.AuditInspectionDetails | 4414 | NO_SAFE_DESTINATION |
| dbo.AuditInspectionSec | 983 | NO_SAFE_DESTINATION |
| dbo.AuditInspectionsHeader | 97 | PROPOSED_BUSINESS_MAPPING |
| dbo.AuditOptionDetail | 3 | NO_SAFE_DESTINATION |
| dbo.AuditOptionMain | 1 | NO_SAFE_DESTINATION |
| dbo.AuditQuestions | 3408 | REQUIRES_MANUAL_REVIEW |
| dbo.Audits | 104 | NO_SAFE_DESTINATION |
| dbo.AuditSections | 878 | NO_SAFE_DESTINATION |
| dbo.AuditSubCategory | 71 | REQUIRES_MANUAL_REVIEW |
| dbo.ImmediateCauseCategory | 21 | NO_SAFE_DESTINATION |
| dbo.InspectionAssignment | 78 | REQUIRES_MANUAL_REVIEW |
| dbo.InspectionCategory | 3 | NO_SAFE_DESTINATION |
| dbo.InspectionChecklist | 21 | NO_SAFE_DESTINATION |
| dbo.InspectionCheckListImport | 2069 | LEGACY_OR_AUDIT_DATA |
| dbo.InspectionDashboardSummary | 29 | LEGACY_OR_AUDIT_DATA |
| dbo.InspectionHasCategories | 49 | NO_SAFE_DESTINATION |
| dbo.InspectionInspectionCat | 62 | NO_SAFE_DESTINATION |
| dbo.InspectionInspectionDetails | 1496 | NO_SAFE_DESTINATION |
| dbo.InspectionOptionDetail | 3 | NO_SAFE_DESTINATION |
| dbo.InspectionOptionMain | 1 | NO_SAFE_DESTINATION |
| dbo.InspectionQuestions | 950 | NO_SAFE_DESTINATION |
| dbo.Inspections | 29 | PROPOSED_BUSINESS_MAPPING |
| dbo.Inspectionsec | 218 | NO_SAFE_DESTINATION |
| dbo.InspectionSections | 98 | NO_SAFE_DESTINATION |
| dbo.InspectionsHeader | 33 | NO_SAFE_DESTINATION |
| dbo.InspectionSubCategory | 30 | NO_SAFE_DESTINATION |
| dbo.MFCategory | 43 | NO_SAFE_DESTINATION |
| dbo.SQImmediateCause | 0 | EMPTY_TABLE |
| dbo.SQInvestigation | 0 | EMPTY_TABLE |
| dbo.SQManagementFailure | 0 | EMPTY_TABLE |
| dbo.SQNotification | 0 | EMPTY_TABLE |
| dbo.SQRootCause | 0 | EMPTY_TABLE |
| dbo.SQRootCauseCategory | 146 | NO_SAFE_DESTINATION |
| dbo.tblActionList | 430 | NO_SAFE_DESTINATION |
| dbo.tblActionListGroup | 2 | NO_SAFE_DESTINATION |
| dbo.tblActionListQuickMenu | 0 | EMPTY_TABLE |
| dbo.tblActivityType | 2 | NO_SAFE_DESTINATION |
| dbo.tblAegisModule | 13 | NO_SAFE_DESTINATION |
| dbo.tblAegisReviewerApproverDetails | 1 | NO_SAFE_DESTINATION |
| dbo.tblAegisReviewerApproverHeader | 1 | NO_SAFE_DESTINATION |
| dbo.tblAegisReviewerApproverSub | 1 | NO_SAFE_DESTINATION |
| dbo.tblAegisStageComments | 280 | NO_SAFE_DESTINATION |
| dbo.tblAegisStatus | 30 | NO_SAFE_DESTINATION |
| dbo.tblAIPossibleRootCause | 4 | NO_SAFE_DESTINATION |
| dbo.tblAsset | 4 | NO_SAFE_DESTINATION |
| dbo.tblAssetCategory | 5 | NO_SAFE_DESTINATION |
| dbo.tblAssetLoss | 14 | NO_SAFE_DESTINATION |
| dbo.tblAttachments | 1791 | NO_SAFE_DESTINATION |
| dbo.tblAutomotiveLoss | 4 | NO_SAFE_DESTINATION |
| dbo.tblBI_DashboardDataMaster | 15 | LEGACY_OR_AUDIT_DATA |
| dbo.tblBI_DashboardDetails | 14 | LEGACY_OR_AUDIT_DATA |
| dbo.tblBI_DashboardMaster | 19 | LEGACY_OR_AUDIT_DATA |
| dbo.tblBIStrategicKPI | 0 | EMPTY_TABLE |
| dbo.tblBreach | 11 | NO_SAFE_DESTINATION |
| dbo.tblBulkDeleteMaster | 115 | LEGACY_OR_AUDIT_DATA |
| dbo.tblBulkImportDetail | 450 | LEGACY_OR_AUDIT_DATA |
| dbo.tblBulkImportMaster | 94 | LEGACY_OR_AUDIT_DATA |
| dbo.tblBusinessUnit | 7 | PROPOSED_BUSINESS_MAPPING |
| dbo.tblBusinessUnit_History | 54 | LEGACY_OR_AUDIT_DATA |
| dbo.tblCertiBody | 1 | NO_SAFE_DESTINATION |
| dbo.tblCertiBodyHasCertificates | 0 | EMPTY_TABLE |
| dbo.tblCertificates | 1 | NO_SAFE_DESTINATION |
| dbo.tblCertificationCategory | 1 | NO_SAFE_DESTINATION |
| dbo.tblCertificationDetail | 0 | EMPTY_TABLE |
| dbo.tblCity | 0 | EMPTY_TABLE |
| dbo.tblClient | 5 | NO_SAFE_DESTINATION |
| dbo.tblCompany | 1 | PROPOSED_BUSINESS_MAPPING |
| dbo.tblContractors | 4 | NO_SAFE_DESTINATION |
| dbo.tblCountry | 0 | EMPTY_TABLE |
| dbo.tblCourseCategory | 6 | NO_SAFE_DESTINATION |
| dbo.tblCourses | 111 | PROPOSED_BUSINESS_MAPPING |
| dbo.tblCrew | 7 | NO_SAFE_DESTINATION |
| dbo.tblCurrency | 2 | NO_SAFE_DESTINATION |
| dbo.tblCustomLog | 27259 | LEGACY_OR_AUDIT_DATA |
| dbo.tblDailySheetDetail | 0 | EMPTY_TABLE |
| dbo.tblDailySheetEventAR | 0 | EMPTY_TABLE |
| dbo.tblDailySheetMaster | 0 | EMPTY_TABLE |
| dbo.tblDamage | 5 | NO_SAFE_DESTINATION |
| dbo.tblDashboardLaggingIndicatorBULTI | 4 | LEGACY_OR_AUDIT_DATA |
| dbo.tblDashboardLaggingIndicatorCompanyLTI | 1 | LEGACY_OR_AUDIT_DATA |
| dbo.tblDashboardLaggingIndicatorYears | 84 | LEGACY_OR_AUDIT_DATA |
| dbo.tblDashboardRAG | 54 | LEGACY_OR_AUDIT_DATA |
| dbo.tblDashboardSafetyPyramid | 5 | LEGACY_OR_AUDIT_DATA |
| dbo.tblDashboardTargets | 6 | LEGACY_OR_AUDIT_DATA |
| dbo.tblDashboardTrainingComplianceChart | 12 | LEGACY_OR_AUDIT_DATA |
| dbo.tblDepartment | 20 | NO_SAFE_DESTINATION |
| dbo.tblDesignation | 100 | NO_SAFE_DESTINATION |
| dbo.tblDevExpressDetails | 28 | NO_SAFE_DESTINATION |
| dbo.tblDevExpressMaster | 28 | NO_SAFE_DESTINATION |
| dbo.tblEmailRouterBusinessDate | 1 | LEGACY_OR_AUDIT_DATA |
| dbo.tblEmailRouterFieldObjects | 906 | LEGACY_OR_AUDIT_DATA |
| dbo.tblEmailRouterGroup | 0 | EMPTY_TABLE |
| dbo.tblEmailRouterMaster | 58 | LEGACY_OR_AUDIT_DATA |
| dbo.tblEmailRouterObjects | 35 | LEGACY_OR_AUDIT_DATA |
| dbo.tblEmailRouterRule | 41 | LEGACY_OR_AUDIT_DATA |
| dbo.tblEmailRouterSchedule | 5 | LEGACY_OR_AUDIT_DATA |
| dbo.tblEmailRouterStatus | 25827 | LEGACY_OR_AUDIT_DATA |
| dbo.tblEmployee | 378 | PROPOSED_BUSINESS_MAPPING |
| dbo.tblEnvironmentalLoss | 4 | NO_SAFE_DESTINATION |
| dbo.tblEqpCompliance | 0 | EMPTY_TABLE |
| dbo.tblEqpComplianceMatrix | 0 | EMPTY_TABLE |
| dbo.tblEqpCriteria | 4 | NO_SAFE_DESTINATION |
| dbo.tblEqpSort | 0 | EMPTY_TABLE |
| dbo.tblEquipment | 1 | NO_SAFE_DESTINATION |
| dbo.tblEquipmentDBMailSent | 0 | EMPTY_TABLE |
| dbo.tblEquipmentSort | 1 | NO_SAFE_DESTINATION |
| dbo.tblEquipmentType | 1 | NO_SAFE_DESTINATION |
| dbo.tblEquipmentTypeConfigDetail | 0 | EMPTY_TABLE |
| dbo.tblEquipmentTypeConfigMaster | 0 | EMPTY_TABLE |
| dbo.tblExcelTemplate | 10 | NO_SAFE_DESTINATION |
| dbo.tblExtensionData | 0 | EMPTY_TABLE |
| dbo.tblExtensionDetail | 0 | EMPTY_TABLE |
| dbo.tblExtensionMaster | 15 | NO_SAFE_DESTINATION |
| dbo.tblfncTrainingCourseGet | 2401 | NO_SAFE_DESTINATION |
| dbo.tblForum | 0 | EMPTY_TABLE |
| dbo.tblFrequencyofactivity | 5 | NO_SAFE_DESTINATION |
| dbo.tblFrequencyReportData | 508 | NO_SAFE_DESTINATION |
| dbo.tblFrequencyReportSetting | 4 | NO_SAFE_DESTINATION |
| dbo.tblFTWDetail | 0 | EMPTY_TABLE |
| dbo.tblGenrateEmailRouterQueue | 0 | EMPTY_TABLE |
| dbo.tblHazardCategory | 42 | NO_SAFE_DESTINATION |
| dbo.tblHEMP | 0 | EMPTY_TABLE |
| dbo.tblHEMP_Has_HazardRiskControl | 0 | EMPTY_TABLE |
| dbo.tblHEMPStatus | 2 | NO_SAFE_DESTINATION |
| dbo.tblHSEINC | 23 | NO_SAFE_DESTINATION |
| dbo.tblHSESafetyAlert | 1 | NO_SAFE_DESTINATION |
| dbo.tblImmediateCauseSA | 14 | NO_SAFE_DESTINATION |
| dbo.tblImmediateCauseSC | 7 | NO_SAFE_DESTINATION |
| dbo.tblImpact | 1 | NO_SAFE_DESTINATION |
| dbo.tblImportFileHistory | 52 | LEGACY_OR_AUDIT_DATA |
| dbo.tblIncidentType | 25 | PROPOSED_BUSINESS_MAPPING |
| dbo.tblInjuryType | 35 | NO_SAFE_DESTINATION |
| dbo.tblInsightsSettings | 6 | NO_SAFE_DESTINATION |
| dbo.tblInstitute | 5 | NO_SAFE_DESTINATION |
| dbo.tblInstituteHasCourses | 95 | NO_SAFE_DESTINATION |
| dbo.tblInvestigation | 8 | NO_SAFE_DESTINATION |
| dbo.tblInvestigation_Has_Papers | 8 | NO_SAFE_DESTINATION |
| dbo.tblInvestigation_Has_Parts | 6 | NO_SAFE_DESTINATION |
| dbo.tblInvestigation_has_PeopleAndPositions | 9 | NO_SAFE_DESTINATION |
| dbo.tblInvestigation_Has_Processes | 8 | NO_SAFE_DESTINATION |
| dbo.tblJM | 92 | NO_SAFE_DESTINATION |
| dbo.tblJM_Has_InspectionChecklist | 2208 | NO_SAFE_DESTINATION |
| dbo.tblJM_Has_Passengers | 1 | NO_SAFE_DESTINATION |
| dbo.tblJM_Has_RoadCondition | 1380 | NO_SAFE_DESTINATION |
| dbo.tblJM_Has_RouteBreakdown | 330 | NO_SAFE_DESTINATION |
| dbo.tblJM_Has_WeatherCondition | 920 | NO_SAFE_DESTINATION |
| dbo.tblJMDriver | 87 | NO_SAFE_DESTINATION |
| dbo.tblJMInspectionChecklist | 24 | NO_SAFE_DESTINATION |
| dbo.tblJMVehicleDetail | 54 | PROPOSED_BUSINESS_MAPPING |
| dbo.tblJobFactor | 9 | NO_SAFE_DESTINATION |
| dbo.tblJobPosition | 121 | NO_SAFE_DESTINATION |
| dbo.tblKBInsightConfigMain | 29 | NO_SAFE_DESTINATION |
| dbo.tblKBInsightDashboardSetting | 28 | LEGACY_OR_AUDIT_DATA |
| dbo.tblKBInsightDashboardSettingWeightage | 6 | LEGACY_OR_AUDIT_DATA |
| dbo.tblKBInsightsDataDetail | 1672 | NO_SAFE_DESTINATION |
| dbo.tblKBInsightsDataHeader | 474 | NO_SAFE_DESTINATION |
| dbo.tblKBTicker | 1 | NO_SAFE_DESTINATION |
| dbo.tblKPIGroupMaster | 3 | NO_SAFE_DESTINATION |
| dbo.tblLibrary | 657 | NO_SAFE_DESTINATION |
| dbo.tblLibraryAccess | 32 | NO_SAFE_DESTINATION |
| dbo.tblLibraryHierarchy | 1903 | NO_SAFE_DESTINATION |
| dbo.tblLocation | 6 | NO_SAFE_DESTINATION |
| dbo.tblLogin | 266 | SECURITY_OR_AUTH_EXCLUDED |
| dbo.tblLoginAccess | 114 | SECURITY_OR_AUTH_EXCLUDED |
| dbo.tblManagementFactor | 9 | NO_SAFE_DESTINATION |
| dbo.tblMaterialReleased | 3 | NO_SAFE_DESTINATION |
| dbo.tblMeeting_Has_Incidents | 1 | NO_SAFE_DESTINATION |
| dbo.tblMeeting_Has_Notes | 6 | NO_SAFE_DESTINATION |
| dbo.tblMeeting_Has_Participants | 507 | NO_SAFE_DESTINATION |
| dbo.tblMeeting_Has_ParticipantsExternal | 10 | NO_SAFE_DESTINATION |
| dbo.tblMeetings | 123 | NO_SAFE_DESTINATION |
| dbo.tblMeetingType | 54 | NO_SAFE_DESTINATION |
| dbo.tblMeetingVenues | 7 | NO_SAFE_DESTINATION |
| dbo.tblMOC | 55 | NO_SAFE_DESTINATION |
| dbo.tblMOCApprover | 100 | NO_SAFE_DESTINATION |
| dbo.tblMOCApproverHistory | 0 | EMPTY_TABLE |
| dbo.tblMOCAreaAffected | 5 | NO_SAFE_DESTINATION |
| dbo.tblMOCCategory | 11 | NO_SAFE_DESTINATION |
| dbo.tblMOCMB | 0 | EMPTY_TABLE |
| dbo.tblMOCMBApprover | 0 | EMPTY_TABLE |
| dbo.tblMOCMBApproverHistory | 0 | EMPTY_TABLE |
| dbo.tblMOCMBStatges | 12 | NO_SAFE_DESTINATION |
| dbo.tblMOCMMBExpiryHistory | 0 | EMPTY_TABLE |
| dbo.tblMOCStatges | 10 | NO_SAFE_DESTINATION |
| dbo.tblMOCSubType | 0 | EMPTY_TABLE |
| dbo.tblMonthlySheet | 588 | NO_SAFE_DESTINATION |
| dbo.tblMonthlySheetDateDetail | 0 | EMPTY_TABLE |
| dbo.tblMonthlySheetDateMaster | 38 | NO_SAFE_DESTINATION |
| dbo.tblMonthlySheetImports | 43 | LEGACY_OR_AUDIT_DATA |
| dbo.tblNCAffectedSystem | 11 | NO_SAFE_DESTINATION |
| dbo.tblNCPossibleCause | 34 | NO_SAFE_DESTINATION |
| dbo.tblNCType | 7 | NO_SAFE_DESTINATION |
| dbo.tblNonConformance | 0 | EMPTY_TABLE |
| dbo.tblNonConformance_Has_AuditingParty | 0 | EMPTY_TABLE |
| dbo.tblNotification | 4482 | NO_SAFE_DESTINATION |
| dbo.tblNotificationType | 130 | NO_SAFE_DESTINATION |
| dbo.tblNumberofPeople | 4 | NO_SAFE_DESTINATION |
| dbo.tblObservationCategory | 105 | NO_SAFE_DESTINATION |
| dbo.tblObservationType | 5 | NO_SAFE_DESTINATION |
| dbo.tblOCMasters | 258 | NO_SAFE_DESTINATION |
| dbo.tblOCWSAccess | 0 | EMPTY_TABLE |
| dbo.tblOutcome | 30 | NO_SAFE_DESTINATION |
| dbo.tblParameterDetail | 143 | NO_SAFE_DESTINATION |
| dbo.tblParameterDetails | 0 | EMPTY_TABLE |
| dbo.tblParameterGroup | 30 | NO_SAFE_DESTINATION |
| dbo.tblParameterHeader | 142 | NO_SAFE_DESTINATION |
| dbo.tblParameterMaster | 5 | NO_SAFE_DESTINATION |
| dbo.tblPasswordSetting | 1 | SECURITY_OR_AUTH_EXCLUDED |
| dbo.tblPersonalFactor | 7 | NO_SAFE_DESTINATION |
| dbo.tblPersonalLoss | 3 | NO_SAFE_DESTINATION |
| dbo.tblPosition | 27 | NO_SAFE_DESTINATION |
| dbo.tblPotentialSeverity | 5 | NO_SAFE_DESTINATION |
| dbo.tblProbability | 5 | NO_SAFE_DESTINATION |
| dbo.tblPTW | 0 | EMPTY_TABLE |
| dbo.tblPTW_Has_Document | 0 | EMPTY_TABLE |
| dbo.tblPTW_Has_Precaution | 0 | EMPTY_TABLE |
| dbo.tblPTWApprover | 0 | EMPTY_TABLE |
| dbo.tblPTWApproverHistory | 0 | EMPTY_TABLE |
| dbo.tblPTWDocument | 2 | NO_SAFE_DESTINATION |
| dbo.tblPTWPrecautionSubType | 3 | NO_SAFE_DESTINATION |
| dbo.tblPTWPrecautionType | 3 | NO_SAFE_DESTINATION |
| dbo.tblPTWScopeofWork | 2 | NO_SAFE_DESTINATION |
| dbo.tblPTWStatus | 8 | NO_SAFE_DESTINATION |
| dbo.tblPTWType | 2 | NO_SAFE_DESTINATION |
| dbo.tblPTWWorkArea | 1 | NO_SAFE_DESTINATION |
| dbo.tblRelationDetail | 509 | NO_SAFE_DESTINATION |
| dbo.tblRelationMaster | 108 | NO_SAFE_DESTINATION |
| dbo.tblReportEngineFields | 1062 | NO_SAFE_DESTINATION |
| dbo.tblReportEngineMaster | 66 | NO_SAFE_DESTINATION |
| dbo.tblReportEngineRelation | 142 | NO_SAFE_DESTINATION |
| dbo.tblReportEngineRelationExclude | 13 | NO_SAFE_DESTINATION |
| dbo.tblReportEngineSortMapping | 2 | NO_SAFE_DESTINATION |
| dbo.tblReportEngineUserDisplayFields | 28 | NO_SAFE_DESTINATION |
| dbo.tblReportEngineUserDisplayFieldsSort | 1 | NO_SAFE_DESTINATION |
| dbo.tblReportEngineUserFilters | 1 | NO_SAFE_DESTINATION |
| dbo.tblReportEngineUserMaster | 1 | NO_SAFE_DESTINATION |
| dbo.tblReportEngineUserRelations | 1 | NO_SAFE_DESTINATION |
| dbo.tblReportEngineUserReportGroup | 0 | EMPTY_TABLE |
| dbo.tblReportEngineWorkArea | 1 | NO_SAFE_DESTINATION |
| dbo.tblReportEventDetail | 55 | NO_SAFE_DESTINATION |
| dbo.tblReportEventDetailKPI | 158 | NO_SAFE_DESTINATION |
| dbo.tblReportEventHeader | 5 | NO_SAFE_DESTINATION |
| dbo.tblResetPassword | 267 | SECURITY_OR_AUTH_EXCLUDED |
| dbo.tblRIA | 39 | NO_SAFE_DESTINATION |
| dbo.tblRIA_Has_AdditionalPreventative | 0 | EMPTY_TABLE |
| dbo.tblRIA_Has_ExistingPreventative | 0 | EMPTY_TABLE |
| dbo.tblRIA_has_Hazard | 232 | NO_SAFE_DESTINATION |
| dbo.tblRIAActivity | 44 | NO_SAFE_DESTINATION |
| dbo.tblRIAApprover | 0 | EMPTY_TABLE |
| dbo.tblRIAApproverHistory | 0 | EMPTY_TABLE |
| dbo.tblRIAHazard | 148 | NO_SAFE_DESTINATION |
| dbo.tblRIAHazardCategory | 4 | NO_SAFE_DESTINATION |
| dbo.tblRIAHazardsImpacts | 0 | EMPTY_TABLE |
| dbo.tblRIAPPMeasures | 0 | EMPTY_TABLE |
| dbo.tblRIARiskMatrix | 0 | EMPTY_TABLE |
| dbo.tblRIARiskMatrixX | 0 | EMPTY_TABLE |
| dbo.tblRIARiskMatrixY | 0 | EMPTY_TABLE |
| dbo.tblRIARiskType | 0 | EMPTY_TABLE |
| dbo.tblRIAStatus | 0 | EMPTY_TABLE |
| dbo.tblRiskMatrix | 4 | NO_SAFE_DESTINATION |
| dbo.tblRiskMatrixX | 36 | NO_SAFE_DESTINATION |
| dbo.tblRiskMatrixx_tmp | 10 | NO_SAFE_DESTINATION |
| dbo.tblRiskMatrixY | 23 | NO_SAFE_DESTINATION |
| dbo.tblRiskMatrixY_tmp | 12 | NO_SAFE_DESTINATION |
| dbo.tblRMPotentialSeverity | 20 | NO_SAFE_DESTINATION |
| dbo.tblRMRiskType | 14 | NO_SAFE_DESTINATION |
| dbo.tblRMRiskType_tmp | 8 | NO_SAFE_DESTINATION |
| dbo.tblRMRiskTypeAS | 83 | NO_SAFE_DESTINATION |
| dbo.tblRoadCondition | 15 | NO_SAFE_DESTINATION |
| dbo.tblSafeObservation | 0 | EMPTY_TABLE |
| dbo.tblSafeTrack | 1858 | NO_SAFE_DESTINATION |
| dbo.tblSafeTrack_Has_SafeObservation | 0 | EMPTY_TABLE |
| dbo.tblSafeTrack_Has_Types | 1963 | NO_SAFE_DESTINATION |
| dbo.tblSafeTrack_Has_UnSafeObservation | 0 | EMPTY_TABLE |
| dbo.tblSafeTrackLocation | 7 | NO_SAFE_DESTINATION |
| dbo.tblSafeTrackO | 0 | EMPTY_TABLE |
| dbo.tblSafeTrackStatus | 2 | NO_SAFE_DESTINATION |
| dbo.tblScheduleMail | 5 | NO_SAFE_DESTINATION |
| dbo.tblScheduleMail_AI | 0 | EMPTY_TABLE |
| dbo.tblScheduleMail_KPI | 2 | NO_SAFE_DESTINATION |
| dbo.tblScheduleMail_Training | 3 | NO_SAFE_DESTINATION |
| dbo.tblSearchEngineFieldMapping | 326 | NO_SAFE_DESTINATION |
| dbo.tblSearchEngineFields | 2086 | NO_SAFE_DESTINATION |
| dbo.tblSearchEngineFieldsSort | 105 | NO_SAFE_DESTINATION |
| dbo.tblSearchEngineFilters | 0 | EMPTY_TABLE |
| dbo.tblSearchEngineMaster | 183 | NO_SAFE_DESTINATION |
| dbo.tblSettings | 1 | NO_SAFE_DESTINATION |
| dbo.tblSeverity | 3 | NO_SAFE_DESTINATION |
| dbo.tblShareDetail | 2 | NO_SAFE_DESTINATION |
| dbo.tblShareMaster | 8 | NO_SAFE_DESTINATION |
| dbo.tblSite | 10 | NO_SAFE_DESTINATION |
| dbo.tblSQCategory | 0 | EMPTY_TABLE |
| dbo.tblSQFailureSubType | 5 | NO_SAFE_DESTINATION |
| dbo.tblSQFailureType | 5 | NO_SAFE_DESTINATION |
| dbo.tblSQINCFailure | 0 | EMPTY_TABLE |
| dbo.tblState | 0 | EMPTY_TABLE |
| dbo.tblStatus | 4 | NO_SAFE_DESTINATION |
| dbo.tblSubstandardActs | 38 | NO_SAFE_DESTINATION |
| dbo.tblSubstandardCondition | 39 | NO_SAFE_DESTINATION |
| dbo.tblSubType | 228 | NO_SAFE_DESTINATION |
| dbo.tblTaskManager | 34 | NO_SAFE_DESTINATION |
| dbo.tblTaskSource | 2 | NO_SAFE_DESTINATION |
| dbo.tblTeamLead | 4 | NO_SAFE_DESTINATION |
| dbo.tblTempTraning_Course_Compliance_dashboard | 0 | EMPTY_TABLE |
| dbo.tblTimeLossType | 0 | EMPTY_TABLE |
| dbo.tblTraCompliance | 23 | NO_SAFE_DESTINATION |
| dbo.tblTraComplianceMatrix | 1237 | NO_SAFE_DESTINATION |
| dbo.tblTraCriteria | 4 | NO_SAFE_DESTINATION |
| dbo.tblTrainingDashboardbreakup | 1 | LEGACY_OR_AUDIT_DATA |
| dbo.tblTrainingDBMailSent | 0 | EMPTY_TABLE |
| dbo.tblTrainingDetail | 3120 | NO_SAFE_DESTINATION |
| dbo.tblTrainingSetting | 1 | NO_SAFE_DESTINATION |
| dbo.tblType | 26 | NO_SAFE_DESTINATION |
| dbo.tblUnSafeObservation | 0 | EMPTY_TABLE |
| dbo.tblUnSafeSpecific | 1 | NO_SAFE_DESTINATION |
| dbo.tblUnSafeSubCategory | 186 | NO_SAFE_DESTINATION |
| dbo.tblUserLog | 2810 | LEGACY_OR_AUDIT_DATA |
| dbo.tblUserLogExt | 0 | EMPTY_TABLE |
| dbo.tblUserPasswordHistory | 416 | SECURITY_OR_AUTH_EXCLUDED |
| dbo.tblUserRights | 3097 | NO_SAFE_DESTINATION |
| dbo.tblUserRights_History | 17232 | LEGACY_OR_AUDIT_DATA |
| dbo.tblUserRole | 11 | NO_SAFE_DESTINATION |
| dbo.tblUserRole_History | 70 | LEGACY_OR_AUDIT_DATA |
| dbo.tblVehicle | 28 | NO_SAFE_DESTINATION |
| dbo.tblWeatherCondition | 10 | NO_SAFE_DESTINATION |
| dbo.tblWorkArea | 16 | NO_SAFE_DESTINATION |
| dbo.tmpdata | 3 | NO_SAFE_DESTINATION |
