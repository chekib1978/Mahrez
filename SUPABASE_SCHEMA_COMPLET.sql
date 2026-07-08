-- ============================================================================
-- SCHEMA COMPLET SUPABASE - PHARMACIE MAHREZ KAMMOUN
-- ============================================================================
-- Ce script cree l'integralite de la base de donnees pour l'application
-- Version: Complete
-- Date: 2026-06-14
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction pour mettre a jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- TABLE: document_sequences
-- Gestion des numeros de documents (VTE, ACH, BL, FAC, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.document_sequences (
  prefix TEXT PRIMARY KEY,
  last_value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.set_document_sequences_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_document_sequences_updated_at ON public.document_sequences;
CREATE TRIGGER trg_document_sequences_updated_at
BEFORE UPDATE ON public.document_sequences
FOR EACH ROW
EXECUTE FUNCTION public.set_document_sequences_updated_at();

-- Fonction pour generer des numeros de documents prefixes
CREATE OR REPLACE FUNCTION public.generate_prefixed_number(prefix TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_prefix TEXT := UPPER(COALESCE(NULLIF(TRIM(generate_prefixed_number.prefix), ''), 'REF'));
  next_value BIGINT;
BEGIN
  INSERT INTO public.document_sequences AS ds (prefix, last_value)
  VALUES (normalized_prefix, 1)
  ON CONFLICT ON CONSTRAINT document_sequences_pkey
  DO UPDATE SET last_value = ds.last_value + 1
  RETURNING ds.last_value INTO next_value;

  RETURN normalized_prefix || '-' || LPAD(next_value::TEXT, 6, '0');
END;
$$;

-- Fonction pour voir le prochain numero sans l'incrementer
CREATE OR REPLACE FUNCTION public.peek_prefixed_number(prefix TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_prefix TEXT := UPPER(COALESCE(NULLIF(TRIM(peek_prefixed_number.prefix), ''), 'REF'));
  current_value BIGINT := 0;
BEGIN
  SELECT ds.last_value
    INTO current_value
  FROM public.document_sequences ds
  WHERE ds.prefix = normalized_prefix;

  current_value := COALESCE(current_value, 0) + 1;
  RETURN normalized_prefix || '-' || LPAD(current_value::TEXT, 6, '0');
END;
$$;

-- ============================================================================
-- TABLE: mutuelles
-- Gestion des mutuelles (caisses d'assurance maladie)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.mutuelles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  taux_remboursement NUMERIC(15,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mutuelles_nom ON public.mutuelles (LOWER(nom));

-- ============================================================================
-- TABLE: customers
-- Gestion des clients
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  telephone TEXT,
  adresse TEXT,
  mutuelle_id UUID REFERENCES public.mutuelles(id) ON DELETE SET NULL,
  numero_matricule_mutuelle TEXT,
  nom_malade TEXT,
  solde NUMERIC(15,3) NOT NULL DEFAULT 0,
  en_cours NUMERIC(15,3) NOT NULL DEFAULT 0,
  reste_a_payer NUMERIC(15,3) NOT NULL DEFAULT 0,
  solde_initial NUMERIC(15,3) NOT NULL DEFAULT 0,
  date_initial DATE,
  email TEXT,
  source_client TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_nom ON public.customers (nom);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (telephone);
CREATE INDEX IF NOT EXISTS idx_customers_mutuelle ON public.customers (mutuelle_id);

DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- ============================================================================
-- TABLE: suppliers
-- Gestion des fournisseurs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  telephone TEXT,
  matricule_fiscale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_nom ON public.suppliers (nom);

-- ============================================================================
-- TABLE: products
-- Gestion des articles/produits
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_article TEXT NOT NULL,
  code_barre TEXT,
  designation TEXT NOT NULL,
  code_pct TEXT,
  stock_actuel NUMERIC(15,3) NOT NULL DEFAULT 0,
  peremption DATE,
  prix_achat_ht NUMERIC(15,3) NOT NULL DEFAULT 0,
  prix_achat_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  prix_vente_ht NUMERIC(15,3) NOT NULL DEFAULT 0,
  tva NUMERIC(15,3) NOT NULL DEFAULT 0,
  fodec_pct NUMERIC(15,3) NOT NULL DEFAULT 0,
  prix_vente_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  prix_vente_web_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  prix_vente_passager_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  remise_web_pct NUMERIC(15,3) NOT NULL DEFAULT 0,
  marge NUMERIC(15,3) NOT NULL DEFAULT 0,
  date_alerte DATE,
  image_url TEXT,
  description_web TEXT,
  product_brand TEXT,
  web_category_slug TEXT,
  is_web_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  old_price_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  promo_badge TEXT,
  product_gallery_urls TEXT,
  product_specs TEXT,
  forme TEXT,
  product_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_code_article ON public.products (code_article);
CREATE INDEX IF NOT EXISTS idx_products_designation ON public.products (designation);
CREATE INDEX IF NOT EXISTS idx_products_web_category_slug ON public.products (web_category_slug);

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- ============================================================================
-- TABLE: sales
-- Gestion des ventes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_vente TEXT UNIQUE,
  numero_bl TEXT UNIQUE,
  numero_facture TEXT UNIQUE,
  numero_devis TEXT UNIQUE,
  type_vente TEXT NOT NULL DEFAULT 'COMPTANT',
  client_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  mutuelle_id UUID REFERENCES public.mutuelles(id) ON DELETE SET NULL,
  payment_mode TEXT NOT NULL DEFAULT 'ESPECE',
  total_ht NUMERIC(15,3) NOT NULL DEFAULT 0,
  total_tva NUMERIC(15,3) NOT NULL DEFAULT 0,
  total_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'Valide',
  date_vente TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.set_sales_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF COALESCE(TRIM(NEW.numero_vente), '') = '' THEN
    NEW.numero_vente := public.generate_prefixed_number('VTE');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sales_defaults ON public.sales;
CREATE TRIGGER trg_sales_defaults
BEFORE INSERT ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.set_sales_defaults();

CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales (date_vente DESC);
CREATE INDEX IF NOT EXISTS idx_sales_client ON public.sales (client_id);
CREATE INDEX IF NOT EXISTS idx_sales_mutuelle ON public.sales (mutuelle_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_numero_bl ON public.sales (numero_bl) WHERE numero_bl IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_numero_facture ON public.sales (numero_facture) WHERE numero_facture IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_numero_devis ON public.sales (numero_devis) WHERE numero_devis IS NOT NULL;

-- Fonction pour assigner les numeros de documents BL, FAC, DEV
CREATE OR REPLACE FUNCTION public.assign_sale_document_number(p_sale_id UUID, p_doc_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_doc_type TEXT := UPPER(COALESCE(NULLIF(TRIM(p_doc_type), ''), ''));
  target_column TEXT;
  target_prefix TEXT;
  existing_value TEXT;
  next_number TEXT;
BEGIN
  IF normalized_doc_type IN ('BL', 'DELIVERY_NOTE') THEN
    target_column := 'numero_bl';
    target_prefix := 'BL';
  ELSIF normalized_doc_type IN ('FAC', 'FACTURE', 'INVOICE') THEN
    target_column := 'numero_facture';
    target_prefix := 'FAC';
  ELSIF normalized_doc_type IN ('DEV', 'DEVIS', 'QUOTE') THEN
    target_column := 'numero_devis';
    target_prefix := 'DEV';
  ELSE
    RAISE EXCEPTION 'Type document non supporte: %', normalized_doc_type;
  END IF;

  EXECUTE FORMAT('SELECT %I FROM public.sales WHERE id = $1', target_column)
    INTO existing_value
    USING p_sale_id;

  IF COALESCE(TRIM(existing_value), '') <> '' THEN
    RETURN existing_value;
  END IF;

  next_number := public.generate_prefixed_number(target_prefix);

  EXECUTE FORMAT(
    'UPDATE public.sales SET %1$I = $1 WHERE id = $2 AND COALESCE(TRIM(%1$I), '''') = '''' RETURNING %1$I',
    target_column
  )
    INTO existing_value
    USING next_number, p_sale_id;

  RETURN COALESCE(existing_value, next_number);
END;
$$;

-- ============================================================================
-- TABLE: sale_items
-- Lignes de vente
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
-- Gestion des achats
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_achat TEXT UNIQUE,
  date_achat DATE NOT NULL DEFAULT CURRENT_DATE,
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

CREATE OR REPLACE FUNCTION public.set_purchases_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF COALESCE(TRIM(NEW.numero_achat), '') = '' THEN
    NEW.numero_achat := public.generate_prefixed_number('ACH');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_purchases_defaults ON public.purchases;
CREATE TRIGGER trg_purchases_defaults
BEFORE INSERT ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.set_purchases_defaults();

-- ============================================================================
-- TABLE: purchase_items
-- Lignes d'achat
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantite NUMERIC(15,3) NOT NULL DEFAULT 0,
  quantite_gratuite NUMERIC(15,3) NOT NULL DEFAULT 0,
  prix_achat_ht NUMERIC(15,3) NOT NULL DEFAULT 0,
  prix_unitaire_ht NUMERIC(15,3) NOT NULL DEFAULT 0,
  fodec_pct NUMERIC(15,3) NOT NULL DEFAULT 1,
  remise NUMERIC(15,3) NOT NULL DEFAULT 0,
  peremption DATE,
  tva NUMERIC(15,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON public.purchase_items (purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product ON public.purchase_items (product_id);

-- ============================================================================
-- TABLE: supplier_returns
-- Gestion des retours fournisseurs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.supplier_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number TEXT UNIQUE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  total_ht NUMERIC(15,3) NOT NULL DEFAULT 0,
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

CREATE INDEX IF NOT EXISTS idx_supplier_returns_supplier ON public.supplier_returns (supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_returns_date ON public.supplier_returns (return_date DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_return_items_return ON public.supplier_return_items (supplier_return_id);
CREATE INDEX IF NOT EXISTS idx_supplier_return_items_product ON public.supplier_return_items (product_id);

-- Trigger pour generer automatiquement le numero de retour
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

DROP TRIGGER IF EXISTS trg_supplier_returns_defaults ON public.supplier_returns;
CREATE TRIGGER trg_supplier_returns_defaults
BEFORE INSERT ON public.supplier_returns
FOR EACH ROW
EXECUTE FUNCTION public.set_supplier_returns_defaults();

-- ============================================================================
-- TABLE: stock_operations
-- Gestion des operations de stock (Pret, Emprunt, Entree, Sortie)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_number TEXT NOT NULL UNIQUE,
  module_id TEXT NOT NULL,
  movement_type TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_code TEXT,
  product_designation TEXT,
  partner_name TEXT,
  note TEXT,
  quantity NUMERIC(15,3) NOT NULL DEFAULT 0,
  stock_effect NUMERIC(15,3) NOT NULL DEFAULT 0,
  operation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  CONSTRAINT stock_operations_module_check CHECK (
    module_id IN ('stock_pret', 'stock_emprunt', 'stock_entree', 'stock_sortie')
  ),
  CONSTRAINT stock_operations_type_check CHECK (
    movement_type IN ('PRET', 'EMPRUNT', 'ENTREE', 'SORTIE')
  )
);

CREATE INDEX IF NOT EXISTS stock_operations_module_date_idx ON public.stock_operations(module_id, operation_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS stock_operations_product_date_idx ON public.stock_operations(product_id, operation_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS stock_operations_type_date_idx ON public.stock_operations(movement_type, operation_date DESC, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_stock_operations_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_prefix TEXT;
BEGIN
  IF COALESCE(TRIM(NEW.operation_number), '') = '' THEN
    target_prefix := CASE UPPER(COALESCE(NEW.movement_type, ''))
      WHEN 'ENTREE' THEN 'ENT'
      WHEN 'SORTIE' THEN 'SOR'
      WHEN 'PRET' THEN 'PRT'
      WHEN 'EMPRUNT' THEN 'EMP'
      ELSE 'MOV'
    END;
    NEW.operation_number := public.generate_prefixed_number(target_prefix);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stock_operations_defaults ON public.stock_operations;
CREATE TRIGGER trg_stock_operations_defaults
BEFORE INSERT ON public.stock_operations
FOR EACH ROW
EXECUTE FUNCTION public.set_stock_operations_defaults();

-- ============================================================================
-- TABLE: fridge_sales
-- Gestion des ventes en attente (frigo)
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
  note TEXT,
  statut TEXT NOT NULL DEFAULT 'EN_ATTENTE',
  resumed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fridge_sales_status_expiry ON public.fridge_sales(statut, expiry_date);
CREATE INDEX IF NOT EXISTS idx_fridge_sales_client_date ON public.fridge_sales(client_id, fridge_date DESC);

DROP TRIGGER IF EXISTS trg_fridge_sales_updated_at ON public.fridge_sales;
CREATE TRIGGER trg_fridge_sales_updated_at
BEFORE UPDATE ON public.fridge_sales
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- ============================================================================
-- TABLE: customer_payments
-- Gestion des reglements clients
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  amount NUMERIC(15,3) NOT NULL DEFAULT 0,
  payment_mode TEXT NOT NULL DEFAULT 'ESPECE',
  reference TEXT,
  note TEXT,
  statut TEXT NOT NULL DEFAULT 'VALIDE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_payments_client_date ON public.customer_payments(client_id, payment_date DESC);

-- ============================================================================
-- TABLE: web_categories
-- Categories pour le site e-commerce
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.web_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.web_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_categories_parent_sort ON public.web_categories(parent_id, sort_order, name);

DROP TRIGGER IF EXISTS trg_web_categories_updated_at ON public.web_categories;
CREATE TRIGGER trg_web_categories_updated_at
BEFORE UPDATE ON public.web_categories
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- ============================================================================
-- TABLE: web_orders
-- Commandes du site e-commerce
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.web_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  customer_address TEXT,
  notes TEXT,
  delivery_mode TEXT DEFAULT 'Livraison standard',
  payment_mode TEXT DEFAULT 'Paiement a la livraison',
  delivery_fee_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  total_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Nouvelle',
  stock_decremented BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_orders_created_at ON public.web_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_web_orders_status ON public.web_orders(status, created_at DESC);

DROP TRIGGER IF EXISTS trg_web_orders_updated_at ON public.web_orders;
CREATE TRIGGER trg_web_orders_updated_at
BEFORE UPDATE ON public.web_orders
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

CREATE OR REPLACE FUNCTION public.set_web_orders_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF COALESCE(TRIM(NEW.order_number), '') = '' THEN
    NEW.order_number := public.generate_prefixed_number('WEB');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_web_orders_defaults ON public.web_orders;
CREATE TRIGGER trg_web_orders_defaults
BEFORE INSERT ON public.web_orders
FOR EACH ROW
EXECUTE FUNCTION public.set_web_orders_defaults();

-- ============================================================================
-- TABLE: web_order_items
-- Lignes de commande web
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.web_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.web_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity NUMERIC(15,3) NOT NULL DEFAULT 0,
  unit_price NUMERIC(15,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_order_items_order ON public.web_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_web_order_items_product ON public.web_order_items(product_id);

-- ============================================================================
-- TABLE: web_order_status_history
-- Historique des changements de statut
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.web_order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.web_orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_order_status_history_order ON public.web_order_status_history(order_id, created_at DESC);

-- ============================================================================
-- TABLE: web_order_delivery_history
-- Historique des modifications de frais de livraison
-- ============================================================================
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

CREATE INDEX IF NOT EXISTS idx_web_order_delivery_history_order ON public.web_order_delivery_history(order_id, created_at DESC);

-- ============================================================================
-- TABLE: web_product_reviews
-- Avis clients sur les produits
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.web_product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_title TEXT,
  comment TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_product_reviews_product ON public.web_product_reviews(product_id, created_at DESC);

-- ============================================================================
-- TABLE: web_customer_profiles
-- Profils clients pour auth Supabase
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.web_customer_profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_web_customer_profiles_updated_at ON public.web_customer_profiles;
CREATE TRIGGER trg_web_customer_profiles_updated_at
BEFORE UPDATE ON public.web_customer_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- ============================================================================
-- TABLE: web_customer_accounts
-- Comptes clients avec authentification par telephone
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.web_customer_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  address TEXT,
  session_token UUID,
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_customer_accounts_phone ON public.web_customer_accounts(phone);
CREATE INDEX IF NOT EXISTS idx_web_customer_accounts_session ON public.web_customer_accounts(session_token);
CREATE UNIQUE INDEX IF NOT EXISTS idx_web_customer_accounts_email ON public.web_customer_accounts(LOWER(email)) WHERE email IS NOT NULL AND TRIM(email) <> '';

DROP TRIGGER IF EXISTS trg_web_customer_accounts_updated_at ON public.web_customer_accounts;
CREATE TRIGGER trg_web_customer_accounts_updated_at
BEFORE UPDATE ON public.web_customer_accounts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- ============================================================================
-- TABLE: mutuelle_bordereaux
-- Releves de mutuelles
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.mutuelle_bordereaux (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_releve TEXT NOT NULL,
  mutuelle_id UUID REFERENCES public.mutuelles(id) ON DELETE RESTRICT,
  date_creation TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  tri_par TEXT NOT NULL DEFAULT 'date',
  total NUMERIC(15,3) NOT NULL DEFAULT 0,
  montant_a_rembourser NUMERIC(15,3) NOT NULL DEFAULT 0,
  deja_regle NUMERIC(15,3) NOT NULL DEFAULT 0,
  retenue_source NUMERIC(15,3) NOT NULL DEFAULT 0,
  reste NUMERIC(15,3) NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'BROUILLON',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mutuelle_bordereaux_mutuelle_date ON public.mutuelle_bordereaux(mutuelle_id, date_debut, date_fin);

-- ============================================================================
-- TABLE: mutuelle_bordereau_lignes
-- Lignes des releves de mutuelles
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.mutuelle_bordereau_lignes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bordereau_id UUID NOT NULL REFERENCES public.mutuelle_bordereaux(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  ordre INTEGER NOT NULL DEFAULT 0,
  num_vente TEXT,
  nom_client TEXT,
  nom_malade TEXT,
  matricule_mutuelle TEXT,
  date_vente TIMESTAMPTZ,
  total_ttc NUMERIC(15,3) NOT NULL DEFAULT 0,
  montant_rembourser NUMERIC(15,3) NOT NULL DEFAULT 0,
  total_ht NUMERIC(15,3) NOT NULL DEFAULT 0,
  libelle1 TEXT,
  libelle2 TEXT,
  libelle3 TEXT,
  libelle4 TEXT,
  libelle5 TEXT
);

CREATE INDEX IF NOT EXISTS idx_mutuelle_bordereau_lignes_bordereau ON public.mutuelle_bordereau_lignes(bordereau_id, ordre);

-- ============================================================================
-- TABLE: action_history
-- Historique des actions utilisateurs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.action_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id TEXT,
  username TEXT,
  full_name TEXT,
  poste_label TEXT,
  category TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'UPDATE',
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  entity_label TEXT,
  details JSONB NOT NULL DEFAULT '[]'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_action_history_created_at ON public.action_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_history_category ON public.action_history(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_history_entity ON public.action_history(entity_type, entity_id);

-- ============================================================================
-- TABLE: company_settings
-- Parametres de l'entreprise
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.company_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  company_name TEXT,
  subtitle TEXT,
  address TEXT,
  city TEXT,
  phone TEXT,
  mobile TEXT,
  email TEXT,
  fiscal_id TEXT,
  website TEXT,
  rib TEXT,
  pharmacist_code TEXT,
  delivery_fee_standard NUMERIC(15,3) NOT NULL DEFAULT 0,
  delivery_fee_express NUMERIC(15,3) NOT NULL DEFAULT 0,
  delivery_fee_pickup NUMERIC(15,3) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT company_settings_singleton CHECK (id = 1)
);

DROP TRIGGER IF EXISTS trg_company_settings_updated_at ON public.company_settings;
CREATE TRIGGER trg_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- ============================================================================
-- TABLE: backoffice_users
-- Utilisateurs du backoffice
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.backoffice_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  full_name TEXT,
  password_text TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  allowed_modules JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PERMISSIONS ET ROW LEVEL SECURITY
-- ============================================================================

-- Accorder les permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mutuelles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_items TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchases TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_items TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_returns TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_return_items TO anon, authenticated;
GRANT SELECT, INSERT ON public.action_history TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_settings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.backoffice_users TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fridge_sales TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_payments TO anon, authenticated;
GRANT ALL ON public.stock_operations TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.web_categories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.web_orders TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.web_order_items TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.web_order_status_history TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.web_order_delivery_history TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.web_product_reviews TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.web_customer_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.web_customer_accounts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mutuelle_bordereaux TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mutuelle_bordereau_lignes TO anon, authenticated;

-- Activer Row Level Security sur toutes les tables
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

-- ============================================================================
-- POLITIQUES RLS (Row Level Security)
-- Politiques permissives pour tous les utilisateurs anon et authenticated
-- ============================================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'mutuelles',
    'customers',
    'products',
    'suppliers',
    'sales',
    'sale_items',
    'purchases',
    'purchase_items',
    'supplier_returns',
    'supplier_return_items',
    'company_settings',
    'backoffice_users',
    'fridge_sales',
    'customer_payments',
    'stock_operations',
    'web_categories',
    'web_orders',
    'web_order_items',
    'web_order_status_history',
    'web_order_delivery_history',
    'web_product_reviews',
    'web_customer_accounts',
    'mutuelle_bordereaux',
    'mutuelle_bordereau_lignes'
  ]
  LOOP
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I_allow_all ON public.%I', tbl, tbl);
    EXECUTE FORMAT('CREATE POLICY %I_allow_all ON public.%I FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE)', tbl, tbl);
  END LOOP;
END
$$;

-- Politique speciale pour web_customer_profiles (accès basé sur auth.uid())
DROP POLICY IF EXISTS web_customer_profiles_select_own ON public.web_customer_profiles;
CREATE POLICY web_customer_profiles_select_own
  ON public.web_customer_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS web_customer_profiles_insert_own ON public.web_customer_profiles;
CREATE POLICY web_customer_profiles_insert_own
  ON public.web_customer_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS web_customer_profiles_update_own ON public.web_customer_profiles;
CREATE POLICY web_customer_profiles_update_own
  ON public.web_customer_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politique pour action_history (insertion seulement)
DROP POLICY IF EXISTS action_history_insert_all ON public.action_history;
CREATE POLICY action_history_insert_all
  ON public.action_history
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS action_history_select_all ON public.action_history;
CREATE POLICY action_history_select_all
  ON public.action_history
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- ============================================================================
-- DONNEES INITIALES
-- ============================================================================

-- Inserer une ligne de configuration par defaut si elle n'existe pas
INSERT INTO public.company_settings (id, company_name, subtitle)
VALUES (1, 'Pharmacie Mahrez Kammoun', 'Votre sante, notre priorite')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
-- Pour executer ce script:
-- 1. Connectez-vous a votre projet Supabase
-- 2. Allez dans SQL Editor
-- 3. Copiez-collez ce script complet
-- 4. Executez-le
-- 
-- Note: Ce script est idempotent, vous pouvez l'executer plusieurs fois
-- sans risque de duplication ou d'erreur.
-- ============================================================================
