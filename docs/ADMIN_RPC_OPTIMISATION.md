# Optimisation admin avec RPC

But : réduire l'egress admin sans casser le temps réel.

## Ce qui est ajouté

- `SUPABASE_ADMIN_RPC_OPTIMIZATIONS.sql` : fonctions RPC slim pour les grosses lectures admin.
- `admin-rpc-optimizer.js` : intercepte certaines lectures REST lourdes et les remplace par des appels RPC.
- Le cache existant `supabase-cache-layer.js` garde les réponses RPC en cache car les fonctions commencent par `get_`.

## À installer dans Supabase

Ouvre Supabase → SQL Editor → colle le contenu de :

```text
SUPABASE_ADMIN_RPC_OPTIMIZATIONS.sql
```

Puis exécute.

## À charger dans l'admin

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

`rpc` doit monter quand tu ouvres les modules produits, clients, ventes frigo ou règlements clients.

## Pourquoi pas cache statique admin ?

Parce que l'admin doit rester frais : stock, ventes, caisse, commandes. RPC + cache court est le bon compromis : moins de données transférées, mais données encore fiables.
