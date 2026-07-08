-- Corrige les anciennes commandes web touchees par une double application
-- de la remise web. Le script :
-- 1. repere les lignes dont unit_price correspond au prix web re-remise
-- 2. remet unit_price au vrai prix_vente_web_ttc
-- 3. recalcule total_ttc dans web_orders

with suspect_lines as (
  select
    woi.id,
    woi.order_id,
    woi.product_id,
    woi.quantity,
    woi.unit_price as old_unit_price,
    p.prix_vente_ttc,
    p.prix_vente_web_ttc,
    p.remise_web_pct,
    round((p.prix_vente_web_ttc * (1 - (coalesce(p.remise_web_pct, 0) / 100.0)))::numeric, 3) as bugged_unit_price,
    round(coalesce(p.prix_vente_web_ttc, 0)::numeric, 3) as correct_unit_price
  from public.web_order_items woi
  join public.products p on p.id = woi.product_id
  where coalesce(p.prix_vente_web_ttc, 0) > 0
    and coalesce(p.remise_web_pct, 0) > 0
    and abs(coalesce(woi.unit_price, 0) - round((p.prix_vente_web_ttc * (1 - (coalesce(p.remise_web_pct, 0) / 100.0)))::numeric, 3)) <= 0.001
    and abs(coalesce(woi.unit_price, 0) - round(coalesce(p.prix_vente_web_ttc, 0)::numeric, 3)) > 0.001
),
updated_lines as (
  update public.web_order_items woi
  set unit_price = sl.correct_unit_price
  from suspect_lines sl
  where woi.id = sl.id
  returning woi.order_id
),
orders_to_refresh as (
  select distinct order_id from updated_lines
)
update public.web_orders wo
set total_ttc = totals.total_ttc
from (
  select
    woi.order_id,
    round(sum(coalesce(woi.quantity, 0) * coalesce(woi.unit_price, 0))::numeric, 3) as total_ttc
  from public.web_order_items woi
  where woi.order_id in (select order_id from orders_to_refresh)
  group by woi.order_id
) totals
where wo.id = totals.order_id;

-- Controle apres correction :
-- select
--   wo.order_number,
--   woi.quantity,
--   woi.unit_price,
--   p.prix_vente_web_ttc,
--   p.remise_web_pct,
--   wo.total_ttc
-- from public.web_orders wo
-- join public.web_order_items woi on woi.order_id = wo.id
-- join public.products p on p.id = woi.product_id
-- order by wo.created_at desc;
