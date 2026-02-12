-- Product access rules:
-- admin: full CRUD
-- editor: create/update/select
-- visitante: select only products from own company
-- rutero: no access

alter table public.product enable row level security;
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product'
      and policyname = 'product_select_admin_editor'
  ) then
    create policy product_select_admin_editor
      on public.product
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
      and tablename = 'product'
      and policyname = 'product_select_visitante_own_company'
  ) then
    create policy product_select_visitante_own_company
      on public.product
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.user_profile up
          where up.auth_user_id = auth.uid()
            and up.role = 'visitante'
            and up.company_id = product.company_id
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
      and tablename = 'product'
      and policyname = 'product_insert_admin_editor'
  ) then
    create policy product_insert_admin_editor
      on public.product
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
      and tablename = 'product'
      and policyname = 'product_update_admin_editor'
  ) then
    create policy product_update_admin_editor
      on public.product
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
      and tablename = 'product'
      and policyname = 'product_delete_admin'
  ) then
    create policy product_delete_admin
      on public.product
      for delete
      to authenticated
      using (public.current_user_role() = 'admin');
  end if;
end
$$;
