-- Allow deleting companies only for admin users.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'company'
      and policyname = 'company_delete_admin'
  ) then
    create policy company_delete_admin
      on public.company
      for delete
      to authenticated
      using (
        exists (
          select 1
          from public.user_profile up
          where up.auth_user_id = auth.uid()
            and up.role = 'admin'
        )
      );
  end if;
end
$$;
