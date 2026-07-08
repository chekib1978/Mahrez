-- =====================================================
-- FIX: Ajouter colonnes manquantes à purchase_items
-- et calculer les valeurs existantes
-- =====================================================

-- Ajouter les colonnes manquantes
ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS prix_unitaire_ht NUMERIC;
ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS tva NUMERIC;
ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS total_ligne NUMERIC;

-- Remplir prix_unitaire_ht depuis prix_achat_ht (c'est la même donnée)
UPDATE purchase_items SET prix_unitaire_ht = prix_achat_ht WHERE prix_unitaire_ht IS NULL;

-- Remplir tva depuis products.tva pour chaque ligne
UPDATE purchase_items pi
SET tva = p.tva
FROM products p
WHERE pi.product_id = p.id AND pi.tva IS NULL;

-- Calculer total_ligne = quantite * prix_achat_ht - remise
UPDATE purchase_items
SET total_ligne = (COALESCE(quantite, 0) * COALESCE(prix_achat_ht, 0)) - COALESCE(remise, 0)
WHERE total_ligne IS NULL;

-- =====================================================
-- Aussi pour sale_items si nécessaire
-- =====================================================
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS total_ligne NUMERIC;

UPDATE sale_items
SET total_ligne = (COALESCE(quantite, 0) * COALESCE(prix_unitaire_ttc, 0)) - COALESCE(remise, 0)
WHERE total_ligne IS NULL;
