CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS fridge_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fridge_number TEXT NOT NULL,
  sale_type TEXT NOT NULL DEFAULT 'COMPTANT',
  client_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  mutuelle_id UUID REFERENCES mutuelles(id) ON DELETE SET NULL,
  total_ht DECIMAL(15,3) NOT NULL DEFAULT 0,
  total_tva DECIMAL(15,3) NOT NULL DEFAULT 0,
  total_ttc DECIMAL(15,3) NOT NULL DEFAULT 0,
  sale_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  fridge_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry_date TIMESTAMPTZ NOT NULL,
  note TEXT,
  statut TEXT NOT NULL DEFAULT 'EN_ATTENTE',
  resumed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fridge_sales_number
ON fridge_sales(fridge_number);

CREATE INDEX IF NOT EXISTS idx_fridge_sales_status_expiry
ON fridge_sales(statut, expiry_date);

CREATE INDEX IF NOT EXISTS idx_fridge_sales_client_date
ON fridge_sales(client_id, fridge_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE fridge_sales TO anon, authenticated;

ALTER TABLE fridge_sales ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'fridge_sales'
      AND policyname = 'fridge_sales_select_all'
  ) THEN
    CREATE POLICY fridge_sales_select_all
    ON public.fridge_sales
    FOR SELECT
    TO anon, authenticated
    USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'fridge_sales'
      AND policyname = 'fridge_sales_insert_all'
  ) THEN
    CREATE POLICY fridge_sales_insert_all
    ON public.fridge_sales
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'fridge_sales'
      AND policyname = 'fridge_sales_update_all'
  ) THEN
    CREATE POLICY fridge_sales_update_all
    ON public.fridge_sales
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'fridge_sales'
      AND policyname = 'fridge_sales_delete_all'
  ) THEN
    CREATE POLICY fridge_sales_delete_all
    ON public.fridge_sales
    FOR DELETE
    TO anon, authenticated
    USING (true);
  END IF;
END $$;
