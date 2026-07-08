@echo off
setlocal

cd /d "%~dp0"

echo ==========================================
echo Rapprochement Catalogue Web ^<^> Backoffice
echo ==========================================
echo.
echo Ce script va utiliser :
echo - parashop-public-import.ready.csv
echo - votre export articles backoffice ^(.xlsx, .xls ou .csv^)
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js n'est pas installe ou non disponible dans le PATH.
    echo Installez Node.js puis relancez ce fichier.
    echo.
    pause
    exit /b 1
)

set "BACKOFFICE_FILE=%~1"

if "%BACKOFFICE_FILE%"=="" (
    set /p BACKOFFICE_FILE=Collez ici le chemin du fichier backoffice puis appuyez sur Entree : 
)

if "%BACKOFFICE_FILE%"=="" (
    echo.
    echo Aucun fichier fourni.
    echo.
    pause
    exit /b 1
)

if not exist "%BACKOFFICE_FILE%" (
    echo.
    echo Fichier introuvable :
    echo %BACKOFFICE_FILE%
    echo.
    pause
    exit /b 1
)

if not exist "%cd%\parashop-public-import.ready.csv" (
    echo.
    echo Fichier web introuvable :
    echo %cd%\parashop-public-import.ready.csv
    echo Lancez d'abord "Generer CSV Parashop.bat" et le nettoyage.
    echo.
    pause
    exit /b 1
)

call node scripts\match-backoffice-parashop.mjs --backoffice "%BACKOFFICE_FILE%" --web "%cd%\parashop-public-import.ready.csv" --out-dir "%cd%"
if errorlevel 1 (
    echo.
    echo Echec du rapprochement catalogue.
    echo Verifiez le fichier backoffice puis reessayez.
    echo.
    pause
    exit /b 1
)

echo.
echo Rapprochement termine avec succes.
echo Fichiers generes :
echo - %cd%\catalogue-web-match.matched.csv
echo - %cd%\catalogue-web-match.review.csv
echo - %cd%\catalogue-web-match.unmatched.csv
echo.
echo Utilisez surtout "catalogue-web-match.matched.csv" pour enrichir les articles.
echo.
pause
