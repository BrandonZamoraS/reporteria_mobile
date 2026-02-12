-- Improve company name search performance for paginated list filtering.
create extension if not exists pg_trgm with schema extensions;
create index if not exists company_name_trgm_idx
  on public.company
  using gin (name extensions.gin_trgm_ops);
