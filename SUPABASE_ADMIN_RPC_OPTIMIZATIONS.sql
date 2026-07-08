-- Admin RPC optimizations for lower Supabase egress
-- Run this once in Supabase SQL Editor.
-- These functions return slim, ready-to-render payloads for the backoffice.

create or replace function public.get_admin_products_light(
  p_search text default '',
  p_limit integer default 2000,
  p_offset integer default 0
)
returns table (
  id uuid,
  code_article text,
  code_barre text,
  designation text,
  forme text,
  stock_actuel numeric,
  prix_vente_ttc numeric,
  tva numeric,
  prix_achat_ht numeric,
  peremption date,
  code_pct text,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.code_article,
    p.code_barre,
    p.designation,
    p.forme,
    p.stock_actuel,
    p.prix_vente_ttc,
    p.tva,
    p.prix_achat_ht,
    p.peremption,
    p.code_pct,
    p.updated_at
  from public.products p
  where coalesce(trim(p_search), '') = ''
     or p.designation ilike '%' || p_search || '%'
     or p.code_article ilike '%' || p_search || '%'
     or coalesce(p.code_barre, '') ilike '%' || p_search || '%'
  order by p.designation asc
  limit greatest(1, least(coalesce(p_limit, 2000), 5000))
  offset greatest(coalesce(p_offset, 0), 0);
$$;

create or replace function public.get_admin_customers_light(
  p_search text default '',
  p_limit integer default 2000,
  p_offset integer default 0
)
returns table (
  id uuid,
  nom text,
  telephone text,
  solde numeric,
  en_cours numeric,
  reste_a_payer numeric,
  mutuelle_id uuid,
  mutuelles jsonb,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.nom,
    c.telephone,
    c.solde,
    c.en_cours,
    c.reste_a_payer,
    c.mutuelle_id,
    case when m.id is null then null else jsonb_build_object('nom', m.nom) end as mutuelles,
    c.updated_at
  from public.customers c
  left join public.mutuelles m on m.id = c.mutuelle_id
  where coalesce(trim(p_search), '') = ''
     or c.nom ilike '%' || p_search || '%'
     or coalesce(c.telephone, '') ilike '%' || p_search || '%'
  order by c.nom asc
  limit greatest(1, least(coalesce(p_limit, 2000), 5000))
  offset greatest(coalesce(p_offset, 0), 0);
$$;

create or replace function public.get_admin_fridge_sales_recent(
  p_limit integer default 500
)
returns table (
  id uuid,
  fridge_number text,
  sale_type text,
  client_id uuid,
  mutuelle_id uuid,
  total_ht numeric,
  total_tva numeric,
  total_ttc numeric,
  sale_snapshot jsonb,
  fridge_date timestamptz,
  expiry_date timestamptz,
  note text,
  statut text,
  resumed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  customers jsonb,
  mutuelles jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    f.id,
    f.fridge_number,
    f.sale_type,
    f.client_id,
    f.mutuelle_id,
    f.total_ht,
    f.total_tva,
    f.total_ttc,
    f.sale_snapshot,
    f.fridge_date,
    f.expiry_date,
    f.note,
    f.statut,
    f.resumed_at,
    f.cancelled_at,
    f.created_at,
    f.updated_at,
    case when c.id is null then null else jsonb_build_object('nom', c.nom) end as customers,
    case when m.id is null then null else jsonb_build_object('nom', m.nom) end as mutuelles
  from public.fridge_sales f
  left join public.customers c on c.id = f.client_id
  left join public.mutuelles m on m.id = f.mutuelle_id
  order by f.fridge_date desc, f.created_at desc
  limit greatest(1, least(coalesce(p_limit, 500), 1000));
$$;

create or replace function public.get_admin_customer_payments_recent(
  p_limit integer default 500
)
returns table (
  id uuid,
  payment_number text,
  client_id uuid,
  amount numeric,
  payment_date timestamptz,
  payment_mode text,
  reference text,
  note text,
  statut text,
  created_at timestamptz,
  customers jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    cp.id,
    cp.payment_number,
    cp.client_id,
    cp.amount,
    cp.payment_date,
    cp.payment_mode,
    cp.reference,
    cp.note,
    cp.statut,
    cp.created_at,
    case when c.id is null then null else jsonb_build_object('nom', c.nom) end as customers
  from public.customer_payments cp
  left join public.customers c on c.id = cp.client_id
  order by cp.payment_date desc, cp.created_at desc
  limit greatest(1, least(coalesce(p_limit, 500), 1000));
$$;

create or replace function public.get_admin_dashboard_summary()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'generated_at', now(),
    'products_count', (select count(*) from public.products),
    'low_stock_count', (select count(*) from public.products where stock_actuel <= 0),
    'customers_count', (select count(*) from public.customers),
    'today_sales_count', (select count(*) from public.sales where date_vente >= current_date and date_vente < current_date + interval '1 day'),
    'today_sales_total', coalesce((select sum(total_ttc) from public.sales where date_vente >= current_date and date_vente < current_date + interval '1 day'), 0),
    'pending_web_orders_count', (select count(*) from public.web_orders where lower(coalesce(status, '')) in ('nouvelle', 'en attente', 'pending')),
    'pending_fridge_sales_count', (select count(*) from public.fridge_sales where coalesce(statut, 'EN_ATTENTE') = 'EN_ATTENTE')
  );
$$;

\i SUPABASE_MISSING_RPC_PRODUCTS_ADMIN_BUNDLE.sql

grant execute on function public.get_admin_products_light(text, integer, integer) to anon, authenticated;
grant execute on function public.get_admin_customers_light(text, integer, integer) to anon, authenticated;
grant execute on function public.get_admin_fridge_sales_recent(integer) to anon, authenticated;
grant execute on function public.get_admin_customer_payments_recent(integer) to anon, authenticated;
grant execute on function public.get_admin_dashboard_summary() to anon, authenticated;
