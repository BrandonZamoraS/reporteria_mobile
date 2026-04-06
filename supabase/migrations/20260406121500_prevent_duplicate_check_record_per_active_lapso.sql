create index if not exists check_record_lapso_establishment_product_idx
  on public.check_record (lapso_id, establishment_id, product_id);

create or replace function public.prevent_duplicate_check_record_per_active_lapso()
returns trigger
language plpgsql
as $$
begin
  if new.lapso_id is null then
    return new;
  end if;

  if exists (
    select 1
    from public.check_record cr
    where cr.lapso_id = new.lapso_id
      and cr.establishment_id = new.establishment_id
      and cr.product_id = new.product_id
  ) then
    raise exception
      using
        errcode = '23505',
        message = 'Ya existe un registro para este producto en este establecimiento durante el lapso activo. Puedes editar el registro existente.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_duplicate_check_record_per_active_lapso on public.check_record;
create trigger trg_prevent_duplicate_check_record_per_active_lapso
before insert on public.check_record
for each row
execute function public.prevent_duplicate_check_record_per_active_lapso();
