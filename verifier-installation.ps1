# Script de vérification - Solution Cache Supabase
# Exécuter dans PowerShell: .\verifier-installation.ps1

Write-Host "`n🔍 VÉRIFICATION INSTALLATION CACHE SUPABASE`n" -ForegroundColor Cyan

$baseDir = $PSScriptRoot
$errors = @()
$warnings = @()
$success = @()

# Fonction de vérification de fichier
function Test-FileExists {
    param($Path, $Description)
    
    if (Test-Path $Path) {
        Write-Host "✅ $Description" -ForegroundColor Green
        $script:success += $Description
        return $true
    } else {
        Write-Host "❌ $Description - MANQUANT" -ForegroundColor Red
        $script:errors += "$Description - Fichier: $Path"
        return $false
    }
}

# Fonction de vérification de contenu
function Test-FileContains {
    param($Path, $Pattern, $Description)
    
    if (Test-Path $Path) {
        $content = Get-Content $Path -Raw
        if ($content -match $Pattern) {
            Write-Host "✅ $Description" -ForegroundColor Green
            $script:success += $Description
            return $true
        } else {
            Write-Host "⚠️  $Description - LIGNE MANQUANTE" -ForegroundColor Yellow
            $script:warnings += "$Description - Pattern: $Pattern"
            return $false
        }
    } else {
        Write-Host "❌ $Description - FICHIER MANQUANT" -ForegroundColor Red
        $script:errors += "$Description - Fichier: $Path"
        return $false
    }
}

Write-Host "📦 Vérification des fichiers cache layer...`n" -ForegroundColor Yellow

# Vérifier fichiers cache layer
Test-FileExists "$baseDir\supabase-cache-layer.js" "Cache layer principal"
Test-FileExists "$baseDir\deploy-plesk-test\httpdocs\admin\supabase-cache-layer.js" "Cache layer déploiement"
Test-FileExists "$baseDir\mv-para-sparkle-main\public\supabase-cache.js" "Cache layer React"

Write-Host "`n📝 Vérification des modifications HTML...`n" -ForegroundColor Yellow

# Vérifier modifications HTML
Test-FileContains "$baseDir\admin.html" "supabase-cache-layer\.js" "admin.html inclut cache layer"
Test-FileContains "$baseDir\index.html" "supabase-cache-layer\.js" "index.html inclut cache layer"
Test-FileContains "$baseDir\deploy-plesk-test\httpdocs\admin\index.html" "supabase-cache-layer\.js" "Déploiement Plesk inclut cache layer"
Test-FileContains "$baseDir\mv-para-sparkle-main\index.html" "supabase-cache\.js" "Site React inclut cache layer"

Write-Host "`n📚 Vérification de la documentation...`n" -ForegroundColor Yellow

# Vérifier documentation
Test-FileExists "$baseDir\SOLUTION_EGRESS.md" "Guide complet SOLUTION_EGRESS.md"
Test-FileExists "$baseDir\DEPLOIEMENT_RAPIDE.md" "Guide déploiement"
Test-FileExists "$baseDir\RESUME_EXECUTIF.md" "Résumé exécutif"
Test-FileExists "$baseDir\LISTE_CHANGEMENTS.md" "Liste des changements"
Test-FileExists "$baseDir\test-cache.html" "Page de test"

Write-Host "`n🧪 Vérification des outils...`n" -ForegroundColor Yellow

# Vérifier que app.js n'a PAS été modifié
$appJsPath = "$baseDir\app.js"
if (Test-Path $appJsPath) {
    $appJsContent = Get-Content $appJsPath -Raw
    if ($appJsContent -match "SUPABASE_CACHE" -or $appJsContent -match "cache-layer") {
        Write-Host "⚠️  app.js a été modifié (pas recommandé)" -ForegroundColor Yellow
        $script:warnings += "app.js contient des références au cache (devrait être externe)"
    } else {
        Write-Host "✅ app.js non modifié (correct)" -ForegroundColor Green
        $script:success += "app.js intact"
    }
}

# Vérifier taille des fichiers
Write-Host "`n📊 Taille des fichiers...`n" -ForegroundColor Yellow

$cacheLayerSize = (Get-Item "$baseDir\supabase-cache-layer.js").Length / 1KB
$cacheReactSize = (Get-Item "$baseDir\mv-para-sparkle-main\public\supabase-cache.js").Length / 1KB

Write-Host "   Cache layer principal: $([math]::Round($cacheLayerSize, 1)) KB"
Write-Host "   Cache layer React: $([math]::Round($cacheReactSize, 1)) KB"

if ($cacheLayerSize -lt 8 -or $cacheLayerSize -gt 15) {
    Write-Host "⚠️  Taille anormale du cache layer principal" -ForegroundColor Yellow
    $script:warnings += "Cache layer principal: taille inattendue ($cacheLayerSize KB)"
}

# Résumé
Write-Host "`n" + ("="*60) -ForegroundColor Cyan
Write-Host "📋 RÉSUMÉ" -ForegroundColor Cyan
Write-Host ("="*60) -ForegroundColor Cyan

Write-Host "`n✅ Succès: $($success.Count)" -ForegroundColor Green
Write-Host "⚠️  Avertissements: $($warnings.Count)" -ForegroundColor Yellow
Write-Host "❌ Erreurs: $($errors.Count)" -ForegroundColor Red

if ($errors.Count -gt 0) {
    Write-Host "`n❌ ERREURS DÉTECTÉES:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "   • $error" -ForegroundColor Red
    }
}

if ($warnings.Count -gt 0) {
    Write-Host "`n⚠️  AVERTISSEMENTS:" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "   • $warning" -ForegroundColor Yellow
    }
}

# Recommandations
Write-Host "`n🎯 PROCHAINES ÉTAPES:" -ForegroundColor Cyan

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "`n✅ Installation PARFAITE! Vous pouvez:" -ForegroundColor Green
    Write-Host "   1. Ouvrir test-cache.html dans un navigateur" -ForegroundColor White
    Write-Host "   2. Lancer les tests (boutons dans la page)" -ForegroundColor White
    Write-Host "   3. Vérifier que Hit rate > 80%" -ForegroundColor White
    Write-Host "   4. Ouvrir admin.html et tester normalement" -ForegroundColor White
    Write-Host "   5. Console F12: SUPABASE_CACHE.showStats()" -ForegroundColor White
    Write-Host "   6. Déployer en production" -ForegroundColor White
} elseif ($errors.Count -eq 0) {
    Write-Host "`n⚠️  Installation OK avec avertissements mineurs" -ForegroundColor Yellow
    Write-Host "   Vous pouvez continuer les tests." -ForegroundColor White
} else {
    Write-Host "`n❌ Installation INCOMPLÈTE" -ForegroundColor Red
    Write-Host "   Corrigez les erreurs ci-dessus avant de continuer." -ForegroundColor White
}

Write-Host "`n📖 Documentation complète dans SOLUTION_EGRESS.md`n" -ForegroundColor Cyan

# Code de sortie
if ($errors.Count -gt 0) {
    exit 1
} else {
    exit 0
}
