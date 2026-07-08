# Static public data

Ce dossier est généré par :

```bash
node scripts/build-static-public-data.mjs
```

Il doit contenir :

- `products.json`
- `web_categories.json`
- `manifest.json`

Ces fichiers permettent à la boutique publique de lire les produits et catégories sans appeler Supabase depuis le navigateur.
