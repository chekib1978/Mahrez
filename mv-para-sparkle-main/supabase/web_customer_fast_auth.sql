create extension if not exists pgcrypto;

create table if not exists public.web_customer_accounts (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  email text,
  password_hash text not null,
  full_name text not null,
  address text,
  session_token uuid,
  last_login_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.web_customer_accounts
add column if not exists email text;

alter table public.customers
add column if not exists email text;

alter table public.customers
add column if not exists source_client text;

create index if not exists idx_web_customer_accounts_phone on public.web_customer_accounts(phone);
create index if not exists idx_web_customer_accounts_session on public.web_customer_accounts(session_token);
create unique index if not exists idx_web_customer_accounts_email
on public.web_customer_accounts(lower(email))
where email is not null and trim(email) <> '';

create or replace function public.set_updated_at_web_customer_accounts()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_web_customer_accounts_updated_at on public.web_customer_accounts;
create trigger trg_web_customer_accounts_updated_at
before update on public.web_customer_accounts
for each row
execute function public.set_updated_at_web_customer_accounts();

alter table public.web_customer_accounts enable row level security;

drop function if exists public.web_customer_fast_register(text, text, text, text);
drop function if exists public.web_customer_fast_register(text, text, text, text, text);
drop function if exists public.web_customer_fast_login(text, text);
drop function if exists public.web_customer_fast_session(uuid, uuid);
drop function if exists public.web_customer_fast_update_profile(uuid, uuid, text, text, text);
drop function if exists public.web_customer_fast_update_profile(uuid, uuid, text, text, text, text);
drop function if exists public.web_customer_fast_logout(uuid, uuid);
drop function if exists public.sync_web_customer_to_customers(text, text, text, text);

create or replace function public.sync_web_customer_to_customers(
  p_full_name text,
  p_phone text,
  p_email text default null,
  p_address text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_customer_id uuid;
begin
  if length(v_phone) < 8 then
    return;
  end if;

  select account.id
  into v_customer_id
  from public.customers account
  where regexp_replace(coalesce(account.telephone, ''), '\D', '', 'g') = v_phone
  limit 1;

  if v_customer_id is null then
    insert into public.customers (
      nom,
      telephone,
      adresse,
      email,
      source_client
    )
    values (
      trim(coalesce(p_full_name, 'Client web')),
      v_phone,
      nullif(trim(coalesce(p_address, '')), ''),
      v_email,
      'CLIENT_WEB'
    );
    return;
  end if;

  update public.customers
  set
    nom = trim(coalesce(p_full_name, public.customers.nom)),
    telephone = v_phone,
    adresse = nullif(trim(coalesce(p_address, '')), ''),
    email = v_email,
    source_client = 'CLIENT_WEB'
  where public.customers.id = v_customer_id;
end;
$$;

create or replace function public.web_customer_fast_register(
  p_full_name text,
  p_phone text,
  p_password text,
  p_email text default null,
  p_address text default null
)
returns table (
  id uuid,
  full_name text,
  email text,
  phone text,
  address text,
  session_token uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_account public.web_customer_accounts%rowtype;
begin
  if length(v_phone) < 8 then
    raise exception 'Numero de telephone invalide.';
  end if;

  if coalesce(length(trim(p_password)), 0) < 4 then
    raise exception 'Mot de passe trop court.';
  end if;

  if exists(select 1 from public.web_customer_accounts account where account.phone = v_phone) then
    raise exception 'Ce numero de telephone est deja utilise.';
  end if;

  if v_email is not null and exists(
    select 1 from public.web_customer_accounts account where lower(account.email) = v_email
  ) then
    raise exception 'Cet email est deja utilise.';
  end if;

  insert into public.web_customer_accounts (
    phone,
    email,
    password_hash,
    full_name,
    address,
    session_token,
    last_login_at
  )
  values (
    v_phone,
    v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    trim(coalesce(p_full_name, 'Client web')),
    nullif(trim(coalesce(p_address, '')), ''),
    gen_random_uuid(),
    now()
  )
  returning * into v_account;

  perform public.sync_web_customer_to_customers(
    v_account.full_name,
    v_account.phone,
    v_account.email,
    v_account.address
  );

  return query
  select
    v_account.id,
    v_account.full_name,
    v_account.email,
    v_account.phone,
    v_account.address,
    v_account.session_token,
    v_account.created_at,
    v_account.updated_at;
end;
$$;

create or replace function public.web_customer_fast_login(
  p_phone text,
  p_password text
)
returns table (
  id uuid,
  full_name text,
  email text,
  phone text,
  address text,
  session_token uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_account public.web_customer_accounts%rowtype;
begin
  select *
  into v_account
  from public.web_customer_accounts account
  where account.phone = v_phone
    and account.is_active = true
  limit 1;

  if v_account.id is null then
    raise exception 'Compte introuvable.';
  end if;

  if extensions.crypt(p_password, v_account.password_hash) <> v_account.password_hash then
    raise exception 'Mot de passe incorrect.';
  end if;

  update public.web_customer_accounts
  set session_token = gen_random_uuid(),
      last_login_at = now()
  where public.web_customer_accounts.id = v_account.id
  returning * into v_account;

  return query
  select
    v_account.id,
    v_account.full_name,
    v_account.email,
    v_account.phone,
    v_account.address,
    v_account.session_token,
    v_account.created_at,
    v_account.updated_at;
end;
$$;

create or replace function public.web_customer_fast_session(
  p_account_id uuid,
  p_session_token uuid
)
returns table (
  id uuid,
  full_name text,
  email text,
  phone text,
  address text,
  session_token uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    account.id,
    account.full_name,
    account.email,
    account.phone,
    account.address,
    account.session_token,
    account.created_at,
    account.updated_at
  from public.web_customer_accounts account
  where account.id = p_account_id
    and account.session_token = p_session_token
    and account.is_active = true
  limit 1;
$$;

create or replace function public.web_customer_fast_update_profile(
  p_account_id uuid,
  p_session_token uuid,
  p_full_name text,
  p_phone text,
  p_email text default null,
  p_address text default null
)
returns table (
  id uuid,
  full_name text,
  email text,
  phone text,
  address text,
  session_token uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_account public.web_customer_accounts%rowtype;
begin
  if length(v_phone) < 8 then
    raise exception 'Numero de telephone invalide.';
  end if;

  if exists(
    select 1
    from public.web_customer_accounts account
    where account.phone = v_phone
      and account.id <> p_account_id
  ) then
    raise exception 'Ce numero de telephone est deja utilise.';
  end if;

  if v_email is not null and exists(
    select 1
    from public.web_customer_accounts account
    where lower(account.email) = v_email
      and account.id <> p_account_id
  ) then
    raise exception 'Cet email est deja utilise.';
  end if;

  update public.web_customer_accounts
  set
    email = v_email,
    full_name = trim(coalesce(p_full_name, web_customer_accounts.full_name)),
    phone = v_phone,
    address = nullif(trim(coalesce(p_address, '')), '')
  where public.web_customer_accounts.id = p_account_id
    and public.web_customer_accounts.session_token = p_session_token
    and public.web_customer_accounts.is_active = true
  returning * into v_account;

  if v_account.id is null then
    raise exception 'Session client invalide.';
  end if;

  perform public.sync_web_customer_to_customers(
    v_account.full_name,
    v_account.phone,
    v_account.email,
    v_account.address
  );

  return query
  select
    v_account.id,
    v_account.full_name,
    v_account.email,
    v_account.phone,
    v_account.address,
    v_account.session_token,
    v_account.created_at,
    v_account.updated_at;
end;
$$;

create or replace function public.web_customer_fast_logout(
  p_account_id uuid,
  p_session_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.web_customer_accounts
  set session_token = null
  where public.web_customer_accounts.id = p_account_id
    and public.web_customer_accounts.session_token = p_session_token;

  return true;
end;
$$;

grant execute on function public.web_customer_fast_register(text, text, text, text, text) to anon, authenticated;
grant execute on function public.web_customer_fast_login(text, text) to anon, authenticated;
grant execute on function public.web_customer_fast_session(uuid, uuid) to anon, authenticated;
grant execute on function public.web_customer_fast_update_profile(uuid, uuid, text, text, text, text) to anon, authenticated;
grant execute on function public.web_customer_fast_logout(uuid, uuid) to anon, authenticated;
grant execute on function public.sync_web_customer_to_customers(text, text, text, text) to anon, authenticated;
