# GUIDE DE CONFIGURATION SUPABASE - PHARMACIE MAHREZ KAMMOUN

## 📋 Vue d'ensemble

Ce guide vous permet de créer une nouvelle base de données Supabase complète pour votre application de pharmacie avec site e-commerce.

## 📦 Fichiers fournis

1. **SUPABASE_SCHEMA_COMPLET.sql** - Schema complet de la base de données
2. **SUPABASE_SEED_CATEGORIES.sql** - Données initiales des catégories web
3. **INSTRUCTIONS_SUPABASE.md** - Ce fichier d'instructions

## 🎯 Étapes d'installation

### Étape 1 : Créer un nouveau projet Supabase

1. Allez sur https://supabase.com
2. Connectez-vous ou créez un compte
3. Cliquez sur "New Project"
4. Remplissez les informations :
   - **Name**: Pharmacie Mahrez Kammoun
   - **Database Password**: Choisissez un mot de passe fort (NOTEZ-LE)
   - **Region**: Choisissez la région la plus proche (Europe pour Tunisie)
5. Cliquez sur "Create new project"
6. Attendez quelques minutes que le projet soit créé

### Étape 2 : Récupérer vos credentials

Une fois le projet créé, allez dans :
- **Settings** > **API**
- Notez ces informations importantes :

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
Project API keys:
  - anon/public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  - service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Database:
  - Host: db.xxxxxxxxxxxxx.supabase.co
  - Database name: postgres
  - Port: 5432
  - User: postgres
  - Password: [le mot de passe que vous avez choisi]
```

### Étape 3 : Exécuter le schema de base

1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Cliquez sur "New query"
3. Ouvrez le fichier **SUPABASE_SCHEMA_COMPLET.sql**
4. Copiez TOUT le contenu du fichier
5. Collez-le dans l'éditeur SQL de Supabase
6. Cliquez sur **Run** (ou Ctrl+Enter)
7. Attendez que l'exécution se termine (ça peut prendre 30-60 secondes)
8. Vérifiez qu'il n'y a pas d'erreurs dans le résultat

### Étape 4 : Charger les catégories web

1. Toujours dans **SQL Editor**, créez une nouvelle query
2. Ouvrez le fichier **SUPABASE_SEED_CATEGORIES.sql**
3. Copiez TOUT le contenu du fichier
4. Collez-le dans l'éditeur SQL
5. Cliquez sur **Run**
6. Vérifiez que les catégories sont créées avec succès

### Étape 5 : Vérification de l'installation

Exécutez ces requêtes SQL pour vérifier que tout est correct :

```sql
-- Vérifier le nombre de tables créées (devrait retourner environ 30)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Vérifier les catégories web (devrait retourner plus de 100 catégories)
SELECT COUNT(*) FROM public.web_categories;

-- Vérifier les fonctions
SELECT COUNT(*) FROM information_schema.routines 
WHERE routine_schema = 'public';

-- Afficher quelques catégories principales
SELECT name, slug, sort_order 
FROM public.web_categories 
WHERE parent_id IS NULL 
ORDER BY sort_order;
```

### Étape 6 : Configuration de l'application

Maintenant vous devez mettre à jour les credentials Supabase dans votre code :

#### Pour l'application admin (app.js) :

Cherchez dans le fichier `app.js` la section de configuration Supabase :

```javascript
const SUPABASE_URL = 'https://xxxxxxxxxxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

Remplacez par vos nouvelles valeurs récupérées à l'Étape 2.

#### Pour le site web (mv-para-sparkle-main) :

Cherchez le fichier de configuration (probablement dans `src/lib/` ou à la racine) :

```javascript
// Exemple de fichier .env ou config
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📊 Structure de la base de données

### Tables principales

| Table | Description |
|-------|-------------|
| **products** | Articles/produits de la pharmacie |
| **customers** | Clients |
| **suppliers** | Fournisseurs |
| **sales** | Ventes |
| **sale_items** | Lignes de vente |
| **purchases** | Achats |
| **purchase_items** | Lignes d'achat |
| **supplier_returns** | Retours fournisseurs |
| **supplier_return_items** | Lignes de retour fournisseur |
| **stock_operations** | Opérations de stock (Prêt, Emprunt, Entrée, Sortie) |
| **mutuelles** | Caisses d'assurance maladie |
| **mutuelle_bordereaux** | Relevés de mutuelles |
| **customer_payments** | Règlements clients |
| **fridge_sales** | Ventes en attente (frigo) |
| **web_categories** | Catégories du site e-commerce |
| **web_orders** | Commandes du site web |
| **web_order_items** | Lignes de commande web |
| **web_product_reviews** | Avis clients sur les produits |
| **web_customer_accounts** | Comptes clients web |
| **web_customer_profiles** | Profils clients (auth Supabase) |
| **company_settings** | Paramètres de l'entreprise |
| **backoffice_users** | Utilisateurs du backoffice |
| **action_history** | Historique des actions |
| **document_sequences** | Séquences pour les numéros de documents |

### Fonctions utilitaires

- `generate_prefixed_number(prefix)` - Génère un numéro de document (VTE-000001, ACH-000001, etc.)
- `peek_prefixed_number(prefix)` - Voir le prochain numéro sans l'incrémenter
- `assign_sale_document_number(sale_id, doc_type)` - Assigne un numéro BL/FAC/DEV à une vente
