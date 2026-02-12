-- Dedicated storage and authorization rules for registros evidences.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'check-evidences',
  'check-evidences',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = 8388608,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.evidence enable row level security;

drop policy if exists evidence_select_admin_or_rutero_owner on public.evidence;
create policy evidence_select_admin_or_rutero_owner
on public.evidence
for select
to authenticated
using (
  exists (
    select 1
    from public.user_profile up
    join public.check_record cr on cr.record_id = evidence.record_id
    where up.auth_user_id = auth.uid()
      and (
        up.role = 'admin'
        or (up.role = 'rutero' and cr.user_id = up.user_id)
      )
  )
);

drop policy if exists evidence_insert_admin_or_rutero_owner on public.evidence;
create policy evidence_insert_admin_or_rutero_owner
on public.evidence
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_profile up
    join public.check_record cr on cr.record_id = evidence.record_id
    where up.auth_user_id = auth.uid()
      and (
        up.role = 'admin'
        or (up.role = 'rutero' and cr.user_id = up.user_id)
      )
  )
);

drop policy if exists evidence_delete_admin_or_rutero_owner on public.evidence;
create policy evidence_delete_admin_or_rutero_owner
on public.evidence
for delete
to authenticated
using (
  exists (
    select 1
    from public.user_profile up
    join public.check_record cr on cr.record_id = evidence.record_id
    where up.auth_user_id = auth.uid()
      and (
        up.role = 'admin'
        or (up.role = 'rutero' and cr.user_id = up.user_id)
      )
  )
);

drop policy if exists check_record_select_admin on public.check_record;
create policy check_record_select_admin
on public.check_record
for select
to authenticated
using (
  exists (
    select 1
    from public.user_profile up
    where up.auth_user_id = auth.uid()
      and up.role = 'admin'
  )
);

drop policy if exists check_record_insert_admin on public.check_record;
create policy check_record_insert_admin
on public.check_record
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_profile up
    where up.auth_user_id = auth.uid()
      and up.role = 'admin'
  )
);

drop policy if exists check_record_update_admin on public.check_record;
create policy check_record_update_admin
on public.check_record
for update
to authenticated
using (
  exists (
    select 1
    from public.user_profile up
    where up.auth_user_id = auth.uid()
      and up.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.user_profile up
    where up.auth_user_id = auth.uid()
      and up.role = 'admin'
  )
);

drop policy if exists check_evidences_select_scoped on storage.objects;
create policy check_evidences_select_scoped
on storage.objects
for select
to authenticated
using (
  bucket_id = 'check-evidences'
  and split_part(name, '/', 2) ~ '^[0-9]+$'
  and exists (
    select 1
    from public.user_profile up
    join public.check_record cr on cr.record_id = split_part(storage.objects.name, '/', 2)::bigint
    where up.auth_user_id = auth.uid()
      and (
        up.role = 'admin'
        or (up.role = 'rutero' and cr.user_id = up.user_id)
      )
  )
);

drop policy if exists check_evidences_insert_scoped on storage.objects;
create policy check_evidences_insert_scoped
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'check-evidences'
  and split_part(name, '/', 2) ~ '^[0-9]+$'
  and exists (
    select 1
    from public.user_profile up
    join public.check_record cr on cr.record_id = split_part(storage.objects.name, '/', 2)::bigint
    where up.auth_user_id = auth.uid()
      and (
        up.role = 'admin'
        or (up.role = 'rutero' and cr.user_id = up.user_id)
      )
  )
);

drop policy if exists check_evidences_update_scoped on storage.objects;
create policy check_evidences_update_scoped
on storage.objects
for update
to authenticated
using (
  bucket_id = 'check-evidences'
  and split_part(name, '/', 2) ~ '^[0-9]+$'
  and exists (
    select 1
    from public.user_profile up
    join public.check_record cr on cr.record_id = split_part(storage.objects.name, '/', 2)::bigint
    where up.auth_user_id = auth.uid()
      and (
        up.role = 'admin'
        or (up.role = 'rutero' and cr.user_id = up.user_id)
      )
  )
)
with check (
  bucket_id = 'check-evidences'
  and split_part(name, '/', 2) ~ '^[0-9]+$'
  and exists (
    select 1
    from public.user_profile up
    join public.check_record cr on cr.record_id = split_part(storage.objects.name, '/', 2)::bigint
    where up.auth_user_id = auth.uid()
      and (
        up.role = 'admin'
        or (up.role = 'rutero' and cr.user_id = up.user_id)
      )
  )
);

drop policy if exists check_evidences_delete_scoped on storage.objects;
create policy check_evidences_delete_scoped
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'check-evidences'
  and split_part(name, '/', 2) ~ '^[0-9]+$'
  and exists (
    select 1
    from public.user_profile up
    join public.check_record cr on cr.record_id = split_part(storage.objects.name, '/', 2)::bigint
    where up.auth_user_id = auth.uid()
      and (
        up.role = 'admin'
        or (up.role = 'rutero' and cr.user_id = up.user_id)
      )
  )
);

create or replace function public.enforce_max_evidence_per_record()
returns trigger
language plpgsql
as $$
declare
  current_count integer;
begin
  select count(*)
    into current_count
  from public.evidence e
  where e.record_id = new.record_id
    and e.evidence_id <> coalesce(new.evidence_id, -1);

  if current_count >= 6 then
    raise exception 'No se permiten mas de 6 evidencias por registro.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_max_evidence_per_record on public.evidence;
create trigger trg_enforce_max_evidence_per_record
before insert or update on public.evidence
for each row
execute function public.enforce_max_evidence_per_record();

grant select, insert, update, delete on table public.evidence to authenticated;
grant all on table public.evidence to service_role;
grant usage, select on sequence public.evidence_evidence_id_seq to authenticated;
grant all on sequence public.evidence_evidence_id_seq to service_role;
