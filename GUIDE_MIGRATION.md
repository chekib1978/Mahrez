# Guide de migration vers une nouvelle instance Supabase

## Prérequis
- Node.js installé
- Accès à l'ancienne instance Supabase (SOURCE)
- Accès à la nouvelle instance Supabase (DESTINATION)
- Les fichiers du projet

---

### Étape 1 — Créer les credentials
Dans la nouvelle instance Supabase Dashboard → **Project Settings → API** :
- Copier l'**URL** (ex: `https://xxx.supabase.co`)
- Copier la **clé anon/public**

### Étape 2 — Mettre à jour les credentials
Mettre la nouvelle URL et clé dans :
- `app.js` (admin)
- `deploy-plesk-test/httpdocs/admin/app.js`
- `mv-para-sparkle-main/src/lib/store-api.ts` (e-commerce)
- `import_to_new_instance.js`

### Étape 3 — Exporter les données depuis l'ancienne instance
```bash
node export_all_tables.js
```
Les fichiers CSV sont créés dans `exports_csv/`.

### Étape 4 — Créer le schéma sur la nouvelle instance
Dans le **Supabase SQL Editor**, exécuter dans cet ordre :
| Ordre | Fichier |
|-------|---------|
| 4.1 | `RESET_SUPABASE.sql` |
| 4.2 | `SUPABASE_SCHEMA_COMPLET.sql` |
| 4.3 | `FIX_APRES_IMPORT.sql` |

### Étape 5 — Importer les données
```bash
node import_to_new_instance.js
```

### Étape 6 — Seed et finalisation
Dans le **Supabase SQL Editor**, exécuter :
| Ordre | Fichier |
|-------|---------|
| 6.1 | `seed_web_categories.sql` |
| 6.2 | `FIX_RPC_SEQUENCES.sql` |

### Étape 7 — Rebuild e-commerce (si les URLs changent)
```bash
cd mv-para-sparkle-main
npm install
npm run build
```

### Étape 8 — Déploiement
Copier le contenu de `deploy-plesk-test/httpdocs/` vers le serveur Plesk.

### Étape 9 — Test
Ctrl+F5 dans le navigateur et vérifier :
- Connexion admin
- Ventes / Achats
- État des ventes
- E-commerce (frontend)

---

## Fichiers clés
| Fichier | Rôle |
|---------|------|
| `RESET_SUPABASE.sql` | Nettoie la base (DROP SCHEMA public CASCADE) |
| `SUPABASE_SCHEMA_COMPLET.sql` | Crée toutes les tables, fonctions, triggers, RLS |
| `FIX_APRES_IMPORT.sql` | Permissions document_sequences + colonnes validated_by/created_by |
| `export_all_tables.js` | Export des données depuis l'ancienne instance |
| `import_to_new_instance.js` | Import vers la nouvelle instance |
| `seed_web_categories.sql` | Catégories du site e-commerce |
| `FIX_RPC_SEQUENCES.sql` | Synchronise les compteurs VTE/ACH/FAC/BL |
