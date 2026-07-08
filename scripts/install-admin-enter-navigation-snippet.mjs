#!/usr/bin/env node
/**
 * Injects admin-enter-navigation.js into admin.html before app.js.
 * Safe to run multiple times.
 */
import { readFile, writeFile } from 'node:fs/promises';

const TARGET = process.env.ADMIN_HTML || 'admin.html';
const SNIPPET = '<script src="admin-enter-navigation.js"></script>';

let html = await readFile(TARGET, 'utf8');

if (html.includes('admin-enter-navigation.js')) {
  console.log(`✓ ${TARGET}: Enter navigation already installed`);
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
console.log(`✓ ${TARGET}: Enter navigation installed before app.js`);
