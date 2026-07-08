-- Smoke tests for Supabase RPC optimizations
-- Run in Supabase SQL Editor after installing the RPC scripts.
-- Read-only tests only.

select 'get_admin_products_light' as rpc, count(*) as rows_returned
from public.get_admin_products_light('', 5, 0);

select 'get_admin_customers_light' as rpc, count(*) as rows_returned
from public.get_admin_customers_light('', 5, 0);

select 'get_admin_fridge_sales_recent' as rpc, count(*) as rows_returned
from public.get_admin_fridge_sales_recent(5);

select 'get_admin_customer_payments_recent' as rpc, count(*) as rows_returned
from public.get_admin_customer_payments_recent(5);

select 'get_admin_dashboard_summary' as rpc,
       public.get_admin_dashboard_summary() as result;

select 'get_products_admin_bundle' as rpc,
       public.get_products_admin_bundle('', 5, 0, 1, 5, '', true, 'designation', 'asc') as result;

-- One compact status table. If this runs without error, all RPCs are callable.
select * from (
  select 'get_admin_products_light' as rpc, 'OK' as status, count(*)::text as detail
  from public.get_admin_products_light('', 5, 0)
  union all
  select 'get_admin_customers_light', 'OK', count(*)::text
  from public.get_admin_customers_light('', 5, 0)
  union all
  select 'get_admin_fridge_sales_recent', 'OK', count(*)::text
  from public.get_admin_fridge_sales_recent(5)
  union all
  select 'get_admin_customer_payments_recent', 'OK', count(*)::text
  from public.get_admin_customer_payments_recent(5)
  union all
  select 'get_admin_dashboard_summary', 'OK', jsonb_typeof(public.get_admin_dashboard_summary())
  union all
  select 'get_products_admin_bundle', 'OK', jsonb_typeof(public.get_products_admin_bundle('', 5, 0, 1, 5, '', true, 'designation', 'asc'))
) rpc_tests;
