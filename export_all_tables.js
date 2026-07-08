// ============================================================================
// SCRIPT D'EXPORT COMPLET DE TOUTES LES TABLES
// ============================================================================
// Ce script exporte TOUTES les données de toutes les tables importantes
// Usage: node export_all_tables.js
// ============================================================================

const fs = require('fs');

// ⚠️ CONFIGURATION - Mettez vos ANCIENNES credentials ici
const OLD_SUPABASE_URL = 'https://jvyvilqdnbjavxbwysdb.supabase.co/rest/v1/';
const OLD_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eXZpbHFkbmJqYXZ4Ynd5c2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MjE1NDIsImV4cCI6MjA5ODQ5NzU0Mn0.8GetwBw6mZuwtvIQQdu6ARHQ2g_1tOdrkmTHpTO4ZbM';

// Tables à exporter (dans l'ordre recommandé)
const TABLES_TO_EXPORT = [
  'mutuelles',
  'suppliers',
  'products',
  'customers',
  'sales',
  'sale_items',
  'purchases',
  'purchase_items',
  'supplier_returns',
  'supplier_return_items',
  'customer_payments',
  'fridge_sales',
  'stock_operations',
  'web_orders',
  'web_order_items',
  'backoffice_users',
  'action_history'
];

async function exportTable(tableName) {
  console.log(`\n📦 Export de la table: ${tableName}`);
  
  let allData = [];
  let offset = 0;
  const limit = 1000;
  
  while (true) {
    const response = await fetch(
      `${OLD_SUPABASE_URL}${tableName}?select=*&order=created_at&limit=${limit}&offset=${offset}`,
      {
        headers: {
          'apikey': OLD_SUPABASE_KEY,
          'Authorization': `Bearer ${OLD_SUPABASE_KEY}`,
        }
      }
    );
    
    if (!response.ok) {
      console.warn(`⚠️  Impossible d'exporter ${tableName}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.length === 0) break;
    
    allData = allData.concat(data);
    offset += limit;
    
    process.stdout.write(`\r   Téléchargé: ${allData.length} lignes`);
  }
  
  console.log(`\n✅ ${tableName}: ${allData.length} lignes exportées`);
  return allData;
}

function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      let value = row[header];
      
      if (value === null || value === undefined) return '';
      
      // Gérer les objets JSON
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      
      value = String(value).replace(/"/g, '""');
      
      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        return `"${value}"`;
      }
      
      return value;
    }).join(',');
  });
  
  return csvHeaders + '\n' + csvRows.join('\n');
}

async function exportAllTables() {
  console.log('🚀 Début de l\'export complet...\n');
  
  const exportDir = 'exports_csv';
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
  }
  
  const summary = [];
  
  for (const tableName of TABLES_TO_EXPORT) {
    try {
      const data = await exportTable(tableName);
      
      if (data && data.length > 0) {
        const csv = convertToCSV(data);
        const filename = `${exportDir}/${tableName}.csv`;
        fs.writeFileSync(filename, csv, 'utf8');
        
        summary.push({
          table: tableName,
          rows: data.length,
          file: filename,
          status: '✅'
        });
      } else {
        summary.push({
          table: tableName,
          rows: 0,
          file: '-',
          status: '⚠️ Vide'
        });
      }
    } catch (error) {
      console.error(`❌ Erreur sur ${tableName}:`, error.message);
      summary.push({
        table: tableName,
        rows: 0,
        file: '-',
        status: '❌ Erreur'
      });
    }
  }
  
  // Afficher le résumé
  console.log('\n\n📊 RÉSUMÉ DE L\'EXPORT');
  console.log('='.repeat(60));
  console.table(summary);
  
  const totalRows = summary.reduce((sum, item) => sum + item.rows, 0);
  console.log(`\n✅ Export terminé: ${totalRows} lignes au total`);
  console.log(`📁 Fichiers dans: ${exportDir}/`);
}

// Exécution
exportAllTables().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
