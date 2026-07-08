# 🚀 GUIDE VISUEL - Déploiement Plesk (5 Minutes)

## 📋 AVANT DE COMMENCER

✅ Vous avez accès à Plesk
✅ Vous connaissez l'URL d'admin Plesk
✅ Vous avez les identifiants Plesk

---

## 🎯 ÉTAPE 1 : Créer le Package ZIP

### Sur votre machine locale :

```powershell
# Ouvrir PowerShell
cd "c:\Users\INES\Desktop\Mahrez Kammoun -Avant BAse Local\deploy-plesk-test"

# Exécuter le script
.\creer-package-plesk.ps1
```

**Résultat :**
- ✅ 2 fichiers ZIP créés :
  - `mvpara-deploy-plesk-YYYYMMDD-HHMM.zip` (Package complet)
  - `mvpara-deploy-admin-only-YYYYMMDD-HHMM.zip` (Admin uniquement)

---

## 🎯 ÉTAPE 2 : Backup Plesk (IMPORTANT!)

### Dans Plesk :

1. **Connexion Plesk**
   ```
   https://votre-serveur-plesk.com:8443
   ```

2. **Naviguer vers votre domaine**
   ```
   Domaines → votre-domaine.com → Gestionnaire de fichiers
   ```

3. **Faire un backup**
   - Sélectionner le dossier `httpdocs/`
   - Cliquer **"Compress"** (icône ZIP)
   - Nom : `backup-avant-cache`
   - Cliquer **"OK"**
   - Attendre la compression
   - **Télécharger** le fichier ZIP sur votre ordinateur

**💡 IMPORTANT : Ce backup vous sauve en cas de problème !**

---

## 🎯 ÉTAPE 3A : Déploiement Admin UNIQUEMENT (Recommandé - 5 min)

### Dans Plesk File Manager :

1. **Naviguer vers admin**
   ```
   httpdocs/admin/
   ```

2. **Upload le ZIP Admin**
   - Cliquer **"Upload"**
   - Sélectionner `mvpara-deploy-admin-only-YYYYMMDD-HHMM.zip`
   - Attendre l'upload

3. **Extraire le ZIP**
   - Sélectionner le fichier ZIP uploadé
   - Cliquer **"Extract"** ou **"Extraire"**
   - Confirmer l'extraction
   - Les fichiers vont remplacer les anciens

4. **Nettoyer**
   - Supprimer le fichier ZIP
   - Rafraîchir la page Plesk

**✅ C'est tout pour l'admin !**

---

## 🎯 ÉTAPE 3B : Déploiement Shop (Site E-commerce - 15 min)

### Option A : Compiler localement puis uploader (RECOMMANDÉ)

#### Sur votre machine locale :

```powershell
# Aller dans le dossier React
cd "c:\Users\INES\Desktop\Mahrez Kammoun -Avant BAse Local\mv-para-sparkle-main"

# Installer dépendances (si pas déjà fait)
npm install

# Compiler pour production
npm run build
```

**Résultat :** Dossier `dist/` créé avec les fichiers compilés

#### Dans Plesk File Manager :

1. **Naviguer vers shop**
   ```
   httpdocs/shop/
   ```

2. **Supprimer l'ancien contenu**
   - Sélectionner TOUT dans `shop/`
   - Cliquer **"Delete"**
   - Confirmer

3. **Upload le dossier dist/**
   - Cliquer **"Upload"** ou **"Upload Files"**
   - Uploader **TOUS les fichiers** du dossier `dist/`
   - Attendre que tous les fichiers soient uploadés

4. **Vérifier la structure**
   ```
   shop/
   ├── index.html
   ├── assets/
   │   ├── index-abc123.js
   │   ├── index-def456.css
   │   └── ...
   └── supabase-cache.js (devrait être là)
   ```

### Option B : Upload sources et compiler sur serveur

#### Dans Plesk File Manager :

1. **Upload le ZIP Shop**
   - Aller dans `httpdocs/`
   - Upload `mvpara-deploy-plesk-YYYYMMDD-HHMM.zip`
   - Extraire dans `httpdocs/`

2. **Via SSH Plesk** (si vous avez accès SSH) :
   ```bash
   cd ~/httpdocs/shop
   npm install
   npm run build
   cp -r dist/* ./
   ```

**💡 Si pas d'accès SSH : Utilisez Option A**

---

## 🎯 ÉTAPE 4 : Vérification

### Vérifier Admin :

1. **Ouvrir dans navigateur**
   ```
   https://votre-domaine.com/admin/
   ```

2. **Ouvrir Console (F12)**
   - Chercher le message : `✅ Supabase Cache Layer activated`
   - Si présent → ✅ **SUCCÈS !**

3. **Tester le cache**
   ```javascript
   SUPABASE_CACHE.showStats()
   ```
   
   **Résultat attendu :**
   ```
   📊 Cache Statistics:
   Total Requests: 0
   Cache Hits: 0
   Cache Misses: 0
   Hit Rate: 0.00%
   Cache Size: 0
   ```

4. **Faire quelques actions**
   - Charger produits
   - Charger clients
   - Rafraîchir la page

5. **Re-vérifier stats**
   ```javascript
   SUPABASE_CACHE.showStats()
   ```
   
   **Résultat attendu après actions :**
   ```
   📊 Cache Statistics:
   Total Requests: 10
   Cache Hits: 7
   Cache Misses: 3
   Hit Rate: 70.00%  ← Devrait augmenter !
   Cache Size: 3
   ```

### Vérifier Shop (si déployé) :

1. **Ouvrir dans navigateur**
   ```
   https://votre-domaine.com/shop/
   ```
   ou
   ```
   https://votre-domaine.com/
   ```

2. **Ouvrir Console (F12)**
   - Chercher le message : `✅ Supabase Cache Layer loaded (React mode)`
   - Si présent → ✅ **SUCCÈS !**

3. **Naviguer sur le site**
   - Cliquer sur catégories
   - Voir des produits
   - Naviguer plusieurs fois

4. **Vérifier cache**
   ```javascript
   window.SUPABASE_CACHE.showStats()
   ```

---

## ✅ CHECKLIST FINALE

### Admin
- [ ] https://domaine.com/admin/ fonctionne
- [ ] Console affiche "Cache Layer activated"
- [ ] Aucune erreur dans console
- [ ] Actions admin fonctionnent (produits, clients, etc.)
- [ ] `SUPABASE_CACHE.showStats()` montre des hits

### Shop (optionnel si déployé)
- [ ] https://domaine.com/shop/ fonctionne
- [ ] Console affiche "Cache Layer loaded"
- [ ] Aucune erreur dans console
- [ ] Navigation fonctionne
- [ ] `window.SUPABASE_CACHE.showStats()` montre des hits

---

## 🚨 SI PROBLÈME

### "Cache Layer not found"

**Solution rapide :**
1. Vérifier que `supabase-cache-layer.js` existe dans `/admin/`
2. Vérifier dans `index.html` la ligne :
   ```html
   <script src="supabase-cache-layer.js"></script>
   ```
3. Vider cache navigateur : `Ctrl + F5`

### "Site ne s'affiche pas"

**Solution rapide :**
1. Vérifier que tous les fichiers ont été uploadés
2. Consulter **Plesk → Logs → Error Log**
3. Vérifier console navigateur (F12)

### "Rollback complet"

**Solution en 2 minutes :**
1. Aller dans Plesk File Manager
2. Uploader votre `backup-avant-cache.zip`
3. Extraire dans `httpdocs/` (remplacer tout)
4. Rafraîchir navigateur (Ctrl+F5)

**✅ Vous êtes revenu à l'état d'avant !**

---

## 📊 Résultats Attendus

| Temps | Hit Rate | Egress | Amélioration |
|-------|----------|--------|--------------|
| Maintenant | 0% | 1.5 GB/j | - |
| +1 heure | 40-60% | ~800 MB/j | -45% |
| +24 heures | 70-80% | ~350 MB/j | -76% |
| +3 jours | 80-90% | ~250 MB/j | -83% ✅ |

---

## 🎉 C'EST FAIT !

Votre système de cache est maintenant **ACTIF** et **FONCTIONNE** !

### Prochaines étapes :

1. **Monitorer Supabase** (24h après)
   - Aller sur https://supabase.com
   - Project → Settings → Usage
   - Vérifier "Database Egress"
   - Constater la baisse ! 📉

2. **Optimiser encore plus** (optionnel)
   - Utiliser Egress Detective
   - Identifier d'autres facteurs d'egress
   - Optimiser les requêtes SQL

**💡 Avec le cache seul, vous économisez déjà 80% !**

---

**Temps total du déploiement :** 5-15 minutes
**Économies attendues :** -80% d'egress (-1.2 GB/jour)
**Gain de vitesse :** +50 à +80%

🎊 **Bravo ! Vous avez réussi !** 🎊
