# Script de préparation déploiement Plesk
# Copie TOUS les fichiers nécessaires dans deploy-plesk-test

Write-Host "`n🚀 PRÉPARATION DÉPLOIEMENT PLESK`n" -ForegroundColor Cyan

$sourceDir = $PSScriptRoot
$deployDir = Join-Path $sourceDir "deploy-plesk-test\httpdocs\admin"

# Vérifier que le dossier existe
if (-not (Test-Path $deployDir)) {
    Write-Host "❌ Dossier deploy-plesk-test\httpdocs\admin introuvable !" -ForegroundColor Red
    Write-Host "   Créez-le d'abord." -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Copie des fichiers essentiels...`n" -ForegroundColor Yellow

$filesToCopy = @(
    @{
        Source = "supabase-cache-layer.js"
        Dest = "supabase-cache-layer.js"
        Required = $true
        Description = "Cache layer principal"
    },
    @{
        Source = "app.js"
        Dest = "app.js"
        Required = $true
        Description = "Application principale"
    },
    @{
        Source = "styles.css"
        Dest = "styles.css"
        Required = $true
        Description = "Styles CSS"
    },
    @{
        Source = "admin.html"
        Dest = "index.html"
        Required = $true
        Description = "Page admin principale"
    },
    @{
        Source = "logo.png"
        Dest = "logo.png"
        Required = $false
        Description = "Logo application"
    }
)

$copied = 0
$skipped = 0
$errors = 0

foreach ($file in $filesToCopy) {
    $sourcePath = Join-Path $sourceDir $file.Source
    $destPath = Join-Path $deployDir $file.Dest
    
    if (Test-Path $sourcePath) {
        try {
            Copy-Item -Path $sourcePath -Destination $destPath -Force
            Write-Host "✅ $($file.Description) copié" -ForegroundColor Green
            $copied++
        } catch {
            Write-Host "❌ Erreur copie $($file.Description): $($_.Exception.Message)" -ForegroundColor Red
            $errors++
        }
    } else {
        if ($file.Required) {
            Write-Host "⚠️  MANQUANT (requis): $($file.Source)" -ForegroundColor Yellow
            $errors++
        } else {
            Write-Host "⏭️  Ignoré (optionnel): $($file.Source)" -ForegroundColor Gray
            $skipped++
        }
    }
}

Write-Host "`n" + ("="*60) -ForegroundColor Cyan
Write-Host "📊 RÉSUMÉ" -ForegroundColor Cyan
Write-Host ("="*60) -ForegroundColor Cyan

Write-Host "`n✅ Fichiers copiés: $copied" -ForegroundColor Green
Write-Host "⏭️  Fichiers ignorés: $skipped" -ForegroundColor Gray
Write-Host "❌ Erreurs: $errors" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "Green" })

if ($errors -eq 0) {
    Write-Host "`n🎉 DÉPLOIEMENT PRÊT !" -ForegroundColor Green
    Write-Host "`n📂 Dossier à uploader :" -ForegroundColor Cyan
    Write-Host "   $deployDir" -ForegroundColor White
    Write-Host "`n📋 PROCHAINES ÉTAPES :" -ForegroundColor Cyan
    Write-Host "   1. Ouvrir Plesk File Manager" -ForegroundColor White
    Write-Host "   2. Aller dans /httpdocs/admin/" -ForegroundColor White
    Write-Host "   3. Uploader TOUS les fichiers de:" -ForegroundColor White
    Write-Host "      $deployDir" -ForegroundColor Yellow
    Write-Host "   4. Tester: https://votre-domaine.com/admin/" -ForegroundColor White
    Write-Host "   5. Console F12: Vérifier 'Cache Layer activated'" -ForegroundColor White
} else {
    Write-Host "`n⚠️  ATTENTION: Erreurs détectées" -ForegroundColor Yellow
    Write-Host "   Corrigez les erreurs ci-dessus avant de déployer." -ForegroundColor White
}

Write-Host ""
