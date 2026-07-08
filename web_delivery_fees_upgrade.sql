ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS delivery_fee_standard NUMERIC(15,3) NOT NULL DEFAULT 0;

ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS delivery_fee_express NUMERIC(15,3) NOT NULL DEFAULT 0;

ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS delivery_fee_pickup NUMERIC(15,3) NOT NULL DEFAULT 0;

ALTER TABLE public.web_orders
  ADD COLUMN IF NOT EXISTS delivery_fee_ttc NUMERIC(15,3) NOT NULL DEFAULT 0;

UPDATE public.web_orders
SET delivery_fee_ttc = COALESCE(delivery_fee_ttc, 0)
WHERE delivery_fee_ttc IS NULL;

CREATE TABLE IF NOT EXISTS public.web_order_delivery_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.web_orders(id) ON DELETE CASCADE,
  old_fee_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  new_fee_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  old_total_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  new_total_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_order_delivery_history_order
  ON public.web_order_delivery_history(order_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.web_order_delivery_history TO anon, authenticated;

ALTER TABLE public.web_order_delivery_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS web_order_delivery_history_anon_all ON public.web_order_delivery_history;

CREATE POLICY web_order_delivery_history_anon_all
ON public.web_order_delivery_history
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);
