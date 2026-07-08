-- Correction Nlle Instance : colonnes manquantes + RLS
ALTER TABLE sales ADD COLUMN IF NOT EXISTS validated_by TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS validated_by_user_id UUID;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS created_by TEXT;

-- RLS pour document_sequences
DROP POLICY IF EXISTS document_sequences_allow_all ON document_sequences;
CREATE POLICY document_sequences_allow_all ON document_sequences
  FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);
ALTER TABLE document_sequences ENABLE ROW LEVEL SECURITY;
