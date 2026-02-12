drop policy if exists "user_tasks_update_rutero_complete_pending"
on public.user_tasks;

create policy "user_tasks_update_rutero_complete_pending"
on public.user_tasks
for update
to authenticated
using (
  exists (
    select 1
    from public.user_profile up
    where up.auth_user_id = auth.uid()
      and up.role = 'rutero'
      and up.user_id = user_tasks.user_id
  )
  and user_tasks.task_state = 'Pendiente'
)
with check (
  exists (
    select 1
    from public.user_profile up
    where up.auth_user_id = auth.uid()
      and up.role = 'rutero'
      and up.user_id = user_tasks.user_id
  )
  and user_tasks.task_state = 'Completada'
);
