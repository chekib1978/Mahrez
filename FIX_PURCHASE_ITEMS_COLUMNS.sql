-- Ajouter les colonnes manquantes dans purchase_items
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS tva NUMERIC(15,3) NOT NULL DEFAULT 0;
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS prix_unitaire_ht NUMERIC(15,3) NOT NULL DEFAULT 0;
