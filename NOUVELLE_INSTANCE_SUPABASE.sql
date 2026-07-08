-- =====================================================
-- SCRIPT SQL COMPLET : NOUVELLE INSTANCE SUPABASE
-- Parapharmacie E-commerce
-- =====================================================
-- 1. Extensions
-- 2. Tables (schéma complet)
-- 3. Web Categories (arbre complet)
-- 4. Company Settings (données par défaut)
-- 5. Auth RPC Functions (inscription/login/session)
-- 6. RLS Policies
-- 7. Indexes
-- =====================================================

-- =====================================================
-- 1. EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- 2. TABLES
-- =====================================================

-- Fix: Ajouter colonnes manquantes à sales (si table existe déjà)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sales') THEN
    ALTER TABLE sales ADD COLUMN IF NOT EXISTS validated_by TEXT;
    ALTER TABLE sales ADD COLUMN IF NOT EXISTS validated_by_user_id UUID;
    ALTER TABLE sales ADD COLUMN IF NOT EXISTS created_by TEXT;
  END IF;
END $$;

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Tunisia',
  ice TEXT,
  rc TEXT,
  mf TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Customers (backoffice)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  loyalty_points INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  compare_price NUMERIC DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  sku TEXT,
  barcode TEXT,
  category TEXT,
  subcategory TEXT,
  brand TEXT,
  image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  stock_quantity INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_promo BOOLEAN DEFAULT false,
  promo_price NUMERIC,
  rating_avg NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  supplier_id UUID REFERENCES suppliers(id),
  origin TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Web Categories
CREATE TABLE IF NOT EXISTS web_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES web_categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  icon TEXT,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Web Orders
CREATE TABLE IF NOT EXISTS web_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  guest_email TEXT,
  guest_phone TEXT,
  guest_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','preparing','shipped','delivered','cancelled','refunded')),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  shipping_cost NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'MAD',
  payment_method TEXT DEFAULT 'cash_on_delivery',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  shipping_address JSONB,
  billing_address JSONB,
  notes TEXT,
  tracking_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Web Order Items
CREATE TABLE IF NOT EXISTS web_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES web_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_code TEXT,
  product_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Web Order Status History
CREATE TABLE IF NOT EXISTS web_order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES web_orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Web Product Reviews
CREATE TABLE IF NOT EXISTS web_product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Web Customer Accounts
CREATE TABLE IF NOT EXISTS web_customer_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  default_address JSONB,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Company Settings
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT DEFAULT 'Parapharmacie',
  company_email TEXT,
  company_phone TEXT,
  company_address TEXT,
  company_city TEXT,
  company_postal_code TEXT,
  company_country TEXT DEFAULT 'Tunisia',
  company_website TEXT,
  company_logo_url TEXT,
  default_currency TEXT DEFAULT 'MAD',
  default_vat_rate NUMERIC DEFAULT 19,
  shipping_cost NUMERIC DEFAULT 25,
  free_shipping_min NUMERIC DEFAULT 200,
  maintenance_mode BOOLEAN DEFAULT false,
  tax_enabled BOOLEAN DEFAULT false,
  invoice_prefix TEXT DEFAULT 'INV',
  order_prefix TEXT DEFAULT 'ORD',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Supplier Invoices
CREATE TABLE IF NOT EXISTS supplier_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id),
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  total NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','partial','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Supplier Invoice Items
CREATE TABLE IF NOT EXISTS supplier_invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES supplier_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_code TEXT,
  product_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Supplier Returns
CREATE TABLE IF NOT EXISTS supplier_returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id),
  return_number TEXT NOT NULL,
  return_date DATE NOT NULL,
  reason TEXT,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processed','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Supplier Return Items
CREATE TABLE IF NOT EXISTS supplier_return_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_id UUID REFERENCES supplier_returns(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_code TEXT,
  product_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Stock Operations
CREATE TABLE IF NOT EXISTS stock_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  operation_type TEXT NOT NULL CHECK (operation_type IN ('purchase','sale','return','adjustment','damaged','expired')),
  quantity INTEGER NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  performed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Invoices (backoffice)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  vat_rate NUMERIC DEFAULT 0,
  vat_amount NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled')),
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Invoice Lines
CREATE TABLE IF NOT EXISTS invoice_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fridge Deposits
CREATE TABLE IF NOT EXISTS fridge_deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  fridge_serial TEXT,
  deposit_date DATE NOT NULL,
  return_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','returned','expired')),
  deposit_amount NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fridge Stock Operations
CREATE TABLE IF NOT EXISTS fridge_stock_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fridge_id UUID REFERENCES fridge_deposits(id),
  product_id UUID REFERENCES products(id),
  operation_type TEXT NOT NULL CHECK (operation_type IN ('deposit','withdrawal','expired','returned')),
  quantity INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  performed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Document Sequences
CREATE TABLE IF NOT EXISTS document_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type TEXT UNIQUE NOT NULL,
  current_number INTEGER NOT NULL DEFAULT 0,
  prefix TEXT DEFAULT '',
  suffix TEXT DEFAULT '',
  padding_length INTEGER DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fridge Expiry Warnings
CREATE TABLE IF NOT EXISTS fridge_expiry_warnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  warning_date DATE NOT NULL,
  expiry_date DATE,
  quantity INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','notified','resolved')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 3. WEB CATEGORIES (Arbre complet)
-- =====================================================

-- Catégories parentes
INSERT INTO web_categories (name, slug, description, icon, display_order, is_active) VALUES
('Visage', 'visage', 'Soin du visage, nettoyants, crèmes, masques', 'sparkles', 1, true),
('Corps', 'corps', 'Soin du corps, huiles, lotions, gommages', 'heart', 2, true),
('Capillaire', 'capillaire', 'Soin des cheveux, shampoings, soins', 'scissors', 3, true),
('Solaire', 'solaire', 'Protection solaire, après-soleil, autobronzants', 'sun', 4, true),
('Bébé & maman', 'bebe-maman', 'Produits pour bébé et maman', 'baby', 5, true),
('Nature & bio', 'nature-bio', 'Produits naturels et biologiques', 'leaf', 6, true),
('Compléments alimentaires', 'complementaires-alimentaires', 'Vitamines, minéraux, compléments', 'pill', 7, true),
('Orthopedie', 'orthopedie', 'Matériel orthopédique et contention', 'activity', 8, true),
('Hygiène', 'hygiene', 'Hygiène corporelle et intime', 'shield', 9, true)
ON CONFLICT (slug) DO NOTHING;

-- Sous-catégories Visage
DO $$
DECLARE
  visage_id UUID;
BEGIN
  SELECT id INTO visage_id FROM web_categories WHERE slug = 'visage';
  IF visage_id IS NOT NULL THEN
    INSERT INTO web_categories (name, slug, description, parent_id, display_order, is_active) VALUES
    ('Nettoyants', 'nettoyants-visage', 'Gels, mousses, laits démaquillants', visage_id, 1, true),
    ('Crèmes hydratantes', 'cremes-hydratantes', 'Crèmes de jour, de nuit, hydratantes', visage_id, 2, true),
    ('Sérums & concentrés', 'serums-concentres', 'Sérums anti-âge, éclat, taches', visage_id, 3, true),
    ('Masques', 'masques-visage', 'Masques purifiants, hydratants, exfoliants', visage_id, 4, true),
    ('Contour des yeux et lèvres', 'contour-yeux-levres', 'Soins spécifiques yeux et lèvres', visage_id, 5, true),
    ('Anti-âge', 'anti-age', 'Produits anti-rides et fermeté', visage_id, 6, true),
    ('Peaux sensibles', 'peaux-sensibles', 'Soins pour peaux sensibles et réactives', visage_id, 7, true),
    ('Peaux mixtes à grasses', 'peaux-mixtes-grasses', 'Matifiants, purifiants, anti-boutons', visage_id, 8, true)
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

-- Sous-catégories Corps
DO $$
DECLARE
  corps_id UUID;
BEGIN
  SELECT id INTO corps_id FROM web_categories WHERE slug = 'corps';
  IF corps_id IS NOT NULL THEN
    INSERT INTO web_categories (name, slug, description, parent_id, display_order, is_active) VALUES
    ('Hydratants corps', 'hydratants-corps', 'Beurres, lotions, laits corporels', corps_id, 1, true),
    ('Huiles corporelles', 'huiles-corporelles', 'Huiles de massage, nourrissantes', corps_id, 2, true),
    ('Gommages corps', 'gommages-corps', 'Gommages physiques et enzymatiques', corps_id, 3, true),
    ('Mains & pieds', 'mains-pieds', 'Soins des mains et des pieds', corps_id, 4, true),
    ('Anti-cellulite', 'anti-cellulite', 'Produits raffermisants et amincissants', corps_id, 5, true),
    ('Déodorants', 'deodorants', 'Déodorants naturels et efficaces', corps_id, 6, true)
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

-- Sous-catégories Capillaire
DO $$
DECLARE
  cap_id UUID;
BEGIN
  SELECT id INTO cap_id FROM web_categories WHERE slug = 'capillaire';
  IF cap_id IS NOT NULL THEN
    INSERT INTO web_categories (name, slug, description, parent_id, display_order, is_active) VALUES
    ('Shampoings', 'shampoings', 'Shampoings pour tous types de cheveux', cap_id, 1, true),
    ('Soins capillaires', 'soins-capillaires', 'Après-shampoings, masques, huiles', cap_id, 2, true),
    ('Coloration', 'coloration', 'Colorants et teintures', cap_id, 3, true),
    ('Coiffage', 'coiffage', 'Laques, mousses, gels, cires', cap_id, 4, true),
    ('Anti-pelliculaire', 'anti-pelliculaire', 'Traitements pellicules et cuir chevelu', cap_id, 5, true),
    ('Chute de cheveux', 'chute-cheveux', 'Anti-chute, stimulateurs de pousse', cap_id, 6, true)
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

-- Sous-catégories Solaire
DO $$
DECLARE
  sol_id UUID;
BEGIN
  SELECT id INTO sol_id FROM web_categories WHERE slug = 'solaire';
  IF sol_id IS NOT NULL THEN
    INSERT INTO web_categories (name, slug, description, parent_id, display_order, is_active) VALUES
    ('Crèmes solaires', 'cremes-solaires', 'Protection solaire haute, moyenne, basse', sol_id, 1, true),
    ('Après-soleil', 'apres-soleil', 'Hydratation et apaisement après exposition', sol_id, 2, true),
    ('Autobronzants', 'autobronzants', 'Produits auto-bronzeurs et bronzer', sol_id, 3, true),
    ('Solaires enfants', 'solaire-enfants', 'Protection spéciale pour enfants', sol_id, 4, true),
    ('Lèvres & yeux solaires', 'levres-yeux-solaires', 'Protection zone lèvres et contour yeux', sol_id, 5, true)
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

-- Sous-catégories Bébé & maman
DO $$
DECLARE
  bebe_id UUID;
BEGIN
  SELECT id INTO bebe_id FROM web_categories WHERE slug = 'bebe-maman';
  IF bebe_id IS NOT NULL THEN
    INSERT INTO web_categories (name, slug, description, parent_id, display_order, is_active) VALUES
    ('Soins bébé', 'soins-bebe', 'Bains, huiles, crèmes pour bébé', bebe_id, 1, true),
    ('Hygiène bébé', 'hygiene-bebe', 'Couches, lingettes, change', bebe_id, 2, true),
    ('Alimentation bébé', 'alimentation-bebe', 'Laits, biberons, diversification', bebe_id, 3, true),
    ('Soins maman', 'soins-maman', 'Soins grossesse, post-partum, allaitement', bebe_id, 4, true),
    ('Vêtements bébé', 'vetements-bebe', 'Vêtements et accessoires bébé', bebe_id, 5, true)
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

-- Sous-catégories Nature & bio
DO $$
DECLARE
  nature_id UUID;
BEGIN
  SELECT id INTO nature_id FROM web_categories WHERE slug = 'nature-bio';
  IF nature_id IS NOT NULL THEN
    INSERT INTO web_categories (name, slug, description, parent_id, display_order, is_active) VALUES
    ('Cosmétiques bio', 'cosmetiques-bio', 'Produits certifiés bio et naturels', nature_id, 1, true),
    ('Huiles essentielles', 'huiles-essentielles', 'HE pures et mélanges', nature_id, 2, true),
    ('Phytothérapie', 'phytotherapie', 'Plantes médicinaales et tisanes', nature_id, 3, true),
    ('Aromathérapie', 'aromatherapie', 'Diffuseurs, bougies, bien-être', nature_id, 4, true),
    ('Maison naturelle', 'maison-naturelle', 'Entretien ménager naturel', nature_id, 5, true)
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

-- Sous-catégories Compléments alimentaires
DO $$
DECLARE
  comp_id UUID;
BEGIN
  SELECT id INTO comp_id FROM web_categories WHERE slug = 'complementaires-alimentaires';
  IF comp_id IS NOT NULL THEN
    INSERT INTO web_categories (name, slug, description, parent_id, display_order, is_active) VALUES
    ('Vitamines & minéraux', 'vitamines-mineraux', 'Vitamines, minéraux, oligo-éléments', comp_id, 1, true),
    ('Oméga & acides gras', 'omega-acides-gras', 'Oméga 3, 6, 9 et huiles de poisson', comp_id, 2, true),
    ('Probiotiques', 'probiotiques', 'Flore intestinale et digestion', comp_id, 3, true),
    ('Minceur & énergie', 'minceur-energie', 'Brûle-graisse, énergie, sport', comp_id, 4, true),
    ('Immunité', 'immunite', 'Renforcement immunitaire', comp_id, 5, true),
    ('Sommeil & stress', 'sommeil-stress', 'Relaxation, sommeil, anxiété', comp_id, 6, true),
    ('Peau, cheveux, ongles', 'peau-cheveux-ongles', 'Beauté intérieure', comp_id, 7, true),
    ('Vision', 'vision', 'Santé oculaire et vision', comp_id, 8, true)
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

-- Sous-catégories Orthopédie
DO $$
DECLARE
  ortho_id UUID;
BEGIN
  SELECT id INTO ortho_id FROM web_categories WHERE slug = 'orthopedie';
  IF ortho_id IS NOT NULL THEN
    INSERT INTO web_categories (name, slug, description, parent_id, display_order, is_active) VALUES
    ('Contentions', 'contentions', 'Bandages, manchons, ceintures', ortho_id, 1, true),
    ('Genouillères', 'genouilleres', 'Supports et genouillères thérapeutiques', ortho_id, 2, true),
    ('Chevillères', 'chevilleres', 'Attelles et supports de cheville', ortho_id, 3, true),
    ('Orthèses', 'ortheses', 'Semelles, coussinets, supports plantaires', ortho_id, 4, true),
    ('Écharpes & béquilles', 'echarpes-bequilles', 'Écharpes, béquilles, fauteuil', ortho_id, 5, true)
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

-- Sous-catégories Hygiène
DO $$
DECLARE
  hyg_id UUID;
BEGIN
  SELECT id INTO hyg_id FROM web_categories WHERE slug = 'hygiene';
  IF hyg_id IS NOT NULL THEN
    INSERT INTO web_categories (name, slug, description, parent_id, display_order, is_active) VALUES
    ('Hygiène corporelle', 'hygiene-corporelle', 'Savons, gel douche, déodorants', hyg_id, 1, true),
    ('Hygiène intime', 'hygiene-intime', 'Produits d'hygiène intime', hyg_id, 2, true),
    ('Hygiène bucco-dentaire', 'hygiene-bucco-dentaire', 'Dentifrices, bains de bouche, brossets', hyg_id, 3, true),
    ('Déodorants', 'deodorants-hygiene', 'Spray, stick, roll-on', hyg_id, 4, true),
    ('Rasage & épilation', 'rasage-epilation', 'Crèmes, rasoirs, cires', hyg_id, 5, true)
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

-- =====================================================
-- 4. COMPANY SETTINGS (Données par défaut)
-- =====================================================
INSERT INTO company_settings (
  company_name,
  company_email,
  company_phone,
  company_address,
  company_city,
  company_postal_code,
  company_country,
  default_currency,
  default_vat_rate,
  shipping_cost,
  free_shipping_min,
  tax_enabled,
  invoice_prefix,
  order_prefix
) VALUES (
  'Parapharmacie Sparkle',
  'contact@parapharmacie-sparkle.tn',
  '+216 71 123 456',
  'Avenue Habib Bourguiba',
  'Tunis',
  '1000',
  'Tunisia',
  'MAD',
  19,
  25,
  200,
  false,
  'INV',
  'ORD'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. AUTH RPC FUNCTIONS
-- =====================================================

-- Fast register: create auth user + web_customer_account + customer
CREATE OR REPLACE FUNCTION public.web_customer_fast_register(
  p_email TEXT,
  p_password TEXT,
  p_first_name TEXT DEFAULT '',
  p_last_name TEXT DEFAULT '',
  p_phone TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_auth_user_id UUID;
  v_customer_id UUID;
  v_web_account_id UUID;
  v_result JSONB;
BEGIN
  -- Create auth user
  v_auth_user_id := gen_random_uuid();
  
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token
  ) VALUES (
    v_auth_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    p_email, crypt(p_password, gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}',
    jsonb_build_object('first_name', p_first_name, 'last_name', p_last_name, 'phone', p_phone),
    now(), now(), '', ''
  );

  -- Create customer record
  INSERT INTO customers (first_name, last_name, email, phone)
  VALUES (p_first_name, p_last_name, p_email, p_phone)
  RETURNING id INTO v_customer_id;

  -- Create web customer account
  INSERT INTO web_customer_accounts (auth_user_id, customer_id, email, first_name, last_name, phone)
  VALUES (v_auth_user_id, v_customer_id, p_email, p_first_name, p_last_name, p_phone)
  RETURNING id INTO v_web_account_id;

  v_result := jsonb_build_object(
    'success', true,
    'user_id', v_auth_user_id,
    'customer_id', v_customer_id,
    'web_account_id', v_web_account_id
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Fast login: email + password
CREATE OR REPLACE FUNCTION public.web_customer_fast_login(
  p_email TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_customer RECORD;
  v_web_account RECORD;
  v_result JSONB;
BEGIN
  -- Find auth user
  SELECT id, email, encrypted_password, raw_user_meta_data
  INTO v_user
  FROM auth.users
  WHERE email = p_email AND aud = 'authenticated';

  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email ou mot de passe incorrect');
  END IF;

  -- Verify password
  IF NOT (v_user.encrypted_password = crypt(p_password, v_user.encrypted_password)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email ou mot de passe incorrect');
  END IF;

  -- Get web account
  SELECT * INTO v_web_account
  FROM web_customer_accounts
  WHERE auth_user_id = v_user.id AND is_active = true;

  IF v_web_account IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Compte non trouvé');
  END IF;

  -- Get customer
  SELECT * INTO v_customer
  FROM customers
  WHERE id = v_web_account.customer_id;

  -- Update last login
  UPDATE web_customer_accounts SET last_login = now() WHERE id = v_web_account.id;

  v_result := jsonb_build_object(
    'success', true,
    'user_id', v_user.id,
    'customer_id', v_web_account.customer_id,
    'web_account_id', v_web_account.id,
    'email', v_user.email,
    'first_name', v_web_account.first_name,
    'last_name', v_web_account.last_name,
    'phone', v_web_account.phone,
    'default_address', v_web_account.default_address,
    'loyalty_points', COALESCE(v_customer.loyalty_points, 0)
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Fast session: get user data by auth_user_id
CREATE OR REPLACE FUNCTION public.web_customer_fast_session(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_web_account RECORD;
  v_customer RECORD;
  v_result JSONB;
BEGIN
  SELECT * INTO v_web_account
  FROM web_customer_accounts
  WHERE auth_user_id = p_user_id AND is_active = true;

  IF v_web_account IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session non trouvée');
  END IF;

  SELECT * INTO v_customer
  FROM customers
  WHERE id = v_web_account.customer_id;

  v_result := jsonb_build_object(
    'success', true,
    'user_id', v_web_account.auth_user_id,
    'customer_id', v_web_account.customer_id,
    'web_account_id', v_web_account.id,
    'email', v_web_account.email,
    'first_name', v_web_account.first_name,
    'last_name', v_web_account.last_name,
    'phone', v_web_account.phone,
    'default_address', v_web_account.default_address,
    'loyalty_points', COALESCE(v_customer.loyalty_points, 0)
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Fast update profile
CREATE OR REPLACE FUNCTION public.web_customer_fast_update_profile(
  p_user_id UUID,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_default_address JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_web_account_id UUID;
  v_customer_id UUID;
BEGIN
  SELECT id, customer_id INTO v_web_account_id, v_customer_id
  FROM web_customer_accounts
  WHERE auth_user_id = p_user_id AND is_active = true;

  IF v_web_account_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Compte non trouvé');
  END IF;

  UPDATE web_customer_accounts SET
    first_name = COALESCE(p_first_name, first_name),
    last_name = COALESCE(p_last_name, last_name),
    phone = COALESCE(p_phone, phone),
    default_address = COALESCE(p_default_address, default_address),
    updated_at = now()
  WHERE id = v_web_account_id;

  UPDATE customers SET
    first_name = COALESCE(p_first_name, first_name),
    last_name = COALESCE(p_last_name, last_name),
    phone = COALESCE(p_phone, phone),
    updated_at = now()
  WHERE id = v_customer_id;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Fast logout
CREATE OR REPLACE FUNCTION public.web_customer_fast_logout(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE web_customer_accounts SET last_login = NULL WHERE auth_user_id = p_user_id;
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Sync web_customer_accounts to customers
CREATE OR REPLACE FUNCTION public.sync_web_customer_to_customers()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE customers SET
    first_name = NEW.first_name,
    last_name = NEW.last_name,
    phone = NEW.phone,
    updated_at = now()
  WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$;

-- Trigger for auto-sync
DROP TRIGGER IF EXISTS trg_sync_web_customer ON web_customer_accounts;
CREATE TRIGGER trg_sync_web_customer
  AFTER UPDATE ON web_customer_accounts
  FOR EACH ROW
  EXECUTE FUNCTION sync_web_customer_to_customers();

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_customer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE fridge_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE fridge_stock_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE fridge_expiry_warnings ENABLE ROW LEVEL SECURITY;

-- Products: public read, authenticated write
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Products are insertable by authenticated" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Products are updatable by authenticated" ON products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Products are deletable by authenticated" ON products FOR DELETE USING (auth.role() = 'authenticated');

-- Web Categories: public read, authenticated write
CREATE POLICY "Categories are viewable by everyone" ON web_categories FOR SELECT USING (true);
CREATE POLICY "Categories are insertable by authenticated" ON web_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Categories are updatable by authenticated" ON web_categories FOR UPDATE USING (auth.role() = 'authenticated');

-- Web Orders: customers see own, authenticated sees all
CREATE POLICY "Orders viewable by owner or admin" ON web_orders FOR SELECT
  USING (
    auth.role() = 'authenticated'
    OR customer_id IN (SELECT id FROM customers WHERE email = auth.email())
  );
CREATE POLICY "Orders insertable by anyone" ON web_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Orders updatable by authenticated" ON web_orders FOR UPDATE USING (auth.role() = 'authenticated');

-- Web Order Items: follow order access
CREATE POLICY "Order items follow order access" ON web_order_items FOR SELECT
  USING (
    auth.role() = 'authenticated'
    OR order_id IN (
      SELECT id FROM web_orders
      WHERE customer_id IN (SELECT id FROM customers WHERE email = auth.email())
    )
  );
CREATE POLICY "Order items insertable by anyone" ON web_order_items FOR INSERT WITH CHECK (true);

-- Web Order Status History: authenticated only
CREATE POLICY "Status history viewable by authenticated" ON web_order_status_history FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Status history insertable by authenticated" ON web_order_status_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Web Product Reviews: public read, owner/admin write
CREATE POLICY "Reviews are viewable by everyone" ON web_product_reviews FOR SELECT USING (true);
CREATE POLICY "Reviews insertable by authenticated" ON web_product_reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Reviews updatable by owner or admin" ON web_product_reviews FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    OR customer_id IN (SELECT id FROM customers WHERE email = auth.email())
  );

-- Web Customer Accounts: owner/admin only
CREATE POLICY "Accounts viewable by owner or admin" ON web_customer_accounts FOR SELECT
  USING (
    auth.role() = 'authenticated'
    OR auth_user_id = auth.uid()
  );
CREATE POLICY "Accounts insertable by anyone" ON web_customer_accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Accounts updatable by owner or admin" ON web_customer_accounts FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    OR auth_user_id = auth.uid()
  );

-- Customers: authenticated only (backoffice)
CREATE POLICY "Customers viewable by authenticated" ON customers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Customers insertable by authenticated" ON customers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Customers updatable by authenticated" ON customers FOR UPDATE USING (auth.role() = 'authenticated');

-- Company Settings: public read, authenticated write
CREATE POLICY "Settings viewable by everyone" ON company_settings FOR SELECT USING (true);
CREATE POLICY "Settings updatable by authenticated" ON company_settings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Settings insertable by authenticated" ON company_settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Suppliers: authenticated only
CREATE POLICY "Suppliers viewable by authenticated" ON suppliers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Suppliers insertable by authenticated" ON suppliers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Suppliers updatable by authenticated" ON suppliers FOR UPDATE USING (auth.role() = 'authenticated');

-- Supplier Invoices: authenticated only
CREATE POLICY "Supplier invoices viewable by authenticated" ON supplier_invoices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Supplier invoices insertable by authenticated" ON supplier_invoices FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Supplier invoices updatable by authenticated" ON supplier_invoices FOR UPDATE USING (auth.role() = 'authenticated');

-- Supplier Invoice Items: authenticated only
CREATE POLICY "Supplier invoice items viewable by authenticated" ON supplier_invoice_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Supplier invoice items insertable by authenticated" ON supplier_invoice_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Supplier Returns: authenticated only
CREATE POLICY "Supplier returns viewable by authenticated" ON supplier_returns FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Supplier returns insertable by authenticated" ON supplier_returns FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Supplier returns updatable by authenticated" ON supplier_returns FOR UPDATE USING (auth.role() = 'authenticated');

-- Supplier Return Items: authenticated only
CREATE POLICY "Supplier return items viewable by authenticated" ON supplier_return_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Supplier return items insertable by authenticated" ON supplier_return_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Stock Operations: authenticated only
CREATE POLICY "Stock operations viewable by authenticated" ON stock_operations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Stock operations insertable by authenticated" ON stock_operations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Invoices: authenticated only
CREATE POLICY "Invoices viewable by authenticated" ON invoices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Invoices insertable by authenticated" ON invoices FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Invoices updatable by authenticated" ON invoices FOR UPDATE USING (auth.role() = 'authenticated');

-- Invoice Lines: authenticated only
CREATE POLICY "Invoice lines viewable by authenticated" ON invoice_lines FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Invoice lines insertable by authenticated" ON invoice_lines FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Fridge Deposits: authenticated only
CREATE POLICY "Fridge deposits viewable by authenticated" ON fridge_deposits FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Fridge deposits insertable by authenticated" ON fridge_deposits FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Fridge deposits updatable by authenticated" ON fridge_deposits FOR UPDATE USING (auth.role() = 'authenticated');

-- Fridge Stock Operations: authenticated only
CREATE POLICY "Fridge stock ops viewable by authenticated" ON fridge_stock_operations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Fridge stock ops insertable by authenticated" ON fridge_stock_operations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Document Sequences: authenticated only
CREATE POLICY "Doc sequences viewable by authenticated" ON document_sequences FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Doc sequences updatable by authenticated" ON document_sequences FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Doc sequences insertable by authenticated" ON document_sequences FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Fridge Expiry Warnings: authenticated only
CREATE POLICY "Expiry warnings viewable by authenticated" ON fridge_expiry_warnings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Expiry warnings insertable by authenticated" ON fridge_expiry_warnings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Expiry warnings updatable by authenticated" ON fridge_expiry_warnings FOR UPDATE USING (auth.role() = 'authenticated');

-- =====================================================
-- 7. INDEXES (Performance)
-- =====================================================

-- Products
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_promo ON products(is_promo);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity);

-- Web Categories
CREATE INDEX IF NOT EXISTS idx_web_categories_slug ON web_categories(slug);
CREATE INDEX IF NOT EXISTS idx_web_categories_parent ON web_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_web_categories_active ON web_categories(is_active);

-- Web Orders
CREATE INDEX IF NOT EXISTS idx_web_orders_customer ON web_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_web_orders_status ON web_orders(status);
CREATE INDEX IF NOT EXISTS idx_web_orders_created ON web_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_web_orders_number ON web_orders(order_number);

-- Web Order Items
CREATE INDEX IF NOT EXISTS idx_web_order_items_order ON web_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_web_order_items_product ON web_order_items(product_id);

-- Web Product Reviews
CREATE INDEX IF NOT EXISTS idx_web_reviews_product ON web_product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_web_reviews_customer ON web_product_reviews(customer_id);

-- Web Customer Accounts
CREATE INDEX IF NOT EXISTS idx_web_accounts_auth ON web_customer_accounts(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_web_accounts_email ON web_customer_accounts(email);
CREATE INDEX IF NOT EXISTS idx_web_accounts_customer ON web_customer_accounts(customer_id);

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Stock Operations
CREATE INDEX IF NOT EXISTS idx_stock_ops_product ON stock_operations(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_ops_type ON stock_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_stock_ops_created ON stock_operations(created_at);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created ON invoices(created_at);

-- Supplier Invoices
CREATE INDEX IF NOT EXISTS idx_supplier_inv_supplier ON supplier_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_inv_status ON supplier_invoices(status);

-- Fridge Deposits
CREATE INDEX IF NOT EXISTS idx_fridge_dep_customer ON fridge_deposits(customer_id);
CREATE INDEX IF NOT EXISTS idx_fridge_dep_status ON fridge_deposits(status);

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================
