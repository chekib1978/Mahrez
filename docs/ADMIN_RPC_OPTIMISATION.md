# Optimisation admin avec RPC

But : réduire l'egress admin sans casser le temps réel.

## Mode sécurité anti-OOM

`admin-rpc-optimizer.js` est en **SAFE MODE** :

- il optimise les listes paginées ou limitées,
- il évite d'optimiser `products` et `customers` quand l'admin demande toute la table sans `limit`,
- il limite les réponses RPC à 500 lignes max côté navigateur,
- si une RPC échoue, il revient automatiquement à l'appel Supabase original.

Pourquoi : charger 2000+ produits plusieurs milliers de fois peut provoquer `Out of Memory` dans Chrome.

## À installer dans Supabase

Ouvre Supabase → SQL Editor → colle le contenu de :

```text
SUPABASE_ADMIN_RPC_OPTIMIZATIONS.sql
```

Puis exécute.

## À charger dans l'admin local

Lance dans le dossier projet :

```powershell
npm run install:admin-rpc
```

Ordre recommandé :

```html
<script src="supabase-cache-layer.js"></script>
<script src="admin-rpc-optimizer.js"></script>
<script src="app.js"></script>
```

## Vérification navigateur

Dans l'admin, ouvre la console :

```javascript
ADMIN_RPC_OPTIMIZER.showStats()
SUPABASE_CACHE.showStats()
```

`rpc` doit monter sur les modules optimisés. `skippedNoLimit` peut monter aussi : c'est normal, ça veut dire que l'optimiseur a évité une requête trop grosse pour protéger la mémoire.

## Pourquoi pas cache statique admin ?

Parce que l'admin doit rester frais : stock, ventes, caisse, commandes. RPC + cache court + limites mémoire est le bon compromis.
