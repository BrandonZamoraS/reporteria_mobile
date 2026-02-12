-- Allow linking a company to user profiles, only for visitante role.

alter table public.user_profile
  add column if not exists company_id bigint;
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_profile_company_id_fkey'
      and conrelid = 'public.user_profile'::regclass
  ) then
    alter table public.user_profile
      add constraint user_profile_company_id_fkey
      foreign key (company_id)
      references public.company (company_id)
      on delete set null;
  end if;
end
$$;
create index if not exists user_profile_company_id_idx
  on public.user_profile (company_id);
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_profile_company_only_visitante_chk'
      and conrelid = 'public.user_profile'::regclass
  ) then
    alter table public.user_profile
      add constraint user_profile_company_only_visitante_chk
      check (company_id is null or role = 'visitante');
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
     or new.auth_user_id is distinct from old.auth_user_id
     or new.company_id is distinct from old.company_id then
    raise exception 'Solo puedes actualizar tu nombre';
  end if;

  return new;
end
$$;
