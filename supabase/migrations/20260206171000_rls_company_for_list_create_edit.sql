-- RLS for company module:
-- - SELECT: admin, editor, visitante
-- - INSERT/UPDATE: admin, editor

alter table public.company enable row level security;
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'company'
      and policyname = 'company_select_admin_editor_visitante'
  ) then
    create policy company_select_admin_editor_visitante
      on public.company
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.user_profile up
          where up.auth_user_id = auth.uid()
            and up.role in ('admin', 'editor', 'visitante')
        )
      );
  end if;
end
$$;
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'company'
      and policyname = 'company_insert_admin_editor'
  ) then
    create policy company_insert_admin_editor
      on public.company
      for insert
      to authenticated
      with check (
        exists (
          select 1
          from public.user_profile up
          where up.auth_user_id = auth.uid()
            and up.role in ('admin', 'editor')
        )
      );
  end if;
end
$$;
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'company'
      and policyname = 'company_update_admin_editor'
  ) then
    create policy company_update_admin_editor
      on public.company
      for update
      to authenticated
      using (
        exists (
          select 1
          from public.user_profile up
          where up.auth_user_id = auth.uid()
            and up.role in ('admin', 'editor')
        )
      )
      with check (
        exists (
          select 1
          from public.user_profile up
          where up.auth_user_id = auth.uid()
            and up.role in ('admin', 'editor')
        )
      );
  end if;
end
$$;
