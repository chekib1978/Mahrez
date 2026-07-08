# 📤 GUIDE EXPORT COMPLET DES DONNÉES (9000+ produits)

## 🔴 Problème identifié

L'export CSV via l'interface Supabase est limité à **100 lignes** par défaut.  
Vous avez 9000 produits mais seulement 100 ont été exportés !

---

## ✅ SOLUTION 1 : Export via script Node.js (RECOMMANDÉ)

### Prérequis
- Node.js installé sur votre machine
- Accès à l'ancienne instance Supabase

### Étape 1 : Exécuter le script d'export

Ouvrez un terminal (CMD ou PowerShell) dans le dossier :
```
c:\Users\INES\Desktop\Mahrez Kammoun -Avant BAse Local\
```

#### Option A : Exporter UNIQUEMENT les produits

```bash
node export_products_full.js
```

Résultat : Un fichier `products_complet_export.csv` avec les 9000 produits ✅

#### Option B : Exporter TOUTES les tables d'un coup

```bash
node export_all_tables.js
```

Résultat : Un dossier `exports_csv/` avec tous les CSV :
- mutuelles.csv
- suppliers.csv
- products.csv (9000 lignes)
- customers.csv
- sales.csv
- etc.

✅ **Tous les fichiers seront complets !**

---

## ✅ SOLUTION 2 : Export via SQL (Alternative)

### Dans l'ancienne instance Supabase :

1. Allez dans **SQL Editor**
2. Exécutez cette requête pour chaque table :

```sql
-- Export TOUS les produits
COPY (
  SELECT * FROM products ORDER BY created_at
) TO STDOUT WITH CSV HEADER;
```

3. Copiez le résultat
4. Collez dans un fichier `products_complet.csv`
5. Répétez pour chaque table

### Requêtes pour toutes les tables :

```sql
-- Mutuelles
COPY (SELECT * FROM mutuelles ORDER BY created_at) TO STDOUT WITH CSV HEADER;

-- Fournisseurs
COPY (SELECT * FROM suppliers ORDER BY created_at) TO STDOUT WITH CSV HEADER;

-- Produits (9000 lignes)
COPY (SELECT * FROM products ORDER BY created_at) TO STDOUT WITH CSV HEADER;

-- Clients
COPY (SELECT * FROM customers ORDER BY created_at) TO STDOUT WITH CSV HEADER;

-- Ventes
COPY (SELECT * FROM sales ORDER BY date_vente DESC) TO STDOUT WITH CSV HEADER;

-- Lignes de vente
COPY (SELECT * FROM sale_items ORDER BY created_at) TO STDOUT WITH CSV HEADER;

-- Achats
COPY (SELECT * FROM purchases ORDER BY date_achat DESC) TO STDOUT WITH CSV HEADER;

-- Lignes d'achat
COPY (SELECT * FROM purchase_items ORDER BY created_at) TO STDOUT WITH CSV HEADER;

-- Retours fournisseurs
COPY (SELECT * FROM supplier_returns ORDER BY return_date DESC) TO STDOUT WITH CSV HEADER;

-- Lignes de retours
COPY (SELECT * FROM supplier_return_items ORDER BY created_at) TO STDOUT WITH CSV HEADER;

-- Paiements clients
COPY (SELECT * FROM customer_payments ORDER BY payment_date DESC) TO STDOUT WITH CSV HEADER;

-- Ventes frigo
COPY (SELECT * FROM fridge_sales ORDER BY fridge_date DESC) TO STDOUT WITH CSV HEADER;

-- Opérations stock
COPY (SELECT * FROM stock_operations ORDER BY operation_date DESC) TO STDOUT WITH CSV HEADER;

-- Commandes web
COPY (SELECT * FROM web_orders ORDER BY created_at DESC) TO STDOUT WITH CSV HEADER;

-- Lignes commandes web
COPY (SELECT * FROM web_order_items ORDER BY created_at) TO STDOUT WITH CSV HEADER;
```

---

## ✅ SOLUTION 3 : Export via l'API REST (Avancé)

Si vous préférez utiliser un autre outil (Python, curl, etc.) :

### Avec curl (Windows PowerShell) :

```powershell
# Variables
$OLD_URL = "https://azikpzhpqchkawenbvnm.supabase.co/rest/v1/"
$OLD_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Export produits (par batch de 1000)
$offset = 0
$limit = 1000
$allProducts = @()

while ($true) {
    $response = Invoke-RestMethod `
        -Uri "${OLD_URL}products?select=*&order=created_at&limit=${limit}&offset=${offset}" `
        -Headers @{
            "apikey" = $OLD_KEY
            "Authorization" = "Bearer $OLD_KEY"
        }
    
    if ($response.Count -eq 0) { break }
    
    $allProducts += $response
    $offset += $limit
    Write-Host "Téléchargé: $($allProducts.Count) produits"
}

# Convertir en CSV
$allProducts | Export-Csv -Path "products_complet.csv" -NoTypeInformation -Encoding UTF8
Write-Host "✅ Export terminé: $($allProducts.Count) produits"
```

---

## 📋 Fichiers créés pour vous

| Fichier | Description |
|---------|-------------|
| **export_products_full.js** | Export uniquement les 9000 produits |
| **export_all_tables.js** | Export TOUTES les tables d'un coup |
| **GUIDE_EXPORT_COMPLET.md** | Ce guide |

---

## 🎯 RECOMMANDATION

**Utilisez `export_all_tables.js`** car :
- ✅ Exporte TOUT en un seul clic
- ✅ Crée les CSV dans le bon ordre d'importation
- ✅ Gère automatiquement les limites de pagination
- ✅ Affiche un résumé avec le nombre de lignes par table
- ✅ Pas de limite de 100 lignes !

---

## 🔧 Après l'export

Une fois vos CSV complets exportés, suivez le **GUIDE_IMPORT_CSV.md** pour les importer dans le bon ordre vers la nouvelle base.

---

## ⚠️ Notes importantes

1. **Node.js requis** : Si vous n'avez pas Node.js, téléchargez-le sur https://nodejs.org/
2. **Credentials** : Les scripts utilisent par défaut les anciennes credentials. Vérifiez qu'elles sont correctes.
3. **Temps d'export** : Pour 9000 produits, comptez environ 10-30 secondes selon votre connexion.
4. **Espace disque** : Prévoyez environ 10-50 MB pour tous les CSV.

---

🎉 **Bon export !**
