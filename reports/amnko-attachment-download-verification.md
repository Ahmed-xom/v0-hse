# AMNKO HSE attachment verification

## Data integrity (read-only staging checks)

- Scope: Neon staging branch `aegis-pilot-20261009` / `public.attachment_records`
- Active records: 46
- Content present: 46/46
- Stored byte length equals `byte_size`: 46/46
- Stored SHA-256 metadata present: 46/46
- Link state: 46/46 UNLINKED
- Database writes: none

## Authentication and authorization checks

- `GET /api/amnko-attachments/file?attachmentId=659` without a session: HTTP 401 with `{"error":"Unauthorized"}`
- Administrator session: not available in the project/browser context
- Temporary test-session mechanism: none found; no session was fabricated and no credential or session secret was read from Neon
- Authenticated downloads: 0/46 tested
- Download SHA-256 comparisons: 0

## Result

The stored staging rows contain file bytes, consistent sizes, and SHA-256 metadata. The protected route correctly rejects unauthenticated access. End-to-end download, response-header, and SHA-256 verification are blocked by the absence of a real authorized administrator session. All records remain UNLINKED.

Single remaining blocker: perform the project's normal administrator sign-in in a reachable Preview/browser session; then run attachment 659 first and the remaining 45 records, comparing response bytes to the stored SHA-256 values. No code, environment, Neon schema/data, or Production changes were made.
