drop policy if exists establishment_select_rutero_assigned
on public.establishment;

create policy establishment_select_rutero_assigned
on public.establishment
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.route r
    join public.user_profile up
      on up.user_id = r.assigned_user
    where r.route_id = establishment.route_id
      and up.auth_user_id = auth.uid()
      and up.role = 'rutero'
  )
);
