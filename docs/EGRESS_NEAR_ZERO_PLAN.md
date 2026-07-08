# Plan near-zero egress Supabase

Objectif réaliste : supprimer l'egress navigateur sur la boutique publique, et garder Supabase surtout pour l'admin, les commandes et les écritures.

## Ce qui est installé dans cette branche

1. `public-supabase-static-cache.js` intercepte les lectures publiques de `products` et `web_categories`.
2. `scripts/build-static-public-data.mjs` génère `static-data/products.json`, `static-data/web_categories.json` et `static-data/manifest.json`.
3. `scripts/install-static-cache-snippet.mjs` ajoute automatiquement le script cache dans `index.html` et `ecommerce.html`.
4. `npm run optimize:egress` lance la génération des JSON puis l'installation du snippet.

## Commande recommandée sur le serveur ou la machine de build

```bash
SUPABASE_URL="https://xxxx.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="..." \
npm run optimize:egress
```

Sur Windows PowerShell :

```powershell
$env:SUPABASE_URL="https://xxxx.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="..."
npm run optimize:egress
```

Puis uploader avec le site :

```text
public-supabase-static-cache.js
static-data/products.json
static-data/web_categories.json
static-data/manifest.json
index.html
ecommerce.html
```

## Résultat attendu

- Visiteurs boutique : 0 appel Supabase pour produits et catégories.
- Supabase garde l'egress pour les commandes, login client, paiements et admin.
- Le plus gros trafic passe par le serveur web ou CDN, pas Supabase.

## Vérification navigateur

Ouvrir la console :

```javascript
STATIC_SUPABASE_CACHE.showStats()
```

Tu dois voir des `hits` monter quand la boutique charge les produits/catégories.

## Important

Ne mets pas `public-supabase-static-cache.js` sur l'admin pour l'instant. L'admin doit rester temps réel, sinon tu risques de voir un stock ancien.
