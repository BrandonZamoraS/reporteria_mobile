-- Task access by role:
-- admin: select/insert/update/delete
-- editor: select/update
-- rutero: select only assigned tasks
-- visitante: no access

alter table public.task enable row level security;
alter table public.user_tasks enable row level security;
-- user_tasks policies (needed for rutero assignment checks).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_tasks'
      and policyname = 'user_tasks_select_admin_editor'
  ) then
    create policy user_tasks_select_admin_editor
      on public.user_tasks
      for select
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
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_tasks'
      and policyname = 'user_tasks_select_rutero_own'
  ) then
    create policy user_tasks_select_rutero_own
      on public.user_tasks
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.user_profile up
          where up.auth_user_id = auth.uid()
            and up.role = 'rutero'
            and up.user_id = user_tasks.user_id
        )
      );
  end if;
end
$$;
-- task policies.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'task'
      and policyname = 'task_select_admin_editor'
  ) then
    create policy task_select_admin_editor
      on public.task
      for select
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
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'task'
      and policyname = 'task_select_rutero_assigned'
  ) then
    create policy task_select_rutero_assigned
      on public.task
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.user_tasks ut
          join public.user_profile up on up.user_id = ut.user_id
          where up.auth_user_id = auth.uid()
            and up.role = 'rutero'
            and ut.task_id = task.task_id
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
      and tablename = 'task'
      and policyname = 'task_insert_admin'
  ) then
    create policy task_insert_admin
      on public.task
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
  end if;
end
$$;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'task'
      and policyname = 'task_update_admin_editor'
  ) then
    create policy task_update_admin_editor
      on public.task
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
      and tablename = 'task'
      and policyname = 'task_delete_admin'
  ) then
    create policy task_delete_admin
      on public.task
      for delete
      to authenticated
      using (
        exists (
          select 1
          from public.user_profile up
          where up.auth_user_id = auth.uid()
            and up.role = 'admin'
        )
      );
  end if;
end
$$;
