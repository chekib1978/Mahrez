#!/usr/bin/env node
/**
 * Injects admin-sales-date-defaults.js into admin.html before app.js.
 * Safe to run multiple times.
 */
import { readFile, writeFile } from 'node:fs/promises';

const TARGET = process.env.ADMIN_HTML || 'admin.html';
const SNIPPET = '<script src="admin-sales-date-defaults.js"></script>';

let html = await readFile(TARGET, 'utf8');

if (html.includes('admin-sales-date-defaults.js')) {
  console.log(`✓ ${TARGET}: sales date defaults already installed`);
  process.exit(0);
}

const anchors = [
  '<script src="app.js"></script>',
  '<script src="./app.js"></script>',
  '<script defer src="app.js"></script>',
  '<script defer src="./app.js"></script>'
];

let installed = false;
for (const anchor of anchors) {
  if (html.includes(anchor)) {
    html = html.replace(anchor, `${SNIPPET}\n${anchor}`);
    installed = true;
    break;
  }
}

if (!installed && html.includes('</body>')) {
  html = html.replace('</body>', `${SNIPPET}\n</body>`);
  installed = true;
}

if (!installed) html = `${html}\n${SNIPPET}\n`;

await writeFile(TARGET, html, 'utf8');
console.log(`✓ ${TARGET}: sales date defaults installed before app.js`);
