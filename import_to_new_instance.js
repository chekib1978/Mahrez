const fs = require('fs');
const path = require('path');

const NEW_URL = 'https://sckhssxmgtyqrwwsoqtk.supabase.co/rest/v1/';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNja2hzc3htZ3R5cXJ3d3NvcXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MDg2MDUsImV4cCI6MjA5ODk4NDYwNX0.N7M-c7HVpcJ85iFFY5xCVAOnZB6TTzRv9A2l-4Kb4kY';

const supabaseHeaders = {
  'apikey': NEW_KEY,
  'Authorization': `Bearer ${NEW_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

const KNOWN_COLUMNS = {
  company_settings: ['id','company_name','subtitle','address','city','phone','mobile','email','fiscal_id','website','rib','pharmacist_code','delivery_fee_standard','delivery_fee_express','delivery_fee_pickup','updated_at'],
  document_sequences: ['prefix','last_value','updated_at'],
  backoffice_users: ['id','username','full_name','password_text','is_admin','allowed_modules','is_active','created_at'],
  mutuelles: ['id','nom','taux_remboursement','created_at'],
  suppliers: ['id','nom','telephone','matricule_fiscale','created_at'],
  products: ['id','code_article','code_barre','designation','code_pct','stock_actuel','peremption','prix_achat_ht','prix_achat_ttc','prix_vente_ht','tva','fodec_pct','prix_vente_ttc','prix_vente_web_ttc','prix_vente_passager_ttc','remise_web_pct','marge','date_alerte','image_url','description_web','product_brand','web_category_slug','is_web_hidden','old_price_ttc','promo_badge','product_gallery_urls','product_specs','forme','product_url','created_at','updated_at'],
  customers: ['id','nom','telephone','adresse','mutuelle_id','numero_matricule_mutuelle','nom_malade','solde','en_cours','reste_a_payer','solde_initial','date_initial','email','source_client','created_at','updated_at'],
  sales: ['id','numero_vente','numero_bl','numero_facture','numero_devis','type_vente','client_id','mutuelle_id','payment_mode','total_ht','total_tva','total_ttc','statut','date_vente','validated_by','validated_by_user_id','created_by','created_at'],
  sale_items: ['id','sale_id','product_id','quantite','prix_unitaire_ttc','remise','created_at'],
  purchases: ['id','numero_achat','date_achat','supplier_id','num_bl_fact','total_ht_net','total_fodec','total_ttc','created_at','created_by'],
  purchase_items: ['id','purchase_id','product_id','quantite','quantite_gratuite','prix_achat_ht','fodec_pct','remise','peremption','created_at'],
  supplier_returns: ['id','return_number','supplier_id','return_date','note','total_ht','created_at'],
  supplier_return_items: ['id','supplier_return_id','product_id','quantite','prix_achat_ht','created_at'],
  customer_payments: ['id','payment_number','client_id','payment_date','amount','payment_mode','reference','note','statut','created_at'],
  fridge_sales: ['id','fridge_number','sale_type','client_id','mutuelle_id','total_ht','total_tva','total_ttc','sale_snapshot','fridge_date','expiry_date','note','statut','resumed_at','cancelled_at','created_at','updated_at'],
  stock_operations: ['id','operation_number','module_id','movement_type','product_id','product_code','product_designation','partner_name','note','quantity','stock_effect','operation_date','created_at','created_by'],
  web_orders: ['id','order_number','customer_name','customer_phone','customer_email','customer_address','notes','delivery_mode','payment_mode','delivery_fee_ttc','total_ttc','status','stock_decremented','created_at','updated_at'],
  web_order_items: ['id','order_id','product_id','quantity','unit_price','created_at'],
  action_history: ['id','created_at','user_id','username','full_name','poste_label','category','action','entity_type','entity_id','entity_label','details']
};

const TABLES_ORDER = [
  'company_settings',
  'document_sequences',
  'backoffice_users',
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
  'action_history'
];

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8').trim();
  const lines = splitCSVLines(content);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const row = {};
    headers.forEach((header, idx) => {
      if (idx < values.length) {
        row[header] = values[idx] || null;
      }
    });
    rows.push(row);
  }

  return { headers, rows };
}

function splitCSVLines(content) {
  const lines = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < content.length && content[i + 1] === '"') {
        current += '""';
        i++;
      } else {
        inQuotes = !inQuotes;
        current += ch;
      }
    } else if (ch === '\n' && !inQuotes) {
      lines.push(current);
      current = '';
    } else if (ch === '\r') {
      // skip carriage return
    } else {
      current += ch;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function cleanRow(row, tableName) {
  const allowed = KNOWN_COLUMNS[tableName];
  if (!allowed) return row;

  const cleaned = {};
  for (const col of allowed) {
    let val = row[col];
    if (val === '' || val === undefined || val === null) {
      val = null;
    }
    if (col === 'sale_snapshot' && typeof val === 'string') {
      try { val = JSON.parse(val); } catch(e) {}
    }
    if (col === 'allowed_modules' && typeof val === 'string') {
      try { val = JSON.parse(val); } catch(e) { val = []; }
    }
    if (col === 'details' && typeof val === 'string') {
      try { val = JSON.parse(val); } catch(e) { val = []; }
    }
    if (val === 'null') val = null;
    if (val === 'true') val = true;
    if (val === 'false') val = false;
    if (col === 'is_admin' || col === 'is_active' || col === 'is_web_hidden' || col === 'stock_decremented') {
      if (val === 't' || val === 'true' || val === '1' || val === 1) val = true;
      else if (val === 'f' || val === 'false' || val === '0' || val === 0) val = false;
    }
    cleaned[col] = val;
  }
  return cleaned;
}

async function importTable(tableName) {
  const csvPath = path.join(__dirname, 'exports_csv', `${tableName}.csv`);
  if (!fs.existsSync(csvPath)) {
    console.log(`⚠️  ${tableName}: fichier CSV introuvable, ignoré`);
    return 0;
  }

  const { rows } = parseCSV(csvPath);
  if (rows.length === 0) {
    console.log(`⚠️  ${tableName}: fichier vide, ignoré`);
    return 0;
  }

  console.log(`📦 Import de ${tableName}: ${rows.length} lignes...`);

  const batchSize = 500;
  let imported = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize).map(row => cleanRow(row, tableName));
    let attempts = 0;
    let success = false;

    while (!success && attempts < 3) {
      try {
        const response = await fetch(`${NEW_URL}${tableName}`, {
          method: 'POST',
          headers: supabaseHeaders,
          body: JSON.stringify(batch)
        });

        if (response.ok) {
          imported += batch.length;
          success = true;
        } else {
          const errText = await response.text();
          if (response.status === 409) {
            console.log(`   ⚠️  Conflit détecté pour ${tableName}, import individuel...`);
            let singleOk = 0;
            for (const row of batch) {
              try {
                const resp = await fetch(`${NEW_URL}${tableName}`, {
                  method: 'POST',
                  headers: supabaseHeaders,
                  body: JSON.stringify(row)
                });
                if (resp.ok) singleOk++;
              } catch(e) {}
              await new Promise(r => setTimeout(r, 50));
            }
            imported += singleOk;
            success = true;
          } else {
            attempts++;
            if (attempts < 3) {
              console.log(`   ⚠️  Erreur HTTP ${response.status}, tentative ${attempts + 1}/3...`);
              await new Promise(r => setTimeout(r, 2000));
            } else {
              console.log(`   ❌ Erreur HTTP ${response.status} pour ${tableName}: ${errText.slice(0, 200)}`);
            }
          }
        }
      } catch (e) {
        attempts++;
        if (attempts < 3) {
          console.log(`   ⚠️  Erreur réseau, tentative ${attempts + 1}/3: ${e.message}`);
          await new Promise(r => setTimeout(r, 3000));
        } else {
          console.log(`   ❌ Erreur réseau pour ${tableName}: ${e.message}`);
        }
      }
    }

    const progress = Math.min(i + batchSize, rows.length);
    process.stdout.write(`\r   Progression: ${progress}/${rows.length} lignes`);
  }

  console.log(`\n✅ ${tableName}: ${imported}/${rows.length} lignes importées`);
  return imported;
}

async function main() {
  console.log('🚀 Début de l\'import vers la nouvelle instance Supabase\n');
  console.log(`📁 Source: exports_csv/`);
  console.log(`🎯 Cible: ${NEW_URL}\n`);

  const summary = [];
  let totalImported = 0;
  let totalErrors = 0;

  for (const table of TABLES_ORDER) {
    try {
      const count = await importTable(table);
      summary.push({ table, status: count > 0 ? '✅' : '⚠️', rows: count });
      totalImported += count;
    } catch (e) {
      console.error(`❌ ${table}: Erreur - ${e.message}`);
      summary.push({ table, status: '❌', rows: 0 });
      totalErrors++;
    }
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('📊 RÉSUMÉ DE L\'IMPORT');
  console.log('='.repeat(60));
  console.table(summary);
  console.log(`\n✅ Total: ${totalImported} lignes importées`);
  if (totalErrors > 0) console.log(`⚠️  ${totalErrors} tables en erreur`);

  console.log('\n📋 Prochaines étapes:');
  console.log('1. Exécutez la PARTIE 3 du SQL pour réactiver les FK');
  console.log('2. Importez les catégories web via SUPABASE_SEED_CATEGORIES.sql');
  console.log('3. Redémarrez l\'application');
}

main().catch(e => {
  console.error('❌ Erreur fatale:', e);
  process.exit(1);
});
