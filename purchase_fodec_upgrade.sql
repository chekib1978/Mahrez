alter table public.products
  add column if not exists fodec_pct numeric(15,3) not null default 0;

alter table public.products
  alter column fodec_pct set default 0;

alter table public.products
  add column if not exists is_web_hidden boolean not null default false;

alter table public.purchases
  add column if not exists total_fodec numeric(15,3) not null default 0;

alter table public.purchase_items
  add column if not exists fodec_pct numeric(15,3) not null default 1;
