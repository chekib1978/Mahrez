create or replace function public.upsert_web_category_seed(
  p_slug text,
  p_name text,
  p_parent_slug text default null,
  p_sort_order integer default 0
)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
  v_parent_id uuid;
begin
  if p_parent_slug is not null and btrim(p_parent_slug) <> '' then
    select id into v_parent_id
    from public.web_categories
    where slug = p_parent_slug;
  else
    v_parent_id := null;
  end if;

  insert into public.web_categories (parent_id, name, slug, sort_order, is_active)
  values (v_parent_id, p_name, p_slug, p_sort_order, true)
  on conflict (slug) do update
    set parent_id = excluded.parent_id,
        name = excluded.name,
        sort_order = excluded.sort_order,
        is_active = true
  returning id into v_id;

  return v_id;
end;
$$;

select public.upsert_web_category_seed('visage', 'Visage', null, 1);
select public.upsert_web_category_seed('corps', 'Corps', null, 2);
select public.upsert_web_category_seed('capillaire', 'Capillaire', null, 3);
select public.upsert_web_category_seed('solaire', 'Solaire', null, 4);
select public.upsert_web_category_seed('bebe-maman', 'Bébé & maman', null, 5);
select public.upsert_web_category_seed('nature-bio', 'Nature & bio', null, 6);
select public.upsert_web_category_seed('complements-alimentaires', 'Compléments alimentaires', null, 7);
select public.upsert_web_category_seed('orthopedie', 'Orthopedie', null, 8);
select public.upsert_web_category_seed('hygiene', 'Hygiène', null, 9);

select public.upsert_web_category_seed('visage-nettoyant-demaquillant', 'Nettoyant & démaquillant', 'visage', 1);
select public.upsert_web_category_seed('visage-soin-anti-age', 'Soin anti-âge', 'visage', 2);
select public.upsert_web_category_seed('visage-hydratation-nutrition', 'Hydratation et nutrition', 'visage', 3);
select public.upsert_web_category_seed('visage-peaux-mixtes-grasses-acne', 'Peaux mixtes, grasses, acné et imperfections', 'visage', 4);
select public.upsert_web_category_seed('visage-peaux-sensibles-rougeurs', 'Peaux sensibles et rougeurs', 'visage', 5);
select public.upsert_web_category_seed('visage-cicatrices', 'Cicatrices', 'visage', 6);
select public.upsert_web_category_seed('visage-anti-tache-depigmentant', 'Anti tache, dépigmentant', 'visage', 7);
select public.upsert_web_category_seed('visage-eclat-du-teint', 'Éclat du teint', 'visage', 8);
select public.upsert_web_category_seed('visage-yeux', 'Yeux', 'visage', 9);
select public.upsert_web_category_seed('visage-levres', 'Lèvres', 'visage', 10);

select public.upsert_web_category_seed('lait-demaquillant', 'Lait démaquillant', 'visage-nettoyant-demaquillant', 1);
select public.upsert_web_category_seed('visage-lotion', 'Lotion', 'visage-nettoyant-demaquillant', 2);
select public.upsert_web_category_seed('gel-lavant', 'Gel lavant', 'visage-nettoyant-demaquillant', 3);
select public.upsert_web_category_seed('eau-micellaire', 'Eau micellaire', 'visage-nettoyant-demaquillant', 4);
select public.upsert_web_category_seed('eaux-thermales', 'Eaux thermales', 'visage-nettoyant-demaquillant', 5);
select public.upsert_web_category_seed('moussant-visage', 'Moussant', 'visage-nettoyant-demaquillant', 6);
select public.upsert_web_category_seed('masque-visage', 'Masque visage', 'visage-nettoyant-demaquillant', 7);
select public.upsert_web_category_seed('gommage-visage', 'Gommage visage', 'visage-nettoyant-demaquillant', 8);
select public.upsert_web_category_seed('pains-nettoyants', 'Pains nettoyants', 'visage-nettoyant-demaquillant', 9);

select public.upsert_web_category_seed('serum-anti-age', 'Sérum anti-âge', 'visage-soin-anti-age', 1);
select public.upsert_web_category_seed('creme-premieres-rides', 'Crème premières rides', 'visage-soin-anti-age', 2);
select public.upsert_web_category_seed('creme-anti-rides-peau-seche', 'Crème anti-rides peau sèche', 'visage-soin-anti-age', 3);
select public.upsert_web_category_seed('creme-anti-rides-peau-grasse', 'Crème anti-rides peau grasse', 'visage-soin-anti-age', 4);
select public.upsert_web_category_seed('soin-liftant', 'Soin liftant', 'visage-soin-anti-age', 5);
select public.upsert_web_category_seed('fermete-peau-mature', 'Fermeté et peau mature', 'visage-soin-anti-age', 6);

select public.upsert_web_category_seed('masque-visage-hydratant', 'Masque visage hydratant', 'visage-hydratation-nutrition', 1);
select public.upsert_web_category_seed('creme-hydratante-peau-normale-mixte', 'Crème hydratante peau normale à mixte', 'visage-hydratation-nutrition', 2);
select public.upsert_web_category_seed('creme-hydratante-peau-seche', 'Crème hydratante pour peau sèche', 'visage-hydratation-nutrition', 3);
select public.upsert_web_category_seed('creme-hydratante-peau-grasse', 'Crème hydratante pour peau grasse', 'visage-hydratation-nutrition', 4);
select public.upsert_web_category_seed('creme-hydratante-peau-sensible', 'Crème hydratante peau sensible', 'visage-hydratation-nutrition', 5);
select public.upsert_web_category_seed('creme-de-nuit', 'Crème de nuit', 'visage-hydratation-nutrition', 6);
select public.upsert_web_category_seed('pains-hydratants', 'Pains hydratants', 'visage-hydratation-nutrition', 7);

select public.upsert_web_category_seed('nettoyant-purifiant', 'Nettoyant & purifiant', 'visage-peaux-mixtes-grasses-acne', 1);
select public.upsert_web_category_seed('lotion-acne', 'Lotion', 'visage-peaux-mixtes-grasses-acne', 2);
select public.upsert_web_category_seed('creme-soin-traitant', 'Crème & soin traitant', 'visage-peaux-mixtes-grasses-acne', 3);
select public.upsert_web_category_seed('traitant-matin-soir', 'Traitant matin et soir', 'visage-peaux-mixtes-grasses-acne', 4);
select public.upsert_web_category_seed('concentre-imperfections', 'Concentré', 'visage-peaux-mixtes-grasses-acne', 5);
select public.upsert_web_category_seed('maquillage-fluide', 'Maquillage et fluide', 'visage-peaux-mixtes-grasses-acne', 6);
select public.upsert_web_category_seed('pains-acne', 'Pains', 'visage-peaux-mixtes-grasses-acne', 7);

select public.upsert_web_category_seed('nettoyant-peaux-sensibles', 'Nettoyant pour peaux sensibles', 'visage-peaux-sensibles-rougeurs', 1);
select public.upsert_web_category_seed('masques-apaisants', 'Masques apaisants', 'visage-peaux-sensibles-rougeurs', 2);
select public.upsert_web_category_seed('lotion-apaisante', 'Lotion apaisante', 'visage-peaux-sensibles-rougeurs', 3);
select public.upsert_web_category_seed('creme-peaux-sensibles', 'Crème peaux sensibles', 'visage-peaux-sensibles-rougeurs', 4);
select public.upsert_web_category_seed('anti-rougeurs', 'Anti-rougeurs', 'visage-peaux-sensibles-rougeurs', 5);

select public.upsert_web_category_seed('creme-cicatrisante', 'Crème cicatrisante', 'visage-cicatrices', 1);

select public.upsert_web_category_seed('anti-tache-serums', 'Sérums', 'visage-anti-tache-depigmentant', 1);
select public.upsert_web_category_seed('cremes-anti-taches', 'Crèmes anti taches', 'visage-anti-tache-depigmentant', 2);
select public.upsert_web_category_seed('ecran-solaire-anti-taches', 'Ecran solaire anti taches', 'visage-anti-tache-depigmentant', 3);
select public.upsert_web_category_seed('pains-unifiants', 'Pains unifiants', 'visage-anti-tache-depigmentant', 4);

select public.upsert_web_category_seed('bb-creme', 'BB crème', 'visage-eclat-du-teint', 1);
select public.upsert_web_category_seed('cc-creme', 'CC crème', 'visage-eclat-du-teint', 2);
select public.upsert_web_category_seed('eclat-du-teint-anti-fatigue', 'Éclat du teint et anti-fatigue', 'visage-eclat-du-teint', 3);

select public.upsert_web_category_seed('yeux-maquillage', 'Maquillage', 'visage-yeux', 1);
select public.upsert_web_category_seed('anti-cernes-anti-poches', 'Anti-cernes & anti-poches', 'visage-yeux', 2);
select public.upsert_web_category_seed('contour-des-yeux', 'Contour des yeux', 'visage-yeux', 3);

select public.upsert_web_category_seed('hydratation-levres', 'Hydratation lèvres', 'visage-levres', 1);
select public.upsert_web_category_seed('stick-solaire-levres', 'Stick solaire lèvres', 'visage-levres', 2);
select public.upsert_web_category_seed('baume-reparateur-levres', 'Baume réparateur', 'visage-levres', 3);

select public.upsert_web_category_seed('corps-soins', 'Soins corps', 'corps', 1);
select public.upsert_web_category_seed('hydratation-corps', 'Hydratation corps', 'corps-soins', 1);
select public.upsert_web_category_seed('gommage-corps', 'Gommage corps', 'corps-soins', 2);
select public.upsert_web_category_seed('mains-pieds', 'Mains & pieds', 'corps-soins', 3);

select public.upsert_web_category_seed('capillaire-cheveux', 'Cheveux', 'capillaire', 1);
select public.upsert_web_category_seed('shampooing', 'Shampooing', 'capillaire-cheveux', 1);
select public.upsert_web_category_seed('apres-shampooing', 'Après-shampooing', 'capillaire-cheveux', 2);
select public.upsert_web_category_seed('masque-cheveux', 'Masque cheveux', 'capillaire-cheveux', 3);

select public.upsert_web_category_seed('solaire-protection', 'Protection solaire', 'solaire', 1);
select public.upsert_web_category_seed('visage-spf', 'Visage SPF', 'solaire-protection', 1);
select public.upsert_web_category_seed('corps-spf', 'Corps SPF', 'solaire-protection', 2);
select public.upsert_web_category_seed('apres-soleil', 'Après soleil', 'solaire-protection', 3);

select public.upsert_web_category_seed('bebe-maman-selection', 'Maternité & bébé', 'bebe-maman', 1);
select public.upsert_web_category_seed('toilette-bebe', 'Toilette bébé', 'bebe-maman-selection', 1);
select public.upsert_web_category_seed('cremes-change', 'Crèmes change', 'bebe-maman-selection', 2);
select public.upsert_web_category_seed('grossesse-maternite', 'Grossesse & maternité', 'bebe-maman-selection', 3);

select public.upsert_web_category_seed('nature-bio-selection', 'Naturel', 'nature-bio', 1);
select public.upsert_web_category_seed('huiles-naturelles', 'Huiles', 'nature-bio-selection', 1);
select public.upsert_web_category_seed('plantes', 'Plantes', 'nature-bio-selection', 2);
select public.upsert_web_category_seed('soins-bio', 'Soins bio', 'nature-bio-selection', 3);

select public.upsert_web_category_seed('complements-selection', 'Compléments', 'complements-alimentaires', 1);
select public.upsert_web_category_seed('vitamines', 'Vitamines', 'complements-selection', 1);
select public.upsert_web_category_seed('minceur', 'Minceur', 'complements-selection', 2);
select public.upsert_web_category_seed('immunite', 'Immunité', 'complements-selection', 3);

select public.upsert_web_category_seed('orthopedie-maintien-posture', 'Maintien & posture', 'orthopedie', 1);
select public.upsert_web_category_seed('ceintures-lombaires', 'Ceintures lombaires', 'orthopedie-maintien-posture', 1);
select public.upsert_web_category_seed('genouilleres', 'Genouilleres', 'orthopedie-maintien-posture', 2);
select public.upsert_web_category_seed('chevillieres', 'Chevillieres', 'orthopedie-maintien-posture', 3);

select public.upsert_web_category_seed('orthopedie-mobilite-confort', 'Mobilite & confort', 'orthopedie', 2);
select public.upsert_web_category_seed('attelles', 'Attelles', 'orthopedie-mobilite-confort', 1);
select public.upsert_web_category_seed('bas-contention', 'Bas de contention', 'orthopedie-mobilite-confort', 2);
select public.upsert_web_category_seed('poignets-coudieres', 'Poignets & coudieres', 'orthopedie-mobilite-confort', 3);

select public.upsert_web_category_seed('orthopedie-podologie', 'Podologie', 'orthopedie', 3);
select public.upsert_web_category_seed('semelles', 'Semelles', 'orthopedie-podologie', 1);
select public.upsert_web_category_seed('talonnieres', 'Talonnieres', 'orthopedie-podologie', 2);
select public.upsert_web_category_seed('correcteurs-orteils', 'Correcteurs d orteils', 'orthopedie-podologie', 3);

select public.upsert_web_category_seed('hygiene-selection', 'Hygiène quotidienne', 'hygiene', 1);
select public.upsert_web_category_seed('gel-douche', 'Gel douche', 'hygiene-selection', 1);
select public.upsert_web_category_seed('hygiene-bucco-dentaire', 'Hygiène bucco-dentaire', 'hygiene-selection', 2);
select public.upsert_web_category_seed('hygiene-intime', 'Intime', 'hygiene-selection', 3);

update public.web_categories
set is_active = false
where slug in ('homme', 'homme-selection', 'rasage', 'barbe', 'soins-homme');

drop function if exists public.upsert_web_category_seed(text, text, text, integer);
