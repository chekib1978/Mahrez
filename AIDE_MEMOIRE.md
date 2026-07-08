# 🎯 AIDE-MÉMOIRE RAPIDE

## 🔍 PROBLÈME : Egress 1.5 GB/jour trop élevé

---

## 🛠️ DEUX OUTILS FOURNIS

### 1️⃣ EGRESS DETECTIVE (Nouveau !)
**Usage :** Identifier TOUS les coupables  
**Fichier :** `egress-detective.html`  
**Durée :** 5 min diagnostic  
**Quand :** AVANT d'installer le cache

**Cible :**
- SELECT * (colonnes inutiles)
- Absence LIMIT (tout charger)
- Relations lourdes
- Polling excessif

---

### 2️⃣ CACHE LAYER (Principal)
**Usage :** Réduire requêtes répétitives  
**Fichier :** `test-cache.html` + `TEST_CACHE.bat`  
**Durée :** 5 min installation  
**Quand :** Après diagnostic (ou directement)

**Cible :**
- Requêtes répétitives
- Données peu changeantes
- Navigation utilisateur

---

## ⚡ DÉMARRAGE EXPRESS

### Option A : Diagnostic d'abord (Recommandé)
```
1. egress-detective.html → Identifier coupables
2. Corriger alertes 🔴🟠 dans app.js
3. TEST_CACHE.bat → Installer cache
4. Résultat : -95% egress
```

### Option B : Cache direct (Rapide)
```
1. TEST_CACHE.bat → Installer cache
2. test-cache.html → Tester
3. Déployer
4. Résultat : -80% egress
```

---

## 📊 IMPACT ATTENDU

| Approche | Réduction | Temps | Effort |
|----------|-----------|-------|--------|
| Cache seul | -80% | 10 min | Minimal |
| Detective + Quick wins | -70% | 40 min | Moyen |
| Les deux | -95% | 50 min | Moyen |

---

## 🎮 COMMANDES ESSENTIELLES

### Detective
```javascript
// Dans egress-detective.html
EGRESS_DETECTIVE.showReport()
EGRESS_DETECTIVE.exportJSON()
```

### Cache
```javascript
// Dans console admin.html (F12)
SUPABASE_CACHE.showStats()
SUPABASE_CACHE.clear()
```

---

## 📚 DOCUMENTATION

| Besoin | Fichier |
|--------|---------|
| Vue d'ensemble | **SOLUTION_COMPLETE.md** ⭐ |
| Guide cache | SOLUTION_EGRESS.md |
| Guide detective | EGRESS_DETECTIVE_GUIDE.md |
| Démarrage 30s | DEMARRAGE_RAPIDE.md |

---

## 🆘 DÉPANNAGE

### Cache ne fonctionne pas
→ Vérifier console : "Cache Layer activated"  
→ Ctrl+F5 (hard refresh)

### Detective ne montre rien
→ Utiliser admin.html pendant 3 min  
→ Retourner sur detective et générer rapport

### Egress toujours élevé
→ Lancer detective pour voir alertes  
→ Corriger 🔴 en priorité

---

## ✅ CHECKLIST

- [ ] Detective lancé
- [ ] Alertes identifiées
- [ ] Corrections quick wins faites (si 🔴🟠)
- [ ] Cache installé
- [ ] Tests passés
- [ ] Production déployée
- [ ] Monitoring 72h

---

**Tout est prêt ! Commencez par ce que vous voulez : Detective OU Cache direct. 🚀**

**Recommandation : Detective d'abord (5 min) pour savoir exactement quoi faire.**
