// ============================================================================
// SCRIPT D'EXPORT COMPLET DES PRODUITS
// ============================================================================
// Ce script exporte TOUS les produits de l'ancienne base Supabase
// Usage: node export_products_full.js
// ============================================================================

const fs = require('fs');

// ⚠️ CONFIGURATION - Mettez vos ANCIENNES credentials ici
const OLD_SUPABASE_URL = 'https://jvyvilqdnbjavxbwysdb.supabase.co/rest/v1/';
const OLD_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eXZpbHFkbmJqYXZ4Ynd5c2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MjE1NDIsImV4cCI6MjA5ODQ5NzU0Mn0.8GetwBw6mZuwtvIQQdu6ARHQ2g_1tOdrkmTHpTO4ZbM';

async function exportAllProducts() {
  console.log('🚀 Début de l\'export des produits...');
  
  let allProducts = [];
  let offset = 0;
  const limit = 1000; // Par batch de 1000
  
  while (true) {
    console.log(`📦 Téléchargement batch ${Math.floor(offset / limit) + 1} (lignes ${offset} à ${offset + limit})...`);
    
    const response = await fetch(
      `${OLD_SUPABASE_URL}products?select=*&order=created_at&limit=${limit}&offset=${offset}`,
      {
        headers: {
          'apikey': OLD_SUPABASE_KEY,
          'Authorization': `Bearer ${OLD_SUPABASE_KEY}`,
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const products = await response.json();
    
    if (products.length === 0) {
      console.log('✅ Tous les produits ont été téléchargés');
      break;
    }
    
    allProducts = allProducts.concat(products);
    offset += limit;
    
    console.log(`   Total téléchargé: ${allProducts.length} produits`);
  }
  
  // Convertir en CSV
  console.log('📝 Conversion en CSV...');
  const csv = convertToCSV(allProducts);
  
  // Sauvegarder
  const filename = 'products_complet_export.csv';
  fs.writeFileSync(filename, csv, 'utf8');
  
  console.log(`✅ Export terminé: ${allProducts.length} produits exportés dans ${filename}`);
}

function convertToCSV(data) {
  if (data.length === 0) return '';
  
  // En-têtes
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  // Lignes
  const csvRows = data.map(row => {
    return headers.map(header => {
      let value = row[header];
      
      // Gérer les valeurs null/undefined
      if (value === null || value === undefined) {
        return '';
      }
      
      // Convertir en string et échapper les guillemets
      value = String(value).replace(/"/g, '""');
      
      // Entourer de guillemets si contient virgule, retour ligne ou guillemet
      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        return `"${value}"`;
      }
      
      return value;
    }).join(',');
  });
  
  return csvHeaders + '\n' + csvRows.join('\n');
}

// Exécution
exportAllProducts().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
