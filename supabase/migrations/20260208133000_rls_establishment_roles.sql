-- Establishment access rules:
-- admin: full CRUD
-- editor: create/update/select
-- visitante: select only establishments linked to products from own company
-- rutero: no access

alter table public.establishment enable row level security;
alter table public.products_establishment enable row level security;
create index if not exists products_establishment_establishment_id_idx
  on public.products_establishment (establishment_id);
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'establishment'
      and policyname = 'establishment_select_admin_editor'
  ) then
    create policy establishment_select_admin_editor
      on public.establishment
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
      and tablename = 'establishment'
      and policyname = 'establishment_select_visitante_company_products'
  ) then
    create policy establishment_select_visitante_company_products
      on public.establishment
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.products_establishment pe
          join public.product p
            on p.product_id = pe.product_id
          join public.user_profile up
            on up.auth_user_id = auth.uid()
          where pe.establishment_id = establishment.establishment_id
            and up.role = 'visitante'
            and up.company_id = p.company_id
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
      and tablename = 'establishment'
      and policyname = 'establishment_insert_admin_editor'
  ) then
    create policy establishment_insert_admin_editor
      on public.establishment
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
      and tablename = 'establishment'
      and policyname = 'establishment_update_admin_editor'
  ) then
    create policy establishment_update_admin_editor
      on public.establishment
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
      and tablename = 'establishment'
      and policyname = 'establishment_delete_admin'
  ) then
    create policy establishment_delete_admin
      on public.establishment
      for delete
      to authenticated
      using (public.current_user_role() = 'admin');
  end if;
end
$$;
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'products_establishment'
      and policyname = 'products_establishment_select_admin_editor'
  ) then
    create policy products_establishment_select_admin_editor
      on public.products_establishment
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
      and tablename = 'products_establishment'
      and policyname = 'products_establishment_select_visitante_company_products'
  ) then
    create policy products_establishment_select_visitante_company_products
      on public.products_establishment
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.product p
          join public.user_profile up
            on up.auth_user_id = auth.uid()
          where p.product_id = products_establishment.product_id
            and up.role = 'visitante'
            and up.company_id = p.company_id
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
      and tablename = 'products_establishment'
      and policyname = 'products_establishment_insert_admin_editor'
  ) then
    create policy products_establishment_insert_admin_editor
      on public.products_establishment
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
      and tablename = 'products_establishment'
      and policyname = 'products_establishment_update_admin_editor'
  ) then
    create policy products_establishment_update_admin_editor
      on public.products_establishment
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
      and tablename = 'products_establishment'
      and policyname = 'products_establishment_delete_admin_editor'
  ) then
    create policy products_establishment_delete_admin_editor
      on public.products_establishment
      for delete
      to authenticated
      using (public.current_user_role() in ('admin', 'editor'));
  end if;
end
$$;
