const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const TABLES = [
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
  'company_settings',
  'backoffice_users',
  'document_sequences'
];

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function importTable(tableName, url, key) {
  const filePath = path.join(__dirname, 'migration_backup', `${tableName}.json`);
  if (!fs.existsSync(filePath)) {
    console.log(`â„¹ï¸  ${tableName} : Pas de fichier de backup (vide).`);
    return;
  }
  
  const rawData = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(rawData);
  if (!data || data.length === 0) {
    console.log(`â„¹ï¸  ${tableName} : Pas de donnÃ©es Ã  importer.`);
    return;
  }
  
  console.log(`ðŸš€ Importation de la table ${tableName} (${data.length} lignes)...`);
  
  // Par paquets de 100 lignes pour Ã©viter d'excÃ©der la limite de requÃªte
  const batchSize = 100;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    // Pour document_sequences on fait un upsert
    const isSequence = tableName === 'document_sequences';
    const headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': isSequence ? 'resolution=merge-duplicates' : 'return=minimal'
    };
    
    const response = await fetch(`${url}${tableName}`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(batch)
    });
    
    if (!response.ok) {
      const err = await response.text();
      console.error(`\nâŒ Ã‰chec import lot ${i}-${i + batch.length} de ${tableName} : ${err}`);
      throw new Error(`Erreur insertion sur ${tableName}`);
    }
  }
  
  console.log(`âœ… ${tableName} : Import rÃ©ussi de ${data.length} lignes.`);
}

async function start() {
  console.log('ðŸ INITIALISATION DE L\'IMPORTATION VERS LA NOUVELLE BASE');
  console.log('========================================================\n');
  
  const newUrlInput = await askQuestion('ðŸ”— Entrez l\'URL Supabase REST de votre NOUVELLE instance :\n(ex: https://abcde.supabase.co/rest/v1/) -> ');
  const newKeyInput = await askQuestion('\nðŸ”‘ Entrez la clÃ© PUBLIC ANON de votre NOUVELLE instance -> ');
  
  rl.close();
  
  let cleanUrl = newUrlInput.trim();
  if (!cleanUrl.endsWith('/')) cleanUrl += '/';
  if (!cleanUrl.endsWith('rest/v1/')) {
    if (cleanUrl.endsWith('supabase.co/')) cleanUrl += 'rest/v1/';
    else if (cleanUrl.endsWith('supabase.co')) cleanUrl += '/rest/v1/';
  }
  
  const cleanKey = newKeyInput.trim();
  
  if (!cleanUrl.startsWith('https://') || cleanKey.length < 50) {
    console.error('âŒ URL ou ClÃ© invalide.');
    process.exit(1);
  }
  
  console.log('\nðŸ Nouvelle instance cible :', cleanUrl);
  console.log('ðŸ“‚ Lecture des fichiers depuis le dossier migration_backup/ ...\n');
  
  for (const table of TABLES) {
    try {
      await importTable(table, cleanUrl, cleanKey);
    } catch (e) {
      console.error(`ðŸ›‘ Importation arrÃªtÃ©e suite Ã  une erreur sur la table ${table} :`, e.message);
      console.log('\nðŸ’¡ Conseil : Assurez-vous d\'avoir bien exÃ©cutÃ© le schÃ©ma SQL (SUPABASE_SCHEMA_COMPLET.sql) sur la nouvelle base avant d\'importer.');
      process.exit(1);
    }
  }
  
  console.log('\nðŸŽ‰ MIGRATION TERMINÃ‰E AVEC SUCCÃˆS !');
}

start();