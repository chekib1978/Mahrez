# Script de création du package de déploiement Plesk
# Crée un ZIP contenant uniquement les fichiers nécessaires

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Package Déploiement Plesk - MVPara" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Définir les chemins
$baseDir = "c:\Users\INES\Desktop\Mahrez Kammoun -Avant BAse Local"
$deployDir = "$baseDir\deploy-plesk-test"
$zipFile = "$baseDir\mvpara-deploy-plesk-$(Get-Date -Format 'yyyyMMdd-HHmm').zip"

Write-Host "[1/4] Vérification des fichiers..." -ForegroundColor Yellow

# Vérifier que le dossier deploy existe
if (-not (Test-Path $deployDir)) {
    Write-Host "❌ ERREUR: Dossier deploy-plesk-test introuvable!" -ForegroundColor Red
    Write-Host "   Chemin attendu: $deployDir" -ForegroundColor Red
    exit 1
}

# Vérifier les fichiers admin
$adminFiles = @(
    "$deployDir\httpdocs\admin\index.html",
    "$deployDir\httpdocs\admin\supabase-cache-layer.js",
    "$deployDir\httpdocs\admin\app.js",
    "$deployDir\httpdocs\admin\styles.css"
)

$missing = $false
foreach ($file in $adminFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Fichier manquant: $file" -ForegroundColor Red
        $missing = $true
    }
}

# Vérifier les fichiers shop
$shopFiles = @(
    "$deployDir\httpdocs\shop\index.html",
    "$deployDir\httpdocs\shop\public\supabase-cache.js",
    "$deployDir\httpdocs\shop\src\App.tsx",
    "$deployDir\httpdocs\shop\package.json"
)

foreach ($file in $shopFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Fichier manquant: $file" -ForegroundColor Red
        $missing = $true
    }
}

if ($missing) {
    Write-Host ""
    Write-Host "❌ Des fichiers sont manquants. Impossible de créer le package." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Tous les fichiers nécessaires sont présents" -ForegroundColor Green
Write-Host ""

Write-Host "[2/4] Comptage des fichiers..." -ForegroundColor Yellow

$adminCount = (Get-ChildItem -Path "$deployDir\httpdocs\admin" -Recurse -File).Count
$shopCount = (Get-ChildItem -Path "$deployDir\httpdocs\shop" -Recurse -File).Count
$totalCount = $adminCount + $shopCount

Write-Host "   📁 Admin: $adminCount fichiers" -ForegroundColor Cyan
Write-Host "   📁 Shop: $shopCount fichiers" -ForegroundColor Cyan
Write-Host "   📦 Total: $totalCount fichiers" -ForegroundColor Cyan
Write-Host ""

Write-Host "[3/4] Création du ZIP..." -ForegroundColor Yellow

# Supprimer ancien ZIP s'il existe
if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}

# Créer le ZIP
try {
    # Utiliser Compress-Archive avec compression optimale
    $filesToZip = Get-ChildItem -Path $deployDir -Recurse
    Compress-Archive -Path "$deployDir\*" -DestinationPath $zipFile -CompressionLevel Optimal
    
    $zipSize = (Get-Item $zipFile).Length
    $zipSizeMB = [math]::Round($zipSize / 1MB, 2)
    
    Write-Host "✅ ZIP créé avec succès!" -ForegroundColor Green
    Write-Host "   📦 Taille: $zipSizeMB MB" -ForegroundColor Cyan
    Write-Host "   📍 Emplacement: $zipFile" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ ERREUR lors de la création du ZIP:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[4/4] Création du package Admin uniquement (pour déploiement rapide)..." -ForegroundColor Yellow

$adminZipFile = "$baseDir\mvpara-deploy-admin-only-$(Get-Date -Format 'yyyyMMdd-HHmm').zip"

try {
    Compress-Archive -Path "$deployDir\httpdocs\admin\*" -DestinationPath $adminZipFile -CompressionLevel Optimal
    
    $adminZipSize = (Get-Item $adminZipFile).Length
    $adminZipSizeMB = [math]::Round($adminZipSize / 1MB, 2)
    
    Write-Host "✅ ZIP Admin créé avec succès!" -ForegroundColor Green
    Write-Host "   📦 Taille: $adminZipSizeMB MB" -ForegroundColor Cyan
    Write-Host "   📍 Emplacement: $adminZipFile" -ForegroundColor Cyan
    
} catch {
    Write-Host "⚠️  Impossible de créer le ZIP Admin uniquement" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ PACKAGES PRÊTS POUR DÉPLOIEMENT" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📦 PACKAGE COMPLET (Admin + Shop):" -ForegroundColor Cyan
Write-Host "   $zipFile" -ForegroundColor White
Write-Host "   Taille: $zipSizeMB MB" -ForegroundColor Gray
Write-Host ""
Write-Host "📦 PACKAGE ADMIN UNIQUEMENT (déploiement rapide):" -ForegroundColor Cyan
Write-Host "   $adminZipFile" -ForegroundColor White
Write-Host "   Taille: $adminZipSizeMB MB" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 PROCHAINES ÉTAPES:" -ForegroundColor Yellow
Write-Host "   1. Uploader le ZIP sur Plesk" -ForegroundColor White
Write-Host "   2. Extraire dans httpdocs/" -ForegroundColor White
Write-Host "   3. Suivre les instructions dans README_DEPLOIEMENT.md" -ForegroundColor White
Write-Host ""
Write-Host "📖 Documentation complète: deploy-plesk-test\README_DEPLOIEMENT.md" -ForegroundColor Cyan
Write-Host ""
