#!/usr/bin/env node
/**
 * Injects public-supabase-static-cache.js into public HTML pages.
 * Safe to run multiple times.
 */
import { readFile, writeFile } from 'node:fs/promises';

const TARGETS = (process.env.STATIC_CACHE_HTML || 'index.html,ecommerce.html')
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean);

const SNIPPET = '<script src="public-supabase-static-cache.js"></script>';

async function install(file) {
  let html = await readFile(file, 'utf8');
  if (html.includes('public-supabase-static-cache.js')) {
    console.log(`✓ ${file}: already installed`);
    return;
  }

  if (html.includes('</head>')) {
    html = html.replace('</head>', `  ${SNIPPET}\n</head>`);
  } else if (html.includes('<body')) {
    html = html.replace('<body', `${SNIPPET}\n<body`);
  } else {
    html = `${SNIPPET}\n${html}`;
  }

  await writeFile(file, html, 'utf8');
  console.log(`✓ ${file}: static cache installed`);
}

for (const file of TARGETS) {
  await install(file);
}
