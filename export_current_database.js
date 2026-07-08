const fs = require('fs');
const path = require('path');

function getCredentials() {
  const apiPath = path.join(__dirname, 'mv-para-sparkle-main', 'src', 'lib', 'store-api.ts');
  if (!fs.existsSync(apiPath)) {
    console.error('âŒ Impossible de trouver store-api.ts.');
    process.exit(1);
  }
  const content = fs.readFileSync(apiPath, 'utf8');
  const urlMatch = content.match(/supabaseUrl\s*=\s*["']([^"']+)["']/);
  const keyMatch = content.match(/supabaseKey\s*=\s*["']([^"']+)["']/);
  if (!urlMatch || !keyMatch) {
    console.error('âŒ Impossible d\'extraire les credentials.');
    process.exit(1);
  }
  return { url: urlMatch[1], key: keyMatch[1] };
}

const { url: SUPABASE_URL, key: SUPABASE_KEY } = getCredentials();
console.log('ðŸ“¡ Instance source dÃ©tectÃ©e :', SUPABASE_URL);

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

async function exportTable(tableName) {
  let allData = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const fetchUrl = `${SUPABASE_URL}${tableName}?select=*&limit=${limit}&offset=${offset}`;
    const response = await fetch(fetchUrl, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Erreur HTTP ${response.status} : ${err}`);
    }
    const data = await response.json();
    if (data.length === 0) break;
    allData = allData.concat(data);
    offset += limit;
    process.stdout.write(`   TÃ©lÃ©chargement ${tableName} : ${allData.length} lignes...\r`);
  }
  console.log(`âœ… ${tableName} : ${allData.length} lignes exportÃ©es.         `);
  return allData;
}

async function start() {
  const backupDir = path.join(__dirname, 'migration_backup');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
  console.log('ðŸš€ DÃ©but de l\'export complet des donnÃ©es...\n');
  for (const table of TABLES) {
    try {
      const data = await exportTable(table);
      if (data.length > 0) {
        fs.writeFileSync(path.join(backupDir, `${table}.json`), JSON.stringify(data, null, 2), 'utf8');
      }
    } catch (e) {
      console.error(`âŒ Ã‰chec de l'export pour ${table} :`, e.message);
    }
  }
  console.log('\nðŸŽ‰ DonnÃ©es exportÃ©es avec succÃ¨s dans le dossier : migration_backup/');
}
start();