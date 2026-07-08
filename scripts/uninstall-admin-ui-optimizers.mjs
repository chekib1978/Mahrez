#!/usr/bin/env node
/**
 * Emergency rollback for admin UI helper scripts.
 * Removes scripts that can interfere with native app.js behavior.
 * Targets both source admin.html and generated Plesk admin index.html.
 * Keeps the public storefront static-data optimization untouched.
 */
import { readFile, writeFile } from 'node:fs/promises';

const targets = (process.env.ADMIN_HTML_TARGETS || 'admin.html,deploy-plesk-test/httpdocs/admin/index.html')
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean);

const patterns = [
  /\s*<script\s+src=["']admin-enter-navigation\.js["']><\/script>\s*/g,
  /\s*<script\s+src=["']\.\/admin-enter-navigation\.js["']><\/script>\s*/g,
  /\s*<script\s+src=["']admin-rpc-optimizer\.js["']><\/script>\s*/g,
  /\s*<script\s+src=["']\.\/admin-rpc-optimizer\.js["']><\/script>\s*/g
];

for (const target of targets) {
  let html;
  try {
    html = await readFile(target, 'utf8');
  } catch {
    console.log(`- ${target}: not found, skipped`);
    continue;
  }

  const before = html;
  for (const pattern of patterns) html = html.replace(pattern, '\n');

  if (html === before) {
    console.log(`✓ ${target}: no admin UI optimizer scripts found`);
  } else {
    await writeFile(target, html, 'utf8');
    console.log(`✓ ${target}: admin UI optimizer scripts removed`);
  }
}
