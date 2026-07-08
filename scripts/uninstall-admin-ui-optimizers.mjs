#!/usr/bin/env node
/**
 * Emergency rollback for admin UI helper scripts.
 * Removes scripts that can interfere with native app.js behavior.
 * Keeps the public storefront static-data optimization untouched.
 */
import { readFile, writeFile } from 'node:fs/promises';

const TARGET = process.env.ADMIN_HTML || 'admin.html';
const patterns = [
  /\s*<script\s+src=["']admin-enter-navigation\.js["']><\/script>\s*/g,
  /\s*<script\s+src=["']\.\/admin-enter-navigation\.js["']><\/script>\s*/g,
  /\s*<script\s+src=["']admin-rpc-optimizer\.js["']><\/script>\s*/g,
  /\s*<script\s+src=["']\.\/admin-rpc-optimizer\.js["']><\/script>\s*/g
];

let html = await readFile(TARGET, 'utf8');
const before = html;
for (const pattern of patterns) html = html.replace(pattern, '\n');

if (html === before) {
  console.log(`✓ ${TARGET}: no admin UI optimizer scripts found`);
} else {
  await writeFile(TARGET, html, 'utf8');
  console.log(`✓ ${TARGET}: admin UI optimizer scripts removed`);
}
