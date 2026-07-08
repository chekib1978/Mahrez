# 🚀 COMMENT DÉPLOYER SUR PLESK

## ✅ TOUT EST PRÊT DANS : `deploy-plesk-test`

---

## 📍 1. OUVRIR LE DOSSIER

```
c:\Users\INES\Desktop\Mahrez Kammoun -Avant BAse Local\deploy-plesk-test\
```

---

## 📖 2. LIRE LE GUIDE

Double-cliquer sur **l'un de ces fichiers** :

### 🟢 Pour débutants (RECOMMANDÉ)
```
LISEZMOI.md
```
ou
```
START_HERE.md
```

Ces fichiers vous guident vers le bon guide selon votre niveau.

### 🔵 Pour aller directement au déploiement
```
GUIDE_VISUEL_DEPLOIEMENT.md
```

Ce guide vous accompagne **pas à pas** avec checklist.

---

## 🎯 3. SUIVRE LES INSTRUCTIONS

Le guide contient :
- ✅ Étapes numérotées
- ✅ Checklist à cocher
- ✅ Commandes à copier-coller
- ✅ Vérifications à chaque étape
- ✅ Troubleshooting si problème
- ✅ Instructions de rollback

**Durée : 5-15 minutes**

---

## ⚡ RÉSUMÉ ULTRA-RAPIDE

### Ce qui sera fait :

1. **Backup Plesk** (2 min)
   - Compresser `httpdocs/`
   - Télécharger le ZIP

2. **Upload Admin** (3 min)
   - Uploader 2 fichiers dans `/admin/`
   - Vérifier que ça fonctionne

3. **Upload Shop** (10 min - OPTIONNEL)
   - Compiler React localement
   - Uploader dans `/shop/`

### Résultat attendu :

| Métrique | Avant | Après |
|----------|-------|-------|
| **Egress** | 1.5 GB/j | 0.25 GB/j (-83%) |
| **Vitesse** | 1.2s | 0.4s (+66%) |
| **Économies** | - | $3-4/mois |

---

## 📦 CONTENU DU PACKAGE

Le dossier `deploy-plesk-test` contient :

```
deploy-plesk-test/
├── 📖 6 guides de déploiement
├── 🔧 2 scripts PowerShell d'aide
└── 📂 httpdocs/ (à uploader sur Plesk)
    ├── admin/ (interface admin)
    └── shop/ (site e-commerce)
```

---

## 🚨 IMPORTANT

**AVANT de toucher Plesk :**
✅ **FAIRE UN BACKUP !**

Dans Plesk :
1. Compresser `httpdocs/`
2. Télécharger le ZIP
3. Conserver sur votre ordinateur

**Pourquoi ?** Rollback possible en 2 minutes si problème !

---

## 💡 RECOMMANDATION

### Si c'est votre première fois :
👉 **Lisez : `deploy-plesk-test/LISEZMOI.md`**  
👉 **Puis : `deploy-plesk-test/GUIDE_VISUEL_DEPLOIEMENT.md`**

### Si vous êtes pressé :
👉 **Admin uniquement = 5 minutes**  
👉 **Lisez : `deploy-plesk-test/GUIDE_VISUEL_DEPLOIEMENT.md`**

---

## ✅ TOUT EST DANS LES GUIDES !

**Vous avez :**
- ✅ 6 guides complets
- ✅ Instructions pas à pas
- ✅ Checklist complètes
- ✅ Troubleshooting
- ✅ Commandes prêtes
- ✅ Scripts d'aide

**Questions ? Réponses dans les guides !** 📖

---

## 🎉 VOUS ÊTES PRÊT !

**Prochaine étape :**
```
👉 Ouvrir : deploy-plesk-test\LISEZMOI.md
```

**🚀 Bon déploiement ! 🚀**

---

**Date :** 2025-01-XX  
**Durée :** 5-15 minutes  
**Niveau requis :** Débutant accepté  
**Rollback :** Possible en 2 min
