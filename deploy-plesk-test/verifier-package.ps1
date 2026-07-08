# Script de Vérification du Package Déploiement Plesk
# Vérifie que tous les fichiers sont présents et prêts

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Vérification Package Déploiement" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseDir = "c:\Users\INES\Desktop\Mahrez Kammoun -Avant BAse Local"
$deployDir = "$baseDir\deploy-plesk-test"

$errors = 0
$warnings = 0

# Fonction de vérification
function Test-FileExists {
    param($path, $description)
    if (Test-Path $path) {
        Write-Host "✅ $description" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $description" -ForegroundColor Red
        Write-Host "   Manquant: $path" -ForegroundColor Red
        $script:errors++
        return $false
    }
}

Write-Host "[1/5] Vérification structure de base..." -ForegroundColor Yellow
Write-Host ""

Test-FileExists "$deployDir" "Dossier deploy-plesk-test"
Test-FileExists "$deployDir\httpdocs" "Dossier httpdocs"
Test-FileExists "$deployDir\httpdocs\admin" "Dossier admin"
Test-FileExists "$deployDir\httpdocs\shop" "Dossier shop"

Write-Host ""
Write-Host "[2/5] Vérification fichiers Admin..." -ForegroundColor Yellow
Write-Host ""

Test-FileExists "$deployDir\httpdocs\admin\index.html" "Admin: index.html"
Test-FileExists "$deployDir\httpdocs\admin\supabase-cache-layer.js" "Admin: supabase-cache-layer.js (NOUVEAU)"
Test-FileExists "$deployDir\httpdocs\admin\app.js" "Admin: app.js"
Test-FileExists "$deployDir\httpdocs\admin\styles.css" "Admin: styles.css"

Write-Host ""
Write-Host "[3/5] Vérification fichiers Shop..." -ForegroundColor Yellow
Write-Host ""

Test-FileExists "$deployDir\httpdocs\shop\index.html" "Shop: index.html"
Test-FileExists "$deployDir\httpdocs\shop\public\supabase-cache.js" "Shop: supabase-cache.js (NOUVEAU)"
Test-FileExists "$deployDir\httpdocs\shop\src\App.tsx" "Shop: App.tsx"
Test-FileExists "$deployDir\httpdocs\shop\package.json" "Shop: package.json"
Test-FileExists "$deployDir\httpdocs\shop\vite.config.ts" "Shop: vite.config.ts"

Write-Host ""
Write-Host "[4/5] Vérification guides de déploiement..." -ForegroundColor Yellow
Write-Host ""

Test-FileExists "$deployDir\START_HERE.md" "Guide: START_HERE.md"
Test-FileExists "$deployDir\LISEZMOI.md" "Guide: LISEZMOI.md"
Test-FileExists "$deployDir\GUIDE_VISUEL_DEPLOIEMENT.md" "Guide: GUIDE_VISUEL_DEPLOIEMENT.md"
Test-FileExists "$deployDir\INDEX.md" "Guide: INDEX.md"
Test-FileExists "$deployDir\README_DEPLOIEMENT.md" "Guide: README_DEPLOIEMENT.md"
Test-FileExists "$deployDir\DEPLOIEMENT_COMPLET_RESUME.md" "Guide: DEPLOIEMENT_COMPLET_RESUME.md"

Write-Host ""
Write-Host "[5/5] Vérification contenu des fichiers modifiés..." -ForegroundColor Yellow
Write-Host ""

# Vérifier que admin/index.html contient la ligne du cache
if (Test-Path "$deployDir\httpdocs\admin\index.html") {
    $content = Get-Content "$deployDir\httpdocs\admin\index.html" -Raw
    if ($content -match "supabase-cache-layer\.js") {
        Write-Host "✅ Admin index.html contient référence au cache layer" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Admin index.html ne contient pas la référence au cache" -ForegroundColor Yellow
        $warnings++
    }
}

# Vérifier que shop/index.html contient la ligne du cache
if (Test-Path "$deployDir\httpdocs\shop\index.html") {
    $content = Get-Content "$deployDir\httpdocs\shop\index.html" -Raw
    if ($content -match "supabase-cache\.js") {
        Write-Host "✅ Shop index.html contient référence au cache layer" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Shop index.html ne contient pas la référence au cache" -ForegroundColor Yellow
        $warnings++
    }
}

# Vérifier taille app.js (doit être > 1 MB)
if (Test-Path "$deployDir\httpdocs\admin\app.js") {
    $size = (Get-Item "$deployDir\httpdocs\admin\app.js").Length
    $sizeMB = [math]::Round($size / 1MB, 2)
    if ($sizeMB -gt 1) {
        Write-Host "✅ Admin app.js présent ($sizeMB MB)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Admin app.js semble trop petit ($sizeMB MB)" -ForegroundColor Yellow
        $warnings++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RÉSULTAT DE LA VÉRIFICATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "🎉 PARFAIT ! Tous les fichiers sont présents et prêts !" -ForegroundColor Green
    Write-Host ""
    Write-Host "📦 Package de déploiement : PRÊT ✅" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 PROCHAINE ÉTAPE :" -ForegroundColor Yellow
    Write-Host "   Ouvrir : deploy-plesk-test\START_HERE.md" -ForegroundColor Cyan
    Write-Host "   Ou : deploy-plesk-test\LISEZMOI.md" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📁 Emplacement package :" -ForegroundColor Cyan
    Write-Host "   $deployDir" -ForegroundColor White
    
} elseif ($errors -eq 0) {
    Write-Host "✅ Tous les fichiers essentiels sont présents" -ForegroundColor Green
    Write-Host "⚠️  $warnings avertissement(s) détecté(s)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Le package est utilisable mais vérifiez les avertissements." -ForegroundColor Yellow
    
} else {
    Write-Host "❌ $errors erreur(s) détectée(s)" -ForegroundColor Red
    if ($warnings -gt 0) {
        Write-Host "⚠️  $warnings avertissement(s) détecté(s)" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Le package est incomplet. Veuillez corriger les erreurs." -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
