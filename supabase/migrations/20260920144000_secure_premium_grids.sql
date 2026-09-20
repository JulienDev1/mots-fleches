alter table public.grids
  add column if not exists is_premium boolean not null default false;

create or replace function public.is_current_user_subscribed()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select p.is_subscribed
      from public.profiles p
      where p.id = auth.uid()
    ),
    false
  );
$$;

revoke all on function public.is_current_user_subscribed() from public;
grant execute on function public.is_current_user_subscribed() to authenticated;

alter table public.grids enable row level security;

do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'grids'
      and cmd = 'SELECT'
  loop
    execute format(
      'drop policy if exists %I on public.grids',
      existing_policy.policyname
    );
  end loop;
end
$$;

create policy "Authenticated users can read available grids"
  on public.grids
  for select
  to authenticated
  using (
    not is_premium
    or public.is_current_user_subscribed()
  );
