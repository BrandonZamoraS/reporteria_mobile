drop policy if exists products_establishment_select_rutero_assigned_route
on public.products_establishment;

create policy products_establishment_select_rutero_assigned_route
on public.products_establishment
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.establishment e
    join public.route r
      on r.route_id = e.route_id
    join public.user_profile up
      on up.user_id = r.assigned_user
    where e.establishment_id = products_establishment.establishment_id
      and up.auth_user_id = auth.uid()
      and up.role = 'rutero'
  )
);

drop policy if exists product_select_rutero_assigned_route
on public.product;

create policy product_select_rutero_assigned_route
on public.product
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.products_establishment pe
    join public.establishment e
      on e.establishment_id = pe.establishment_id
    join public.route r
      on r.route_id = e.route_id
    join public.user_profile up
      on up.user_id = r.assigned_user
    where pe.product_id = product.product_id
      and up.auth_user_id = auth.uid()
      and up.role = 'rutero'
  )
);
