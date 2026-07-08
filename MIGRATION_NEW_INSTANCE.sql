-- ============================================================================
-- MIGRATION COMPLETE - NOUVELLE INSTANCE SUPABASE
-- Pharmacie Mahrez Kammoun
-- ============================================================================
-- 1. Création du schéma complet
-- 2. Désactivation temporaire des FK pour l'import
-- 3. Réactivation après import
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : EXTENSIONS ET FONCTIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

-- ============================================================================
-- TABLE: document_sequences
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.document_sequences (
  prefix TEXT PRIMARY KEY,
  last_value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_document_sequences_updated_at ON public.document_sequences;
CREATE TRIGGER trg_document_sequences_updated_at
BEFORE UPDATE ON public.document_sequences
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

CREATE OR REPLACE FUNCTION public.generate_prefixed_number(prefix TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE normalized_prefix TEXT := UPPER(COALESCE(NULLIF(TRIM(prefix), ''), 'REF')); next_value BIGINT;
BEGIN
  INSERT INTO public.document_sequences AS ds (prefix, last_value)
  VALUES (normalized_prefix, 1)
  ON CONFLICT ON CONSTRAINT document_sequences_pkey
  DO UPDATE SET last_value = ds.last_value + 1
  RETURNING ds.last_value INTO next_value;
  RETURN normalized_prefix || '-' || LPAD(next_value::TEXT, 6, '0');
END;
$$;

-- ============================================================================
-- TABLE: company_settings
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.company_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  company_name TEXT, subtitle TEXT, address TEXT, city TEXT, phone TEXT,
  mobile TEXT, email TEXT, fiscal_id TEXT, website TEXT, rib TEXT,
  pharmacist_code TEXT,
  delivery_fee_standard NUMERIC(15,3) NOT NULL DEFAULT 0,
  delivery_fee_express NUMERIC(15,3) NOT NULL DEFAULT 0,
  delivery_fee_pickup NUMERIC(15,3) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT company_settings_singleton CHECK (id = 1)
);

INSERT INTO public.company_settings (id, company_name, subtitle)
VALUES (1, 'Pharmacie Mahrez Kammoun', 'Votre sante, notre priorite')
ON CONFLICT (id) DO NOTHING;

-- Fonction pour générer les numéros de vente automatiquement
CREATE OR REPLACE FUNCTION public.set_sales_defaults()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF COALESCE(TRIM(NEW.numero_vente), '') = '' THEN
    NEW.numero_vente := public.generate_prefixed_number('VTE');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_purchases_defaults()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF COALESCE(TRIM(NEW.numero_achat), '') = '' THEN
    NEW.numero_achat := public.generate_prefixed_number('ACH');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_supplier_returns_defaults()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF COALESCE(TRIM(NEW.return_number), '') = '' THEN
    NEW.return_number := public.generate_prefixed_number('RET');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_web_orders_defaults()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF COALESCE(TRIM(NEW.order_number), '') = '' THEN
    NEW.order_number := public.generate_prefixed_number('WEB');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_stock_operations_defaults()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE target_prefix TEXT;
BEGIN
  IF COALESCE(TRIM(NEW.operation_number), '') = '' THEN
    target_prefix := CASE UPPER(COALESCE(NEW.movement_type, ''))
      WHEN 'ENTREE' THEN 'ENT' WHEN 'SORTIE' THEN 'SOR'
      WHEN 'PRET' THEN 'PRT' WHEN 'EMPRUNT' THEN 'EMP'
      ELSE 'MOV'
    END;
    NEW.operation_number := public.generate_prefixed_number(target_prefix);
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- TABLE: backoffice_users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.backoffice_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE, full_name TEXT, password_text TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  allowed_modules JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: mutuelles
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.mutuelles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  taux_remboursement NUMERIC(15,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mutuelles_nom ON public.mutuelles (LOWER(nom));

-- ============================================================================
-- TABLE: suppliers
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL, telephone TEXT, matricule_fiscale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_suppliers_nom ON public.suppliers (nom);

-- ============================================================================
-- TABLE: products
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_article TEXT NOT NULL, code_barre TEXT, designation TEXT NOT NULL,
  code_pct TEXT, stock_actuel NUMERIC(15,3) NOT NULL DEFAULT 0,
  peremption DATE, prix_achat_ht NUMERIC(15,3) NOT NULL DEFAULT 0,
  prix_achat_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  prix_vente_ht NUMERIC(15,3) NOT NULL DEFAULT 0,
  tva NUMERIC(15,3) NOT NULL DEFAULT 0,
  fodec_pct NUMERIC(15,3) NOT NULL DEFAULT 0,
  prix_vente_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  prix_vente_web_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  prix_vente_passager_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  remise_web_pct NUMERIC(15,3) NOT NULL DEFAULT 0,
  marge NUMERIC(15,3) NOT NULL DEFAULT 0,
  date_alerte DATE, image_url TEXT, description_web TEXT,
  product_brand TEXT, web_category_slug TEXT,
  is_web_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  old_price_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  promo_badge TEXT, product_gallery_urls TEXT, product_specs TEXT,
  forme TEXT, product_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_code_article ON public.products (code_article);
CREATE INDEX IF NOT EXISTS idx_products_designation ON public.products (designation);
CREATE INDEX IF NOT EXISTS idx_products_web_category_slug ON public.products (web_category_slug);

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- ============================================================================
-- TABLE: customers
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL, telephone TEXT, adresse TEXT,
  mutuelle_id UUID REFERENCES public.mutuelles(id) ON DELETE SET NULL,
  numero_matricule_mutuelle TEXT, nom_malade TEXT,
  solde NUMERIC(15,3) NOT NULL DEFAULT 0,
  en_cours NUMERIC(15,3) NOT NULL DEFAULT 0,
  reste_a_payer NUMERIC(15,3) NOT NULL DEFAULT 0,
  solde_initial NUMERIC(15,3) NOT NULL DEFAULT 0,
  date_initial DATE, email TEXT, source_client TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_nom ON public.customers (nom);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (telephone);
CREATE INDEX IF NOT EXISTS idx_customers_mutuelle ON public.customers (mutuelle_id);

DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- ============================================================================
-- TABLE: sales
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_vente TEXT UNIQUE, numero_bl TEXT UNIQUE,
  numero_facture TEXT UNIQUE, numero_devis TEXT UNIQUE,
  type_vente TEXT NOT NULL DEFAULT 'COMPTANT',
  client_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  mutuelle_id UUID REFERENCES public.mutuelles(id) ON DELETE SET NULL,
  payment_mode TEXT NOT NULL DEFAULT 'ESPECE',
  total_ht NUMERIC(15,3) NOT NULL DEFAULT 0,
  total_tva NUMERIC(15,3) NOT NULL DEFAULT 0,
  total_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'Valide',
  date_vente TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  validated_by TEXT, validated_by_user_id UUID, created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_sales_defaults ON public.sales;
CREATE TRIGGER trg_sales_defaults
BEFORE INSERT ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.set_sales_defaults();

CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales (date_vente DESC);
CREATE INDEX IF NOT EXISTS idx_sales_client ON public.sales (client_id);
CREATE INDEX IF NOT EXISTS idx_sales_mutuelle ON public.sales (mutuelle_id);

-- ============================================================================
-- TABLE: sale_items
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantite NUMERIC(15,3) NOT NULL DEFAULT 0,
  prix_unitaire_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  remise NUMERIC(15,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items (sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON public.sale_items (product_id);

-- ============================================================================
-- TABLE: purchases
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_achat TEXT UNIQUE, date_achat DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  num_bl_fact TEXT,
  total_ht_net NUMERIC(15,3) NOT NULL DEFAULT 0,
  total_fodec NUMERIC(15,3) NOT NULL DEFAULT 0,
  total_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON public.purchases (date_achat DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON public.purchases (supplier_id);

DROP TRIGGER IF EXISTS trg_purchases_defaults ON public.purchases;
CREATE TRIGGER trg_purchases_defaults
BEFORE INSERT ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.set_purchases_defaults();

-- ============================================================================
-- TABLE: purchase_items
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantite NUMERIC(15,3) NOT NULL DEFAULT 0,
  quantite_gratuite NUMERIC(15,3) NOT NULL DEFAULT 0,
  prix_achat_ht NUMERIC(15,3) NOT NULL DEFAULT 0,
  fodec_pct NUMERIC(15,3) NOT NULL DEFAULT 1,
  remise NUMERIC(15,3) NOT NULL DEFAULT 0,
  peremption DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON public.purchase_items (purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product ON public.purchase_items (product_id);

-- ============================================================================
-- TABLE: supplier_returns
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.supplier_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number TEXT UNIQUE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT, total_ht NUMERIC(15,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.supplier_return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_return_id UUID NOT NULL REFERENCES public.supplier_returns(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantite NUMERIC(15,3) NOT NULL DEFAULT 0,
  prix_achat_ht NUMERIC(15,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: stock_operations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_number TEXT NOT NULL UNIQUE,
  module_id TEXT NOT NULL, movement_type TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_code TEXT, product_designation TEXT, partner_name TEXT,
  note TEXT, quantity NUMERIC(15,3) NOT NULL DEFAULT 0,
  stock_effect NUMERIC(15,3) NOT NULL DEFAULT 0,
  operation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by TEXT
);

DROP TRIGGER IF EXISTS trg_stock_operations_defaults ON public.stock_operations;
CREATE TRIGGER trg_stock_operations_defaults
BEFORE INSERT ON public.stock_operations
FOR EACH ROW EXECUTE FUNCTION public.set_stock_operations_defaults();

-- ============================================================================
-- TABLE: fridge_sales
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.fridge_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fridge_number TEXT NOT NULL UNIQUE,
  sale_type TEXT NOT NULL DEFAULT 'COMPTANT',
  client_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  mutuelle_id UUID REFERENCES public.mutuelles(id) ON DELETE SET NULL,
  total_ht NUMERIC(15,3) NOT NULL DEFAULT 0,
  total_tva NUMERIC(15,3) NOT NULL DEFAULT 0,
  total_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  sale_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
  fridge_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry_date TIMESTAMPTZ NOT NULL,
  note TEXT, statut TEXT NOT NULL DEFAULT 'EN_ATTENTE',
  resumed_at TIMESTAMPTZ, cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: customer_payments
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  amount NUMERIC(15,3) NOT NULL DEFAULT 0,
  payment_mode TEXT NOT NULL DEFAULT 'ESPECE',
  reference TEXT, note TEXT, statut TEXT NOT NULL DEFAULT 'VALIDE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: web_categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.web_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.web_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: web_orders
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.web_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL, customer_phone TEXT, customer_email TEXT,
  customer_address TEXT, notes TEXT,
  delivery_mode TEXT DEFAULT 'Livraison standard',
  payment_mode TEXT DEFAULT 'Paiement a la livraison',
  delivery_fee_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  total_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Nouvelle',
  stock_decremented BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: web_order_items
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.web_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.web_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity NUMERIC(15,3) NOT NULL DEFAULT 0,
  unit_price NUMERIC(15,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: web_order_status_history
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.web_order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.web_orders(id) ON DELETE CASCADE,
  old_status TEXT, new_status TEXT NOT NULL, note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: web_order_delivery_history
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.web_order_delivery_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.web_orders(id) ON DELETE CASCADE,
  old_fee_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  new_fee_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  old_total_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  new_total_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  note TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: web_product_reviews
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.web_product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_title TEXT, comment TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: web_customer_profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.web_customer_profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE, full_name TEXT NOT NULL, phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: web_customer_accounts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.web_customer_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE, email TEXT, password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL, address TEXT, session_token UUID,
  last_login_at TIMESTAMPTZ, is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: mutuelle_bordereaux
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.mutuelle_bordereaux (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_releve TEXT NOT NULL,
  mutuelle_id UUID REFERENCES public.mutuelles(id) ON DELETE RESTRICT,
  date_creation TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date_debut DATE NOT NULL, date_fin DATE NOT NULL,
  tri_par TEXT NOT NULL DEFAULT 'date',
  total NUMERIC(15,3) NOT NULL DEFAULT 0,
  montant_a_rembourser NUMERIC(15,3) NOT NULL DEFAULT 0,
  deja_regle NUMERIC(15,3) NOT NULL DEFAULT 0,
  retenue_source NUMERIC(15,3) NOT NULL DEFAULT 0,
  reste NUMERIC(15,3) NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'BROUILLON',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mutuelle_bordereau_lignes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bordereau_id UUID NOT NULL REFERENCES public.mutuelle_bordereaux(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  ordre INTEGER NOT NULL DEFAULT 0,
  num_vente TEXT, nom_client TEXT, nom_malade TEXT,
  matricule_mutuelle TEXT, date_vente TIMESTAMPTZ,
  total_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  montant_rembourser NUMERIC(15,3) NOT NULL DEFAULT 0,
  total_ht NUMERIC(15,3) NOT NULL DEFAULT 0,
  libelle1 TEXT, libelle2 TEXT, libelle3 TEXT, libelle4 TEXT, libelle5 TEXT
);

-- ============================================================================
-- TABLE: action_history
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.action_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id TEXT, username TEXT, full_name TEXT, poste_label TEXT,
  category TEXT NOT NULL, action TEXT NOT NULL DEFAULT 'UPDATE',
  entity_type TEXT NOT NULL, entity_id TEXT, entity_label TEXT,
  details JSONB NOT NULL DEFAULT '[]'::JSONB
);

-- ============================================================================
-- PERMISSIONS ET RLS
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
ALTER TABLE public.mutuelles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backoffice_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fridge_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_order_delivery_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_customer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mutuelle_bordereaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mutuelle_bordereau_lignes ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE tbl TEXT; BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'mutuelles','customers','products','suppliers','sales','sale_items',
    'purchases','purchase_items','supplier_returns','supplier_return_items',
    'company_settings','backoffice_users','fridge_sales','customer_payments',
    'stock_operations','web_categories','web_orders','web_order_items',
    'web_order_status_history','web_order_delivery_history',
    'web_product_reviews','web_customer_accounts',
    'mutuelle_bordereaux','mutuelle_bordereau_lignes'
  ] LOOP
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I_allow_all ON public.%I', tbl, tbl);
    EXECUTE FORMAT('CREATE POLICY %I_allow_all ON public.%I FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE)', tbl, tbl);
  END LOOP;
END $$;

DROP POLICY IF EXISTS action_history_insert_all ON public.action_history;
CREATE POLICY action_history_insert_all ON public.action_history FOR INSERT TO anon, authenticated WITH CHECK (TRUE);
DROP POLICY IF EXISTS action_history_select_all ON public.action_history;
CREATE POLICY action_history_select_all ON public.action_history FOR SELECT TO anon, authenticated USING (TRUE);

-- ============================================================================
-- PARTIE 2 : DESACTIVATION DES FK POUR L'IMPORT
-- ============================================================================
-- Executez cette partie SEULEMENT si vous importez via CSV/script
-- ============================================================================

ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_mutuelle_id_fkey;
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_client_id_fkey;
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_mutuelle_id_fkey;
ALTER TABLE public.sale_items DROP CONSTRAINT IF EXISTS sale_items_product_id_fkey;
ALTER TABLE public.sale_items DROP CONSTRAINT IF EXISTS sale_items_sale_id_fkey;
ALTER TABLE public.purchases DROP CONSTRAINT IF EXISTS purchases_supplier_id_fkey;
ALTER TABLE public.purchase_items DROP CONSTRAINT IF EXISTS purchase_items_product_id_fkey;
ALTER TABLE public.purchase_items DROP CONSTRAINT IF EXISTS purchase_items_purchase_id_fkey;
ALTER TABLE public.supplier_returns DROP CONSTRAINT IF EXISTS supplier_returns_supplier_id_fkey;
ALTER TABLE public.supplier_return_items DROP CONSTRAINT IF EXISTS supplier_return_items_supplier_return_id_fkey;
ALTER TABLE public.supplier_return_items DROP CONSTRAINT IF EXISTS supplier_return_items_product_id_fkey;
ALTER TABLE public.customer_payments DROP CONSTRAINT IF EXISTS customer_payments_client_id_fkey;
ALTER TABLE public.fridge_sales DROP CONSTRAINT IF EXISTS fridge_sales_client_id_fkey;
ALTER TABLE public.fridge_sales DROP CONSTRAINT IF EXISTS fridge_sales_mutuelle_id_fkey;
ALTER TABLE public.stock_operations DROP CONSTRAINT IF EXISTS stock_operations_product_id_fkey;
ALTER TABLE public.web_order_items DROP CONSTRAINT IF EXISTS web_order_items_order_id_fkey;
ALTER TABLE public.web_order_items DROP CONSTRAINT IF EXISTS web_order_items_product_id_fkey;
ALTER TABLE public.web_order_status_history DROP CONSTRAINT IF EXISTS web_order_status_history_order_id_fkey;
ALTER TABLE public.web_order_delivery_history DROP CONSTRAINT IF EXISTS web_order_delivery_history_order_id_fkey;
ALTER TABLE public.web_product_reviews DROP CONSTRAINT IF EXISTS web_product_reviews_product_id_fkey;
ALTER TABLE public.mutuelle_bordereau_lignes DROP CONSTRAINT IF EXISTS mutuelle_bordereau_lignes_bordereau_id_fkey;
ALTER TABLE public.mutuelle_bordereau_lignes DROP CONSTRAINT IF EXISTS mutuelle_bordereau_lignes_sale_id_fkey;
ALTER TABLE public.mutuelle_bordereau_lignes DROP CONSTRAINT IF EXISTS mutuelle_bordereau_lignes_client_id_fkey;
ALTER TABLE public.mutuelle_bordereaux DROP CONSTRAINT IF EXISTS mutuelle_bordereaux_mutuelle_id_fkey;

-- ============================================================================
-- PARTIE 3 : REACTIVATION DES FK (APRES IMPORT)
-- ============================================================================
-- Executez ceci APRES avoir importe toutes les donnees
-- Decommentez et executez apres l'import
-- ============================================================================

-- ALTER TABLE public.customers ADD CONSTRAINT customers_mutuelle_id_fkey FOREIGN KEY (mutuelle_id) REFERENCES public.mutuelles(id) ON DELETE SET NULL;
-- ALTER TABLE public.sales ADD CONSTRAINT sales_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.customers(id) ON DELETE SET NULL;
-- ALTER TABLE public.sales ADD CONSTRAINT sales_mutuelle_id_fkey FOREIGN KEY (mutuelle_id) REFERENCES public.mutuelles(id) ON DELETE SET NULL;
-- ALTER TABLE public.sale_items ADD CONSTRAINT sale_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
-- ALTER TABLE public.sale_items ADD CONSTRAINT sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;
-- ALTER TABLE public.purchases ADD CONSTRAINT purchases_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;
-- ALTER TABLE public.purchase_items ADD CONSTRAINT purchase_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
-- ALTER TABLE public.purchase_items ADD CONSTRAINT purchase_items_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.purchases(id) ON DELETE CASCADE;
-- ALTER TABLE public.supplier_returns ADD CONSTRAINT supplier_returns_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;
-- ALTER TABLE public.supplier_return_items ADD CONSTRAINT supplier_return_items_supplier_return_id_fkey FOREIGN KEY (supplier_return_id) REFERENCES public.supplier_returns(id) ON DELETE CASCADE;
-- ALTER TABLE public.supplier_return_items ADD CONSTRAINT supplier_return_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
-- ALTER TABLE public.customer_payments ADD CONSTRAINT customer_payments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.customers(id) ON DELETE CASCADE;
-- ALTER TABLE public.fridge_sales ADD CONSTRAINT fridge_sales_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.customers(id) ON DELETE SET NULL;
-- ALTER TABLE public.fridge_sales ADD CONSTRAINT fridge_sales_mutuelle_id_fkey FOREIGN KEY (mutuelle_id) REFERENCES public.mutuelles(id) ON DELETE SET NULL;
-- ALTER TABLE public.stock_operations ADD CONSTRAINT stock_operations_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
-- ALTER TABLE public.web_order_items ADD CONSTRAINT web_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.web_orders(id) ON DELETE CASCADE;
-- ALTER TABLE public.web_order_items ADD CONSTRAINT web_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
-- ALTER TABLE public.web_order_status_history ADD CONSTRAINT web_order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.web_orders(id) ON DELETE CASCADE;
-- ALTER TABLE public.web_order_delivery_history ADD CONSTRAINT web_order_delivery_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.web_orders(id) ON DELETE CASCADE;
-- ALTER TABLE public.web_product_reviews ADD CONSTRAINT web_product_reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
-- ALTER TABLE public.mutuelle_bordereaux ADD CONSTRAINT mutuelle_bordereaux_mutuelle_id_fkey FOREIGN KEY (mutuelle_id) REFERENCES public.mutuelles(id) ON DELETE RESTRICT;
-- ALTER TABLE public.mutuelle_bordereau_lignes ADD CONSTRAINT mutuelle_bordereau_lignes_bordereau_id_fkey FOREIGN KEY (bordereau_id) REFERENCES public.mutuelle_bordereaux(id) ON DELETE CASCADE;
-- ALTER TABLE public.mutuelle_bordereau_lignes ADD CONSTRAINT mutuelle_bordereau_lignes_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE SET NULL;
-- ALTER TABLE public.mutuelle_bordereau_lignes ADD CONSTRAINT mutuelle_bordereau_lignes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.customers(id) ON DELETE SET NULL;
