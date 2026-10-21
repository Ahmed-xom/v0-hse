# Aegis_XOM → Neon Staging Mapping Approval Template

## Approval scope

| Field | Required value | Approver input |
|---|---|---|
| Source | `Aegis_XOM.dbo` / `.tmp/Aegis_XOM_Export.zip` | Confirm |
| Target branch | `aegis-pilot-20261009` | Confirm |
| Target Branch ID | `br-wispy-hill-apxr32tq` | Confirm |
| Allowed tables | `public.company`, `public.business_unit`, `public.employee` only | Confirm |
| Operation | `INSERT` only | Confirm |
| Existing rows | Skip; never replace or update | Confirm |
| Unresolved/conflicting rows | Quarantine; never infer | Confirm |
| Deletes/updates/DDL/Production | Prohibited | Confirm |

## Required mapping crosswalk

| OldCompanyId | OldCompanyRowguid | NewCompanyId | Evidence source | Status |
|---|---|---|---|---|
| `8` | `25edc39b-70f6-4169-a403-b836d48050b4` | **[REQUIRED: actual target ID]** | **[REQUIRED: official migration/audit reference]** | `UNRESOLVED` |

| OldBU_Id | NewBusinessUnitId | Evidence source | Status |
|---:|---|---|---|
| 1 | **[REQUIRED]** | **[REQUIRED]** | `UNRESOLVED` |
| 2 | **[REQUIRED]** | **[REQUIRED]** | `UNRESOLVED` |
| 3 | **[REQUIRED]** | **[REQUIRED]** | `UNRESOLVED` |
| 4 | **[REQUIRED]** | **[REQUIRED]** | `UNRESOLVED` |
| 5 | **[REQUIRED]** | **[REQUIRED]** | `UNRESOLVED` |
| 6 | **[REQUIRED]** | **[REQUIRED]** | `UNRESOLVED` |
| 7 | N/A | Excluded by approved scope | `EXCLUDED` |

| OldEmp_Id | OldRowguid | NewEmployeeId | NewBusinessUnitId | Evidence source | Status |
|---:|---|---|---|---|---|
| `366` | **[from export]** | `00012` | **[REQUIRED]** | Aegis export + Neon staging read; payroll/name evidence | `CONFIRMED_EXISTING` |
| `374` | **[from export]** | `Approver` | **[REQUIRED]** | Aegis export + Neon staging read; payroll/name evidence | `CONFIRMED_EXISTING` |
| `376` | **[from export]** | `2ejd` | **[REQUIRED]** | Aegis export + Neon staging read; payroll/email/name/unit evidence | `CONFIRMED_EXISTING` |
| `378` | **[from export]** | `3` | **[REQUIRED]** | Aegis export + Neon staging read; payroll/email/name/unit evidence | `CONFIRMED_EXISTING` |
| Remaining employees | **[from export]** | **[REQUIRED per row]** | **[REQUIRED per row]** | **[REQUIRED official reference per row]** | `UNRESOLVED / QUARANTINE` |

## Operational approval and attestation

The current local contract is a draft and is not an approval. The importer requires these runtime authorization fields:

| Field | Required value |
|---|---|
| `contract.approved` | `true` in an approved contract issued through the operational approval path; do not edit manually |
| `contract.stagingAttestation.provided` | `true` |
| `contract.stagingAttestation.branchId` | `br-wispy-hill-apxr32tq` |
| `authorization.approved` | `true` |
| `authorization.branchId` | `br-wispy-hill-apxr32tq` |
| `authorization.operation` | `INSERT` |
| `authorization.tables` | Exactly the three allowlisted tables |
| `authorization.production` | `false` |
| `authorization.ddl` | `false` |
| `authorization.update` | `false` |
| `authorization.delete` | `false` |
| Approval authority | **[REQUIRED: responsible operator name/role]** |
| Approval source | **[REQUIRED: change/ticket/audit reference]** |
| Approval time | **[REQUIRED: UTC timestamp]** |
| Attestation issuer | **[REQUIRED: trusted runtime/operations issuer]** |
| Attestation signature/reference | **[REQUIRED: verifiable signature or immutable attestation ID]** |

## Acceptance rule

Do not execute until the approved contract, verifiable staging attestation, explicit target IDs, and evidence source for every non-quarantined mapping are supplied by the responsible migration operator. `writeAllowed: true` or manual edits to this template are not sufficient authorization.
