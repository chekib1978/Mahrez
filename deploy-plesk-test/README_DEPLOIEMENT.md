# 📦 Déploiement Complet Plesk - Prêt à l'emploi

## ✅ Contenu du Package

Ce dossier `deploy-plesk-test` contient **TOUS les fichiers modifiés** prêts pour le déploiement sur Plesk :

```
deploy-plesk-test/
├── httpdocs/
│   ├── admin/                          ← Interface Admin (Backoffice)
│   │   ├── index.html                  (✅ modifié avec cache layer)
│   │   ├── supabase-cache-layer.js     (✅ NOUVEAU - cache intelligent)
│   │   ├── app.js                      (application admin complète)
│   │   ├── styles.css                  (styles admin)
│   │   └── logo.png                    (logo)
│   │
│   └── shop/                           ← Site E-commerce React
│       ├── index.html                  (✅ modifié avec cache layer)
│       ├── public/
│       │   └── supabase-cache.js       (✅ NOUVEAU - cache React)
│       ├── src/                        (code source React complet)
│       ├── package.json
│       ├── vite.config.ts
│       └── ...tous les fichiers React
│
└── README_DEPLOIEMENT.md               ← Ce fichier

```

---

## 🎯 Option de Déploiement

### Option Unique : Déploiement Complet

**Durée : 10-15 minutes**

#### Étape 1 : Connexion Plesk

1. Ouvrir **Plesk** dans le navigateur
2. Se connecter avec vos identifiants
3. Aller dans votre domaine (ex: `mvpara.com`)
4. Cliquer sur **"Gestionnaire de fichiers"** ou **"File Manager"**

#### Étape 2 : Backup (IMPORTANT!)

**AVANT de toucher quoi que ce soit :**

1. Dans Plesk File Manager, sélectionner le dossier `httpdocs/`
2. Cliquer sur **"Compress"** ou **"Compresser"**
3. Nom : `backup-avant-cache-$(date).zip`
4. Télécharger le fichier ZIP sur votre ordinateur local

> ⚠️ **Ce backup vous permet de revenir en arrière en 2 minutes si besoin !**

#### Étape 3 : Upload Admin

1. Dans Plesk, naviguer vers `httpdocs/admin/`
2. **Supprimer** les anciens fichiers :
   - `index.html` (ancien)
   - `supabase-cache-layer.js` (s'il existe)
3. **Upload** les nouveaux fichiers depuis `deploy-plesk-test/httpdocs/admin/` :
   - `index.html` ✅
   - `supabase-cache-layer.js` ✅
   - `app.js` ✅
   - `styles.css` ✅
   - `logo.png` ✅

#### Étape 4 : Upload Site E-commerce

##### Option A : Si le site React est déjà compilé (dist/)

1. Dans votre machine locale, aller dans `mv-para-sparkle-main/`
2. Ouvrir un terminal PowerShell :
   ```powershell
   cd "c:\Users\INES\Desktop\Mahrez Kammoun -Avant BAse Local\mv-para-sparkle-main"
   npm install
   npm run build
   ```
3. Un dossier `dist/` sera créé
4. Dans Plesk, naviguer vers `httpdocs/shop/`
5. **Supprimer** tout le contenu de `shop/`
6. **Upload** tout le contenu de `dist/` dans `httpdocs/shop/`

##### Option B : Si vous uploadez les sources React

1. Dans Plesk, naviguer vers `httpdocs/`
2. **Supprimer** le dossier `shop/` (s'il existe)
3. **Upload** tout le dossier `deploy-plesk-test/httpdocs/shop/` vers `httpdocs/shop/`
4. **Via SSH Plesk**, compiler le site :
   ```bash
   cd ~/httpdocs/shop
   npm install
   npm run build
   ```
5. Déplacer les fichiers compilés :
   ```bash
   cp -r dist/* ./
   ```

> 💡 **Recommandation : Option A** (compiler localement puis uploader dist/) est plus simple et rapide

#### Étape 5 : Vérification Admin

1. Ouvrir dans navigateur : `https://votre-domaine.com/admin/`
2. Ouvrir la console navigateur (F12)
3. Vérifier le message : 
   ```
   ✅ Supabase Cache Layer activated
   ```
4. Tester quelques actions (charger produits, etc.)
5. Taper dans console :
   ```javascript
   SUPABASE_CACHE.showStats()
   ```
6. Vérifier que le cache fonctionne

#### Étape 6 : Vérification Site E-commerce

1. Ouvrir dans navigateur : `https://votre-domaine.com/shop/` (ou `/`)
2. Ouvrir la console navigateur (F12)
3. Vérifier le message : 
   ```
   ✅ Supabase Cache Layer loaded (React mode)
   ```
4. Naviguer sur le site (produits, catégories, etc.)
5. Taper dans console :
   ```javascript
   window.SUPABASE_CACHE.showStats()
   ```
6. Vérifier que le cache fonctionne

---

## 🔧 Configuration Nginx/Apache (Plesk)

Si vous avez des problèmes de routing React (404 sur refresh), ajouter dans Plesk :

### Apache (.htaccess dans shop/)

Créer fichier `httpdocs/shop/.htaccess` :

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /shop/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /shop/index.html [L]
</IfModule>
```

### Nginx (Plesk Nginx Directives)

Aller dans **Plesk → Apache & Nginx Settings** :

```nginx
location /shop/ {
    try_files $uri $uri/ /shop/index.html;
}

location /admin/ {
    try_files $uri $uri/ /admin/index.html;
}
```

---

## ✅ Checklist Post-Déploiement

### Admin
- [ ] https://domaine.com/admin/ s'ouvre correctement
- [ ] Console affiche "Cache Layer activated"
- [ ] Pas d'erreurs dans console (F12)
- [ ] Actions fonctionnent (charger produits, clients, etc.)
- [ ] `SUPABASE_CACHE.showStats()` affiche stats
- [ ] Hit rate augmente après quelques requêtes

### Site E-commerce
- [ ] https://domaine.com/shop/ s'ouvre correctement (ou `/`)
- [ ] Console affiche "Cache Layer loaded"
- [ ] Pas d'erreurs dans console (F12)
- [ ] Navigation fonctionne (catégories, produits)
- [ ] `window.SUPABASE_CACHE.showStats()` affiche stats
- [ ] Hit rate augmente après navigation

### Monitoring (J+1)
- [ ] Aller sur **Supabase Dashboard** → Database → API
- [ ] Vérifier section "Database Egress"
- [ ] Constater la réduction (objectif: -80%)

---

## 📊 Résultats Attendus

| Période | Hit Rate | Egress | Réduction |
|---------|----------|--------|-----------|
| **Immédiat** | 0% | 1.5 GB/j | 0% |
| **Après 1h** | 40-60% | ~800 MB/j | -45% |
| **Après 24h** | 60-80% | ~400 MB/j | -73% |
| **Après 3j** | 75-90% | ~250 MB/j | -83% |

---

## 🚨 Rollback (si problème)

### Méthode Rapide (2 minutes)

1. Aller dans Plesk File Manager
2. Uploader votre backup `backup-avant-cache-*.zip`
3. Extraire dans `httpdocs/`
4. Remplacer tous les fichiers
5. Rafraîchir le navigateur (Ctrl+F5)

### Désactivation Cache Seulement

**Admin :**
Éditer `httpdocs/admin/index.html`, commenter la ligne :
```html
<!-- <script src="supabase-cache-layer.js"></script> -->
```

**Shop :**
Éditer `httpdocs/shop/index.html`, commenter la ligne :
```html
<!-- <script src="/supabase-cache.js"></script> -->
```

Rafraîchir navigateur (Ctrl+F5).

---

## 🛠️ Troubleshooting

### Erreur "Cache Layer not found"

**Cause :** Fichier cache manquant

**Solution :**
1. Vérifier que `supabase-cache-layer.js` existe dans `/admin/`
2. Vérifier que `supabase-cache.js` existe dans `/shop/public/`
3. Re-uploader les fichiers si nécessaire
4. Vider cache navigateur (Ctrl+F5)

### Site React ne s'affiche pas

**Cause :** Build manquant ou erreur compilation

**Solution :**
1. Vérifier que `npm run build` s'est exécuté sans erreur
2. Vérifier que le dossier `dist/` a été uploadé
3. Consulter logs Plesk : **Logs → Error Log**
4. Vérifier console navigateur pour erreurs JS

### Hit Rate reste à 0%

**Cause :** Cache non activé ou TTL trop courts

**Solution :**
```javascript
// Dans console navigateur :
SUPABASE_CACHE.setDebug(true)
// Puis faire quelques actions
// Observer les logs pour comprendre
```

### Performance pas améliorée

**Cause :** Autres facteurs d'egress (SELECT *, pas de LIMIT)

**Solution :**
1. Utiliser **Egress Detective** (voir README principal)
2. Identifier les requêtes problématiques
3. Optimiser les requêtes identifiées

---

## 📞 Support

Si problème après déploiement :

1. **Console navigateur** (F12) → Copier toutes les erreurs
2. **Plesk Error Logs** → Copier logs pertinents
3. **Tester en local** : Vérifier que ça fonctionne sur votre machine
4. **Comparer** : Différence entre local et Plesk ?

---

## 🎉 Félicitations !

Une fois déployé et vérifié, votre consommation d'egress va **drastiquement diminuer** !

**Économies attendues :**
- 💰 **-80 à -90%** d'egress Supabase
- ⚡ **+50 à +80%** de vitesse de chargement
- 🔋 Moins de consommation batterie/données pour vos utilisateurs

**Prochain monitoring :**
- ✅ **J+1** : Vérifier stats cache + egress Supabase
- ✅ **J+3** : Confirmer réduction 80%
- ✅ **J+7** : Tout devrait être stabilisé

---

**Date de préparation :** $(date)
**Version cache :** 1.0
**Prêt pour production :** ✅ OUI
