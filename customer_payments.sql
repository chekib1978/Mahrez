CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS customer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  amount DECIMAL(15,3) NOT NULL DEFAULT 0,
  payment_mode TEXT NOT NULL DEFAULT 'ESPECE',
  reference TEXT,
  note TEXT,
  statut TEXT NOT NULL DEFAULT 'VALIDE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_payments_number
ON customer_payments(payment_number);

CREATE INDEX IF NOT EXISTS idx_customer_payments_client_date
ON customer_payments(client_id, payment_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE customer_payments TO anon, authenticated;

ALTER TABLE customer_payments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'customer_payments'
      AND policyname = 'customer_payments_select_all'
  ) THEN
    CREATE POLICY customer_payments_select_all
    ON public.customer_payments
    FOR SELECT
    TO anon, authenticated
    USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'customer_payments'
      AND policyname = 'customer_payments_insert_all'
  ) THEN
    CREATE POLICY customer_payments_insert_all
    ON public.customer_payments
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'customer_payments'
      AND policyname = 'customer_payments_update_all'
  ) THEN
    CREATE POLICY customer_payments_update_all
    ON public.customer_payments
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'customer_payments'
      AND policyname = 'customer_payments_delete_all'
  ) THEN
    CREATE POLICY customer_payments_delete_all
    ON public.customer_payments
    FOR DELETE
    TO anon, authenticated
    USING (true);
  END IF;
END $$;
