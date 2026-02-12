-- Add fields required by Usuarios UI and session audit (bitacora de sesiones).

alter table public.user_profile
  add column if not exists email text,
  add column if not exists is_active boolean not null default true;
update public.user_profile up
set email = au.email
from auth.users au
where up.auth_user_id = au.id
  and (up.email is null or up.email = '');
create unique index if not exists user_profile_email_unique_idx
  on public.user_profile (lower(email))
  where email is not null;
create table if not exists public.user_session_log (
  session_log_id bigserial primary key,
  user_id bigint references public.user_profile (user_id) on delete set null,
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  login_at timestamptz not null default timezone('utc', now()),
  logout_at timestamptz,
  user_agent text
);
create index if not exists user_session_log_user_id_login_idx
  on public.user_session_log (user_id, login_at desc);
create index if not exists user_session_log_auth_user_id_login_idx
  on public.user_session_log (auth_user_id, login_at desc);
alter table public.user_session_log enable row level security;
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_session_log'
      and policyname = 'user_session_log_select_admin_editor'
  ) then
    create policy user_session_log_select_admin_editor
      on public.user_session_log
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
      and tablename = 'user_session_log'
      and policyname = 'user_session_log_select_own'
  ) then
    create policy user_session_log_select_own
      on public.user_session_log
      for select
      to authenticated
      using (auth.uid() = auth_user_id);
  end if;
end
$$;
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_session_log'
      and policyname = 'user_session_log_insert_own'
  ) then
    create policy user_session_log_insert_own
      on public.user_session_log
      for insert
      to authenticated
      with check (auth.uid() = auth_user_id);
  end if;
end
$$;
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_session_log'
      and policyname = 'user_session_log_update_own'
  ) then
    create policy user_session_log_update_own
      on public.user_session_log
      for update
      to authenticated
      using (auth.uid() = auth_user_id)
      with check (auth.uid() = auth_user_id);
  end if;
end
$$;
create or replace function public.user_profile_protect_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role public.user_role_enum;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if auth.uid() is null then
    return new;
  end if;

  actor_role := public.current_user_role();

  if actor_role in ('admin', 'editor') then
    return new;
  end if;

  if new.auth_user_id is distinct from auth.uid() then
    raise exception 'No autorizado para actualizar este perfil';
  end if;

  if new.role is distinct from old.role
     or new.email is distinct from old.email
     or new.is_active is distinct from old.is_active
     or new.phone_num is distinct from old.phone_num
     or new.auth_user_id is distinct from old.auth_user_id then
    raise exception 'Solo puedes actualizar tu nombre';
  end if;

  return new;
end
$$;
drop trigger if exists trg_user_profile_protect_self_update on public.user_profile;
create trigger trg_user_profile_protect_self_update
before update on public.user_profile
for each row
execute function public.user_profile_protect_self_update();
