-- Propuesta de cambios DB para manejar lapsos de ruta (NO APLICADA)
-- Enfoque aprobado por negocio:
-- - NO crear route_lapso_task.
-- - Las tareas (task/user_tasks) siguen independientes de rutas/establecimientos.
-- - El control de ejecucion de rutas se hace con:
--   1) route_lapso (cabecera del lapso)
--   2) check_record (registros) vinculados al lapso por lapso_id
--
-- Si se aprueba, este contenido se pasa a una migracion en supabase/migrations.

-- =====================================================================
-- 0) ENUMS NUEVOS
-- =====================================================================
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'route_lapso_status_enum'
  ) then
    create type public.route_lapso_status_enum as enum (
      'en_curso',
      'completado',
      'incompleto',
      'vencido'
    );
  end if;
end
$$;

-- =====================================================================
-- 1) TABLA DE LAPSOS (CABECERA)
-- =====================================================================
create table if not exists public.route_lapso (
  lapso_id bigserial primary key,
  route_id bigint not null references public.route (route_id) on delete cascade,
  user_id bigint not null references public.user_profile (user_id) on delete cascade,
  duration_days integer not null check (duration_days >= 1),
  start_at timestamptz not null default timezone('utc', now()),
  end_at timestamptz not null,
  status public.route_lapso_status_enum not null default 'en_curso',
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint route_lapso_end_after_start_chk check (end_at > start_at),
  constraint route_lapso_closed_when_final_chk check (
    (status = 'en_curso' and closed_at is null)
    or (status <> 'en_curso' and closed_at is not null)
  )
);

-- Solo 1 lapso activo por ruta + rutero.
create unique index if not exists route_lapso_one_active_idx
  on public.route_lapso (route_id, user_id)
  where status = 'en_curso';

create index if not exists route_lapso_user_status_idx
  on public.route_lapso (user_id, status, end_at desc);

create index if not exists route_lapso_route_status_idx
  on public.route_lapso (route_id, status, end_at desc);

-- Requerido para FK compuesto desde check_record.
create unique index if not exists route_lapso_lapso_user_unique_idx
  on public.route_lapso (lapso_id, user_id);

-- =====================================================================
-- 2) EXTENDER REGISTROS (CHECK_RECORD) CON LAPSO
-- =====================================================================
alter table public.check_record
  add column if not exists lapso_id bigint;

-- Integridad: el registro debe pertenecer al mismo user_id del lapso.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'check_record_lapso_user_fkey'
  ) then
    alter table public.check_record
      add constraint check_record_lapso_user_fkey
      foreign key (lapso_id, user_id)
      references public.route_lapso (lapso_id, user_id)
      on delete set null;
  end if;
end
$$;

create index if not exists check_record_lapso_id_idx
  on public.check_record (lapso_id);

-- =====================================================================
-- 3) RLS: ACTIVAR EN ROUTE_LAPSO
-- =====================================================================
alter table public.route_lapso enable row level security;

-- =====================================================================
-- 4) RLS: POLICIES ROUTE_LAPSO
-- =====================================================================
drop policy if exists route_lapso_select_admin on public.route_lapso;
create policy route_lapso_select_admin
on public.route_lapso
for select
to authenticated
using (
  exists (
    select 1
    from public.user_profile up
    where up.auth_user_id = auth.uid()
      and up.role = 'admin'
  )
);

drop policy if exists route_lapso_select_rutero_own on public.route_lapso;
create policy route_lapso_select_rutero_own
on public.route_lapso
for select
to authenticated
using (
  exists (
    select 1
    from public.user_profile up
    where up.auth_user_id = auth.uid()
      and up.role = 'rutero'
      and up.user_id = route_lapso.user_id
  )
);

drop policy if exists route_lapso_insert_admin on public.route_lapso;
create policy route_lapso_insert_admin
on public.route_lapso
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

drop policy if exists route_lapso_insert_rutero_own on public.route_lapso;
create policy route_lapso_insert_rutero_own
on public.route_lapso
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_profile up
    where up.auth_user_id = auth.uid()
      and up.role = 'rutero'
      and up.user_id = route_lapso.user_id
  )
  and status = 'en_curso'
);

drop policy if exists route_lapso_update_admin on public.route_lapso;
create policy route_lapso_update_admin
on public.route_lapso
for update
to authenticated
using (
  exists (
    select 1
    from public.user_profile up
    where up.auth_user_id = auth.uid()
      and up.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.user_profile up
    where up.auth_user_id = auth.uid()
      and up.role = 'admin'
  )
);

drop policy if exists route_lapso_update_rutero_own on public.route_lapso;
create policy route_lapso_update_rutero_own
on public.route_lapso
for update
to authenticated
using (
  exists (
    select 1
    from public.user_profile up
    where up.auth_user_id = auth.uid()
      and up.role = 'rutero'
      and up.user_id = route_lapso.user_id
  )
  and status = 'en_curso'
)
with check (
  exists (
    select 1
    from public.user_profile up
    where up.auth_user_id = auth.uid()
      and up.role = 'rutero'
      and up.user_id = route_lapso.user_id
  )
  and status in ('en_curso', 'completado', 'incompleto')
);

-- =====================================================================
-- 5) RLS: RESTRICCION EXTRA EN CHECK_RECORD PARA USAR SOLO LAPSO PROPIO
-- =====================================================================
-- Nota: check_record ya tiene policies para admin/editor/rutero.
-- Aqui agregamos una regla adicional para rutero cuando inserta/actualiza
-- registros asociados a una ruta en curso.

drop policy if exists check_record_insert_rutero_with_active_lapso on public.check_record;
create policy check_record_insert_rutero_with_active_lapso
on public.check_record
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_profile up
    where up.auth_user_id = auth.uid()
      and up.role = 'rutero'
      and up.user_id = check_record.user_id
  )
  and exists (
    select 1
    from public.route_lapso rl
    where rl.lapso_id = check_record.lapso_id
      and rl.user_id = check_record.user_id
      and rl.status = 'en_curso'
  )
);

drop policy if exists check_record_update_rutero_with_active_lapso on public.check_record;
create policy check_record_update_rutero_with_active_lapso
on public.check_record
for update
to authenticated
using (
  exists (
    select 1
    from public.user_profile up
    where up.auth_user_id = auth.uid()
      and up.role = 'rutero'
      and up.user_id = check_record.user_id
  )
  and exists (
    select 1
    from public.route_lapso rl
    where rl.lapso_id = check_record.lapso_id
      and rl.user_id = check_record.user_id
      and rl.status = 'en_curso'
  )
)
with check (
  exists (
    select 1
    from public.user_profile up
    where up.auth_user_id = auth.uid()
      and up.role = 'rutero'
      and up.user_id = check_record.user_id
  )
  and exists (
    select 1
    from public.route_lapso rl
    where rl.lapso_id = check_record.lapso_id
      and rl.user_id = check_record.user_id
      and rl.status = 'en_curso'
  )
);

-- =====================================================================
-- 6) GRANTS (RLS define alcance real)
-- =====================================================================
grant select, insert, update on table public.route_lapso to authenticated;
grant all on table public.route_lapso to service_role;
grant usage, select on sequence public.route_lapso_lapso_id_seq to authenticated;
grant all on sequence public.route_lapso_lapso_id_seq to service_role;

-- =====================================================================
-- 7) NOTA DE INTEGRACION APP
-- =====================================================================
-- Para que esto funcione en frontend/backend:
-- - Al abrir una ruta: buscar lapso en_curso del rutero+route.
--   Si no existe, crear uno con:
--     start_at = now()
--     end_at = now() + interval '<duration_days> days'
-- - Al guardar un registro de ruta (check_record), enviar lapso_id.
-- - Registros debe consultar route_lapso + check_record por lapso_id.
-- - task/user_tasks no se tocan en este modelo.
