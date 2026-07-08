-- =====================================================
-- DIAGNOSTIC + FIX COMPLET
-- Exécute TOUT d'un seul bloc dans Supabase SQL Editor
-- =====================================================

-- ÉTAPE 1: Vérifier l'état actuel
SELECT '--- DIAGNOSTIC ---' AS info;

SELECT 'purchase_items columns' AS tbl, column_name, data_type
FROM information_schema.columns WHERE table_name='purchase_items' ORDER BY ordinal_position;

SELECT 'sale_items columns' AS tbl, column_name, data_type
FROM information_schema.columns WHERE table_name='sale_items' ORDER BY ordinal_position;

SELECT 'purchases columns' AS tbl, column_name, data_type
FROM information_schema.columns WHERE table_name='purchases' ORDER BY ordinal_position;

SELECT 'sales columns' AS tbl, column_name, data_type
FROM information_schema.columns WHERE table_name='sales' ORDER BY ordinal_position;

SELECT 'existing FKs' AS info, conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint WHERE contype='f' AND connamespace='public'::regnamespace;

-- ÉTAPE 2: Supprimer les anciennes FK qui pourraient bloquer
DO $$ BEGIN
  ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_client_id_fkey;
  ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_mutuelle_id_fkey;
  ALTER TABLE sale_items DROP CONSTRAINT IF EXISTS sale_items_sale_id_fkey;
  ALTER TABLE sale_items DROP CONSTRAINT IF EXISTS sale_items_product_id_fkey;
  ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_supplier_id_fkey;
  ALTER TABLE purchase_items DROP CONSTRAINT IF EXISTS purchase_items_purchase_id_fkey;
  ALTER TABLE purchase_items DROP CONSTRAINT IF EXISTS purchase_items_product_id_fkey;
  ALTER TABLE supplier_returns DROP CONSTRAINT IF EXISTS supplier_returns_supplier_id_fkey;
  ALTER TABLE supplier_return_items DROP CONSTRAINT IF EXISTS supplier_return_items_return_id_fkey;
  ALTER TABLE supplier_return_items DROP CONSTRAINT IF EXISTS supplier_return_items_product_id_fkey;
  ALTER TABLE fridge_sales DROP CONSTRAINT IF EXISTS fridge_sales_client_id_fkey;
  ALTER TABLE fridge_sales DROP CONSTRAINT IF EXISTS fridge_sales_mutuelle_id_fkey;
  ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_mutuelle_id_fkey;
  ALTER TABLE customer_payments DROP CONSTRAINT IF EXISTS customer_payments_client_id_fkey;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ÉTAPE 3: Ajouter colonnes manquantes à purchase_items
ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS prix_unitaire_ht NUMERIC;
ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS tva NUMERIC;
ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS total_ligne NUMERIC;

-- ÉTAPE 4: Ajouter colonnes manquantes à sale_items
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS total_ligne NUMERIC;

-- ÉTAPE 5: Recréer toutes les FK
ALTER TABLE sales ADD CONSTRAINT sales_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES customers(id) ON DELETE SET NULL;

ALTER TABLE sales ADD CONSTRAINT sales_mutuelle_id_fkey
  FOREIGN KEY (mutuelle_id) REFERENCES mutuelles(id) ON DELETE SET NULL;

ALTER TABLE sale_items ADD CONSTRAINT sale_items_sale_id_fkey
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE;

ALTER TABLE sale_items ADD CONSTRAINT sale_items_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

ALTER TABLE purchases ADD CONSTRAINT purchases_supplier_id_fkey
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

ALTER TABLE purchase_items ADD CONSTRAINT purchase_items_purchase_id_fkey
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE;

ALTER TABLE purchase_items ADD CONSTRAINT purchase_items_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

ALTER TABLE supplier_returns ADD CONSTRAINT supplier_returns_supplier_id_fkey
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

ALTER TABLE supplier_return_items ADD CONSTRAINT supplier_return_items_return_id_fkey
  FOREIGN KEY (supplier_return_id) REFERENCES supplier_returns(id) ON DELETE CASCADE;

ALTER TABLE supplier_return_items ADD CONSTRAINT supplier_return_items_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

ALTER TABLE fridge_sales ADD CONSTRAINT fridge_sales_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES customers(id) ON DELETE SET NULL;

ALTER TABLE fridge_sales ADD CONSTRAINT fridge_sales_mutuelle_id_fkey
  FOREIGN KEY (mutuelle_id) REFERENCES mutuelles(id) ON DELETE SET NULL;

ALTER TABLE customers ADD CONSTRAINT customers_mutuelle_id_fkey
  FOREIGN KEY (mutuelle_id) REFERENCES mutuelles(id) ON DELETE SET NULL;

-- customer_payments FK seulement si la table existe
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='customer_payments') THEN
    ALTER TABLE customer_payments ADD CONSTRAINT customer_payments_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES customers(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ÉTAPE 6: Remplir les données manquantes dans purchase_items
UPDATE purchase_items SET prix_unitaire_ht = prix_achat_ht WHERE prix_unitaire_ht IS NULL;

UPDATE purchase_items pi
SET tva = p.tva
FROM products p
WHERE pi.product_id = p.id AND pi.tva IS NULL;

UPDATE purchase_items
SET total_ligne = (COALESCE(quantite, 0) * COALESCE(prix_achat_ht, 0)) - COALESCE(remise, 0)
WHERE total_ligne IS NULL;

-- ÉTAPE 7: Remplir total_ligne dans sale_items
UPDATE sale_items
SET total_ligne = (COALESCE(quantite, 0) * COALESCE(prix_unitaire_ttc, 0)) - COALESCE(remise, 0)
WHERE total_ligne IS NULL;

-- ÉTAPE 8: Mettre à jour document_sequences pour les ventes
INSERT INTO document_sequences (prefix, last_value)
VALUES ('VTE', (SELECT COALESCE(MAX(CAST(SUBSTRING(numero_vente FROM 5) AS INTEGER)), 0) FROM sales))
ON CONFLICT (prefix) DO UPDATE
SET last_value = GREATEST(document_sequences.last_value,
  (SELECT COALESCE(MAX(CAST(SUBSTRING(numero_vente FROM 5) AS INTEGER)), 0) FROM sales));

-- ÉTAPE 9: Vérification finale
SELECT '--- VERIFICATION ---' AS info;

SELECT 'purchase_items' AS tbl, column_name
FROM information_schema.columns WHERE table_name='purchase_items' AND column_name IN ('prix_unitaire_ht','tva','total_ligne');

SELECT 'sale_items' AS tbl, column_name
FROM information_schema.columns WHERE table_name='sale_items' AND column_name='total_ligne';

SELECT 'FK count' AS info, COUNT(*) AS total
FROM pg_constraint WHERE contype='f' AND connamespace='public'::regnamespace;

SELECT 'sales count' AS info, COUNT(*) AS total FROM sales;
SELECT 'purchases count' AS info, COUNT(*) AS total FROM purchases;
SELECT 'sale_items count' AS info, COUNT(*) AS total FROM sale_items;
SELECT 'purchase_items count' AS info, COUNT(*) AS total FROM purchase_items;
