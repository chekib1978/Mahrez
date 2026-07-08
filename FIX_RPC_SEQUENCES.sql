-- =============================================================
-- FIX: Créer les RPC de numérotation + synchroniser les
--      séquences avec les données importées
-- =============================================================
-- Exécuter DANS LE Supabase SQL Editor
-- =============================================================

-- 1) Créer les fonctions RPC de numérotation
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
  select ds.last_value into current_value
  from public.document_sequences ds
  where ds.prefix = normalized_prefix;
  current_value := coalesce(current_value, 0) + 1;
  return normalized_prefix || '-' || lpad(current_value::text, 6, '0');
end;
$$;

-- 2) Synchroniser les séquences avec les données existantes
insert into public.document_sequences (prefix, last_value)
select 'VTE', coalesce(max((regexp_match(numero_vente, 'VTE-0*(\d+)'))[1]::int), 0)
from public.sales where numero_vente ~ '^VTE-\d+$'
on conflict (prefix) do update
set last_value = greatest(document_sequences.last_value, excluded.last_value);

insert into public.document_sequences (prefix, last_value)
select 'ACH', coalesce(max((regexp_match(numero_achat, 'ACH-0*(\d+)'))[1]::int), 0)
from public.purchases where numero_achat ~ '^ACH-\d+$'
on conflict (prefix) do update
set last_value = greatest(document_sequences.last_value, excluded.last_value);

insert into public.document_sequences (prefix, last_value)
select 'FAC', coalesce(max((regexp_match(numero_facture, 'FAC-0*(\d+)'))[1]::int), 0)
from public.sales where numero_facture ~ '^FAC-\d+$'
on conflict (prefix) do update
set last_value = greatest(document_sequences.last_value, excluded.last_value);

insert into public.document_sequences (prefix, last_value)
select 'BL', coalesce(max((regexp_match(numero_bl, 'BL-0*(\d+)'))[1]::int), 0)
from public.sales where numero_bl ~ '^BL-\d+$'
on conflict (prefix) do update
set last_value = greatest(document_sequences.last_value, excluded.last_value);

-- Initialiser les autres préfixes à 0 s'ils n'existent pas
insert into public.document_sequences (prefix, last_value)
values ('DEV', 0), ('WEB', 0), ('ENT', 0), ('SOR', 0)
on conflict (prefix) do nothing;
