-- Route access rules:
-- admin: full CRUD
-- editor: create/update/select
-- rutero: select only assigned routes
-- visitante: no access

alter table public.route enable row level security;
create or replace function public.route_day_options()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select enum_range(null::public.route_day_enum)::text[];
$$;
grant execute on function public.route_day_options() to authenticated;
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'route'
      and policyname = 'route_select_admin_editor'
  ) then
    create policy route_select_admin_editor
      on public.route
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
      and tablename = 'route'
      and policyname = 'route_select_rutero_assigned'
  ) then
    create policy route_select_rutero_assigned
      on public.route
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.user_profile up
          where up.auth_user_id = auth.uid()
            and up.role = 'rutero'
            and up.user_id = route.assigned_user
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
      and tablename = 'route'
      and policyname = 'route_insert_admin_editor'
  ) then
    create policy route_insert_admin_editor
      on public.route
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
      and tablename = 'route'
      and policyname = 'route_update_admin_editor'
  ) then
    create policy route_update_admin_editor
      on public.route
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
      and tablename = 'route'
      and policyname = 'route_delete_admin'
  ) then
    create policy route_delete_admin
      on public.route
      for delete
      to authenticated
      using (public.current_user_role() = 'admin');
  end if;
end
$$;
