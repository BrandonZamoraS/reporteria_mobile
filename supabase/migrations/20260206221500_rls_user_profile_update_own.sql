-- Allow every authenticated user to update only their own user_profile row.

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profile'
      and policyname = 'user_profile_update_own'
  ) then
    create policy user_profile_update_own
      on public.user_profile
      for update
      to authenticated
      using (auth.uid() = auth_user_id)
      with check (auth.uid() = auth_user_id);
  end if;
end
$$;
