create extension if not exists pg_cron;

create or replace function public.close_expired_route_lapsos()
returns integer
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
set row_security = off
as $$
declare
  closed_count integer;
begin
  update public.route_lapso
  set
    status = 'vencido',
    closed_at = coalesce(closed_at, now()),
    updated_at = now()
  where status = 'en_curso'
    and (
      end_at <= now()
      or start_at < (
        date_trunc('week', now() at time zone 'America/Costa_Rica')
        at time zone 'America/Costa_Rica'
      )
    );

  get diagnostics closed_count = row_count;
  return closed_count;
end;
$$;

revoke all on function public.close_expired_route_lapsos() from public;
grant execute on function public.close_expired_route_lapsos() to authenticated;
grant execute on function public.close_expired_route_lapsos() to service_role;

select public.close_expired_route_lapsos();

select cron.schedule(
  'close-expired-route-lapsos',
  '*/15 * * * *',
  $$select public.close_expired_route_lapsos();$$
);
