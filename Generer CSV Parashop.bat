@echo off
setlocal

cd /d "%~dp0"

echo ==========================================
echo Generation du catalogue public Parashop
echo ==========================================
echo.
echo Cette operation va creer :
echo - parashop-public-import.csv
echo - parashop-categories.json
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js n'est pas installe ou non disponible dans le PATH.
    echo Installez Node.js puis relancez ce fichier.
    echo.
    pause
    exit /b 1
)

set "NODE_OPTIONS=--max-old-space-size=4096"
call node scripts\scrape-parashop-public.mjs --limit-categories 8 --limit-products 800
if errorlevel 1 (
    echo.
    echo Echec de generation du catalogue Parashop.
    echo Verifiez la connexion internet et reessayez.
    echo.
    pause
    exit /b 1
)

echo.
echo Generation terminee avec succes.
echo Les fichiers ont ete crees dans :
echo %cd%
echo.
echo Vous pouvez maintenant ouvrir l'admin puis utiliser :
echo Import Catalogue Web
echo.
pause
