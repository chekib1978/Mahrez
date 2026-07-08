@echo off
chcp 65001 >nul
title Test Solution Cache Supabase

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║  🧪 TEST SOLUTION CACHE SUPABASE                        ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

:menu
echo 📋 MENU PRINCIPAL
echo.
echo [1] Vérifier installation (PowerShell)
echo [2] Ouvrir page de test (test-cache.html)
echo [3] Ouvrir admin local (admin.html)
echo [4] Ouvrir site React en dev
echo [5] Afficher documentation
echo [6] Quitter
echo.

set /p choice="Votre choix (1-6): "

if "%choice%"=="1" goto verif
if "%choice%"=="2" goto testpage
if "%choice%"=="3" goto admin
if "%choice%"=="4" goto react
if "%choice%"=="5" goto docs
if "%choice%"=="6" goto end
goto menu

:verif
echo.
echo 🔍 Vérification de l'installation...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0verifier-installation.ps1"
echo.
pause
cls
goto menu

:testpage
echo.
echo 🧪 Ouverture de la page de test...
echo.
start "" "%~dp0test-cache.html"
echo ✅ Page ouverte dans le navigateur
echo.
echo 💡 Actions à faire:
echo    1. Cliquer sur "Test 1: Charger produits (×10)"
echo    2. Attendre 10 secondes
echo    3. Cliquer sur "📊 Afficher stats"
echo    4. Vérifier que Hit rate ^> 80%%
echo.
pause
cls
goto menu

:admin
echo.
echo 👨‍💼 Ouverture de l'admin local...
echo.
start "" "%~dp0admin.html"
echo ✅ Admin ouvert dans le navigateur
echo.
echo 💡 Actions à faire:
echo    1. Ouvrir la console (F12)
echo    2. Chercher: "✅ Supabase Cache Layer activated"
echo    3. Utiliser l'application normalement
echo    4. Dans console, taper: SUPABASE_CACHE.showStats()
echo    5. Vérifier que Hit rate augmente
echo.
pause
cls
goto menu

:react
echo.
echo 🛒 Démarrage du site React...
echo.
cd "%~dp0mv-para-sparkle-main"
if not exist "node_modules" (
    echo ⚠️  node_modules manquant. Installation...
    call npm install
)
echo.
echo 🚀 Lancement du serveur dev...
start cmd /k "npm run dev"
echo.
echo ✅ Serveur démarré
echo.
echo 💡 Le site devrait s'ouvrir automatiquement
echo    Sinon, ouvrir: http://localhost:5173
echo.
echo 📊 Pour voir les stats cache:
echo    Console F12 ^> SUPABASE_CACHE.showStats()
echo.
pause
cls
goto menu

:docs
cls
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║  📚 DOCUMENTATION DISPONIBLE                            ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo [1] README.md                - Vue d'ensemble
echo [2] RESUME_EXECUTIF.md       - Résumé 1 page
echo [3] SOLUTION_EGRESS.md       - Guide complet
echo [4] DEPLOIEMENT_RAPIDE.md    - Procédure déploiement
echo [5] LISTE_CHANGEMENTS.md     - Liste des modifs
echo [6] Retour menu principal
echo.

set /p docchoice="Ouvrir quel document (1-6): "

if "%docchoice%"=="1" start "" "%~dp0README.md"
if "%docchoice%"=="2" start "" "%~dp0RESUME_EXECUTIF.md"
if "%docchoice%"=="3" start "" "%~dp0SOLUTION_EGRESS.md"
if "%docchoice%"=="4" start "" "%~dp0DEPLOIEMENT_RAPIDE.md"
if "%docchoice%"=="5" start "" "%~dp0LISTE_CHANGEMENTS.md"
if "%docchoice%"=="6" (
    cls
    goto menu
)
echo.
echo ✅ Document ouvert
echo.
pause
goto docs

:end
echo.
echo 👋 Au revoir!
echo.
echo 📊 Pensez à surveiller l'egress Supabase après déploiement:
echo    https://supabase.com/dashboard ^> Settings ^> Usage
echo.
pause
exit

