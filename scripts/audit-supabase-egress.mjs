#!/usr/bin/env node
/**
 * Lightweight Supabase egress audit.
 * Finds patterns that usually explode bandwidth: select=*, .select('*'), and reads without limit/range.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'deploy-plesk-test', 'exports_csv', 'migration_backup']);
const extensions = new Set(['.js', '.mjs', '.html', '.ts', '.tsx', '.jsx']);
const findings = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    if (!extensions.has(path.extname(entry.name))) continue;
    await auditFile(full);
  }
}

function lineOf(content, index) {
  return content.slice(0, index).split('\n').length;
}

function add(file, index, severity, message, sample) {
  findings.push({
    file: path.relative(root, file),
    line: lineOf(sample.source, index),
    severity,
    message,
    code: sample.text.trim().slice(0, 180)
  });
}

async function auditFile(file) {
  const source = await readFile(file, 'utf8');

  for (const match of source.matchAll(/select=\*/g)) {
    add(file, match.index, 'HIGH', 'REST query uses select=*', { source, text: source.slice(match.index - 80, match.index + 120) });
  }

  for (const match of source.matchAll(/\.select\(\s*['"`]\*['"`]\s*\)/g)) {
    add(file, match.index, 'HIGH', 'Supabase client uses .select("*")', { source, text: source.slice(match.index - 80, match.index + 120) });
  }

  for (const match of source.matchAll(/\/rest\/v1\/([a-zA-Z0-9_]+)\?([^'"`\s)]+)/g)) {
    const table = match[1];
    const query = match[2];
    if (!/limit=|Range:/i.test(query)) {
      add(file, match.index, 'MEDIUM', `REST read on ${table} has no obvious limit`, { source, text: match[0] });
    }
  }

  for (const match of source.matchAll(/\.from\(\s*['"`]([a-zA-Z0-9_]+)['"`]\s*\)([\s\S]{0,220}?)(?:;|\n\s*\n)/g)) {
    const chain = match[2] || '';
    const table = match[1];
    if (/\.select\(/.test(chain) && !/\.limit\(|\.range\(/.test(chain) && ['products', 'sales', 'sale_items', 'purchases', 'purchase_items', 'web_orders'].includes(table)) {
      add(file, match.index, 'MEDIUM', `Supabase read on heavy table ${table} has no limit/range nearby`, { source, text: match[0] });
    }
  }
}

await walk(root);

const high = findings.filter((x) => x.severity === 'HIGH').length;
const medium = findings.filter((x) => x.severity === 'MEDIUM').length;

console.log(`Supabase egress audit: ${high} high, ${medium} medium`);

for (const item of findings.slice(0, 80)) {
  console.log(`\n[${item.severity}] ${item.file}:${item.line}`);
  console.log(`  ${item.message}`);
  console.log(`  ${item.code}`);
}

if (findings.length > 80) {
  console.log(`\n... ${findings.length - 80} more findings not shown`);
}

if (high > 0) {
  console.log('\nFix HIGH findings first: replace select=* with explicit columns.');
}
