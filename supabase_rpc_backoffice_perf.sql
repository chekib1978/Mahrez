-- RPC de performance pour accelerer le chargement du backoffice
-- Phase test / optimisation
-- A executer dans Supabase SQL Editor

alter table public.customers add column if not exists nom_malade text;

create extension if not exists pgcrypto;

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

alter table public.mutuelle_bordereaux add column if not exists statut text default 'BROUILLON';

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

create index if not exists idx_mutuelle_bordereaux_mutuelle_date
  on public.mutuelle_bordereaux(mutuelle_id, date_debut, date_fin);

create index if not exists idx_mutuelle_bordereau_lignes_bordereau
  on public.mutuelle_bordereau_lignes(bordereau_id, ordre);

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
  updated_at timestamptz not null default now(),
  constraint company_settings_singleton check (id = 1)
);

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

grant select, insert, update, delete on table public.company_settings to anon, authenticated;
grant select, insert, update, delete on table public.backoffice_users to anon, authenticated;

alter table public.company_settings enable row level security;
alter table public.backoffice_users enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'company_settings'
      and policyname = 'company_settings_select_all'
  ) then
    create policy company_settings_select_all
      on public.company_settings
      for select
      to anon, authenticated
      using (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'backoffice_users'
      and policyname = 'backoffice_users_select_all'
  ) then
    create policy backoffice_users_select_all
      on public.backoffice_users
      for select
      to anon, authenticated
      using (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'backoffice_users'
      and policyname = 'backoffice_users_insert_all'
  ) then
    create policy backoffice_users_insert_all
      on public.backoffice_users
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
      and tablename = 'backoffice_users'
      and policyname = 'backoffice_users_update_all'
  ) then
    create policy backoffice_users_update_all
      on public.backoffice_users
      for update
      to anon, authenticated
      using (true)
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
      and tablename = 'backoffice_users'
      and policyname = 'backoffice_users_delete_all'
  ) then
    create policy backoffice_users_delete_all
      on public.backoffice_users
      for delete
      to anon, authenticated
      using (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'company_settings'
      and policyname = 'company_settings_insert_all'
  ) then
    create policy company_settings_insert_all
      on public.company_settings
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
      and tablename = 'company_settings'
      and policyname = 'company_settings_update_all'
  ) then
    create policy company_settings_update_all
      on public.company_settings
      for update
      to anon, authenticated
      using (true)
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
      and tablename = 'company_settings'
      and policyname = 'company_settings_delete_all'
  ) then
    create policy company_settings_delete_all
      on public.company_settings
      for delete
      to anon, authenticated
      using (true);
  end if;
end
$$;

grant select, insert, update, delete on table public.mutuelle_bordereaux to anon, authenticated;
grant select, insert, update, delete on table public.mutuelle_bordereau_lignes to anon, authenticated;

alter table public.mutuelle_bordereaux enable row level security;
alter table public.mutuelle_bordereau_lignes enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'mutuelle_bordereaux'
      and policyname = 'mutuelle_bordereaux_select_all'
  ) then
    create policy mutuelle_bordereaux_select_all
      on public.mutuelle_bordereaux
      for select
      to anon, authenticated
      using (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'mutuelle_bordereaux'
      and policyname = 'mutuelle_bordereaux_insert_all'
  ) then
    create policy mutuelle_bordereaux_insert_all
      on public.mutuelle_bordereaux
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
      and tablename = 'mutuelle_bordereaux'
      and policyname = 'mutuelle_bordereaux_update_all'
  ) then
    create policy mutuelle_bordereaux_update_all
      on public.mutuelle_bordereaux
      for update
      to anon, authenticated
      using (true)
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
      and tablename = 'mutuelle_bordereaux'
      and policyname = 'mutuelle_bordereaux_delete_all'
  ) then
    create policy mutuelle_bordereaux_delete_all
      on public.mutuelle_bordereaux
      for delete
      to anon, authenticated
      using (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'mutuelle_bordereau_lignes'
      and policyname = 'mutuelle_bordereau_lignes_select_all'
  ) then
    create policy mutuelle_bordereau_lignes_select_all
      on public.mutuelle_bordereau_lignes
      for select
      to anon, authenticated
      using (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'mutuelle_bordereau_lignes'
      and policyname = 'mutuelle_bordereau_lignes_insert_all'
  ) then
    create policy mutuelle_bordereau_lignes_insert_all
      on public.mutuelle_bordereau_lignes
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
      and tablename = 'mutuelle_bordereau_lignes'
      and policyname = 'mutuelle_bordereau_lignes_update_all'
  ) then
    create policy mutuelle_bordereau_lignes_update_all
      on public.mutuelle_bordereau_lignes
      for update
      to anon, authenticated
      using (true)
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
      and tablename = 'mutuelle_bordereau_lignes'
      and policyname = 'mutuelle_bordereau_lignes_delete_all'
  ) then
    create policy mutuelle_bordereau_lignes_delete_all
      on public.mutuelle_bordereau_lignes
      for delete
      to anon, authenticated
      using (true);
  end if;
end
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
    coalesce(
      (
        select jsonb_agg(row_to_json(p) order by p.designation asc)
        from (
          select *
          from public.products
        ) p
      ),
      '[]'::jsonb
    ),
    'customers',
    coalesce(
      (
        select jsonb_agg(row_to_json(c) order by c.nom asc)
        from (
          select
            c.*,
            case
              when m.id is null then null
              else jsonb_build_object('nom', m.nom)
            end as mutuelles
          from public.customers c
          left join public.mutuelles m on m.id = c.mutuelle_id
        ) c
      ),
      '[]'::jsonb
    ),
    'mutuelles',
    coalesce(
      (
        select jsonb_agg(row_to_json(m) order by m.nom asc)
        from (
          select *
          from public.mutuelles
        ) m
      ),
      '[]'::jsonb
    )
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
            case
              when m.id is null then null
              else jsonb_build_object('nom', m.nom)
            end as mutuelles
          from public.customers c
          left join public.mutuelles m on m.id = c.mutuelle_id
        ) c
      ),
      '[]'::jsonb
    )
  );
$$;

-- Suppression des anciennes signatures sans parametres pour eviter conflits de surcharge
drop function if exists public.get_sales_reports_bundle();
drop function if exists public.get_purchases_reports_bundle();

-- ----------------------------------------------------------------
-- get_sales_reports_bundle avec filtrage par date et/ou par ID
-- p_start_date / p_end_date : plage de dates (optionnel)
-- p_sale_id                 : recuperer une seule vente (optionnel)
-- Sans parametres : retourne les 30 derniers jours par defaut
-- ----------------------------------------------------------------
create or replace function public.get_sales_reports_bundle(
  p_start_date date default null,
  p_end_date   date default null,
  p_sale_id    uuid default null
)
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
              else jsonb_build_object(
                'nom', c.nom,
                'numero_matricule_mutuelle', c.numero_matricule_mutuelle,
                'nom_malade', c.nom_malade
              )
            end as customers,
            case
              when m.id is null then null
              else jsonb_build_object(
                'nom', m.nom,
                'taux_remboursement', m.taux_remboursement
              )
            end as mutuelles
          from public.sales sale
          left join public.customers c on c.id = sale.client_id
          left join public.mutuelles m on m.id = sale.mutuelle_id
          where
            (p_sale_id is not null and sale.id = p_sale_id)
            or (
              p_sale_id is null
              and sale.date_vente::date >= coalesce(p_start_date, current_date - interval '30 days')
              and sale.date_vente::date <= coalesce(p_end_date, current_date)
            )
          order by sale.date_vente desc
        ) s
      ),
      '[]'::jsonb
    ),
    'sale_items',
    coalesce(
      (
        select jsonb_agg(row_to_json(si) order by si.sale_id)
        from (
          select si.*
          from public.sale_items si
          join public.sales sale on sale.id = si.sale_id
          where
            (p_sale_id is not null and sale.id = p_sale_id)
            or (
              p_sale_id is null
              and sale.date_vente::date >= coalesce(p_start_date, current_date - interval '30 days')
              and sale.date_vente::date <= coalesce(p_end_date, current_date)
            )
          order by si.sale_id
        ) si
      ),
      '[]'::jsonb
    ),
    'products',
    coalesce(
      (
        select jsonb_agg(row_to_json(p) order by p.designation asc)
        from (
          select id, code_article, designation, tva, forme, prix_vente_ttc
          from public.products
          order by designation asc
        ) p
      ),
      '[]'::jsonb
    ),
    'web_orders',
    coalesce(
      (
        select jsonb_agg(row_to_json(o) order by o.created_at desc)
        from (
          select *
          from public.web_orders o
          where
            p_sale_id is null
            and o.created_at::date >= coalesce(p_start_date, current_date - interval '30 days')
            and o.created_at::date <= coalesce(p_end_date, current_date)
          order by created_at desc
        ) o
      ),
      '[]'::jsonb
    ),
    'web_order_items',
    coalesce(
      (
        select jsonb_agg(row_to_json(woi) order by woi.order_id)
        from (
          select woi.*
          from public.web_order_items woi
          join public.web_orders o on o.id = woi.order_id
          where
            p_sale_id is null
            and o.created_at::date >= coalesce(p_start_date, current_date - interval '30 days')
            and o.created_at::date <= coalesce(p_end_date, current_date)
          order by woi.order_id
        ) woi
      ),
      '[]'::jsonb
    )
  );
$$;

-- ----------------------------------------------------------------
-- get_purchases_reports_bundle avec filtrage par date et/ou par ID
-- ----------------------------------------------------------------
create or replace function public.get_purchases_reports_bundle(
  p_start_date  date default null,
  p_end_date    date default null,
  p_purchase_id uuid default null
)
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
            case
              when s.id is null then null
              else jsonb_build_object('nom', s.nom)
            end as suppliers
          from public.purchases purchase
          left join public.suppliers s on s.id = purchase.supplier_id
          where
            (p_purchase_id is not null and purchase.id = p_purchase_id)
            or (
              p_purchase_id is null
              and purchase.date_achat::date >= coalesce(p_start_date, current_date - interval '30 days')
              and purchase.date_achat::date <= coalesce(p_end_date, current_date)
            )
          order by purchase.date_achat desc
        ) pu
      ),
      '[]'::jsonb
    ),
    'purchase_items',
    coalesce(
      (
        select jsonb_agg(row_to_json(pi) order by pi.purchase_id)
        from (
          select pi.*
          from public.purchase_items pi
          join public.purchases purchase on purchase.id = pi.purchase_id
          where
            (p_purchase_id is not null and purchase.id = p_purchase_id)
            or (
              p_purchase_id is null
              and purchase.date_achat::date >= coalesce(p_start_date, current_date - interval '30 days')
              and purchase.date_achat::date <= coalesce(p_end_date, current_date)
            )
          order by pi.purchase_id
        ) pi
      ),
      '[]'::jsonb
    ),
    'products',
    coalesce(
      (
        select jsonb_agg(row_to_json(p) order by p.designation asc)
        from (
          select id, code_article, designation, forme, prix_vente_ttc, tva
          from public.products
          order by designation asc
        ) p
      ),
      '[]'::jsonb
    ),
    'suppliers',
    coalesce(
      (
        select jsonb_agg(row_to_json(s) order by s.nom asc)
        from (
          select *
          from public.suppliers
          order by nom asc
        ) s
      ),
      '[]'::jsonb
    )
  );
$$;

grant execute on function public.get_products_admin_bundle(integer, integer) to anon, authenticated;
grant execute on function public.get_sale_entry_bundle() to anon, authenticated;
grant execute on function public.get_customers_management_bundle() to anon, authenticated;
grant execute on function public.get_sales_reports_bundle(date, date, uuid) to anon, authenticated;
grant execute on function public.get_purchases_reports_bundle(date, date, uuid) to anon, authenticated;
