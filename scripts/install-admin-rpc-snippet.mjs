#!/usr/bin/env node
/**
 * Injects admin-rpc-optimizer.js into admin.html before app.js.
 * Safe to run multiple times.
 */
import { readFile, writeFile } from 'node:fs/promises';

const TARGET = process.env.ADMIN_HTML || 'admin.html';
const SNIPPET = '<script src="admin-rpc-optimizer.js"></script>';

let html = await readFile(TARGET, 'utf8');

if (html.includes('admin-rpc-optimizer.js')) {
  console.log(`✓ ${TARGET}: admin RPC optimizer already installed`);
  process.exit(0);
}

const appScriptPatterns = [
  '<script src="app.js"></script>',
  '<script src="./app.js"></script>',
  '<script defer src="app.js"></script>',
  '<script defer src="./app.js"></script>'
];

let installed = false;
for (const pattern of appScriptPatterns) {
  if (html.includes(pattern)) {
    html = html.replace(pattern, `${SNIPPET}\n${pattern}`);
    installed = true;
    break;
  }
}

if (!installed && html.includes('</body>')) {
  html = html.replace('</body>', `${SNIPPET}\n</body>`);
  installed = true;
}

if (!installed) {
  html = `${html}\n${SNIPPET}\n`;
}

await writeFile(TARGET, html, 'utf8');
console.log(`✓ ${TARGET}: admin RPC optimizer installed before app.js`);
