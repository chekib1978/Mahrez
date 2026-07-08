-- Correction post-schema : permissions + colonnes + séquences
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_sequences TO anon, authenticated;
ALTER TABLE public.document_sequences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS document_sequences_allow_all ON public.document_sequences;
CREATE POLICY document_sequences_allow_all ON public.document_sequences
  FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);

-- Colonnes manquantes
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS validated_by TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS validated_by_user_id UUID;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS created_by TEXT;
