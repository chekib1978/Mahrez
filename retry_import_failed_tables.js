const fs = require('fs');
const path = require('path');

const NEW_URL = 'https://sckhssxmgtyqrwwsoqtk.supabase.co/rest/v1/';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNja2hzc3htZ3R5cXJ3d3NvcXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MDg2MDUsImV4cCI6MjA5ODk4NDYwNX0.N7M-c7HVpcJ85iFFY5xCVAOnZB6TTzRv9A2l-4Kb4kY';

const supabaseHeaders = {
  'apikey': NEW_KEY,
  'Authorization': `Bearer ${NEW_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'resolution=merge-duplicates,return=representation'
};

const KNOWN_COLUMNS = {
  document_sequences: ['prefix','last_value','updated_at'],
  products: ['id','code_article','code_barre','designation','code_pct','stock_actuel','peremption','prix_achat_ht','prix_achat_ttc','prix_vente_ht','tva','fodec_pct','prix_vente_ttc','prix_vente_web_ttc','prix_vente_passager_ttc','remise_web_pct','marge','date_alerte','image_url','description_web','product_brand','web_category_slug','is_web_hidden','old_price_ttc','promo_badge','product_gallery_urls','product_specs','forme','product_url','created_at','updated_at'],
  sales: ['id','numero_vente','numero_bl','numero_facture','numero_devis','type_vente','client_id','mutuelle_id','payment_mode','total_ht','total_tva','total_ttc','statut','date_vente','validated_by','validated_by_user_id','created_by','created_at'],
  sale_items: ['id','sale_id','product_id','quantite','prix_unitaire_ttc','remise','created_at'],
  purchases: ['id','numero_achat','date_achat','supplier_id','num_bl_fact','total_ht_net','total_fodec','total_ttc','created_at','created_by'],
  purchase_items: ['id','purchase_id','product_id','quantite','quantite_gratuite','prix_achat_ht','fodec_pct','remise','peremption','created_at'],
  supplier_return_items: ['id','supplier_return_id','product_id','quantite','prix_achat_ht','created_at'],
  web_order_items: ['id','order_id','product_id','quantity','unit_price','created_at'],
  stock_operations: ['id','operation_number','module_id','movement_type','product_id','product_code','product_designation','partner_name','note','quantity','stock_effect','operation_date','created_at','created_by'],
};

const TABLES_TO_RETRY = [
  'document_sequences',
  'products',
  'sales',
  'sale_items',
  'purchases',
  'purchase_items',
  'supplier_return_items',
  'web_order_items',
  'stock_operations'
];

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8').trim();
  const lines = content.split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;
    const row = {};
    headers.forEach((header, idx) => {
      if (idx < values.length) row[header] = values[idx] || null;
    });
    rows.push(row);
  }
  return { headers, rows };
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
    if (val === '' || val === undefined || val === null) val = null;
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

  const batchSize = tableName === 'products' ? 100 : 500;
  let imported = 0;
  let failed = 0;

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
          if (response.status === 409 || response.status === 400) {
            // Try individual import
            let singleOk = 0;
            for (const row of batch) {
              try {
                const resp = await fetch(`${NEW_URL}${tableName}`, {
                  method: 'POST',
                  headers: supabaseHeaders,
                  body: JSON.stringify(row)
                });
                if (resp.ok) singleOk++;
                else failed++;
              } catch(e) { failed++; }
              await new Promise(r => setTimeout(r, 20));
            }
            imported += singleOk;
            success = true;
          } else {
            attempts++;
            if (attempts < 3) {
              await new Promise(r => setTimeout(r, 2000));
            } else {
              console.log(`   ❌ Erreur ${response.status} pour ${tableName} (batch ${i}): ${errText.slice(0, 150)}`);
              failed += batch.length;
            }
          }
        }
      } catch (e) {
        attempts++;
        if (attempts < 3) {
          await new Promise(r => setTimeout(r, 2000));
        } else {
          console.log(`   ❌ Erreur réseau ${tableName} (batch ${i}): ${e.message}`);
          failed += batch.length;
        }
      }
    }

    const progress = Math.min(i + batchSize, rows.length);
    process.stdout.write(`\r   Progression: ${progress}/${rows.length} (imported: ${imported}, failed: ${failed})`);
  }

  console.log(`\n✅ ${tableName}: ${imported}/${rows.length} lignes importées`);
  return imported;
}

async function main() {
  console.log('🚀 Ré-import des tables échouées\n');

  const summary = [];
  let totalImported = 0;

  for (const table of TABLES_TO_RETRY) {
    try {
      const count = await importTable(table);
      summary.push({ table, status: count > 0 ? '✅' : '⚠️', rows: count });
      totalImported += count;
    } catch (e) {
      console.error(`❌ ${table}: Erreur - ${e.message}`);
      summary.push({ table, status: '❌', rows: 0 });
    }
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('📊 RÉSUMÉ DU RÉ-IMPORT');
  console.log('='.repeat(60));
  console.table(summary);
  console.log(`\n✅ Total: ${totalImported} lignes importées`);
}

main().catch(e => {
  console.error('❌ Erreur fatale:', e);
  process.exit(1);
});
