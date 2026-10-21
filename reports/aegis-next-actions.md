# Aegis_XOM → Neon staging next actions

## Completed locally
- Full employee export is present in `.tmp/Aegis_XOM_Export.zip` and was used for row-level classification.
- Four existing employee links remain preserved; no INSERT is authorized for them.
- Five business units have name-only candidates; BU_Id=6 and BU_Id=7 remain unresolved/excluded.
- The importer guard still requires an approved mapping contract and staging attestation.

## Before INSERT
1. Obtain an official crosswalk for `Cmp_Id/Rowguid → NewCompanyId`, each `BU_Id → NewBusinessUnitId`, and each employee `Emp_Id/Rowguid → NewEmployeeId`.
2. Obtain an operational attestation for branch `br-wispy-hill-apxr32tq`, limited to INSERT on the three allowlisted tables.
3. Re-run the existing guarded importer; skip existing rows and quarantine unresolved rows.

No Neon writes were performed.
