#!/usr/bin/env node
/**
 * Build static JSON files for the public storefront.
 *
 * Required env:
 *   SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=...   (preferred, server-side only)
 * or
 *   SUPABASE_ANON_KEY=...
 *
 * Output:
 *   static-data/products.json
 *   static-data/web_categories.json
 *   static-data/manifest.json
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const OUT_DIR = process.env.STATIC_DATA_DIR || 'static-data';

if (!SUPABASE_URL || !KEY) {
  console.error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
  process.exit(1);
}

const tables = [
  {
    name: 'products',
    // Keep this intentionally explicit. SELECT * is the egress killer.
    query: 'select=id,code,name,brand,category_id,price,sale_price,stock_quantity,image_url,is_active,updated_at&is_active=eq.true&order=name.asc'
  },
  {
    name: 'web_categories',
    query: 'select=id,name,slug,parent_id,sort_order,is_active,updated_at&is_active=eq.true&order=sort_order.asc'
  }
];

async function fetchTable(table) {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table.name}?${table.query}`;
  const response = await fetch(url, {
    headers: {
      apikey: KEY,
      authorization: `Bearer ${KEY}`,
      accept: 'application/json'
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${table.name}: ${response.status} ${text}`);
  }

  const rows = await response.json();
  return Array.isArray(rows) ? rows : [];
}

await mkdir(OUT_DIR, { recursive: true });

const manifest = {
  version: String(Date.now()),
  generatedAt: new Date().toISOString(),
  strategy: 'public-static-json',
  tables: {}
};

for (const table of tables) {
  const rows = await fetchTable(table);
  manifest.tables[table.name] = { rows: rows.length };
  await writeFile(path.join(OUT_DIR, `${table.name}.json`), JSON.stringify(rows), 'utf8');
  console.log(`✓ ${table.name}: ${rows.length} rows`);
}

await writeFile(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log(`✓ manifest: ${manifest.version}`);
console.log('Static public data ready. Upload static-data/ with the site.');
