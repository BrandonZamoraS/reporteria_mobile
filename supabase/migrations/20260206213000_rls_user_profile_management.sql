-- RLS for user_profile management:
-- admin: select/insert/update/delete
-- editor: select/insert/update
-- visitante/rutero: select own row only (already covered by user_profile_select_own)

alter table public.user_profile enable row level security;
create or replace function public.current_user_role()
returns public.user_role_enum
language sql
stable
security definer
set search_path = public
as $$
  select up.role
  from public.user_profile up
  where up.auth_user_id = auth.uid()
  limit 1;
$$;
grant execute on function public.current_user_role() to authenticated;
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profile'
      and policyname = 'user_profile_select_admin_editor'
  ) then
    create policy user_profile_select_admin_editor
      on public.user_profile
      for select
      to authenticated
      using (public.current_user_role() in ('admin', 'editor'));
  end if;
end
$$;
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profile'
      and policyname = 'user_profile_insert_admin_editor'
  ) then
    create policy user_profile_insert_admin_editor
      on public.user_profile
      for insert
      to authenticated
      with check (public.current_user_role() in ('admin', 'editor'));
  end if;
end
$$;
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profile'
      and policyname = 'user_profile_update_admin_editor'
  ) then
    create policy user_profile_update_admin_editor
      on public.user_profile
      for update
      to authenticated
      using (public.current_user_role() in ('admin', 'editor'))
      with check (public.current_user_role() in ('admin', 'editor'));
  end if;
end
$$;
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profile'
      and policyname = 'user_profile_delete_admin'
  ) then
    create policy user_profile_delete_admin
      on public.user_profile
      for delete
      to authenticated
      using (public.current_user_role() = 'admin');
  end if;
end
$$;
