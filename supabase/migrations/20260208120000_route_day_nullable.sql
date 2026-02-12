-- Make route day optional.

alter table public.route
  alter column day drop not null;
