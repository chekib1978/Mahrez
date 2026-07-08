-- =====================================================
-- FIX: Colonnes manquantes dans purchases et sales
-- Le code JS demande des colonnes qui n'existent pas
-- =====================================================

-- purchases: le code demande "total_ht" mais la colonne est "total_ht_net"
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS total_ht NUMERIC;
UPDATE purchases SET total_ht = total_ht_net WHERE total_ht IS NULL;

-- Vérifier que toutes les colonnes requises par le code existent
-- Code ventes demande: id,numero_vente,date_vente,type_vente,payment_mode,total_ttc,total_ht,client_id,mutuelle_id,statut,created_at,created_by
-- Code achats demande: id,numero_achat,date_achat,created_at,supplier_id,num_bl_fact,total_ttc,total_ht
-- Code sale_items demande: id,sale_id,product_id,quantite,prix_unitaire_ttc,remise,total_ligne
-- Code purchase_items demande: id,purchase_id,product_id,quantite,prix_unitaire_ht,tva,total_ligne

SELECT '--- VERIFICATION COLONNES ---' AS info;

SELECT 'purchases' AS tbl, column_name
FROM information_schema.columns WHERE table_name='purchases'
AND column_name IN ('id','numero_achat','date_achat','supplier_id','num_bl_fact','total_ttc','total_ht','total_ht_net','created_at')
ORDER BY column_name;

SELECT 'sales' AS tbl, column_name
FROM information_schema.columns WHERE table_name='sales'
AND column_name IN ('id','numero_vente','date_vente','type_vente','payment_mode','total_ttc','total_ht','total_tva','client_id','mutuelle_id','statut','created_at','created_by')
ORDER BY column_name;

SELECT 'sale_items' AS tbl, column_name
FROM information_schema.columns WHERE table_name='sale_items'
AND column_name IN ('id','sale_id','product_id','quantite','prix_unitaire_ttc','remise','total_ligne')
ORDER BY column_name;

SELECT 'purchase_items' AS tbl, column_name
FROM information_schema.columns WHERE table_name='purchase_items'
AND column_name IN ('id','purchase_id','product_id','quantite','prix_achat_ht','prix_unitaire_ht','tva','total_ligne','fodec_pct','remise')
ORDER BY column_name;
