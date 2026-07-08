-- ============================================================================
-- HELPER POUR IMPORT CSV - Désactivation temporaire des contraintes
-- ============================================================================
-- Utilisez ce script SEULEMENT si vous voulez importer les CSV
-- dans n'importe quel ordre (pas recommandé mais possible)
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : AVANT L'IMPORT - Désactiver les contraintes de clés étrangères
-- ============================================================================
-- ATTENTION : Exécutez ceci AVANT d'importer vos CSV

ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_mutuelle_id_fkey;
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_client_id_fkey;
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_mutuelle_id_fkey;
ALTER TABLE public.sale_items DROP CONSTRAINT IF EXISTS sale_items_product_id_fkey;
ALTER TABLE public.sale_items DROP CONSTRAINT IF EXISTS sale_items_sale_id_fkey;
ALTER TABLE public.purchases DROP CONSTRAINT IF EXISTS purchases_supplier_id_fkey;
ALTER TABLE public.purchase_items DROP CONSTRAINT IF EXISTS purchase_items_product_id_fkey;
ALTER TABLE public.purchase_items DROP CONSTRAINT IF EXISTS purchase_items_purchase_id_fkey;
ALTER TABLE public.supplier_returns DROP CONSTRAINT IF EXISTS supplier_returns_supplier_id_fkey;
ALTER TABLE public.supplier_return_items DROP CONSTRAINT IF EXISTS supplier_return_items_supplier_return_id_fkey;
ALTER TABLE public.supplier_return_items DROP CONSTRAINT IF EXISTS supplier_return_items_product_id_fkey;
ALTER TABLE public.customer_payments DROP CONSTRAINT IF EXISTS customer_payments_client_id_fkey;
ALTER TABLE public.fridge_sales DROP CONSTRAINT IF EXISTS fridge_sales_client_id_fkey;
ALTER TABLE public.fridge_sales DROP CONSTRAINT IF EXISTS fridge_sales_mutuelle_id_fkey;
ALTER TABLE public.stock_operations DROP CONSTRAINT IF EXISTS stock_operations_product_id_fkey;
ALTER TABLE public.web_order_items DROP CONSTRAINT IF EXISTS web_order_items_order_id_fkey;
ALTER TABLE public.web_order_items DROP CONSTRAINT IF EXISTS web_order_items_product_id_fkey;
ALTER TABLE public.web_product_reviews DROP CONSTRAINT IF EXISTS web_product_reviews_product_id_fkey;
ALTER TABLE public.mutuelle_bordereau_lignes DROP CONSTRAINT IF EXISTS mutuelle_bordereau_lignes_bordereau_id_fkey;
ALTER TABLE public.mutuelle_bordereau_lignes DROP CONSTRAINT IF EXISTS mutuelle_bordereau_lignes_sale_id_fkey;
ALTER TABLE public.mutuelle_bordereau_lignes DROP CONSTRAINT IF EXISTS mutuelle_bordereau_lignes_client_id_fkey;
ALTER TABLE public.mutuelle_bordereaux DROP CONSTRAINT IF EXISTS mutuelle_bordereaux_mutuelle_id_fkey;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Contraintes désactivées. Vous pouvez maintenant importer vos CSV dans n''importe quel ordre.';
END $$;


-- ============================================================================
-- ÉTAPE 2 : IMPORTEZ VOS CSV
-- ============================================================================
-- Maintenant vous pouvez importer vos CSV dans n'importe quel ordre
-- via l'interface Supabase (Table Editor > Insert > Import via spreadsheet)

-- ============================================================================
-- ÉTAPE 3 : APRÈS L'IMPORT - Réactiver les contraintes
-- ============================================================================
-- ATTENTION : Exécutez ceci APRÈS avoir importé TOUS vos CSV

ALTER TABLE public.customers 
  ADD CONSTRAINT customers_mutuelle_id_fkey 
  FOREIGN KEY (mutuelle_id) REFERENCES public.mutuelles(id) ON DELETE SET NULL;

ALTER TABLE public.sales 
  ADD CONSTRAINT sales_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES public.customers(id) ON DELETE SET NULL;

ALTER TABLE public.sales 
  ADD CONSTRAINT sales_mutuelle_id_fkey 
  FOREIGN KEY (mutuelle_id) REFERENCES public.mutuelles(id) ON DELETE SET NULL;

ALTER TABLE public.sale_items 
  ADD CONSTRAINT sale_items_sale_id_fkey 
  FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;

ALTER TABLE public.sale_items 
  ADD CONSTRAINT sale_items_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE public.purchases 
  ADD CONSTRAINT purchases_supplier_id_fkey 
  FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;

ALTER TABLE public.purchase_items 
  ADD CONSTRAINT purchase_items_purchase_id_fkey 
  FOREIGN KEY (purchase_id) REFERENCES public.purchases(id) ON DELETE CASCADE;

ALTER TABLE public.purchase_items 
  ADD CONSTRAINT purchase_items_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE public.supplier_returns 
  ADD CONSTRAINT supplier_returns_supplier_id_fkey 
  FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;

ALTER TABLE public.supplier_return_items 
  ADD CONSTRAINT supplier_return_items_supplier_return_id_fkey 
  FOREIGN KEY (supplier_return_id) REFERENCES public.supplier_returns(id) ON DELETE CASCADE;

ALTER TABLE public.supplier_return_items 
  ADD CONSTRAINT supplier_return_items_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE public.customer_payments 
  ADD CONSTRAINT customer_payments_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE public.fridge_sales 
  ADD CONSTRAINT fridge_sales_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES public.customers(id) ON DELETE SET NULL;

ALTER TABLE public.fridge_sales 
  ADD CONSTRAINT fridge_sales_mutuelle_id_fkey 
  FOREIGN KEY (mutuelle_id) REFERENCES public.mutuelles(id) ON DELETE SET NULL;

ALTER TABLE public.stock_operations 
  ADD CONSTRAINT stock_operations_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE public.web_order_items 
  ADD CONSTRAINT web_order_items_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES public.web_orders(id) ON DELETE CASCADE;

ALTER TABLE public.web_order_items 
  ADD CONSTRAINT web_order_items_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE public.web_product_reviews 
  ADD CONSTRAINT web_product_reviews_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.mutuelle_bordereaux 
  ADD CONSTRAINT mutuelle_bordereaux_mutuelle_id_fkey 
  FOREIGN KEY (mutuelle_id) REFERENCES public.mutuelles(id) ON DELETE RESTRICT;

ALTER TABLE public.mutuelle_bordereau_lignes 
  ADD CONSTRAINT mutuelle_bordereau_lignes_bordereau_id_fkey 
  FOREIGN KEY (bordereau_id) REFERENCES public.mutuelle_bordereaux(id) ON DELETE CASCADE;

ALTER TABLE public.mutuelle_bordereau_lignes 
  ADD CONSTRAINT mutuelle_bordereau_lignes_sale_id_fkey 
  FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE SET NULL;

ALTER TABLE public.mutuelle_bordereau_lignes 
  ADD CONSTRAINT mutuelle_bordereau_lignes_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES public.customers(id) ON DELETE SET NULL;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Contraintes réactivées. Votre base de données est maintenant complète et sécurisée.';
END $$;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
