-- Script global de creation de schema Supabase
-- Concu pour etre idempotent et compatible avec la logique actuelle du projet.

create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.document_sequences (
  prefix text primary key,
  last_value bigint not null default 0,
  updated_at timestamptz not null default now()
);

create or replace function public.set_document_sequences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_document_sequences_updated_at on public.document_sequences;
create trigger trg_document_sequences_updated_at
before update on public.document_sequences
for each row
execute function public.set_document_sequences_updated_at();

create or replace function public.generate_prefixed_number(prefix text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_prefix text := upper(coalesce(nullif(trim(generate_prefixed_number.prefix), ''), 'REF'));
  next_value bigint;
begin
  insert into public.document_sequences as ds (prefix, last_value)
  values (normalized_prefix, 1)
  on conflict on constraint document_sequences_pkey
  do update set last_value = ds.last_value + 1
  returning ds.last_value into next_value;

  return normalized_prefix || '-' || lpad(next_value::text, 6, '0');
end;
$$;

create or replace function public.peek_prefixed_number(prefix text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_prefix text := upper(coalesce(nullif(trim(peek_prefixed_number.prefix), ''), 'REF'));
  current_value bigint := 0;
begin
  select ds.last_value
    into current_value
  from public.document_sequences ds
  where ds.prefix = normalized_prefix;

  current_value := coalesce(current_value, 0) + 1;
  return normalized_prefix || '-' || lpad(current_value::text, 6, '0');
end;
$$;

create table if not exists public.mutuelles (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  taux_remboursement numeric(15,3) not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_mutuelles_nom on public.mutuelles (lower(nom));

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  telephone text,
  adresse text,
  mutuelle_id uuid references public.mutuelles(id) on delete set null,
  numero_matricule_mutuelle text,
  nom_malade text,
  solde numeric(15,3) not null default 0,
  en_cours numeric(15,3) not null default 0,
  reste_a_payer numeric(15,3) not null default 0,
  solde_initial numeric(15,3) not null default 0,
  date_initial date,
  email text,
  source_client text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customers_nom on public.customers (nom);
create index if not exists idx_customers_phone on public.customers (telephone);
create index if not exists idx_customers_mutuelle on public.customers (mutuelle_id);

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at
before update on public.customers
for each row
execute function public.set_updated_at_timestamp();

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  code_article text not null,
  code_barre text,
  designation text not null,
  code_pct text,
  stock_actuel numeric(15,3) not null default 0,
  peremption date,
  prix_achat_ht numeric(15,3) not null default 0,
  prix_achat_ttc numeric(15,3) not null default 0,
  prix_vente_ht numeric(15,3) not null default 0,
  tva numeric(15,3) not null default 0,
  fodec_pct numeric(15,3) not null default 0,
  prix_vente_ttc numeric(15,3) not null default 0,
  prix_vente_web_ttc numeric(15,3) not null default 0,
  prix_vente_passager_ttc numeric(15,3) not null default 0,
  remise_web_pct numeric(15,3) not null default 0,
  marge numeric(15,3) not null default 0,
  date_alerte date,
  image_url text,
  description_web text,
  product_brand text,
  web_category_slug text,
  is_web_hidden boolean not null default false,
  old_price_ttc numeric(15,3) not null default 0,
  promo_badge text,
  product_gallery_urls text,
  product_specs text,
  forme text,
  product_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_products_code_article on public.products (code_article);
create index if not exists idx_products_designation on public.products (designation);
create index if not exists idx_products_web_category_slug on public.products (web_category_slug);

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at_timestamp();

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  telephone text,
  matricule_fiscale text,
  created_at timestamptz not null default now()
);

create index if not exists idx_suppliers_nom on public.suppliers (nom);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  numero_vente text unique,
  numero_bl text unique,
  numero_facture text unique,
  numero_devis text unique,
  type_vente text not null default 'COMPTANT',
  client_id uuid references public.customers(id) on delete set null,
  mutuelle_id uuid references public.mutuelles(id) on delete set null,
  payment_mode text not null default 'ESPECE',
  total_ht numeric(15,3) not null default 0,
  total_tva numeric(15,3) not null default 0,
  total_ttc numeric(15,3) not null default 0,
  statut text not null default 'Valide',
  date_vente timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.sales add column if not exists numero_bl text;
alter table public.sales add column if not exists numero_facture text;
alter table public.sales add column if not exists numero_devis text;

create or replace function public.set_sales_defaults()
returns trigger
language plpgsql
as $$
begin
  if coalesce(trim(new.numero_vente), '') = '' then
    new.numero_vente := public.generate_prefixed_number('VTE');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sales_defaults on public.sales;
create trigger trg_sales_defaults
before insert on public.sales
for each row
execute function public.set_sales_defaults();

create index if not exists idx_sales_date on public.sales (date_vente desc);
create index if not exists idx_sales_client on public.sales (client_id);
create index if not exists idx_sales_mutuelle on public.sales (mutuelle_id);
create unique index if not exists idx_sales_numero_bl on public.sales (numero_bl) where numero_bl is not null;
create unique index if not exists idx_sales_numero_facture on public.sales (numero_facture) where numero_facture is not null;
create unique index if not exists idx_sales_numero_devis on public.sales (numero_devis) where numero_devis is not null;

create or replace function public.assign_sale_document_number(p_sale_id uuid, p_doc_type text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_doc_type text := upper(coalesce(nullif(trim(p_doc_type), ''), ''));
  target_column text;
  target_prefix text;
  existing_value text;
  next_number text;
begin
  if normalized_doc_type in ('BL', 'DELIVERY_NOTE') then
    target_column := 'numero_bl';
    target_prefix := 'BL';
  elsif normalized_doc_type in ('FAC', 'FACTURE', 'INVOICE') then
    target_column := 'numero_facture';
    target_prefix := 'FAC';
  elsif normalized_doc_type in ('DEV', 'DEVIS', 'QUOTE') then
    target_column := 'numero_devis';
    target_prefix := 'DEV';
  else
    raise exception 'Type document non supporte: %', normalized_doc_type;
  end if;

  execute format('select %I from public.sales where id = $1', target_column)
    into existing_value
    using p_sale_id;

  if coalesce(trim(existing_value), '') <> '' then
    return existing_value;
  end if;

  next_number := public.generate_prefixed_number(target_prefix);

  execute format(
    'update public.sales set %1$I = $1 where id = $2 and coalesce(trim(%1$I), '''') = '''' returning %1$I',
    target_column
  )
    into existing_value
    using next_number, p_sale_id;

  return coalesce(existing_value, next_number);
end;
$$;

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantite numeric(15,3) not null default 0,
  prix_unitaire_ttc numeric(15,3) not null default 0,
  remise numeric(15,3) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_sale_items_sale on public.sale_items (sale_id);
create index if not exists idx_sale_items_product on public.sale_items (product_id);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  numero_achat text unique,
  date_achat date not null default current_date,
  supplier_id uuid references public.suppliers(id) on delete set null,
  num_bl_fact text,
  total_ht_net numeric(15,3) not null default 0,
  total_fodec numeric(15,3) not null default 0,
  total_ttc numeric(15,3) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_purchases_date on public.purchases (date_achat desc);
create index if not exists idx_purchases_supplier on public.purchases (supplier_id);

create or replace function public.set_purchases_defaults()
returns trigger
language plpgsql
as $$
begin
  if coalesce(trim(new.numero_achat), '') = '' then
    new.numero_achat := public.generate_prefixed_number('ACH');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_purchases_defaults on public.purchases;
create trigger trg_purchases_defaults
before insert on public.purchases
for each row
execute function public.set_purchases_defaults();

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantite numeric(15,3) not null default 0,
  quantite_gratuite numeric(15,3) not null default 0,
  prix_achat_ht numeric(15,3) not null default 0,
  fodec_pct numeric(15,3) not null default 1,
  remise numeric(15,3) not null default 0,
  peremption date,
  created_at timestamptz not null default now()
);

create index if not exists idx_purchase_items_purchase on public.purchase_items (purchase_id);
create index if not exists idx_purchase_items_product on public.purchase_items (product_id);

create table if not exists public.supplier_returns (
  id uuid primary key default gen_random_uuid(),
  return_number text unique,
  supplier_id uuid references public.suppliers(id) on delete set null,
  return_date date not null default current_date,
  note text,
  total_ht numeric(15,3) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.supplier_return_items (
  id uuid primary key default gen_random_uuid(),
  supplier_return_id uuid not null references public.supplier_returns(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantite numeric(15,3) not null default 0,
  prix_achat_ht numeric(15,3) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_supplier_returns_supplier on public.supplier_returns (supplier_id);
create index if not exists idx_supplier_returns_date on public.supplier_returns (return_date desc);
create index if not exists idx_supplier_return_items_return on public.supplier_return_items (supplier_return_id);
create index if not exists idx_supplier_return_items_product on public.supplier_return_items (product_id);

create table if not exists public.action_history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id text,
  username text,
  full_name text,
  poste_label text,
  category text not null,
  action text not null default 'UPDATE',
  entity_type text not null,
  entity_id text,
  entity_label text,
  details jsonb not null default '[]'::jsonb
);

create index if not exists idx_action_history_created_at on public.action_history(created_at desc);
create index if not exists idx_action_history_category on public.action_history(category, created_at desc);
create index if not exists idx_action_history_entity on public.action_history(entity_type, entity_id);

create table if not exists public.company_settings (
  id integer primary key default 1,
  company_name text,
  subtitle text,
  address text,
  city text,
  phone text,
  mobile text,
  email text,
  fiscal_id text,
  website text,
  rib text,
  pharmacist_code text,
  delivery_fee_standard numeric(15,3) not null default 0,
  delivery_fee_express numeric(15,3) not null default 0,
  delivery_fee_pickup numeric(15,3) not null default 0,
  updated_at timestamptz not null default now(),
  constraint company_settings_singleton check (id = 1)
);

drop trigger if exists trg_company_settings_updated_at on public.company_settings;
create trigger trg_company_settings_updated_at
before update on public.company_settings
for each row
execute function public.set_updated_at_timestamp();

create table if not exists public.backoffice_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  full_name text,
  password_text text,
  is_admin boolean not null default false,
  allowed_modules jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.fridge_sales (
  id uuid primary key default gen_random_uuid(),
  fridge_number text not null unique,
  sale_type text not null default 'COMPTANT',
  client_id uuid references public.customers(id) on delete set null,
  mutuelle_id uuid references public.mutuelles(id) on delete set null,
  total_ht numeric(15,3) not null default 0,
  total_tva numeric(15,3) not null default 0,
  total_ttc numeric(15,3) not null default 0,
  sale_snapshot jsonb not null default '{}'::jsonb,
  fridge_date timestamptz not null default now(),
  expiry_date timestamptz not null,
  note text,
  statut text not null default 'EN_ATTENTE',
  resumed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_fridge_sales_status_expiry on public.fridge_sales(statut, expiry_date);
create index if not exists idx_fridge_sales_client_date on public.fridge_sales(client_id, fridge_date desc);

drop trigger if exists trg_fridge_sales_updated_at on public.fridge_sales;
create trigger trg_fridge_sales_updated_at
before update on public.fridge_sales
for each row
execute function public.set_updated_at_timestamp();

create table if not exists public.customer_payments (
  id uuid primary key default gen_random_uuid(),
  payment_number text not null unique,
  client_id uuid not null references public.customers(id) on delete cascade,
  payment_date timestamptz not null default now(),
  amount numeric(15,3) not null default 0,
  payment_mode text not null default 'ESPECE',
  reference text,
  note text,
  statut text not null default 'VALIDE',
  created_at timestamptz not null default now()
);

create index if not exists idx_customer_payments_client_date on public.customer_payments(client_id, payment_date desc);

create table if not exists public.stock_operations (
  id uuid primary key default gen_random_uuid(),
  operation_number text not null unique,
  module_id text not null,
  movement_type text not null,
  product_id uuid references public.products(id) on delete set null,
  product_code text,
  product_designation text,
  partner_name text,
  note text,
  quantity numeric(15,3) not null default 0,
  stock_effect numeric(15,3) not null default 0,
  operation_date date not null default current_date,
  created_at timestamptz not null default now(),
  created_by text,
  constraint stock_operations_module_check check (
    module_id in ('stock_pret', 'stock_emprunt', 'stock_entree', 'stock_sortie')
  ),
  constraint stock_operations_type_check check (
    movement_type in ('PRET', 'EMPRUNT', 'ENTREE', 'SORTIE')
  )
);

create index if not exists stock_operations_module_date_idx
  on public.stock_operations(module_id, operation_date desc, created_at desc);
create index if not exists stock_operations_product_date_idx
  on public.stock_operations(product_id, operation_date desc, created_at desc);
create index if not exists stock_operations_type_date_idx
  on public.stock_operations(movement_type, operation_date desc, created_at desc);

create or replace function public.set_stock_operations_defaults()
returns trigger
language plpgsql
as $$
declare
  target_prefix text;
begin
  if coalesce(trim(new.operation_number), '') = '' then
    target_prefix := case upper(coalesce(new.movement_type, ''))
      when 'ENTREE' then 'ENT'
      when 'SORTIE' then 'SOR'
      when 'PRET' then 'PRT'
      when 'EMPRUNT' then 'EMP'
      else 'MOV'
    end;
    new.operation_number := public.generate_prefixed_number(target_prefix);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_stock_operations_defaults on public.stock_operations;
create trigger trg_stock_operations_defaults
before insert on public.stock_operations
for each row
execute function public.set_stock_operations_defaults();

create table if not exists public.web_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.web_categories(id) on delete cascade,
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_web_categories_parent_sort on public.web_categories(parent_id, sort_order, name);

drop trigger if exists trg_web_categories_updated_at on public.web_categories;
create trigger trg_web_categories_updated_at
before update on public.web_categories
for each row
execute function public.set_updated_at_timestamp();

create table if not exists public.web_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  customer_address text,
  notes text,
  delivery_mode text default 'Livraison standard',
  payment_mode text default 'Paiement a la livraison',
  delivery_fee_ttc numeric(15,3) not null default 0,
  total_ttc numeric(15,3) not null default 0,
  status text not null default 'Nouvelle',
  stock_decremented boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_web_orders_created_at on public.web_orders(created_at desc);
create index if not exists idx_web_orders_status on public.web_orders(status, created_at desc);

drop trigger if exists trg_web_orders_updated_at on public.web_orders;
create trigger trg_web_orders_updated_at
before update on public.web_orders
for each row
execute function public.set_updated_at_timestamp();

create or replace function public.set_web_orders_defaults()
returns trigger
language plpgsql
as $$
begin
  if coalesce(trim(new.order_number), '') = '' then
    new.order_number := public.generate_prefixed_number('WEB');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_web_orders_defaults on public.web_orders;
create trigger trg_web_orders_defaults
before insert on public.web_orders
for each row
execute function public.set_web_orders_defaults();

create table if not exists public.web_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.web_orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantity numeric(15,3) not null default 0,
  unit_price numeric(15,3) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_web_order_items_order on public.web_order_items(order_id);
create index if not exists idx_web_order_items_product on public.web_order_items(product_id);

create table if not exists public.web_order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.web_orders(id) on delete cascade,
  old_status text,
  new_status text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_web_order_status_history_order on public.web_order_status_history(order_id, created_at desc);

create table if not exists public.web_order_delivery_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.web_orders(id) on delete cascade,
  old_fee_ttc numeric(15,3) not null default 0,
  new_fee_ttc numeric(15,3) not null default 0,
  old_total_ttc numeric(15,3) not null default 0,
  new_total_ttc numeric(15,3) not null default 0,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_web_order_delivery_history_order on public.web_order_delivery_history(order_id, created_at desc);

create table if not exists public.web_product_reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  review_title text,
  comment text not null,
  is_approved boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_web_product_reviews_product
on public.web_product_reviews(product_id, created_at desc);

create table if not exists public.web_customer_profiles (
  id uuid primary key,
  email text not null unique,
  full_name text not null,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_web_customer_profiles_updated_at on public.web_customer_profiles;
create trigger trg_web_customer_profiles_updated_at
before update on public.web_customer_profiles
for each row
execute function public.set_updated_at_timestamp();

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

create index if not exists idx_web_customer_accounts_phone on public.web_customer_accounts(phone);
create index if not exists idx_web_customer_accounts_session on public.web_customer_accounts(session_token);
create unique index if not exists idx_web_customer_accounts_email
on public.web_customer_accounts(lower(email))
where email is not null and trim(email) <> '';

drop trigger if exists trg_web_customer_accounts_updated_at on public.web_customer_accounts;
create trigger trg_web_customer_accounts_updated_at
before update on public.web_customer_accounts
for each row
execute function public.set_updated_at_timestamp();

create table if not exists public.mutuelle_bordereaux (
  id uuid primary key default gen_random_uuid(),
  numero_releve text not null,
  mutuelle_id uuid references public.mutuelles(id) on delete restrict,
  date_creation timestamptz not null default now(),
  date_debut date not null,
  date_fin date not null,
  tri_par text not null default 'date',
  total numeric(15,3) not null default 0,
  montant_a_rembourser numeric(15,3) not null default 0,
  deja_regle numeric(15,3) not null default 0,
  retenue_source numeric(15,3) not null default 0,
  reste numeric(15,3) not null default 0,
  statut text not null default 'BROUILLON',
  created_at timestamptz not null default now()
);

create index if not exists idx_mutuelle_bordereaux_mutuelle_date
  on public.mutuelle_bordereaux(mutuelle_id, date_debut, date_fin);

create table if not exists public.mutuelle_bordereau_lignes (
  id uuid primary key default gen_random_uuid(),
  bordereau_id uuid not null references public.mutuelle_bordereaux(id) on delete cascade,
  sale_id uuid references public.sales(id) on delete set null,
  client_id uuid references public.customers(id) on delete set null,
  ordre integer not null default 0,
  num_vente text,
  nom_client text,
  nom_malade text,
  matricule_mutuelle text,
  date_vente timestamptz,
  total_ttc numeric(15,3) not null default 0,
  montant_rembourser numeric(15,3) not null default 0,
  total_ht numeric(15,3) not null default 0,
  libelle1 text,
  libelle2 text,
  libelle3 text,
  libelle4 text,
  libelle5 text
);

create index if not exists idx_mutuelle_bordereau_lignes_bordereau
  on public.mutuelle_bordereau_lignes(bordereau_id, ordre);

grant select, insert, update, delete on public.mutuelles to anon, authenticated;
grant select, insert, update, delete on public.customers to anon, authenticated;
grant select, insert, update, delete on public.products to anon, authenticated;
grant select, insert, update, delete on public.suppliers to anon, authenticated;
grant select, insert, update, delete on public.sales to anon, authenticated;
grant select, insert, update, delete on public.sale_items to anon, authenticated;
grant select, insert, update, delete on public.purchases to anon, authenticated;
grant select, insert, update, delete on public.purchase_items to anon, authenticated;
grant select, insert, update, delete on public.supplier_returns to anon, authenticated;
grant select, insert, update, delete on public.supplier_return_items to anon, authenticated;
grant select, insert on public.action_history to anon, authenticated;
grant select, insert, update, delete on public.company_settings to anon, authenticated;
grant select, insert, update, delete on public.backoffice_users to anon, authenticated;
grant select, insert, update, delete on public.fridge_sales to anon, authenticated;
grant select, insert, update, delete on public.customer_payments to anon, authenticated;
grant all on public.stock_operations to anon, authenticated, service_role;
grant select, insert, update, delete on public.web_categories to anon, authenticated;
grant select, insert, update, delete on public.web_orders to anon, authenticated;
grant select, insert, update, delete on public.web_order_items to anon, authenticated;
grant select, insert, update, delete on public.web_order_status_history to anon, authenticated;
grant select, insert, update, delete on public.web_order_delivery_history to anon, authenticated;
grant select, insert, update, delete on public.web_product_reviews to anon, authenticated;
grant select, insert, update on public.web_customer_profiles to authenticated;
grant select, insert, update, delete on public.mutuelle_bordereaux to anon, authenticated;
grant select, insert, update, delete on public.mutuelle_bordereau_lignes to anon, authenticated;

alter table public.mutuelles enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.suppliers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.supplier_returns enable row level security;
alter table public.supplier_return_items enable row level security;
alter table public.action_history enable row level security;
alter table public.company_settings enable row level security;
alter table public.backoffice_users enable row level security;
alter table public.fridge_sales enable row level security;
alter table public.customer_payments enable row level security;
alter table public.stock_operations enable row level security;
alter table public.web_categories enable row level security;
alter table public.web_orders enable row level security;
alter table public.web_order_items enable row level security;
alter table public.web_order_status_history enable row level security;
alter table public.web_order_delivery_history enable row level security;
alter table public.web_product_reviews enable row level security;
alter table public.web_customer_profiles enable row level security;
alter table public.web_customer_accounts enable row level security;
alter table public.mutuelle_bordereaux enable row level security;
alter table public.mutuelle_bordereau_lignes enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'mutuelles',
    'customers',
    'products',
    'suppliers',
    'sales',
    'sale_items',
    'purchases',
    'purchase_items',
    'supplier_returns',
    'supplier_return_items',
    'company_settings',
    'backoffice_users',
    'fridge_sales',
    'customer_payments',
    'stock_operations',
    'web_categories',
    'web_orders',
    'web_order_items',
    'web_order_status_history',
    'web_order_delivery_history',
    'web_product_reviews',
    'mutuelle_bordereaux',
    'mutuelle_bordereau_lignes'
  ]
  loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = tbl
        and policyname = tbl || '_select_all'
    ) then
      execute format('create policy %I on public.%I for select to anon, authenticated using (true);', tbl || '_select_all', tbl);
    end if;
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = tbl
        and policyname = tbl || '_insert_all'
    ) then
      execute format('create policy %I on public.%I for insert to anon, authenticated with check (true);', tbl || '_insert_all', tbl);
    end if;
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = tbl
        and policyname = tbl || '_update_all'
    ) then
      execute format('create policy %I on public.%I for update to anon, authenticated using (true) with check (true);', tbl || '_update_all', tbl);
    end if;
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = tbl
        and policyname = tbl || '_delete_all'
    ) then
      execute format('create policy %I on public.%I for delete to anon, authenticated using (true);', tbl || '_delete_all', tbl);
    end if;
  end loop;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'action_history'
      and policyname = 'action_history_select_all'
  ) then
    create policy action_history_select_all
      on public.action_history
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'action_history'
      and policyname = 'action_history_insert_all'
  ) then
    create policy action_history_insert_all
      on public.action_history
      for insert
      to anon, authenticated
      with check (true);
  end if;
end
$$;

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

  select c.id
  into v_customer_id
  from public.customers c
  where regexp_replace(coalesce(c.telephone, ''), '\D', '', 'g') = v_phone
  limit 1;

  if v_customer_id is null then
    insert into public.customers (nom, telephone, adresse, email, source_client)
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
    phone, email, password_hash, full_name, address, session_token, last_login_at
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

  perform public.sync_web_customer_to_customers(v_account.full_name, v_account.phone, v_account.email, v_account.address);

  return query
  select v_account.id, v_account.full_name, v_account.email, v_account.phone, v_account.address,
         v_account.session_token, v_account.created_at, v_account.updated_at;
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
  select v_account.id, v_account.full_name, v_account.email, v_account.phone, v_account.address,
         v_account.session_token, v_account.created_at, v_account.updated_at;
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

  perform public.sync_web_customer_to_customers(v_account.full_name, v_account.phone, v_account.email, v_account.address);

  return query
  select v_account.id, v_account.full_name, v_account.email, v_account.phone, v_account.address,
         v_account.session_token, v_account.created_at, v_account.updated_at;
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

create or replace function public.get_products_admin_bundle(
  p_limit integer default 200,
  p_offset integer default 0
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'web_categories',
    coalesce(
      (
        select jsonb_agg(row_to_json(wc) order by wc.sort_order asc, wc.name asc)
        from (
          select id, parent_id, name, slug, sort_order, is_active
          from public.web_categories
          where is_active = true
        ) wc
      ),
      '[]'::jsonb
    ),
    'products_total',
    (
      select count(*)
      from public.products
    ),
    'products',
    coalesce(
      (
        select jsonb_agg(row_to_json(p) order by p.designation asc)
        from (
          select
            id,
            code_article,
            code_barre,
            designation,
            code_pct,
            web_category_slug,
            stock_actuel,
            peremption,
            prix_vente_ht,
            tva,
            prix_vente_ttc,
            prix_vente_web_ttc,
            prix_vente_passager_ttc,
            remise_web_pct,
            marge,
            prix_achat_ht,
            prix_achat_ttc,
            forme,
            date_alerte,
            image_url,
            description_web,
            product_brand,
            old_price_ttc,
            promo_badge,
            product_specs,
            fodec_pct,
            is_web_hidden
          from public.products
          order by designation asc
          limit greatest(coalesce(p_limit, 200), 1)
          offset greatest(coalesce(p_offset, 0), 0)
        ) p
      ),
      '[]'::jsonb
    )
  );
$$;

create or replace function public.get_sale_entry_bundle()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'products',
    coalesce((select jsonb_agg(row_to_json(p) order by p.designation asc) from (select * from public.products) p), '[]'::jsonb),
    'customers',
    coalesce(
      (
        select jsonb_agg(row_to_json(c) order by c.nom asc)
        from (
          select
            c.*,
            case when m.id is null then null else jsonb_build_object('nom', m.nom) end as mutuelles
          from public.customers c
          left join public.mutuelles m on m.id = c.mutuelle_id
        ) c
      ),
      '[]'::jsonb
    ),
    'mutuelles',
    coalesce((select jsonb_agg(row_to_json(m) order by m.nom asc) from (select * from public.mutuelles) m), '[]'::jsonb)
  );
$$;

create or replace function public.get_customers_management_bundle()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'customers',
    coalesce(
      (
        select jsonb_agg(row_to_json(c) order by c.nom asc)
        from (
          select
            c.*,
            case when m.id is null then null else jsonb_build_object('nom', m.nom) end as mutuelles
          from public.customers c
          left join public.mutuelles m on m.id = c.mutuelle_id
        ) c
      ),
      '[]'::jsonb
    )
  );
$$;

create or replace function public.get_sales_reports_bundle()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'sales',
    coalesce(
      (
        select jsonb_agg(row_to_json(s) order by s.date_vente desc)
        from (
          select
            sale.*,
            case
              when c.id is null then null
              else jsonb_build_object('nom', c.nom, 'numero_matricule_mutuelle', c.numero_matricule_mutuelle, 'nom_malade', c.nom_malade)
            end as customers,
            case
              when m.id is null then null
              else jsonb_build_object('nom', m.nom, 'taux_remboursement', m.taux_remboursement)
            end as mutuelles
          from public.sales sale
          left join public.customers c on c.id = sale.client_id
          left join public.mutuelles m on m.id = sale.mutuelle_id
          order by sale.date_vente desc
        ) s
      ),
      '[]'::jsonb
    ),
    'sale_items',
    coalesce((select jsonb_agg(row_to_json(si) order by si.sale_id) from (select * from public.sale_items order by sale_id) si), '[]'::jsonb),
    'products',
    coalesce((select jsonb_agg(row_to_json(p) order by p.designation asc) from (select id, code_article, designation, tva, forme, prix_vente_ttc from public.products order by designation asc) p), '[]'::jsonb),
    'web_orders',
    coalesce((select jsonb_agg(row_to_json(o) order by o.created_at desc) from (select * from public.web_orders order by created_at desc) o), '[]'::jsonb),
    'web_order_items',
    coalesce((select jsonb_agg(row_to_json(woi) order by woi.order_id) from (select * from public.web_order_items order by order_id) woi), '[]'::jsonb),
    'web_order_delivery_history',
    coalesce((select jsonb_agg(row_to_json(wodh) order by wodh.created_at desc) from (select * from public.web_order_delivery_history order by created_at desc) wodh), '[]'::jsonb)
  );
$$;

create or replace function public.get_purchases_reports_bundle()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'purchases',
    coalesce(
      (
        select jsonb_agg(row_to_json(pu) order by pu.date_achat desc)
        from (
          select
            purchase.*,
            case when s.id is null then null else jsonb_build_object('nom', s.nom) end as suppliers
          from public.purchases purchase
          left join public.suppliers s on s.id = purchase.supplier_id
          order by purchase.date_achat desc
        ) pu
      ),
      '[]'::jsonb
    ),
    'purchase_items',
    coalesce((select jsonb_agg(row_to_json(pi) order by pi.purchase_id) from (select * from public.purchase_items order by purchase_id) pi), '[]'::jsonb),
    'products',
    coalesce((select jsonb_agg(row_to_json(p) order by p.designation asc) from (select id, code_article, designation, forme, prix_vente_ttc, tva from public.products order by designation asc) p), '[]'::jsonb),
    'suppliers',
    coalesce((select jsonb_agg(row_to_json(s) order by s.nom asc) from (select * from public.suppliers order by nom asc) s), '[]'::jsonb)
  );
$$;

grant execute on function public.sync_web_customer_to_customers(text, text, text, text) to anon, authenticated;
grant execute on function public.web_customer_fast_register(text, text, text, text, text) to anon, authenticated;
grant execute on function public.web_customer_fast_login(text, text) to anon, authenticated;
grant execute on function public.web_customer_fast_session(uuid, uuid) to anon, authenticated;
grant execute on function public.web_customer_fast_update_profile(uuid, uuid, text, text, text, text) to anon, authenticated;
grant execute on function public.web_customer_fast_logout(uuid, uuid) to anon, authenticated;
grant execute on function public.get_products_admin_bundle(integer, integer) to anon, authenticated;
grant execute on function public.get_sale_entry_bundle() to anon, authenticated;
grant execute on function public.get_customers_management_bundle() to anon, authenticated;
grant execute on function public.get_sales_reports_bundle() to anon, authenticated;
grant execute on function public.get_purchases_reports_bundle() to anon, authenticated;
