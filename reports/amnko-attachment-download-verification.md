# AMNKO HSE attachment verification

- Scope: Neon staging branch `aegis-pilot-20261009` / `public.attachment_records`
- Records: 46 active records
- Content present: 46/46
- Stored byte length equals `byte_size`: 46/46
- Stored SHA-256 metadata present: 46/46
- Link state: 46/46 UNLINKED
- Unauthorized API test (`GET /api/amnko-attachments/file?attachmentId=659` without a session): HTTP 401 with `{"error":"Unauthorized"}`
- Authenticated downloads: 0/46 tested; no administrator session was available
- Download SHA-256 comparisons: 0; the original source files are not present in the project and authenticated API responses were not available
- Database writes: none
- Environment/schema changes: none

Conclusion: the staging rows contain file bytes and consistent stored sizes, but end-to-end authenticated download and SHA-256 verification remain blocked by the missing administrator session. All records remain UNLINKED.
