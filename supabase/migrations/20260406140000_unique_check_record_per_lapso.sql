-- Replace regular index with a proper unique constraint.
-- This enforces at the database level that only one check_record can exist
-- per (lapso_id, establishment_id, product_id) combination.
-- The existing trigger provides the human-readable error message on conflict.

drop index if exists public.check_record_lapso_establishment_product_idx;

create unique index if not exists check_record_lapso_establishment_product_unique_idx
  on public.check_record (lapso_id, establishment_id, product_id);
