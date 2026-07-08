-- ============================================================================
-- FIX: RETOURS FOURNISSEURS - Ajout du trigger manquant
-- ============================================================================
-- Ce script corrige les tables de retours fournisseurs si vous avez deja
-- execute le schema principal sans le trigger de generation de numero.
-- ============================================================================

-- Verifier si les tables existent deja
DO $$
BEGIN
  -- Si supplier_returns n'existe pas, la creer
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'supplier_returns'
  ) THEN
    CREATE TABLE public.supplier_returns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      return_number TEXT UNIQUE,
      supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
      return_date DATE NOT NULL DEFAULT CURRENT_DATE,
      note TEXT,
      total_ht NUMERIC(15,3) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_supplier_returns_supplier ON public.supplier_returns (supplier_id);
    CREATE INDEX idx_supplier_returns_date ON public.supplier_returns (return_date DESC);
  END IF;

  -- Si supplier_return_items n'existe pas, la creer
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'supplier_return_items'
  ) THEN
    CREATE TABLE public.supplier_return_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      supplier_return_id UUID NOT NULL REFERENCES public.supplier_returns(id) ON DELETE CASCADE,
      product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
      quantite NUMERIC(15,3) NOT NULL DEFAULT 0,
      prix_achat_ht NUMERIC(15,3) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_supplier_return_items_return ON public.supplier_return_items (supplier_return_id);
    CREATE INDEX idx_supplier_return_items_product ON public.supplier_return_items (product_id);
  END IF;
END $$;

-- ============================================================================
-- Fonction pour generer les numeros de retour fournisseur (RET-000001)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_supplier_returns_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF COALESCE(TRIM(NEW.return_number), '') = '' THEN
    NEW.return_number := public.generate_prefixed_number('RET');
  END IF;
  RETURN NEW;
END;
$$;

-- Supprimer l'ancien trigger s'il existe et en creer un nouveau
DROP TRIGGER IF EXISTS trg_supplier_returns_defaults ON public.supplier_returns;
CREATE TRIGGER trg_supplier_returns_defaults
BEFORE INSERT ON public.supplier_returns
FOR EACH ROW
EXECUTE FUNCTION public.set_supplier_returns_defaults();

-- ============================================================================
-- Permissions
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_returns TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_return_items TO anon, authenticated;

-- ============================================================================
-- Row Level Security
-- ============================================================================
ALTER TABLE public.supplier_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_return_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS supplier_returns_allow_all ON public.supplier_returns;
CREATE POLICY supplier_returns_allow_all 
ON public.supplier_returns 
FOR ALL 
TO anon, authenticated 
USING (TRUE) 
WITH CHECK (TRUE);

DROP POLICY IF EXISTS supplier_return_items_allow_all ON public.supplier_return_items;
CREATE POLICY supplier_return_items_allow_all 
ON public.supplier_return_items 
FOR ALL 
TO anon, authenticated 
USING (TRUE) 
WITH CHECK (TRUE);

-- ============================================================================
-- Verification
-- ============================================================================
-- Verifier que tout est en place
SELECT 
  'supplier_returns' AS table_name,
  COUNT(*) AS row_count
FROM public.supplier_returns
UNION ALL
SELECT 
  'supplier_return_items' AS table_name,
  COUNT(*) AS row_count
FROM public.supplier_return_items;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
-- Ce script a cree/corrige les tables de retours fournisseurs.
-- Les nouveaux retours auront automatiquement un numero RET-000001, etc.
-- ============================================================================
