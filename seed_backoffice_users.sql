-- Insertion des utilisateurs backoffice dans le nouveau projet
-- Adapte les mots de passe et modules selon tes besoins

-- 1. Administrateur (accès complet)
INSERT INTO public.backoffice_users (username, full_name, password_text, is_admin, allowed_modules, is_active)
VALUES (
  'admin',
  'Administrateur',
  'admin123',
  true,
  '["vente","suppression_vente","vente_articles","vente_frigo","etat_ventes","journal_ventes","mouv_clients","reglement_client","gestion_clients","recap_caisse","achat","purchase_edit","retour_fournisseur","suppression_achat","gestion_fournisseurs","hist_achats","hist_retour","hist_gratuite_achat","mouv_fourn","articles","articles_edit","articles_delete","inventaire","rayonnage_intelligent","stock_peremption","stock_remise","hit_parade","mouv_articles","stock_pret","stock_emprunt","stock_entree","stock_sortie","import_articles","import_public_catalog","hist_pret_emprunt","creer_mutuelle","releve_mutuelle","web_orders","web_delivery_fees","settings","company_settings","utilitaire","system_reset","sequence_reset"]'::jsonb,
  true
)
ON CONFLICT (username) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  password_text = EXCLUDED.password_text,
  is_admin = EXCLUDED.is_admin,
  allowed_modules = EXCLUDED.allowed_modules;

-- 2. Utilisateur limité (chekib)
-- ⚠️ Vérifie le mot de passe et les modules dans ton localStorage :
--    Ouvre la console du navigateur et tape :
--    JSON.parse(localStorage.getItem('para_mv_backoffice_users'))
INSERT INTO public.backoffice_users (username, full_name, password_text, is_admin, allowed_modules, is_active)
VALUES (
  'chekib',
  'chekib',
  'chekib123',
  false,
  '["vente","etat_ventes","journal_ventes","mouv_clients","gestion_clients","recap_caisse","achat","hist_achats","mouv_fourn","articles","inventaire","hit_parade","mouv_articles","creer_mutuelle","releve_mutuelle","web_orders","vente_frigo","reglement_client","gestion_fournisseurs","stock_peremption","stock_remise"]'::jsonb,
  true
)
ON CONFLICT (username) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  password_text = EXCLUDED.password_text,
  is_admin = EXCLUDED.is_admin,
  allowed_modules = EXCLUDED.allowed_modules;
