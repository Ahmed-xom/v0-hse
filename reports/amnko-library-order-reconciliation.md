# AMNKO HSE Library Order Reconciliation

## Result

- Reference manifest items: 579
- Confirmed source-to-library mappings: 273
- Unresolved reference items: 306
- Ambiguous duplicate-name matches added: 0
- Neon, Blob, Production, and `DATABASE_URL`: unchanged

## Evidence examined

- `config/amnko-library-order.json`
- `reports/amnko-library-content-crosswalk.csv`
- `reports/amnko-library-extracted-trace.csv`
- `reports/amnko-library-blob-trace.csv`
- `reports/amnko-library-import-readiness.md`
- `reports/amnko-attachment-crosswalk.csv`
- `reports/amnko-attachment-source-crosswalk.csv`
- `reports/amnko-asset-linking-manifest.csv`
- Git history entries containing `LibraryId`, `Rowguid`, `blob_pathname`, and the AMNKO library reports

## Matching policy

A manifest item was updated only when the evidence supplied a stable source identity: `LibraryId` plus `Rowguid`, with the extracted-trace SHA-256 and Blob pathname cross-checked where available. A unique `SourceName` was accepted only when it resolved to exactly one extracted source record and was then stored together with its `LibraryId`, `Rowguid`, extracted filename, and SHA-256. Duplicate names were never resolved by name alone.

## Unresolved groups

The remaining 306 manifest items have no corresponding source record in `amnko-library-extracted-trace.csv` for their `LibraryId`/source entry, and no additional export or Git-history artifact supplies a stable `Rowguid`, hash, or Blob pathname. They remain explicit in the manifest with `matchEvidence` beginning with `UNRESOLVED`; no UUID/title-based fallback was applied.

The attachment crosswalks were excluded from library matching because they describe incident/journey attachments (`public.incident`/`public.journey`), not `public.amnko_library_document_link` records. The import-readiness report confirms that the confirmed library trace contains 348 source records, while the remaining source rows were intentionally unresolved.

## API/build validation

`app/api/amnko-library/route.ts` uses the manifest's confirmed `blobPathname`/pathname stem only. Unmatched database rows remain after confirmed rows in their database source order. Search and filtering preserve this relative order because ordering is applied after the query result is formed.

`pnpm build`: passed.
