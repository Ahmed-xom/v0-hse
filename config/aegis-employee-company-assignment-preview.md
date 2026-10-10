# Aegis Employee Company Assignment Preview

Status: READ-ONLY preview. No records, company names, permissions, authentication, or database schema were changed.

## Actual schema

- Employee table: `public.employee`
- Employee identifier: `id` (`text`)
- Employee name: `name` (`text`)
- Employee email: `email` (`text`)
- Current company relationship: `employee.company_id -> company.id` (application-level relationship; no missing references were found)
- Company table: `public.company`
- Company identifier: `id` (`text`)
- Company display fields: `name`, `code`, `status`

## Target company records

| Rule key | Actual record | ID | Code | Status |
| --- | --- | --- | --- | --- |
| `xom` | `XOM LLC` | `company-xom-llc` | `XOM` | Active |
| `test` | `Test` | `company-51c0c216-008d-46cf-9669-bef698d25a36` | null | Active |

The requested `xom` rule resolves to the existing company by case-insensitive code (`XOM`), while the display name is `XOM LLC`. The requested `test` rule resolves to the existing company by case-insensitive name (`Test`). No duplicate target company name/code conflict was found.

## Classification rules

1. Missing or blank email: `MANUAL_REVIEW / MISSING_EMAIL`.
2. Email not matching `^[^[:space:]@]+@[^[:space:]@]+$`: `MANUAL_REVIEW / MALFORMED_EMAIL`.
3. Valid email with `lower(split_part(email, '@', 2)) = 'xomoman.com'`: `xom / EXACT_XOMOMAN_DOMAIN`.
4. Other valid email domain: `test / OTHER_VALID_DOMAIN`.

This is exact domain matching after `@`; `notxomoman.com` and `xomoman.com.other` do not match.

## Counts

| Classification | Count |
| --- | ---: |
| XOM proposal | 64 |
| Falcon/test proposal | 208 |
| Manual review | 97 |
| Total employees | 369 |

Exception breakdown:

- `EXACT_XOMOMAN_DOMAIN`: 64
- `OTHER_VALID_DOMAIN`: 208
- `MISSING_EMAIL`: 97
- `MALFORMED_EMAIL`: 0

## Current-company conflicts

- 64 XOM proposals currently belong to `XOM LLC`.
- 10 test proposals currently belong to `AMNKO`.
- 198 test proposals currently belong to `XOM LLC`.
- 97 manual-review records currently belong to `AMNKO`.

These are proposed assignment differences only; none were applied.

## Integrity checks

- Duplicate normalized employee emails: none found.
- Employee rows with a non-null `company_id` that does not resolve to `public.company.id`: none found.
- Duplicate target company name/code conflict for `xom` or `test`: none found.
- Employee primary-key conflicts: none observed through the table's identifier and duplicate-email checks.

## Preview query

```sql
WITH classified AS (
  SELECT
    e.id AS employee_id,
    e.name AS employee_name,
    e.email,
    e.company_id AS current_company_id,
    c.name AS current_company,
    CASE
      WHEN e.email IS NULL OR btrim(e.email) = '' THEN 'MANUAL_REVIEW'
      WHEN e.email !~* '^[^[:space:]@]+@[^[:space:]@]+$' THEN 'MANUAL_REVIEW'
      WHEN lower(split_part(e.email, '@', 2)) = 'xomoman.com' THEN 'xom'
      ELSE 'test'
    END AS proposed_company,
    CASE
      WHEN e.email IS NULL OR btrim(e.email) = '' THEN 'MISSING_EMAIL'
      WHEN e.email !~* '^[^[:space:]@]+@[^[:space:]@]+$' THEN 'MALFORMED_EMAIL'
      WHEN lower(split_part(e.email, '@', 2)) = 'xomoman.com'
        THEN 'EXACT_XOMOMAN_DOMAIN'
      ELSE 'OTHER_VALID_DOMAIN'
    END AS classification_reason
  FROM public.employee e
  LEFT JOIN public.company c ON c.id = e.company_id
)
SELECT *
FROM classified
ORDER BY proposed_company, employee_id;
```

## Approval gate

This preview intentionally stops before any write operation. Renaming `Test` to `Falcon`, changing company assignments, or writing any employee/company records requires a separate explicit approval and a reviewed write plan. No records or company names were changed.
---
Generated from read-only Neon queries on 2026-10-10.
