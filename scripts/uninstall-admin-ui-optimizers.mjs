#!/usr/bin/env node
/**
 * Removes only admin-enter-navigation.js.
 * Keeps admin-rpc-optimizer.js active because RPC optimisation does not touch keyboard events.
 */
import { readFile, writeFile } from 'node:fs/promises';

const targets = (process.env.ADMIN_HTML_TARGETS || 'admin.html,deploy-plesk-test/httpdocs/admin/index.html')
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean);

const patterns = [
  /\s*<script\s+src=["']admin-enter-navigation\.js["']><\/script>\s*/g,
  /\s*<script\s+src=["']\.\/admin-enter-navigation\.js["']><\/script>\s*/g
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

  if (html === before) console.log(`✓ ${target}: admin Enter script was not present`);
  else {
    await writeFile(target, html, 'utf8');
    console.log(`✓ ${target}: admin Enter script removed, RPC kept`);
  }
}
