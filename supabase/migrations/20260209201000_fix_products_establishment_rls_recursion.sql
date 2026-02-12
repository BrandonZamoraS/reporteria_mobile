create or replace function public.is_rutero_assigned_to_establishment(
  target_establishment_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = 'public'
as $$
  select exists (
    select 1
    from public.user_profile up
    join public.route r
      on r.assigned_user = up.user_id
    join public.establishment e
      on e.route_id = r.route_id
    where up.auth_user_id = auth.uid()
      and up.role = 'rutero'
      and e.establishment_id = target_establishment_id
  );
$$;

grant execute on function public.is_rutero_assigned_to_establishment(bigint) to authenticated;
grant execute on function public.is_rutero_assigned_to_establishment(bigint) to service_role;

drop policy if exists products_establishment_select_rutero_assigned_route
on public.products_establishment;

drop policy if exists product_select_rutero_assigned_route
on public.product;

create policy products_establishment_select_rutero_assigned_route
on public.products_establishment
as permissive
for select
to authenticated
using (
  public.is_rutero_assigned_to_establishment(products_establishment.establishment_id)
);

create policy product_select_rutero_assigned_route
on public.product
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.products_establishment pe
    where pe.product_id = product.product_id
      and public.is_rutero_assigned_to_establishment(pe.establishment_id)
  )
);
