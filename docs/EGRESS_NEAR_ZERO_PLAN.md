# Plan near-zero egress Supabase

Objectif réaliste : supprimer l'egress navigateur sur la boutique publique, et garder Supabase surtout pour l'admin, les commandes et les écritures.

## Ce qui change

1. Les données publiques lourdes (`products`, `web_categories`) sont exportées en JSON statique dans `static-data/`.
2. `public-supabase-static-cache.js` intercepte les lectures Supabase publiques et répond depuis ces fichiers JSON.
3. Si un fichier statique manque, l'app retombe automatiquement sur Supabase, donc pas de page cassée.
4. Les filtres simples Supabase (`eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `is`, `in`, `like`, `ilike`, `order`, `limit`, `offset`) sont appliqués localement.

## Installation boutique publique

Ajouter ce script avant les scripts qui appellent Supabase sur la boutique publique :

```html
<script src="public-supabase-static-cache.js"></script>
```

À mettre sur les pages publiques (`index.html`, `ecommerce.html`). Ne pas le mettre sur l'admin tant que l'admin doit afficher les données temps réel.

## Génération des fichiers statiques

Sur la machine de build ou le serveur Plesk :

```bash
SUPABASE_URL="https://xxxx.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="..." \
node scripts/build-static-public-data.mjs
```

Puis uploader :

```text
static-data/products.json
static-data/web_categories.json
static-data/manifest.json
public-supabase-static-cache.js
```

## Résultat attendu

- Visiteurs boutique : 0 appel Supabase pour produits et catégories après déploiement des JSON.
- Supabase garde l'egress pour les commandes, login client, paiements et admin.
- Le plus gros trafic passe par le serveur web/CDN, pas Supabase.

## Important

La vraie règle : jamais de `select=*` sur les flux publics. Le script d'export utilise une liste de colonnes volontairement courte.
