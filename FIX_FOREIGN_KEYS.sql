-- =====================================================
-- FIX: Ajouter les Foreign Keys manquantes
-- après import CSV (les tables existent mais sans FK)
-- =====================================================

-- sales → customers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_client_id_fkey'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='client_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='id'
  ) THEN
    ALTER TABLE sales ADD CONSTRAINT sales_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES customers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- sales → mutuelles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_mutuelle_id_fkey'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='mutuelle_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='mutuelles' AND column_name='id'
  ) THEN
    ALTER TABLE sales ADD CONSTRAINT sales_mutuelle_id_fkey
      FOREIGN KEY (mutuelle_id) REFERENCES mutuelles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- sale_items → sales
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sale_items_sale_id_fkey'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='sale_items' AND column_name='sale_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='id'
  ) THEN
    ALTER TABLE sale_items ADD CONSTRAINT sale_items_sale_id_fkey
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE;
  END IF;
END $$;

-- sale_items → products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sale_items_product_id_fkey'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='sale_items' AND column_name='product_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='id'
  ) THEN
    ALTER TABLE sale_items ADD CONSTRAINT sale_items_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
  END IF;
END $$;

-- purchases → suppliers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'purchases_supplier_id_fkey'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='purchases' AND column_name='supplier_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='id'
  ) THEN
    ALTER TABLE purchases ADD CONSTRAINT purchases_supplier_id_fkey
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- purchase_items → purchases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'purchase_items_purchase_id_fkey'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='purchase_items' AND column_name='purchase_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='purchases' AND column_name='id'
  ) THEN
    ALTER TABLE purchase_items ADD CONSTRAINT purchase_items_purchase_id_fkey
      FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE;
  END IF;
END $$;

-- purchase_items → products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'purchase_items_product_id_fkey'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='purchase_items' AND column_name='product_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='id'
  ) THEN
    ALTER TABLE purchase_items ADD CONSTRAINT purchase_items_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
  END IF;
END $$;

-- supplier_returns → suppliers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'supplier_returns_supplier_id_fkey'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='supplier_returns' AND column_name='supplier_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='id'
  ) THEN
    ALTER TABLE supplier_returns ADD CONSTRAINT supplier_returns_supplier_id_fkey
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- supplier_return_items → supplier_returns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'supplier_return_items_return_id_fkey'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='supplier_return_items' AND column_name='supplier_return_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='supplier_returns' AND column_name='id'
  ) THEN
    ALTER TABLE supplier_return_items ADD CONSTRAINT supplier_return_items_return_id_fkey
      FOREIGN KEY (supplier_return_id) REFERENCES supplier_returns(id) ON DELETE CASCADE;
  END IF;
END $$;

-- supplier_return_items → products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'supplier_return_items_product_id_fkey'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='supplier_return_items' AND column_name='product_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='id'
  ) THEN
    ALTER TABLE supplier_return_items ADD CONSTRAINT supplier_return_items_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
  END IF;
END $$;

-- fridge_sales → customers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fridge_sales_client_id_fkey'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='fridge_sales' AND column_name='client_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='id'
  ) THEN
    ALTER TABLE fridge_sales ADD CONSTRAINT fridge_sales_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES customers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- fridge_sales → mutuelles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fridge_sales_mutuelle_id_fkey'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='fridge_sales' AND column_name='mutuelle_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='mutuelles' AND column_name='id'
  ) THEN
    ALTER TABLE fridge_sales ADD CONSTRAINT fridge_sales_mutuelle_id_fkey
      FOREIGN KEY (mutuelle_id) REFERENCES mutuelles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- customers → mutuelles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customers_mutuelle_id_fkey'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='mutuelle_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='mutuelles' AND column_name='id'
  ) THEN
    ALTER TABLE customers ADD CONSTRAINT customers_mutuelle_id_fkey
      FOREIGN KEY (mutuelle_id) REFERENCES mutuelles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- customer_payments → customers
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name='customer_payments'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customer_payments_client_id_fkey'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='customer_payments' AND column_name='client_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='id'
  ) THEN
    ALTER TABLE customer_payments ADD CONSTRAINT customer_payments_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES customers(id) ON DELETE SET NULL;
  END IF;
END $$;
