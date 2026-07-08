create table if not exists public.web_customer_profiles (
  id uuid primary key,
  email text not null unique,
  full_name text not null,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_web_customer_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_web_customer_profiles_updated_at on public.web_customer_profiles;
create trigger trg_web_customer_profiles_updated_at
before update on public.web_customer_profiles
for each row
execute function public.set_web_customer_profiles_updated_at();

alter table public.web_customer_profiles enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'web_customer_profiles'
      and policyname = 'web_customer_profiles_select_own'
  ) then
    create policy web_customer_profiles_select_own
      on public.web_customer_profiles
      for select
      to authenticated
      using (auth.uid() = id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'web_customer_profiles'
      and policyname = 'web_customer_profiles_insert_own'
  ) then
    create policy web_customer_profiles_insert_own
      on public.web_customer_profiles
      for insert
      to authenticated
      with check (auth.uid() = id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'web_customer_profiles'
      and policyname = 'web_customer_profiles_update_own'
  ) then
    create policy web_customer_profiles_update_own
      on public.web_customer_profiles
      for update
      to authenticated
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end
$$;

grant select, insert, update on public.web_customer_profiles to authenticated;
