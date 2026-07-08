#!/usr/bin/env node
/**
 * Build static JSON files for the public storefront.
 *
 * Required env:
 *   SUPABASE_URL=https://xxxx.supabase.co
 *   or SUPABASE_REST_URL=https://xxxx.supabase.co/rest/v1/
 *
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
const SUPABASE_REST_URL = process.env.SUPABASE_REST_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const OUT_DIR = process.env.STATIC_DATA_DIR || 'static-data';

if ((!SUPABASE_URL && !SUPABASE_REST_URL) || !KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_REST_URL, plus SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
  process.exit(1);
}

function getRestBaseUrl() {
  if (SUPABASE_REST_URL) return SUPABASE_REST_URL.replace(/\/$/, '');
  const clean = SUPABASE_URL.replace(/\/$/, '');
  if (clean.endsWith('/rest/v1')) return clean;
  return `${clean}/rest/v1`;
}

const REST_BASE_URL = getRestBaseUrl();

const tables = [
  {
    name: 'products',
    // Explicit columns only. SELECT * is the egress killer.
    query: [
      'select=id,code_article,code_barre,designation,stock_actuel,prix_vente_ttc,prix_vente_web_ttc,prix_vente_passager_ttc,remise_web_pct,image_url,description_web,product_brand,web_category_slug,is_web_hidden,old_price_ttc,promo_badge,product_gallery_urls,product_specs,forme,product_url,updated_at',
      'is_web_hidden=eq.false',
      'order=designation.asc'
    ].join('&')
  },
  {
    name: 'web_categories',
    query: [
      'select=id,parent_id,name,slug,sort_order,is_active,updated_at',
      'is_active=eq.true',
      'order=sort_order.asc'
    ].join('&')
  }
];

async function fetchTable(table) {
  const url = `${REST_BASE_URL}/${table.name}?${table.query}`;
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
  restBaseUrl: REST_BASE_URL.replace(/^https:\/\/([^./]+).*/, 'https://$1.supabase.co/rest/v1'),
  tables: {}
};

for (const table of tables) {
  const rows = await fetchTable(table);
  const json = JSON.stringify(rows);
  manifest.tables[table.name] = {
    rows: rows.length,
    bytes: Buffer.byteLength(json, 'utf8')
  };
  await writeFile(path.join(OUT_DIR, `${table.name}.json`), json, 'utf8');
  console.log(`✓ ${table.name}: ${rows.length} rows`);
}

await writeFile(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log(`✓ manifest: ${manifest.version}`);
console.log('Static public data ready. Upload static-data/ with the site.');
