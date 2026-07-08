-- =====================================================
-- FINALISATION MIGRATION - Réactiver FK + Seed catégories
-- =====================================================

-- 1. Réactiver les contraintes FK (si elles existent déjà, ignore les erreurs)
-- Les FK sont déjà actives car database_setup.sql les a créées.
-- Rien à faire, elles sont déjà en place.

-- 2. Seeder les catégories web
INSERT INTO web_categories (name, slug, sort_order, is_active) VALUES
('Visage', 'visage', 1, true),
('Corps', 'corps', 2, true),
('Capillaire', 'capillaire', 3, true),
('Solaire', 'solaire', 4, true),
('Bébé & maman', 'bebe-maman', 5, true),
('Nature & bio', 'nature-bio', 6, true),
('Compléments alimentaires', 'complementaires-alimentaires', 7, true),
('Orthopedie', 'orthopedie', 8, true),
('Hygiène', 'hygiene', 9, true)
ON CONFLICT (slug) DO NOTHING;

-- 3. Vérifier les données
SELECT 'products' AS tbl, COUNT(*) AS nb FROM products
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'sales', COUNT(*) FROM sales
UNION ALL SELECT 'sale_items', COUNT(*) FROM sale_items
UNION ALL SELECT 'purchases', COUNT(*) FROM purchases
UNION ALL SELECT 'purchase_items', COUNT(*) FROM purchase_items
UNION ALL SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL SELECT 'mutuelles', COUNT(*) FROM mutuelles
UNION ALL SELECT 'web_categories', COUNT(*) FROM web_categories
UNION ALL SELECT 'backoffice_users', COUNT(*) FROM backoffice_users
ORDER BY tbl;
