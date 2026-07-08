-- Modules stock: Pret / Emprunt / Entree / Sortie
-- Ce script ajoute une vraie table d'historique partagee entre postes.
-- Il ne remplace pas la logique existante et n'efface rien.

create extension if not exists pgcrypto;

create table if not exists public.stock_operations (
    id uuid primary key default gen_random_uuid(),
    operation_number text not null unique,
    module_id text not null,
    movement_type text not null,
    product_id uuid null references public.products(id) on delete set null,
    product_code text null,
    product_designation text null,
    partner_name text null,
    note text null,
    quantity numeric(15, 3) not null default 0,
    stock_effect numeric(15, 3) not null default 0,
    operation_date date not null default current_date,
    created_at timestamptz not null default now(),
    created_by text null,
    constraint stock_operations_module_check check (
        module_id in ('stock_pret', 'stock_emprunt', 'stock_entree', 'stock_sortie')
    ),
    constraint stock_operations_type_check check (
        movement_type in ('PRET', 'EMPRUNT', 'ENTREE', 'SORTIE')
    )
);

alter table public.stock_operations
    add column if not exists operation_number text,
    add column if not exists module_id text,
    add column if not exists movement_type text,
    add column if not exists product_id uuid,
    add column if not exists product_code text,
    add column if not exists product_designation text,
    add column if not exists partner_name text,
    add column if not exists note text,
    add column if not exists quantity numeric(15, 3) not null default 0,
    add column if not exists stock_effect numeric(15, 3) not null default 0,
    add column if not exists operation_date date not null default current_date,
    add column if not exists created_at timestamptz not null default now(),
    add column if not exists created_by text;

create unique index if not exists stock_operations_operation_number_idx
    on public.stock_operations(operation_number);

create index if not exists stock_operations_module_date_idx
    on public.stock_operations(module_id, operation_date desc, created_at desc);

create index if not exists stock_operations_product_date_idx
    on public.stock_operations(product_id, operation_date desc, created_at desc);

create index if not exists stock_operations_type_date_idx
    on public.stock_operations(movement_type, operation_date desc, created_at desc);

comment on table public.stock_operations is 'Historique des mouvements de stock Pret, Emprunt, Entree et Sortie.';
comment on column public.stock_operations.stock_effect is 'Impact sur le stock: negatif pour Pret/Sortie, positif pour Emprunt/Entree.';

alter table public.stock_operations enable row level security;

do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'stock_operations'
          and policyname = 'Allow all stock operations'
    ) then
        create policy "Allow all stock operations"
        on public.stock_operations
        for all
        using (true)
        with check (true);
    end if;
end $$;

grant all on public.stock_operations to anon;
grant all on public.stock_operations to authenticated;
grant all on public.stock_operations to service_role;
