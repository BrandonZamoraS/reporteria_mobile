-- Report access rules:
-- admin/editor: view all reports
-- rutero: view only own reports
-- visitante: view only reports for products of own company

alter table if exists public.check_record enable row level security;
alter table if exists public.evidence enable row level security;
create index if not exists check_record_time_date_idx
  on public.check_record (time_date);
create index if not exists check_record_user_id_idx
  on public.check_record (user_id);
create index if not exists check_record_product_id_idx
  on public.check_record (product_id);
create index if not exists evidence_record_id_idx
  on public.evidence (record_id);
do $$
begin
  if to_regclass('public.check_record') is not null
     and not exists (
       select 1
       from pg_policies
       where schemaname = 'public'
         and tablename = 'check_record'
         and policyname = 'check_record_select_admin_editor'
     ) then
    create policy check_record_select_admin_editor
      on public.check_record
      for select
      to authenticated
      using (public.current_user_role() in ('admin', 'editor'));
  end if;
end
$$;
do $$
begin
  if to_regclass('public.check_record') is not null
     and not exists (
       select 1
       from pg_policies
       where schemaname = 'public'
         and tablename = 'check_record'
         and policyname = 'check_record_select_rutero_own'
     ) then
    create policy check_record_select_rutero_own
      on public.check_record
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.user_profile up
          where up.auth_user_id = auth.uid()
            and up.role = 'rutero'
            and up.user_id = check_record.user_id
        )
      );
  end if;
end
$$;
do $$
begin
  if to_regclass('public.check_record') is not null
     and not exists (
       select 1
       from pg_policies
       where schemaname = 'public'
         and tablename = 'check_record'
         and policyname = 'check_record_select_visitante_company_products'
     ) then
    create policy check_record_select_visitante_company_products
      on public.check_record
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.product p
          join public.user_profile up
            on up.company_id = p.company_id
          where up.auth_user_id = auth.uid()
            and up.role = 'visitante'
            and p.product_id = check_record.product_id
        )
      );
  end if;
end
$$;
do $$
begin
  if to_regclass('public.check_record') is not null
     and not exists (
       select 1
       from pg_policies
       where schemaname = 'public'
         and tablename = 'check_record'
         and policyname = 'check_record_insert_admin_editor'
     ) then
    create policy check_record_insert_admin_editor
      on public.check_record
      for insert
      to authenticated
      with check (public.current_user_role() in ('admin', 'editor'));
  end if;
end
$$;
do $$
begin
  if to_regclass('public.check_record') is not null
     and not exists (
       select 1
       from pg_policies
       where schemaname = 'public'
         and tablename = 'check_record'
         and policyname = 'check_record_insert_rutero_own'
     ) then
    create policy check_record_insert_rutero_own
      on public.check_record
      for insert
      to authenticated
      with check (
        exists (
          select 1
          from public.user_profile up
          where up.auth_user_id = auth.uid()
            and up.role = 'rutero'
            and up.user_id = check_record.user_id
        )
      );
  end if;
end
$$;
do $$
begin
  if to_regclass('public.evidence') is not null
     and not exists (
       select 1
       from pg_policies
       where schemaname = 'public'
         and tablename = 'evidence'
         and policyname = 'evidence_select_admin_editor'
     ) then
    create policy evidence_select_admin_editor
      on public.evidence
      for select
      to authenticated
      using (public.current_user_role() in ('admin', 'editor'));
  end if;
end
$$;
do $$
begin
  if to_regclass('public.evidence') is not null
     and not exists (
       select 1
       from pg_policies
       where schemaname = 'public'
         and tablename = 'evidence'
         and policyname = 'evidence_select_rutero_own_records'
     ) then
    create policy evidence_select_rutero_own_records
      on public.evidence
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.check_record cr
          join public.user_profile up
            on up.user_id = cr.user_id
          where cr.record_id = evidence.record_id
            and up.auth_user_id = auth.uid()
            and up.role = 'rutero'
        )
      );
  end if;
end
$$;
do $$
begin
  if to_regclass('public.evidence') is not null
     and not exists (
       select 1
       from pg_policies
       where schemaname = 'public'
         and tablename = 'evidence'
         and policyname = 'evidence_select_visitante_company_products'
     ) then
    create policy evidence_select_visitante_company_products
      on public.evidence
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.check_record cr
          join public.product p
            on p.product_id = cr.product_id
          join public.user_profile up
            on up.company_id = p.company_id
          where cr.record_id = evidence.record_id
            and up.auth_user_id = auth.uid()
            and up.role = 'visitante'
        )
      );
  end if;
end
$$;
do $$
begin
  if to_regclass('public.evidence') is not null
     and not exists (
       select 1
       from pg_policies
       where schemaname = 'public'
         and tablename = 'evidence'
         and policyname = 'evidence_insert_admin_editor'
     ) then
    create policy evidence_insert_admin_editor
      on public.evidence
      for insert
      to authenticated
      with check (public.current_user_role() in ('admin', 'editor'));
  end if;
end
$$;
do $$
begin
  if to_regclass('public.evidence') is not null
     and not exists (
       select 1
       from pg_policies
       where schemaname = 'public'
         and tablename = 'evidence'
         and policyname = 'evidence_insert_rutero_own_records'
     ) then
    create policy evidence_insert_rutero_own_records
      on public.evidence
      for insert
      to authenticated
      with check (
        exists (
          select 1
          from public.check_record cr
          join public.user_profile up
            on up.user_id = cr.user_id
          where cr.record_id = evidence.record_id
            and up.auth_user_id = auth.uid()
            and up.role = 'rutero'
        )
      );
  end if;
end
$$;
