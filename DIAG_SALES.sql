-- Vérifier SPECIFIQUEMENT les FK de sales
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE contype = 'f'
  AND connamespace = 'public'::regnamespace
  AND (conrelid = 'sales'::regclass OR conrelid = 'purchase_items'::regclass);

-- Vérifier le nombre de lignes dans chaque table
SELECT 'sales' AS tbl, COUNT(*) AS rows FROM sales
UNION ALL SELECT 'sale_items', COUNT(*) FROM sale_items
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'mutuelles', COUNT(*) FROM mutuelles
UNION ALL SELECT 'purchases', COUNT(*) FROM purchases
UNION ALL SELECT 'purchase_items', COUNT(*) FROM purchase_items
UNION ALL SELECT 'suppliers', COUNT(*) FROM suppliers;

-- Tester directement la jointure PostgREST
SELECT s.numero_vente, c.nom AS client_nom, m.nom AS mutuelle_nom
FROM sales s
LEFT JOIN customers c ON s.client_id = c.id
LEFT JOIN mutuelles m ON s.mutuelle_id = m.id
LIMIT 5;
