-- =====================================================
-- FIX URGENT: RLS sur products (retourne 0 via API)
-- Exécute dans Supabase SQL Editor
-- =====================================================

-- Vérifier RLS
SELECT relrowsecurity, relforcerowsecurity
FROM pg_class WHERE relname = 'products';

-- Ajouter toutes les policies nécessaires
DO $$ BEGIN
  DROP POLICY IF EXISTS "products_select_all" ON products;
  DROP POLICY IF EXISTS "products_insert_all" ON products;
  DROP POLICY IF EXISTS "products_update_all" ON products;
  DROP POLICY IF EXISTS "products_delete_all" ON products;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY products_select_all ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY products_insert_all ON public.products FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY products_update_all ON public.products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY products_delete_all ON public.products FOR DELETE TO anon, authenticated USING (true);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Vérification
SELECT 'RLS policies on products:' AS info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'products';
