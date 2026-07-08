#!/usr/bin/env node
/**
 * Removes admin-enter-navigation.js from admin.html.
 * Safe to run multiple times.
 */
import { readFile, writeFile } from 'node:fs/promises';

const TARGET = process.env.ADMIN_HTML || 'admin.html';
const patterns = [
  /\s*<script\s+src=["']admin-enter-navigation\.js["']><\/script>\s*/g,
  /\s*<script\s+src=["']\.\/admin-enter-navigation\.js["']><\/script>\s*/g
];

let html = await readFile(TARGET, 'utf8');
const before = html;
for (const pattern of patterns) {
  html = html.replace(pattern, '\n');
}

if (html === before) {
  console.log(`✓ ${TARGET}: admin-enter-navigation.js was not present`);
} else {
  await writeFile(TARGET, html, 'utf8');
  console.log(`✓ ${TARGET}: admin-enter-navigation.js removed`);
}
