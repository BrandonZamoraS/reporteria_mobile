-- Minimal RLS for auth session flow:
-- allow authenticated users to read only their own profile row.

alter table public.user_profile enable row level security;
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profile'
      and policyname = 'user_profile_select_own'
  ) then
    create policy user_profile_select_own
      on public.user_profile
      for select
      to authenticated
      using (auth.uid() = auth_user_id);
  end if;
end
$$;
