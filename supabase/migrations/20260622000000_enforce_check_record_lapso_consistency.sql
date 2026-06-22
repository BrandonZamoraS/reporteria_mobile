create or replace function public.enforce_check_record_lapso_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_route_id bigint;
  v_record_instant timestamptz;
  v_lapso_id bigint;
begin
  if new.time_date is null then
    raise exception 'check_record.time_date is required';
  end if;

  select e.route_id
    into v_route_id
  from public.establishment e
  where e.establishment_id = new.establishment_id;

  if v_route_id is null then
    raise exception 'No route found for establishment %', new.establishment_id;
  end if;

  v_record_instant := new.time_date at time zone 'America/Costa_Rica';

  select rl.lapso_id
    into v_lapso_id
  from public.route_lapso rl
  where rl.route_id = v_route_id
    and rl.user_id = new.user_id
    and rl.status = 'en_curso'
    and rl.start_at <= v_record_instant
    and rl.end_at > v_record_instant
  order by rl.start_at desc
  limit 1;

  if v_lapso_id is null then
    raise exception 'No route_lapso matches check_record time_date %, route %, user %',
      new.time_date, v_route_id, new.user_id;
  end if;

  new.lapso_id := v_lapso_id;
  return new;
end;
$$;

drop trigger if exists trg_enforce_check_record_lapso_consistency on public.check_record;
create trigger trg_enforce_check_record_lapso_consistency
before insert or update of time_date, lapso_id, user_id, establishment_id
on public.check_record
for each row
execute function public.enforce_check_record_lapso_consistency();
