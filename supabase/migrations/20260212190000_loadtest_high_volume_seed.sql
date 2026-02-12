-- Load test dataset for manual testing in development environments.
-- Scope:
-- - 2 companies (LT_Empresa_A, LT_Empresa_B)
-- - 4 users expected to exist beforehand:
--   visitante.a.test@example.com
--   visitante.b.test@example.com
--   rutero.a.test@example.com
--   rutero.b.test@example.com
-- - 300 products, 800 establishments, 120 routes
-- - 12,000 tasks, 24,000 user-task assignments
-- - 200,000 check records distributed over 365 days

set statement_timeout = 0;
do $$
declare
  v_company_a_id bigint;
  v_company_b_id bigint;

  v_visitante_a_user_id bigint;
  v_visitante_b_user_id bigint;
  v_rutero_a_user_id bigint;
  v_rutero_b_user_id bigint;

  v_route_days public.route_day_enum[];
  v_task_priorities public.task_priority_enum[];

  v_link_count_a bigint;
  v_link_count_b bigint;
  v_rows bigint;
begin
  if exists (select 1 from public.product where sku like 'LT-%')
     or exists (select 1 from public.establishment where name like 'LT Establecimiento %')
     or exists (select 1 from public.route where nombre like 'LT Ruta %')
     or exists (select 1 from public.task where title like 'LT Tarea %')
     or exists (select 1 from public.check_record where comments like '[LT] Seed rec %') then
    raise exception
      'Load-test dataset already exists (LT_* records found). Stop to avoid duplicates.';
  end if;

  insert into public.company (name, direction, is_active)
  select x.name, x.direction, true
  from (
    values
      ('LT_Empresa_A'::varchar(120), 'LT Direccion Empresa A'::varchar(255)),
      ('LT_Empresa_B'::varchar(120), 'LT Direccion Empresa B'::varchar(255))
  ) as x(name, direction)
  where not exists (
    select 1
    from public.company c
    where c.name = x.name
  );

  select c.company_id
  into v_company_a_id
  from public.company c
  where c.name = 'LT_Empresa_A'
  order by c.company_id
  limit 1;

  select c.company_id
  into v_company_b_id
  from public.company c
  where c.name = 'LT_Empresa_B'
  order by c.company_id
  limit 1;

  if v_company_a_id is null or v_company_b_id is null then
    raise exception 'Could not resolve LT company ids.';
  end if;

  select up.user_id
  into v_visitante_a_user_id
  from public.user_profile up
  where lower(up.email) = 'visitante.a.test@example.com'
  limit 1;

  select up.user_id
  into v_visitante_b_user_id
  from public.user_profile up
  where lower(up.email) = 'visitante.b.test@example.com'
  limit 1;

  select up.user_id
  into v_rutero_a_user_id
  from public.user_profile up
  where lower(up.email) = 'rutero.a.test@example.com'
  limit 1;

  select up.user_id
  into v_rutero_b_user_id
  from public.user_profile up
  where lower(up.email) = 'rutero.b.test@example.com'
  limit 1;

  if v_visitante_a_user_id is null
     or v_visitante_b_user_id is null
     or v_rutero_a_user_id is null
     or v_rutero_b_user_id is null then
    raise exception
      'Missing required users. Create visitante.a, visitante.b, rutero.a, rutero.b first.';
  end if;

  perform 1
  from public.user_profile up
  where up.user_id = v_visitante_a_user_id
    and up.role = 'visitante';
  if not found then
    raise exception 'visitante.a.test@example.com must have role visitante.';
  end if;

  perform 1
  from public.user_profile up
  where up.user_id = v_visitante_b_user_id
    and up.role = 'visitante';
  if not found then
    raise exception 'visitante.b.test@example.com must have role visitante.';
  end if;

  perform 1
  from public.user_profile up
  where up.user_id = v_rutero_a_user_id
    and up.role = 'rutero';
  if not found then
    raise exception 'rutero.a.test@example.com must have role rutero.';
  end if;

  perform 1
  from public.user_profile up
  where up.user_id = v_rutero_b_user_id
    and up.role = 'rutero';
  if not found then
    raise exception 'rutero.b.test@example.com must have role rutero.';
  end if;

  update public.user_profile
  set company_id = v_company_a_id
  where user_id = v_visitante_a_user_id;

  update public.user_profile
  set company_id = v_company_b_id
  where user_id = v_visitante_b_user_id;

  select enum_range(null::public.route_day_enum)
  into v_route_days;

  select enum_range(null::public.task_priority_enum)
  into v_task_priorities;

  if array_length(v_route_days, 1) is null then
    raise exception 'No values found in route_day_enum.';
  end if;

  if array_length(v_task_priorities, 1) is null then
    raise exception 'No values found in task_priority_enum.';
  end if;

  insert into public.product (sku, name, is_active, company_id)
  select
    format('LT-A-%s', lpad(gs::text, 4, '0')),
    format('LT Producto A %s', lpad(gs::text, 4, '0')),
    true,
    v_company_a_id
  from generate_series(1, 150) as gs
  on conflict (company_id, sku) do nothing;

  get diagnostics v_rows = row_count;
  raise notice 'Inserted products for company A: %', v_rows;

  insert into public.product (sku, name, is_active, company_id)
  select
    format('LT-B-%s', lpad(gs::text, 4, '0')),
    format('LT Producto B %s', lpad(gs::text, 4, '0')),
    true,
    v_company_b_id
  from generate_series(1, 150) as gs
  on conflict (company_id, sku) do nothing;

  get diagnostics v_rows = row_count;
  raise notice 'Inserted products for company B: %', v_rows;

  insert into public.route (nombre, is_active, visit_period, day, assigned_user)
  select
    format('LT Ruta A %s', lpad(gs::text, 3, '0')),
    true,
    case
      when gs % 3 = 0 then 'Semanal'
      when gs % 3 = 1 then 'Quincenal'
      else 'Mensual'
    end,
    v_route_days[((gs - 1) % array_length(v_route_days, 1)) + 1],
    v_rutero_a_user_id
  from generate_series(1, 60) as gs;

  get diagnostics v_rows = row_count;
  raise notice 'Inserted routes for rutero A: %', v_rows;

  insert into public.route (nombre, is_active, visit_period, day, assigned_user)
  select
    format('LT Ruta B %s', lpad(gs::text, 3, '0')),
    true,
    case
      when gs % 3 = 0 then 'Semanal'
      when gs % 3 = 1 then 'Quincenal'
      else 'Mensual'
    end,
    v_route_days[((gs - 1) % array_length(v_route_days, 1)) + 1],
    v_rutero_b_user_id
  from generate_series(1, 60) as gs;

  get diagnostics v_rows = row_count;
  raise notice 'Inserted routes for rutero B: %', v_rows;

  with route_ids as (
    select array_agg(r.route_id order by r.route_id) as ids
    from public.route r
    where r.nombre like 'LT Ruta A %'
      and r.assigned_user = v_rutero_a_user_id
  )
  insert into public.establishment (name, route_id, direction, lat, long, is_active)
  select
    format('LT Establecimiento A %s', lpad(gs::text, 4, '0')),
    route_ids.ids[((gs - 1) % array_length(route_ids.ids, 1)) + 1],
    format('LT Direccion Est A %s', lpad(gs::text, 4, '0')),
    round((19.250000 + (gs * 0.0007))::numeric, 6),
    round((-99.180000 - (gs * 0.0007))::numeric, 6),
    true
  from generate_series(1, 400) as gs
  cross join route_ids;

  get diagnostics v_rows = row_count;
  raise notice 'Inserted establishments for company A: %', v_rows;

  with route_ids as (
    select array_agg(r.route_id order by r.route_id) as ids
    from public.route r
    where r.nombre like 'LT Ruta B %'
      and r.assigned_user = v_rutero_b_user_id
  )
  insert into public.establishment (name, route_id, direction, lat, long, is_active)
  select
    format('LT Establecimiento B %s', lpad(gs::text, 4, '0')),
    route_ids.ids[((gs - 1) % array_length(route_ids.ids, 1)) + 1],
    format('LT Direccion Est B %s', lpad(gs::text, 4, '0')),
    round((19.650000 + (gs * 0.0007))::numeric, 6),
    round((-99.450000 - (gs * 0.0007))::numeric, 6),
    true
  from generate_series(1, 400) as gs
  cross join route_ids;

  get diagnostics v_rows = row_count;
  raise notice 'Inserted establishments for company B: %', v_rows;

  with products as (
    select
      p.product_id,
      (row_number() over (order by p.product_id)::int - 1) as idx
    from public.product p
    where p.company_id = v_company_a_id
      and p.sku like 'LT-A-%'
  ),
  establishments as (
    select
      e.establishment_id,
      (row_number() over (order by e.establishment_id)::int - 1) as idx
    from public.establishment e
    where e.name like 'LT Establecimiento A %'
  ),
  product_count as (
    select count(*)::int as cnt
    from products
  )
  insert into public.products_establishment (establishment_id, product_id)
  select
    e.establishment_id,
    p.product_id
  from establishments e
  cross join product_count pc
  join lateral generate_series(0, 9) as offset_idx(val) on pc.cnt > 0
  join products p
    on p.idx = ((e.idx * 7 + offset_idx.val) % pc.cnt)
  on conflict (establishment_id, product_id) do nothing;

  get diagnostics v_rows = row_count;
  raise notice 'Inserted product-establishment links for A: %', v_rows;

  with products as (
    select
      p.product_id,
      (row_number() over (order by p.product_id)::int - 1) as idx
    from public.product p
    where p.company_id = v_company_b_id
      and p.sku like 'LT-B-%'
  ),
  establishments as (
    select
      e.establishment_id,
      (row_number() over (order by e.establishment_id)::int - 1) as idx
    from public.establishment e
    where e.name like 'LT Establecimiento B %'
  ),
  product_count as (
    select count(*)::int as cnt
    from products
  )
  insert into public.products_establishment (establishment_id, product_id)
  select
    e.establishment_id,
    p.product_id
  from establishments e
  cross join product_count pc
  join lateral generate_series(0, 9) as offset_idx(val) on pc.cnt > 0
  join products p
    on p.idx = ((e.idx * 11 + offset_idx.val) % pc.cnt)
  on conflict (establishment_id, product_id) do nothing;

  get diagnostics v_rows = row_count;
  raise notice 'Inserted product-establishment links for B: %', v_rows;

  insert into public.task (title, description, priority, due_to)
  select
    format('LT Tarea %s', lpad(gs::text, 5, '0')),
    format('LT tarea de carga masiva numero %s', lpad(gs::text, 5, '0')),
    v_task_priorities[((gs - 1) % array_length(v_task_priorities, 1)) + 1],
    timezone('utc', now()) + ((((gs % 180) - 90)::text || ' days')::interval)
  from generate_series(1, 12000) as gs;

  get diagnostics v_rows = row_count;
  raise notice 'Inserted tasks: %', v_rows;

  with lt_tasks as (
    select
      t.task_id,
      row_number() over (order by t.task_id)::int as rn
    from public.task t
    where t.title like 'LT Tarea %'
  )
  insert into public.user_tasks (user_id, task_id, task_state, comments)
  select
    v_rutero_a_user_id,
    lt.task_id,
    case
      when lt.rn % 8 = 0 then 'Atrasada'::public.task_state_enum
      when lt.rn % 5 = 0 then 'Incompleta'::public.task_state_enum
      when lt.rn % 3 = 0 then 'Completada'::public.task_state_enum
      else 'Pendiente'::public.task_state_enum
    end,
    '[LT] assignment rutero A'
  from lt_tasks lt
  union all
  select
    v_rutero_b_user_id,
    lt.task_id,
    case
      when lt.rn % 7 = 0 then 'Atrasada'::public.task_state_enum
      when lt.rn % 4 = 0 then 'Incompleta'::public.task_state_enum
      when lt.rn % 2 = 0 then 'Completada'::public.task_state_enum
      else 'Pendiente'::public.task_state_enum
    end,
    '[LT] assignment rutero B'
  from lt_tasks lt;

  get diagnostics v_rows = row_count;
  raise notice 'Inserted user_tasks assignments: %', v_rows;

  select count(*)
  into v_link_count_a
  from public.products_establishment pe
  join public.product p on p.product_id = pe.product_id
  join public.establishment e on e.establishment_id = pe.establishment_id
  where p.company_id = v_company_a_id
    and p.sku like 'LT-A-%'
    and e.name like 'LT Establecimiento A %';

  select count(*)
  into v_link_count_b
  from public.products_establishment pe
  join public.product p on p.product_id = pe.product_id
  join public.establishment e on e.establishment_id = pe.establishment_id
  where p.company_id = v_company_b_id
    and p.sku like 'LT-B-%'
    and e.name like 'LT Establecimiento B %';

  if v_link_count_a = 0 or v_link_count_b = 0 then
    raise exception 'Missing product-establishment links for LT companies.';
  end if;

  with links_a as (
    select
      pe.establishment_id,
      pe.product_id,
      (row_number() over (order by pe.establishment_id, pe.product_id)::int - 1) as idx
    from public.products_establishment pe
    join public.product p on p.product_id = pe.product_id
    join public.establishment e on e.establishment_id = pe.establishment_id
    where p.company_id = v_company_a_id
      and p.sku like 'LT-A-%'
      and e.name like 'LT Establecimiento A %'
  ),
  links_b as (
    select
      pe.establishment_id,
      pe.product_id,
      (row_number() over (order by pe.establishment_id, pe.product_id)::int - 1) as idx
    from public.products_establishment pe
    join public.product p on p.product_id = pe.product_id
    join public.establishment e on e.establishment_id = pe.establishment_id
    where p.company_id = v_company_b_id
      and p.sku like 'LT-B-%'
      and e.name like 'LT Establecimiento B %'
  ),
  counts as (
    select
      (select count(*)::int from links_a) as cnt_a,
      (select count(*)::int from links_b) as cnt_b
  )
  insert into public.check_record (
    system_inventory,
    real_inventory,
    evidence_num,
    comments,
    time_date,
    product_id,
    user_id,
    establishment_id
  )
  select
    (40 + (gs % 180))::int as system_inventory,
    greatest(0, (40 + (gs % 180)) + ((gs % 11) - 5))::int as real_inventory,
    case
      when gs % 7 = 0 then 0
      else (gs % 4)
    end::int as evidence_num,
    format('[LT] Seed rec %s', gs),
    (
      date_trunc('day', timezone('utc', now()))
      - (((gs - 1) % 365)::text || ' days')::interval
      + (((gs * 13) % 24)::text || ' hours')::interval
      + (((gs * 17) % 60)::text || ' minutes')::interval
    )::timestamp without time zone as time_date,
    case
      when gs % 2 = 0 then la.product_id
      else lb.product_id
    end as product_id,
    case
      when gs % 2 = 0 then v_rutero_a_user_id
      else v_rutero_b_user_id
    end as user_id,
    case
      when gs % 2 = 0 then la.establishment_id
      else lb.establishment_id
    end as establishment_id
  from generate_series(1, 200000) as gs
  cross join counts c
  join links_a la
    on la.idx = ((gs * 7 + (gs / 31)) % c.cnt_a)
  join links_b lb
    on lb.idx = ((gs * 11 + (gs / 29)) % c.cnt_b)
  where c.cnt_a > 0 and c.cnt_b > 0;

  get diagnostics v_rows = row_count;
  raise notice 'Inserted check_record rows: %', v_rows;

  raise notice 'LT seed completed successfully.';
end
$$;
