alter table public.products
  alter column fodec_pct set default 0;

update public.products
set fodec_pct = 0
where coalesce(fodec_pct, 0) <> 0;
