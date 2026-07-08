# 📥 GUIDE D'IMPORTATION DES CSV VERS SUPABASE

## 🔴 Erreur rencontrée

```
ERROR: 23503: insert or update on table "customers" violates foreign key constraint
"customers_mutuelle_id_fkey"
Key (mutuelle_id)=(7f66efbf-6c19-43cd-b049-831f01ecac9e) is not present in table "mutuelles"
```

**Cause :** Vous avez importé les clients AVANT les mutuelles.

---

## ✅ SOLUTION 1 : MÉTHODE RECOMMANDÉE - Ordre d'importation

Importez vos CSV dans CET ORDRE EXACT :

### 📋 Ordre d'importation obligatoire :

```
1️⃣  mutuelles.csv          ← COMMENCER PAR ICI
2️⃣  suppliers.csv          
3️⃣  products.csv           
4️⃣  customers.csv          ← Maintenant les mutuelles existent
5️⃣  sales.csv              
6️⃣  sale_items.csv         
7️⃣  purchases.csv          
8️⃣  purchase_items.csv     
9️⃣  supplier_returns.csv   
🔟  supplier_return_items.csv
1️⃣1️⃣  customer_payments.csv
1️⃣2️⃣  fridge_sales.csv
1️⃣3️⃣  web_orders.csv
1️⃣4️⃣  web_order_items.csv
1️⃣5️⃣  stock_operations.csv
1️⃣6️⃣  web_product_reviews.csv
1️⃣7️⃣  mutuelle_bordereaux.csv
1️⃣8️⃣  mutuelle_bordereau_lignes.csv
```

### 📝 Procédure pour chaque fichier :

1. Dans Supabase, allez dans **Table Editor**
2. Cliquez sur la table correspondante (ex: mutuelles)
3. Cliquez sur **Insert** (bouton vert)
4. Sélectionnez **Import data via spreadsheet**
5. Choisissez votre fichier CSV
6. Cliquez sur **Import**
7. ✅ Vérifiez que l'import est réussi
8. Passez au fichier suivant

---

## ✅ SOLUTION 2 : MÉTHODE ALTERNATIVE - Sans ordre spécifique

Si vous voulez importer dans n'importe quel ordre (déconseillé mais possible) :

### Étape 1 : Désactiver les contraintes

Exécutez dans **SQL Editor** la PREMIÈRE PARTIE du fichier :
```
SUPABASE_IMPORT_CSV_HELPER.sql (partie ÉTAPE 1)
```

### Étape 2 : Importer tous vos CSV

Importez maintenant dans l'ordre que vous voulez :
- mutuelles.csv
- customers.csv
- suppliers.csv
- products.csv
- sales.csv
- etc.

### Étape 3 : Réactiver les contraintes

Exécutez dans **SQL Editor** la DEUXIÈME PARTIE du fichier :
```
SUPABASE_IMPORT_CSV_HELPER.sql (partie ÉTAPE 3)
```

---

## 🔍 Vérification après importation

Exécutez ces requêtes SQL pour vérifier :

```sql
-- Compter les lignes importées
SELECT 'mutuelles' AS table_name, COUNT(*) AS count FROM mutuelles
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'sales', COUNT(*) FROM sales
UNION ALL
SELECT 'purchases', COUNT(*) FROM purchases
ORDER BY table_name;

-- Vérifier les contraintes (ne devrait pas avoir d'erreurs)
SELECT 
  c.nom AS customer_name,
  c.mutuelle_id,
  m.nom AS mutuelle_name
FROM customers c
LEFT JOIN mutuelles m ON c.mutuelle_id = m.id
WHERE c.mutuelle_id IS NOT NULL
LIMIT 10;
```

---

## ⚠️ Problèmes courants et solutions

### Problème 1 : Colonnes manquantes dans le CSV
**Erreur :** `column "xxx" does not exist`  
**Solution :** Vérifiez que votre CSV a exactement les mêmes noms de colonnes que la table Supabase

### Problème 2 : Format de date incorrect
**Erreur :** `invalid input syntax for type date`  
**Solution :** Format attendu : `YYYY-MM-DD` (exemple: 2026-06-14)

### Problème 3 : UUID invalide
**Erreur :** `invalid input syntax for type uuid`  
**Solution :** Les UUID doivent être au format : `7f66efbf-6c19-43cd-b049-831f01ecac9e`

### Problème 4 : Valeurs NULL dans colonnes NOT NULL
**Erreur :** `null value in column "xxx" violates not-null constraint`  
**Solution :** Remplissez les colonnes obligatoires ou utilisez des valeurs par défaut

---

## 📊 Colonnes importantes à vérifier

### Table `mutuelles`
- ✅ `nom` (obligatoire)
- ✅ `taux_remboursement` (doit être un nombre)

### Table `customers`
- ✅ `nom` (obligatoire)
- ⚠️ `mutuelle_id` (doit exister dans table mutuelles)

### Table `products`
- ✅ `code_article` (obligatoire et unique)
- ✅ `designation` (obligatoire)

### Table `suppliers`
- ✅ `nom` (obligatoire)

---

## 🎯 Recommandation

**Utilisez la SOLUTION 1** (ordre d'importation) car :
- ✅ Plus sûr
- ✅ Plus simple
- ✅ Garantit l'intégrité des données
- ✅ Pas besoin de manipuler les contraintes

**La SOLUTION 2** n'est utile que si vous avez des centaines de tables et que gérer l'ordre devient trop complexe.

---

## 📞 En cas de problème

Si une importation échoue :

1. Notez le message d'erreur COMPLET
2. Vérifiez que vous avez importé les tables parentes d'abord
3. Vérifiez le format des données dans votre CSV
4. Si nécessaire, supprimez les données de la table et réessayez

Pour supprimer toutes les données d'une table :
```sql
TRUNCATE TABLE nom_de_la_table CASCADE;
```
⚠️ **ATTENTION :** Cela supprime TOUTES les données de la table !

---

🎉 **Bon import !**
