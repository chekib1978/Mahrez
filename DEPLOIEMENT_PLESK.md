# 🚀 GUIDE DÉPLOIEMENT PLESK - Étape par Étape

## ⚠️ IMPORTANT : 2 Méthodes

---

## 🎯 MÉTHODE 1 : Rapide (5 min) - RECOMMANDÉE

**Principe :** Uploader SEULEMENT le cache layer + modifier 1 ligne HTML

### Étape 1️⃣ : Uploader Cache Layer

```
1. Ouvrir Plesk
2. File Manager → /httpdocs/admin/
3. Upload → Choisir fichier :
   c:\Users\INES\Desktop\Mahrez Kammoun -Avant BAse Local\supabase-cache-layer.js
4. ✅ Fichier uploadé
```

---

### Étape 2️⃣ : Modifier HTML (Sur Plesk directement)

```
1. Plesk File Manager
2. Ouvrir : /httpdocs/admin/index.html
3. Chercher ligne :
   <script src="app.js"></script>

4. AJOUTER AVANT cette ligne :
   <script src="supabase-cache-layer.js"></script>

5. Sauvegarder
```

**Résultat :**
```html
<!-- Avant -->
<script src="app.js"></script>
</body>

<!-- Après -->
<script src="supabase-cache-layer.js"></script>
<script src="app.js"></script>
</body>
```

---

### Étape 3️⃣ : Tester

```
1. Ouvrir : https://votre-domaine.com/admin/
2. F12 → Console
3. Vérifier message :
   "✅ Supabase Cache Layer activated"
4. Tester navigation normale
5. Console : SUPABASE_CACHE.showStats()
```

**✅ Si message affiché → C'est bon ! Cache fonctionne.**

---

## 🎯 MÉTHODE 2 : Complète (10 min)

**Principe :** Uploader TOUS les fichiers (plus sûr)

### Étape 1️⃣ : Préparer Déploiement

```powershell
# Sur votre PC Windows :
cd "c:\Users\INES\Desktop\Mahrez Kammoun -Avant BAse Local"
.\preparer-deploiement-plesk.ps1
```

**Résultat :**
```
✅ Fichiers copiés: 5
📂 Dossier à uploader :
   c:\...\deploy-plesk-test\httpdocs\admin
```

---

### Étape 2️⃣ : Backup Plesk (IMPORTANT)

```
1. Plesk File Manager
2. Sélectionner /httpdocs/admin/
3. Bouton "Archive"
4. Nom : backup-admin-2025-01-XX.zip
5. Télécharger backup sur PC
```

**⚠️ EN CAS DE PROBLÈME → Restaurer ce backup**

---

### Étape 3️⃣ : Upload Fichiers

```
Méthode A : Upload manuel
1. Plesk File Manager → /httpdocs/admin/
2. Upload fichiers un par un :
   - supabase-cache-layer.js ⭐ NOUVEAU
   - index.html ⭐ MODIFIÉ
   - app.js
   - styles.css
   - logo.png

Méthode B : FTP
1. Connexion FTP (FileZilla)
2. Copier dossier complet :
   deploy-plesk-test/httpdocs/admin/*
   → /httpdocs/admin/
```

---

### Étape 4️⃣ : Vérification Fichiers

```
Sur Plesk File Manager, vérifier :
/httpdocs/admin/
├── ✅ supabase-cache-layer.js (NOUVEAU)
├── ✅ index.html (modifié avec script cache)
├── ✅ app.js
├── ✅ styles.css
└── ✅ logo.png
```

---

### Étape 5️⃣ : Test Production

```
1. Ouvrir : https://votre-domaine.com/admin/
2. Vider cache navigateur : Ctrl+Shift+Delete
3. Recharger : Ctrl+F5
4. Console F12 : Chercher "Cache Layer activated"
5. Utiliser admin normalement 2 min
6. Console : SUPABASE_CACHE.showStats()
```

**Résultat attendu :**
```
✅ Supabase Cache Layer activated
📊 Use SUPABASE_CACHE.showStats()

> SUPABASE_CACHE.showStats()
┌─────────────┬──────────┐
│ entries     │ 25       │
│ hits        │ 45       │
│ misses      │ 12       │
│ hitRate     │ 78.9%    │ ← Doit augmenter
└─────────────┴──────────┘
```

---

## 🆘 DÉPANNAGE PLESK

### ❌ Erreur : "Cache Layer not found"

**Cause :** Fichier pas uploadé ou mauvais chemin

**Solution :**
1. Vérifier fichier existe : /httpdocs/admin/supabase-cache-layer.js
2. Vérifier ligne dans index.html : `<script src="supabase-cache-layer.js"></script>`
3. Vérifier pas de typo dans nom fichier

---

### ❌ Erreur : "Unexpected token"

**Cause :** Fichier corrompu lors upload

**Solution :**
1. Re-télécharger supabase-cache-layer.js depuis votre PC
2. Re-uploader sur Plesk
3. Vérifier encoding UTF-8 (pas UTF-8 BOM)

---

### ❌ Site admin ne charge plus

**Cause :** Erreur dans modification HTML ou JS

**Solution :**
1. Restaurer backup créé avant
2. Plesk File Manager → Upload backup
3. Recommencer déploiement méthode 1

---

### ⚠️ Console montre "activated" mais cache ne fonctionne pas

**Cause :** Conflit avec autre script

**Solution :**
```javascript
// Console :
SUPABASE_CACHE.setDebug(true)
// Recharger page
// Voir logs détaillés
```

---

## 📋 CHECKLIST DÉPLOIEMENT PLESK

### Pré-déploiement
- [ ] Backup admin complet créé
- [ ] Fichiers préparés localement
- [ ] Accès Plesk vérifié

### Déploiement
- [ ] supabase-cache-layer.js uploadé
- [ ] index.html modifié
- [ ] Fichiers vérifiés sur serveur

### Tests
- [ ] Site admin accessible
- [ ] Console affiche "Cache activated"
- [ ] Navigation fonctionne
- [ ] Stats cache affichées

### Validation
- [ ] Aucune erreur console
- [ ] Hit rate augmente
- [ ] Performance normale
- [ ] Monitoring 24h planifié

---

## 🎯 DIFFÉRENCES ENVIRONNEMENTS

### Local (Votre PC)
```
Fichiers source :
c:\...\Mahrez Kammoun -Avant BAse Local\
├── supabase-cache-layer.js ⭐
├── admin.html
├── app.js
└── styles.css
```

### Plesk (Production)
```
Fichiers serveur :
/httpdocs/admin/
├── supabase-cache-layer.js ⭐ NOUVEAU
├── index.html (pas admin.html !)
├── app.js
└── styles.css
```

**⚠️ ATTENTION :** Sur Plesk, le fichier s'appelle souvent `index.html`, pas `admin.html` !

---

## ✅ VALIDATION FINALE

### Après 1 heure
```
Console F12 :
> SUPABASE_CACHE.showStats()

Hit rate > 50% → ✅ Bon
Hit rate < 50% → ⚠️ Augmenter TTL
```

### Après 24h
```
Supabase Dashboard :
Settings → Usage → Egress

Réduction visible → ✅ Succès !
Pas de réduction → 🔍 Vérifier diagnostic
```

---

## 🎉 RÉSULTAT ATTENDU

```
AVANT déploiement :
❌ 1.5 GB/jour egress
❌ Lent
❌ Coûteux

APRÈS déploiement :
✅ 250-400 MB/jour (-80%)
✅ Rapide
✅ Économique
```

---

## 📞 SUPPORT

**Si problème :**
1. Console F12 → Screenshot
2. `SUPABASE_CACHE.showStats()` → Copier résultat
3. Vérifier backup disponible
4. Restaurer si nécessaire

---

**CONSEIL : Commencez par Méthode 1 (rapide). Si problème, passez à Méthode 2 (complète). 🚀**
