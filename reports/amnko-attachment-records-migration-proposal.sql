-- AMNKO HSE attachment_records proposal
-- REVIEW ONLY: do not execute until separately approved.
-- No existing incident/journey fields are changed or removed.

-- UP (proposal; not executed)
CREATE TABLE public.attachment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_table text NOT NULL CHECK (target_table IN ('incident', 'journey')),
  target_id text NOT NULL,
  legacy_parent_group text NOT NULL,
  legacy_parent_id text NOT NULL,
  legacy_rowguid text NOT NULL,
  attachment_id text NOT NULL,
  original_name text NOT NULL,
  archive_path text NOT NULL,
  blob_path text NOT NULL,
  sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  byte_size bigint NOT NULL CHECK (byte_size >= 0),
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (legacy_parent_group, legacy_parent_id, legacy_rowguid, attachment_id, sha256),
  UNIQUE (blob_path)
);

CREATE INDEX attachment_records_target_idx
  ON public.attachment_records (target_table, target_id);

CREATE INDEX attachment_records_legacy_idx
  ON public.attachment_records (legacy_parent_group, legacy_parent_id, legacy_rowguid);

-- DOWN / rollback (proposal; only after confirming the table contains no approved data)
-- DROP INDEX IF EXISTS public.attachment_records_legacy_idx;
-- DROP INDEX IF EXISTS public.attachment_records_target_idx;
-- DROP TABLE IF EXISTS public.attachment_records;

-- Safety notes:
-- 1. This proposal does not alter or overwrite incident/journey attachment fields.
-- 2. Application code must reject deleted/unverified mappings before upload/linking.
-- 3. Blob uploads must use allowOverwrite=false and deterministic blob_path.
-- 4. Rollback deletes only records/objects created by the approved run.
-- 5. Do not apply until the authoritative legacy-to-Neon identity ledger exists.
