-- Missing RPC used by app.js: get_products_admin_bundle
-- Run in Supabase SQL Editor.
-- Read-only: no insert/update/delete, no stock or sales logic touched.

create or replace function public.get_products_admin_bundle(
  p_search text default '',
  p_limit integer default 200,
  p_offset integer default 0,
  p_page integer default 1,
  p_page_size integer default 200,
  p_category_slug text default '',
  p_include_hidden boolean default true,
  p_sort_by text default 'designation',
  p_sort_dir text default 'asc'
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, p_page_size, 200), 500));
  v_offset integer := greatest(coalesce(p_offset, (greatest(coalesce(p_page, 1), 1) - 1) * coalesce(p_page_size, p_limit, 200), 0), 0);
  v_search text := coalesce(trim(p_search), '');
  v_category text := coalesce(trim(p_category_slug), '');
  v_sort_by text := lower(coalesce(nullif(trim(p_sort_by), ''), 'designation'));
  v_sort_dir text := lower(coalesce(nullif(trim(p_sort_dir), ''), 'asc'));
  v_total integer := 0;
  v_rows jsonb := '[]'::jsonb;
begin
  if v_sort_by not in ('designation', 'code_article', 'stock_actuel', 'prix_vente_ttc', 'updated_at') then
    v_sort_by := 'designation';
  end if;

  if v_sort_dir not in ('asc', 'desc') then
    v_sort_dir := 'asc';
  end if;

  with filtered as (
    select
      p.id,
      p.code_article,
      p.code_barre,
      p.designation,
      p.forme,
      p.stock_actuel,
      p.prix_vente_ttc,
      p.prix_vente_web_ttc,
      p.prix_vente_passager_ttc,
      p.tva,
      p.prix_achat_ht,
      p.peremption,
      p.code_pct,
      p.image_url,
      p.description_web,
      p.product_brand,
      p.web_category_slug,
      p.is_web_hidden,
      p.old_price_ttc,
      p.promo_badge,
      p.updated_at
    from public.products p
    where (p_include_hidden or coalesce(p.is_web_hidden, false) = false)
      and (v_category = '' or coalesce(p.web_category_slug, '') = v_category)
      and (
        v_search = ''
        or p.designation ilike '%' || v_search || '%'
        or p.code_article ilike '%' || v_search || '%'
        or coalesce(p.code_barre, '') ilike '%' || v_search || '%'
        or coalesce(p.product_brand, '') ilike '%' || v_search || '%'
      )
  ), counted as (
    select count(*)::integer as total from filtered
  ), paged as (
    select *
    from filtered
    order by
      case when v_sort_by = 'designation' and v_sort_dir = 'asc' then designation end asc,
      case when v_sort_by = 'designation' and v_sort_dir = 'desc' then designation end desc,
      case when v_sort_by = 'code_article' and v_sort_dir = 'asc' then code_article end asc,
      case when v_sort_by = 'code_article' and v_sort_dir = 'desc' then code_article end desc,
      case when v_sort_by = 'stock_actuel' and v_sort_dir = 'asc' then stock_actuel end asc,
      case when v_sort_by = 'stock_actuel' and v_sort_dir = 'desc' then stock_actuel end desc,
      case when v_sort_by = 'prix_vente_ttc' and v_sort_dir = 'asc' then prix_vente_ttc end asc,
      case when v_sort_by = 'prix_vente_ttc' and v_sort_dir = 'desc' then prix_vente_ttc end desc,
      case when v_sort_by = 'updated_at' and v_sort_dir = 'asc' then updated_at end asc,
      case when v_sort_by = 'updated_at' and v_sort_dir = 'desc' then updated_at end desc,
      designation asc
    limit v_limit
    offset v_offset
  )
  select
    (select total from counted),
    coalesce(jsonb_agg(to_jsonb(paged)), '[]'::jsonb)
  into v_total, v_rows
  from paged;

  return jsonb_build_object(
    'products', v_rows,
    'rows', v_rows,
    'items', v_rows,
    'data', v_rows,
    'total', coalesce(v_total, 0),
    'count', coalesce(v_total, 0),
    'limit', v_limit,
    'offset', v_offset,
    'page', greatest(coalesce(p_page, floor(v_offset::numeric / nullif(v_limit, 0))::integer + 1), 1),
    'pageSize', v_limit,
    'hasMore', (v_offset + v_limit) < coalesce(v_total, 0)
  );
end;
$$;

grant execute on function public.get_products_admin_bundle(text, integer, integer, integer, integer, text, boolean, text, text) to anon, authenticated;

-- Quick test:
-- select public.get_products_admin_bundle('', 5, 0, 1, 5, '', true, 'designation', 'asc');
