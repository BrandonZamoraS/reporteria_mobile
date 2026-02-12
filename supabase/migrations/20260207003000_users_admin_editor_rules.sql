-- Align user management rules:
-- - admin: full management
-- - editor: update users, but cannot change role/is_active/auth_user_id

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profile'
      and policyname = 'user_profile_insert_admin_editor'
  ) then
    drop policy user_profile_insert_admin_editor on public.user_profile;
  end if;
end
$$;
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profile'
      and policyname = 'user_profile_insert_admin'
  ) then
    create policy user_profile_insert_admin
      on public.user_profile
      for insert
      to authenticated
      with check (public.current_user_role() = 'admin');
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

  if actor_role = 'admin' then
    return new;
  end if;

  if actor_role = 'editor' then
    if new.role is distinct from old.role
       or new.is_active is distinct from old.is_active
       or new.auth_user_id is distinct from old.auth_user_id then
      raise exception 'Editor no puede cambiar rol, estado ni vinculacion auth';
    end if;
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
