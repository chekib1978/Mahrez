-- =====================================================
-- FIX: Problème enregistrement détails vente (sale_items)
-- Le code JS INSERT sale_items SANS total_ligne
-- Si colonne NOT NULL → INSERT échoue silencieusement
-- Si RLS activé sans policies → INSERT bloqué par Supabase
-- =====================================================

-- ÉTAPE 1: Diagnostic état actuel
SELECT '--- ETAT ACTUEL ---' AS info;

SELECT 'sale_items columns' AS tbl, column_name, data_type, is_nullable, column_default
FROM information_schema.columns WHERE table_name='sale_items' ORDER BY ordinal_position;

SELECT 'sale_items row count' AS info, COUNT(*) AS total FROM sale_items;

-- Vérifier si RLS est activé
SELECT 'RLS on sale_items' AS info,
  CASE WHEN relrowsecurity THEN 'ACTIVÉ' ELSE 'DÉSACTIVÉ' END AS rls_status
FROM pg_class WHERE relname = 'sale_items';

-- ÉTAPE 2: S'assurer que total_ligne est nullable (le code JS ne l'envoie pas)
ALTER TABLE sale_items ALTER COLUMN total_ligne DROP NOT NULL;

-- ÉTAPE 3: Ajouter une DEFAULT pour total_ligne (sécurité)
ALTER TABLE sale_items ALTER COLUMN total_ligne SET DEFAULT 0;

-- ÉTAPE 4: Réparer RLS - soit désactiver, soit ajouter des policies
-- Solution: ajouter des policies permissives pour anon

-- Supprimer anciennes policies s'il y en a
DO $$ BEGIN
  DROP POLICY IF EXISTS "sale_items_select_all" ON sale_items;
  DROP POLICY IF EXISTS "sale_items_insert_all" ON sale_items;
  DROP POLICY IF EXISTS "sale_items_update_all" ON sale_items;
  DROP POLICY IF EXISTS "sale_items_delete_all" ON sale_items;
  DROP POLICY IF EXISTS "Allow all for sale_items" ON sale_items;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Créer les policies permissives
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sale_items' AND policyname='sale_items_select_all') THEN
    CREATE POLICY sale_items_select_all ON public.sale_items FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sale_items' AND policyname='sale_items_insert_all') THEN
    CREATE POLICY sale_items_insert_all ON public.sale_items FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sale_items' AND policyname='sale_items_update_all') THEN
    CREATE POLICY sale_items_update_all ON public.sale_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sale_items' AND policyname='sale_items_delete_all') THEN
    CREATE POLICY sale_items_delete_all ON public.sale_items FOR DELETE TO anon, authenticated USING (true);
  END IF;
END $$;

-- ÉTAPE 5: Faire pareil pour sale_items si RLS n'est pas activé, l'activer avec les policies
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 6: Vérifier que sales a aussi les bonnes policies (pour les INSERT depuis le JS)
DO $$ BEGIN
  DROP POLICY IF EXISTS "sales_select_all" ON sales;
  DROP POLICY IF EXISTS "sales_insert_all" ON sales;
  DROP POLICY IF EXISTS "sales_update_all" ON sales;
  DROP POLICY IF EXISTS "sales_delete_all" ON sales;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sales' AND policyname='sales_select_all') THEN
    CREATE POLICY sales_select_all ON public.sales FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sales' AND policyname='sales_insert_all') THEN
    CREATE POLICY sales_insert_all ON public.sales FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sales' AND policyname='sales_update_all') THEN
    CREATE POLICY sales_update_all ON public.sales FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sales' AND policyname='sales_delete_all') THEN
    CREATE POLICY sales_delete_all ON public.sales FOR DELETE TO anon, authenticated USING (true);
  END IF;
END $$;

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 7: Même chose pour products (nécessaire pour le stock update dans finalizeSale)
DO $$ BEGIN
  DROP POLICY IF EXISTS "products_select_all" ON products;
  DROP POLICY IF EXISTS "products_insert_all" ON products;
  DROP POLICY IF EXISTS "products_update_all" ON products;
  DROP POLICY IF EXISTS "products_delete_all" ON products;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='products_select_all') THEN
    CREATE POLICY products_select_all ON public.products FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='products_insert_all') THEN
    CREATE POLICY products_insert_all ON public.products FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='products_update_all') THEN
    CREATE POLICY products_update_all ON public.products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='products_delete_all') THEN
    CREATE POLICY products_delete_all ON public.products FOR DELETE TO anon, authenticated USING (true);
  END IF;
END $$;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 8: Policies pour customers (nécessaire pour update solde/client dans finalizeSale)
DO $$ BEGIN
  DROP POLICY IF EXISTS "customers_select_all" ON customers;
  DROP POLICY IF EXISTS "customers_insert_all" ON customers;
  DROP POLICY IF EXISTS "customers_update_all" ON customers;
  DROP POLICY IF EXISTS "customers_delete_all" ON customers;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='customers' AND policyname='customers_select_all') THEN
    CREATE POLICY customers_select_all ON public.customers FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='customers' AND policyname='customers_insert_all') THEN
    CREATE POLICY customers_insert_all ON public.customers FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='customers' AND policyname='customers_update_all') THEN
    CREATE POLICY customers_update_all ON public.customers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='customers' AND policyname='customers_delete_all') THEN
    CREATE POLICY customers_delete_all ON public.customers FOR DELETE TO anon, authenticated USING (true);
  END IF;
END $$;

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 9: Policies pour mutuelles
DO $$ BEGIN
  DROP POLICY IF EXISTS "mutuelles_select_all" ON mutuelles;
  DROP POLICY IF EXISTS "mutuelles_insert_all" ON mutuelles;
  DROP POLICY IF EXISTS "mutuelles_update_all" ON mutuelles;
  DROP POLICY IF EXISTS "mutuelles_delete_all" ON mutuelles;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='mutuelles' AND policyname='mutuelles_select_all') THEN
    CREATE POLICY mutuelles_select_all ON public.mutuelles FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='mutuelles' AND policyname='mutuelles_insert_all') THEN
    CREATE POLICY mutuelles_insert_all ON public.mutuelles FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='mutuelles' AND policyname='mutuelles_update_all') THEN
    CREATE POLICY mutuelles_update_all ON public.mutuelles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='mutuelles' AND policyname='mutuelles_delete_all') THEN
    CREATE POLICY mutuelles_delete_all ON public.mutuelles FOR DELETE TO anon, authenticated USING (true);
  END IF;
END $$;

ALTER TABLE mutuelles ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 10: Policies pour suppliers
DO $$ BEGIN
  DROP POLICY IF EXISTS "suppliers_select_all" ON suppliers;
  DROP POLICY IF EXISTS "suppliers_insert_all" ON suppliers;
  DROP POLICY IF EXISTS "suppliers_update_all" ON suppliers;
  DROP POLICY IF EXISTS "suppliers_delete_all" ON suppliers;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='suppliers' AND policyname='suppliers_select_all') THEN
    CREATE POLICY suppliers_select_all ON public.suppliers FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='suppliers' AND policyname='suppliers_insert_all') THEN
    CREATE POLICY suppliers_insert_all ON public.suppliers FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='suppliers' AND policyname='suppliers_update_all') THEN
    CREATE POLICY suppliers_update_all ON public.suppliers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='suppliers' AND policyname='suppliers_delete_all') THEN
    CREATE POLICY suppliers_delete_all ON public.suppliers FOR DELETE TO anon, authenticated USING (true);
  END IF;
END $$;

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 11: Policies pour purchases
DO $$ BEGIN
  DROP POLICY IF EXISTS "purchases_select_all" ON purchases;
  DROP POLICY IF EXISTS "purchases_insert_all" ON purchases;
  DROP POLICY IF EXISTS "purchases_update_all" ON purchases;
  DROP POLICY IF EXISTS "purchases_delete_all" ON purchases;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='purchases' AND policyname='purchases_select_all') THEN
    CREATE POLICY purchases_select_all ON public.purchases FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='purchases' AND policyname='purchases_insert_all') THEN
    CREATE POLICY purchases_insert_all ON public.purchases FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='purchases' AND policyname='purchases_update_all') THEN
    CREATE POLICY purchases_update_all ON public.purchases FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='purchases' AND policyname='purchases_delete_all') THEN
    CREATE POLICY purchases_delete_all ON public.purchases FOR DELETE TO anon, authenticated USING (true);
  END IF;
END $$;

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 12: Policies pour purchase_items
DO $$ BEGIN
  DROP POLICY IF EXISTS "purchase_items_select_all" ON purchase_items;
  DROP POLICY IF EXISTS "purchase_items_insert_all" ON purchase_items;
  DROP POLICY IF EXISTS "purchase_items_update_all" ON purchase_items;
  DROP POLICY IF EXISTS "purchase_items_delete_all" ON purchase_items;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='purchase_items' AND policyname='purchase_items_select_all') THEN
    CREATE POLICY purchase_items_select_all ON public.purchase_items FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='purchase_items' AND policyname='purchase_items_insert_all') THEN
    CREATE POLICY purchase_items_insert_all ON public.purchase_items FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='purchase_items' AND policyname='purchase_items_update_all') THEN
    CREATE POLICY purchase_items_update_all ON public.purchase_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='purchase_items' AND policyname='purchase_items_delete_all') THEN
    CREATE POLICY purchase_items_delete_all ON public.purchase_items FOR DELETE TO anon, authenticated USING (true);
  END IF;
END $$;

ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 13: Policies pour company_settings
DO $$ BEGIN
  DROP POLICY IF EXISTS "company_settings_select_all" ON company_settings;
  DROP POLICY IF EXISTS "company_settings_insert_all" ON company_settings;
  DROP POLICY IF EXISTS "company_settings_update_all" ON company_settings;
  DROP POLICY IF EXISTS "company_settings_delete_all" ON company_settings;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='company_settings' AND policyname='company_settings_select_all') THEN
    CREATE POLICY company_settings_select_all ON public.company_settings FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='company_settings' AND policyname='company_settings_insert_all') THEN
    CREATE POLICY company_settings_insert_all ON public.company_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='company_settings' AND policyname='company_settings_update_all') THEN
    CREATE POLICY company_settings_update_all ON public.company_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='company_settings' AND policyname='company_settings_delete_all') THEN
    CREATE POLICY company_settings_delete_all ON public.company_settings FOR DELETE TO anon, authenticated USING (true);
  END IF;
END $$;

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 14: Policies pour backoffice_users
DO $$ BEGIN
  DROP POLICY IF EXISTS "backoffice_users_select_all" ON backoffice_users;
  DROP POLICY IF EXISTS "backoffice_users_insert_all" ON backoffice_users;
  DROP POLICY IF EXISTS "backoffice_users_update_all" ON backoffice_users;
  DROP POLICY IF EXISTS "backoffice_users_delete_all" ON backoffice_users;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='backoffice_users' AND policyname='backoffice_users_select_all') THEN
    CREATE POLICY backoffice_users_select_all ON public.backoffice_users FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='backoffice_users' AND policyname='backoffice_users_insert_all') THEN
    CREATE POLICY backoffice_users_insert_all ON public.backoffice_users FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='backoffice_users' AND policyname='backoffice_users_update_all') THEN
    CREATE POLICY backoffice_users_update_all ON public.backoffice_users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='backoffice_users' AND policyname='backoffice_users_delete_all') THEN
    CREATE POLICY backoffice_users_delete_all ON public.backoffice_users FOR DELETE TO anon, authenticated USING (true);
  END IF;
END $$;

ALTER TABLE backoffice_users ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 15: Policies pour action_history
DO $$ BEGIN
  DROP POLICY IF EXISTS "action_history_select_all" ON action_history;
  DROP POLICY IF EXISTS "action_history_insert_all" ON action_history;
  DROP POLICY IF EXISTS "action_history_update_all" ON action_history;
  DROP POLICY IF EXISTS "action_history_delete_all" ON action_history;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='action_history' AND policyname='action_history_select_all') THEN
    CREATE POLICY action_history_select_all ON public.action_history FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='action_history' AND policyname='action_history_insert_all') THEN
    CREATE POLICY action_history_insert_all ON public.action_history FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='action_history' AND policyname='action_history_update_all') THEN
    CREATE POLICY action_history_update_all ON public.action_history FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='action_history' AND policyname='action_history_delete_all') THEN
    CREATE POLICY action_history_delete_all ON public.action_history FOR DELETE TO anon, authenticated USING (true);
  END IF;
END $$;

ALTER TABLE action_history ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 16: Policies pour document_sequences
DO $$ BEGIN
  DROP POLICY IF EXISTS "document_sequences_select_all" ON document_sequences;
  DROP POLICY IF EXISTS "document_sequences_insert_all" ON document_sequences;
  DROP POLICY IF EXISTS "document_sequences_update_all" ON document_sequences;
  DROP POLICY IF EXISTS "document_sequences_delete_all" ON document_sequences;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='document_sequences' AND policyname='document_sequences_select_all') THEN
    CREATE POLICY document_sequences_select_all ON public.document_sequences FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='document_sequences' AND policyname='document_sequences_insert_all') THEN
    CREATE POLICY document_sequences_insert_all ON public.document_sequences FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='document_sequences' AND policyname='document_sequences_update_all') THEN
    CREATE POLICY document_sequences_update_all ON public.document_sequences FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='document_sequences' AND policyname='document_sequences_delete_all') THEN
    CREATE POLICY document_sequences_delete_all ON public.document_sequences FOR DELETE TO anon, authenticated USING (true);
  END IF;
END $$;

ALTER TABLE document_sequences ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 17: Policies pour fridge_sales
DO $$ BEGIN
  DROP POLICY IF EXISTS "fridge_sales_select_all" ON fridge_sales;
  DROP POLICY IF EXISTS "fridge_sales_insert_all" ON fridge_sales;
  DROP POLICY IF EXISTS "fridge_sales_update_all" ON fridge_sales;
  DROP POLICY IF EXISTS "fridge_sales_delete_all" ON fridge_sales;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='fridge_sales' AND policyname='fridge_sales_select_all') THEN
    CREATE POLICY fridge_sales_select_all ON public.fridge_sales FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='fridge_sales' AND policyname='fridge_sales_insert_all') THEN
    CREATE POLICY fridge_sales_insert_all ON public.fridge_sales FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='fridge_sales' AND policyname='fridge_sales_update_all') THEN
    CREATE POLICY fridge_sales_update_all ON public.fridge_sales FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='fridge_sales' AND policyname='fridge_sales_delete_all') THEN
    CREATE POLICY fridge_sales_delete_all ON public.fridge_sales FOR DELETE TO anon, authenticated USING (true);
  END IF;
END $$;

ALTER TABLE fridge_sales ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 18: Policies pour web_orders
DO $$ BEGIN
  DROP POLICY IF EXISTS "web_orders_select_all" ON web_orders;
  DROP POLICY IF EXISTS "web_orders_insert_all" ON web_orders;
  DROP POLICY IF EXISTS "web_orders_update_all" ON web_orders;
  DROP POLICY IF EXISTS "web_orders_delete_all" ON web_orders;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='web_orders' AND policyname='web_orders_select_all') THEN
    CREATE POLICY web_orders_select_all ON public.web_orders FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='web_orders' AND policyname='web_orders_insert_all') THEN
    CREATE POLICY web_orders_insert_all ON public.web_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='web_orders' AND policyname='web_orders_update_all') THEN
    CREATE POLICY web_orders_update_all ON public.web_orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='web_orders' AND policyname='web_orders_delete_all') THEN
    CREATE POLICY web_orders_delete_all ON public.web_orders FOR DELETE TO anon, authenticated USING (true);
  END IF;
END $$;

ALTER TABLE web_orders ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 19: Policies pour web_order_items
DO $$ BEGIN
  DROP POLICY IF EXISTS "web_order_items_select_all" ON web_order_items;
  DROP POLICY IF EXISTS "web_order_items_insert_all" ON web_order_items;
  DROP POLICY IF EXISTS "web_order_items_update_all" ON web_order_items;
  DROP POLICY IF EXISTS "web_order_items_delete_all" ON web_order_items;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='web_order_items' AND policyname='web_order_items_select_all') THEN
    CREATE POLICY web_order_items_select_all ON public.web_order_items FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='web_order_items' AND policyname='web_order_items_insert_all') THEN
    CREATE POLICY web_order_items_insert_all ON public.web_order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='web_order_items' AND policyname='web_order_items_update_all') THEN
    CREATE POLICY web_order_items_update_all ON public.web_order_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='web_order_items' AND policyname='web_order_items_delete_all') THEN
    CREATE POLICY web_order_items_delete_all ON public.web_order_items FOR DELETE TO anon, authenticated USING (true);
  END IF;
END $$;

ALTER TABLE web_order_items ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 20: Vérification finale
SELECT '--- VERIFICATION FINALE ---' AS info;

SELECT 'sale_items columns' AS tbl, column_name, data_type, is_nullable, column_default
FROM information_schema.columns WHERE table_name='sale_items' ORDER BY ordinal_position;

SELECT 'sale_items policies' AS tbl, policyname, cmd, roles
FROM pg_policies WHERE tablename='sale_items';

SELECT 'sales policies count' AS tbl, COUNT(*) AS total FROM pg_policies WHERE tablename='sales';
SELECT 'sale_items policies count' AS tbl, COUNT(*) AS total FROM pg_policies WHERE tablename='sale_items';
SELECT 'products policies count' AS tbl, COUNT(*) AS total FROM pg_policies WHERE tablename='products';
