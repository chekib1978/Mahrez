-- ============================================================================
-- SEED CATEGORIES WEB - PHARMACIE MAHREZ KAMMOUN
-- ============================================================================
-- Ce script remplit la table web_categories avec toutes les categories
-- du site e-commerce
-- A executer APRES le script SUPABASE_SCHEMA_COMPLET.sql
-- ============================================================================

-- Fonction utilitaire pour inserer ou mettre a jour les categories
CREATE OR REPLACE FUNCTION public.upsert_web_category_seed(
  p_slug TEXT,
  p_name TEXT,
  p_parent_slug TEXT DEFAULT NULL,
  p_sort_order INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_id UUID;
  v_parent_id UUID;
BEGIN
  IF p_parent_slug IS NOT NULL AND BTRIM(p_parent_slug) <> '' THEN
    SELECT id INTO v_parent_id
    FROM public.web_categories
    WHERE slug = p_parent_slug;
  ELSE
    v_parent_id := NULL;
  END IF;

  INSERT INTO public.web_categories (parent_id, name, slug, sort_order, is_active)
  VALUES (v_parent_id, p_name, p_slug, p_sort_order, TRUE)
  ON CONFLICT (slug) DO UPDATE
    SET parent_id = EXCLUDED.parent_id,
        name = EXCLUDED.name,
        sort_order = EXCLUDED.sort_order,
        is_active = TRUE
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ============================================================================
-- CATEGORIES PRINCIPALES (Niveau 1)
-- ============================================================================
SELECT public.upsert_web_category_seed('visage', 'Visage', NULL, 1);
SELECT public.upsert_web_category_seed('corps', 'Corps', NULL, 2);
SELECT public.upsert_web_category_seed('capillaire', 'Capillaire', NULL, 3);
SELECT public.upsert_web_category_seed('solaire', 'Solaire', NULL, 4);
SELECT public.upsert_web_category_seed('bebe-maman', 'Bébé & maman', NULL, 5);
SELECT public.upsert_web_category_seed('nature-bio', 'Nature & bio', NULL, 6);
SELECT public.upsert_web_category_seed('complements-alimentaires', 'Compléments alimentaires', NULL, 7);
SELECT public.upsert_web_category_seed('orthopedie', 'Orthopedie', NULL, 8);
SELECT public.upsert_web_category_seed('hygiene', 'Hygiène', NULL, 9);

-- ============================================================================
-- VISAGE - Sous-categories Niveau 2
-- ============================================================================
SELECT public.upsert_web_category_seed('visage-nettoyant-demaquillant', 'Nettoyant & démaquillant', 'visage', 1);
SELECT public.upsert_web_category_seed('visage-soin-anti-age', 'Soin anti-âge', 'visage', 2);
SELECT public.upsert_web_category_seed('visage-hydratation-nutrition', 'Hydratation et nutrition', 'visage', 3);
SELECT public.upsert_web_category_seed('visage-peaux-mixtes-grasses-acne', 'Peaux mixtes, grasses, acné et imperfections', 'visage', 4);
SELECT public.upsert_web_category_seed('visage-peaux-sensibles-rougeurs', 'Peaux sensibles et rougeurs', 'visage', 5);
SELECT public.upsert_web_category_seed('visage-cicatrices', 'Cicatrices', 'visage', 6);
SELECT public.upsert_web_category_seed('visage-anti-tache-depigmentant', 'Anti tache, dépigmentant', 'visage', 7);
SELECT public.upsert_web_category_seed('visage-eclat-du-teint', 'Éclat du teint', 'visage', 8);
SELECT public.upsert_web_category_seed('visage-yeux', 'Yeux', 'visage', 9);
SELECT public.upsert_web_category_seed('visage-levres', 'Lèvres', 'visage', 10);

-- ============================================================================
-- VISAGE - Nettoyant & demaquillant (Niveau 3)
-- ============================================================================
SELECT public.upsert_web_category_seed('lait-demaquillant', 'Lait démaquillant', 'visage-nettoyant-demaquillant', 1);
SELECT public.upsert_web_category_seed('visage-lotion', 'Lotion', 'visage-nettoyant-demaquillant', 2);
SELECT public.upsert_web_category_seed('gel-lavant', 'Gel lavant', 'visage-nettoyant-demaquillant', 3);
SELECT public.upsert_web_category_seed('eau-micellaire', 'Eau micellaire', 'visage-nettoyant-demaquillant', 4);
SELECT public.upsert_web_category_seed('eaux-thermales', 'Eaux thermales', 'visage-nettoyant-demaquillant', 5);
SELECT public.upsert_web_category_seed('moussant-visage', 'Moussant', 'visage-nettoyant-demaquillant', 6);
SELECT public.upsert_web_category_seed('masque-visage', 'Masque visage', 'visage-nettoyant-demaquillant', 7);
SELECT public.upsert_web_category_seed('gommage-visage', 'Gommage visage', 'visage-nettoyant-demaquillant', 8);
SELECT public.upsert_web_category_seed('pains-nettoyants', 'Pains nettoyants', 'visage-nettoyant-demaquillant', 9);

-- ============================================================================
-- VISAGE - Soin anti-age (Niveau 3)
-- ============================================================================
SELECT public.upsert_web_category_seed('serum-anti-age', 'Sérum anti-âge', 'visage-soin-anti-age', 1);
SELECT public.upsert_web_category_seed('creme-premieres-rides', 'Crème premières rides', 'visage-soin-anti-age', 2);
SELECT public.upsert_web_category_seed('creme-anti-rides-peau-seche', 'Crème anti-rides peau sèche', 'visage-soin-anti-age', 3);
SELECT public.upsert_web_category_seed('creme-anti-rides-peau-grasse', 'Crème anti-rides peau grasse', 'visage-soin-anti-age', 4);
SELECT public.upsert_web_category_seed('soin-liftant', 'Soin liftant', 'visage-soin-anti-age', 5);
SELECT public.upsert_web_category_seed('fermete-peau-mature', 'Fermeté et peau mature', 'visage-soin-anti-age', 6);

-- ============================================================================
-- VISAGE - Hydratation et nutrition (Niveau 3)
-- ============================================================================
SELECT public.upsert_web_category_seed('masque-visage-hydratant', 'Masque visage hydratant', 'visage-hydratation-nutrition', 1);
SELECT public.upsert_web_category_seed('creme-hydratante-peau-normale-mixte', 'Crème hydratante peau normale à mixte', 'visage-hydratation-nutrition', 2);
SELECT public.upsert_web_category_seed('creme-hydratante-peau-seche', 'Crème hydratante pour peau sèche', 'visage-hydratation-nutrition', 3);
SELECT public.upsert_web_category_seed('creme-hydratante-peau-grasse', 'Crème hydratante pour peau grasse', 'visage-hydratation-nutrition', 4);
SELECT public.upsert_web_category_seed('creme-hydratante-peau-sensible', 'Crème hydratante peau sensible', 'visage-hydratation-nutrition', 5);
SELECT public.upsert_web_category_seed('creme-de-nuit', 'Crème de nuit', 'visage-hydratation-nutrition', 6);
SELECT public.upsert_web_category_seed('pains-hydratants', 'Pains hydratants', 'visage-hydratation-nutrition', 7);

-- ============================================================================
-- VISAGE - Peaux mixtes, grasses, acne (Niveau 3)
-- ============================================================================
SELECT public.upsert_web_category_seed('nettoyant-purifiant', 'Nettoyant & purifiant', 'visage-peaux-mixtes-grasses-acne', 1);
SELECT public.upsert_web_category_seed('lotion-acne', 'Lotion', 'visage-peaux-mixtes-grasses-acne', 2);
SELECT public.upsert_web_category_seed('creme-soin-traitant', 'Crème & soin traitant', 'visage-peaux-mixtes-grasses-acne', 3);
SELECT public.upsert_web_category_seed('traitant-matin-soir', 'Traitant matin et soir', 'visage-peaux-mixtes-grasses-acne', 4);
SELECT public.upsert_web_category_seed('concentre-imperfections', 'Concentré', 'visage-peaux-mixtes-grasses-acne', 5);
SELECT public.upsert_web_category_seed('maquillage-fluide', 'Maquillage et fluide', 'visage-peaux-mixtes-grasses-acne', 6);
SELECT public.upsert_web_category_seed('pains-acne', 'Pains', 'visage-peaux-mixtes-grasses-acne', 7);

-- ============================================================================
-- VISAGE - Peaux sensibles et rougeurs (Niveau 3)
-- ============================================================================
SELECT public.upsert_web_category_seed('nettoyant-peaux-sensibles', 'Nettoyant pour peaux sensibles', 'visage-peaux-sensibles-rougeurs', 1);
SELECT public.upsert_web_category_seed('masques-apaisants', 'Masques apaisants', 'visage-peaux-sensibles-rougeurs', 2);
SELECT public.upsert_web_category_seed('lotion-apaisante', 'Lotion apaisante', 'visage-peaux-sensibles-rougeurs', 3);
SELECT public.upsert_web_category_seed('creme-peaux-sensibles', 'Crème peaux sensibles', 'visage-peaux-sensibles-rougeurs', 4);
SELECT public.upsert_web_category_seed('anti-rougeurs', 'Anti-rougeurs', 'visage-peaux-sensibles-rougeurs', 5);

-- ============================================================================
-- VISAGE - Cicatrices (Niveau 3)
-- ============================================================================
SELECT public.upsert_web_category_seed('creme-cicatrisante', 'Crème cicatrisante', 'visage-cicatrices', 1);

-- ============================================================================
-- VISAGE - Anti tache, depigmentant (Niveau 3)
-- ============================================================================
SELECT public.upsert_web_category_seed('anti-tache-serums', 'Sérums', 'visage-anti-tache-depigmentant', 1);
SELECT public.upsert_web_category_seed('cremes-anti-taches', 'Crèmes anti taches', 'visage-anti-tache-depigmentant', 2);
SELECT public.upsert_web_category_seed('ecran-solaire-anti-taches', 'Ecran solaire anti taches', 'visage-anti-tache-depigmentant', 3);
SELECT public.upsert_web_category_seed('pains-unifiants', 'Pains unifiants', 'visage-anti-tache-depigmentant', 4);

-- ============================================================================
-- VISAGE - Eclat du teint (Niveau 3)
-- ============================================================================
SELECT public.upsert_web_category_seed('bb-creme', 'BB crème', 'visage-eclat-du-teint', 1);
SELECT public.upsert_web_category_seed('cc-creme', 'CC crème', 'visage-eclat-du-teint', 2);
SELECT public.upsert_web_category_seed('eclat-du-teint-anti-fatigue', 'Éclat du teint et anti-fatigue', 'visage-eclat-du-teint', 3);

-- ============================================================================
-- VISAGE - Yeux (Niveau 3)
-- ============================================================================
SELECT public.upsert_web_category_seed('yeux-maquillage', 'Maquillage', 'visage-yeux', 1);
SELECT public.upsert_web_category_seed('anti-cernes-anti-poches', 'Anti-cernes & anti-poches', 'visage-yeux', 2);
SELECT public.upsert_web_category_seed('contour-des-yeux', 'Contour des yeux', 'visage-yeux', 3);

-- ============================================================================
-- VISAGE - Levres (Niveau 3)
-- ============================================================================
SELECT public.upsert_web_category_seed('hydratation-levres', 'Hydratation lèvres', 'visage-levres', 1);
SELECT public.upsert_web_category_seed('stick-solaire-levres', 'Stick solaire lèvres', 'visage-levres', 2);
SELECT public.upsert_web_category_seed('baume-reparateur-levres', 'Baume réparateur', 'visage-levres', 3);

-- ============================================================================
-- CORPS - Categories
-- ============================================================================
SELECT public.upsert_web_category_seed('corps-soins', 'Soins corps', 'corps', 1);
SELECT public.upsert_web_category_seed('hydratation-corps', 'Hydratation corps', 'corps-soins', 1);
SELECT public.upsert_web_category_seed('gommage-corps', 'Gommage corps', 'corps-soins', 2);
SELECT public.upsert_web_category_seed('mains-pieds', 'Mains & pieds', 'corps-soins', 3);

-- ============================================================================
-- CAPILLAIRE - Categories
-- ============================================================================
SELECT public.upsert_web_category_seed('capillaire-cheveux', 'Cheveux', 'capillaire', 1);
SELECT public.upsert_web_category_seed('shampooing', 'Shampooing', 'capillaire-cheveux', 1);
SELECT public.upsert_web_category_seed('apres-shampooing', 'Après-shampooing', 'capillaire-cheveux', 2);
SELECT public.upsert_web_category_seed('masque-cheveux', 'Masque cheveux', 'capillaire-cheveux', 3);

-- ============================================================================
-- SOLAIRE - Categories
-- ============================================================================
SELECT public.upsert_web_category_seed('solaire-protection', 'Protection solaire', 'solaire', 1);
SELECT public.upsert_web_category_seed('visage-spf', 'Visage SPF', 'solaire-protection', 1);
SELECT public.upsert_web_category_seed('corps-spf', 'Corps SPF', 'solaire-protection', 2);
SELECT public.upsert_web_category_seed('apres-soleil', 'Après soleil', 'solaire-protection', 3);

-- ============================================================================
-- BEBE & MAMAN - Categories
-- ============================================================================
SELECT public.upsert_web_category_seed('bebe-maman-selection', 'Maternité & bébé', 'bebe-maman', 1);
SELECT public.upsert_web_category_seed('toilette-bebe', 'Toilette bébé', 'bebe-maman-selection', 1);
SELECT public.upsert_web_category_seed('cremes-change', 'Crèmes change', 'bebe-maman-selection', 2);
SELECT public.upsert_web_category_seed('grossesse-maternite', 'Grossesse & maternité', 'bebe-maman-selection', 3);

-- ============================================================================
-- NATURE & BIO - Categories
-- ============================================================================
SELECT public.upsert_web_category_seed('nature-bio-selection', 'Naturel', 'nature-bio', 1);
SELECT public.upsert_web_category_seed('huiles-naturelles', 'Huiles', 'nature-bio-selection', 1);
SELECT public.upsert_web_category_seed('plantes', 'Plantes', 'nature-bio-selection', 2);
SELECT public.upsert_web_category_seed('soins-bio', 'Soins bio', 'nature-bio-selection', 3);

-- ============================================================================
-- COMPLEMENTS ALIMENTAIRES - Categories
-- ============================================================================
SELECT public.upsert_web_category_seed('complements-selection', 'Compléments', 'complements-alimentaires', 1);
SELECT public.upsert_web_category_seed('vitamines', 'Vitamines', 'complements-selection', 1);
SELECT public.upsert_web_category_seed('minceur', 'Minceur', 'complements-selection', 2);
SELECT public.upsert_web_category_seed('immunite', 'Immunité', 'complements-selection', 3);

-- ============================================================================
-- ORTHOPEDIE - Categories
-- ============================================================================
SELECT public.upsert_web_category_seed('orthopedie-maintien-posture', 'Maintien & posture', 'orthopedie', 1);
SELECT public.upsert_web_category_seed('ceintures-lombaires', 'Ceintures lombaires', 'orthopedie-maintien-posture', 1);
SELECT public.upsert_web_category_seed('genouilleres', 'Genouilleres', 'orthopedie-maintien-posture', 2);
SELECT public.upsert_web_category_seed('chevillieres', 'Chevillieres', 'orthopedie-maintien-posture', 3);

SELECT public.upsert_web_category_seed('orthopedie-mobilite-confort', 'Mobilite & confort', 'orthopedie', 2);
SELECT public.upsert_web_category_seed('attelles', 'Attelles', 'orthopedie-mobilite-confort', 1);
SELECT public.upsert_web_category_seed('bas-contention', 'Bas de contention', 'orthopedie-mobilite-confort', 2);
SELECT public.upsert_web_category_seed('poignets-coudieres', 'Poignets & coudieres', 'orthopedie-mobilite-confort', 3);

SELECT public.upsert_web_category_seed('orthopedie-podologie', 'Podologie', 'orthopedie', 3);
SELECT public.upsert_web_category_seed('semelles', 'Semelles', 'orthopedie-podologie', 1);
SELECT public.upsert_web_category_seed('talonnieres', 'Talonnieres', 'orthopedie-podologie', 2);
SELECT public.upsert_web_category_seed('correcteurs-orteils', 'Correcteurs d orteils', 'orthopedie-podologie', 3);

-- ============================================================================
-- HYGIENE - Categories
-- ============================================================================
SELECT public.upsert_web_category_seed('hygiene-selection', 'Hygiène quotidienne', 'hygiene', 1);
SELECT public.upsert_web_category_seed('gel-douche', 'Gel douche', 'hygiene-selection', 1);
SELECT public.upsert_web_category_seed('hygiene-bucco-dentaire', 'Hygiène bucco-dentaire', 'hygiene-selection', 2);
SELECT public.upsert_web_category_seed('hygiene-intime', 'Intime', 'hygiene-selection', 3);

-- ============================================================================
-- DESACTIVATION DES CATEGORIES OBSOLETES
-- ============================================================================
UPDATE public.web_categories
SET is_active = FALSE
WHERE slug IN ('homme', 'homme-selection', 'rasage', 'barbe', 'soins-homme');

-- ============================================================================
-- NETTOYAGE
-- ============================================================================
-- Supprimer la fonction utilitaire
DROP FUNCTION IF EXISTS public.upsert_web_category_seed(TEXT, TEXT, TEXT, INTEGER);

-- ============================================================================
-- FIN DU SCRIPT SEED CATEGORIES
-- ============================================================================
-- Ce script a cree toutes les categories web pour le site e-commerce.
-- Pour verifier l'insertion:
-- SELECT * FROM public.web_categories ORDER BY parent_id NULLS FIRST, sort_order, name;
-- ============================================================================
