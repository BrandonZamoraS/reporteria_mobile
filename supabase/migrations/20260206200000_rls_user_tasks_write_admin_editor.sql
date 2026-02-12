-- Allow admin/editor to manage task assignments in user_tasks.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_tasks'
      and policyname = 'user_tasks_insert_admin_editor'
  ) then
    create policy user_tasks_insert_admin_editor
      on public.user_tasks
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
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_tasks'
      and policyname = 'user_tasks_update_admin_editor'
  ) then
    create policy user_tasks_update_admin_editor
      on public.user_tasks
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
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_tasks'
      and policyname = 'user_tasks_delete_admin_editor'
  ) then
    create policy user_tasks_delete_admin_editor
      on public.user_tasks
      for delete
      to authenticated
      using (
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
