-- Diagnostic rapide: vérifier FKs et types de colonnes
SELECT conname, conrelid::regclass AS table_from, confrelid::regclass AS table_to,
       a1.attname AS col_from, a2.attname AS col_to
FROM pg_constraint c
JOIN pg_attribute a1 ON a1.attrelid = c.conrelid AND a1.attnum = ANY(c.conkey)
JOIN pg_attribute a2 ON a2.attrelid = c.confrelid AND a2.attnum = ANY(c.confkey)
WHERE contype = 'f' AND c.connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text;

-- Types de colonnes critiques
SELECT table_name, column_name, udt_name AS type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'sales' AND column_name IN ('client_id','mutuelle_id','id'))
    OR (table_name = 'purchases' AND column_name IN ('supplier_id','id'))
    OR (table_name = 'customers' AND column_name IN ('id'))
    OR (table_name = 'mutuelles' AND column_name IN ('id'))
    OR (table_name = 'suppliers' AND column_name IN ('id'))
    OR (table_name = 'purchase_items' AND column_name IN ('purchase_id','product_id','prix_achat_ht'))
    OR (table_name = 'sale_items' AND column_name IN ('sale_id','product_id'))
  )
ORDER BY table_name, column_name;
