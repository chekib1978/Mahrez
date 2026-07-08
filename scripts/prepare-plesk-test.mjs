import fs from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const shopDistDir = path.join(rootDir, 'mv-para-sparkle-main', 'dist');
const outputDir = path.join(rootDir, 'deploy-plesk-test');
const httpdocsDir = path.join(outputDir, 'httpdocs');
const adminDir = path.join(httpdocsDir, 'admin');
const adminVendorDir = path.join(adminDir, 'vendor');
const sqlDir = path.join(outputDir, 'sql');

const adminHtmlPath = path.join(rootDir, 'admin.html');
const adminAppPath = path.join(rootDir, 'app.js');
const adminStylesPath = path.join(rootDir, 'styles.css');
const adminCachePath = path.join(rootDir, 'supabase-cache-layer.js');
const adminRpcOptimizerPath = path.join(rootDir, 'admin-rpc-optimizer.js');
const publicStaticCachePath = path.join(rootDir, 'public-supabase-static-cache.js');
const staticDataDir = path.join(rootDir, 'static-data');
const adminLogoPath = path.join(rootDir, 'logo.png');
const xlsxVendorPath = path.join(rootDir, 'node_modules', 'xlsx', 'dist', 'xlsx.full.min.js');

const sqlSourceFiles = [
  'SUPABASE_SCHEMA_COMPLET.sql',
  'SUPABASE_SEED_CATEGORIES.sql',
  'MIGRATION_INITIALISATION_SUPABASE.sql',
  'SUPABASE_ADMIN_RPC_OPTIMIZATIONS.sql'
];

const rootHtaccess = `
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType application/json "access plus 1 hour"
  ExpiresByType application/javascript "access plus 1 day"
</IfModule>
`;

const adminHtaccess = `
RewriteEngine On
RewriteBase /admin/
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /admin/index.html [L]
`;

function injectBeforeApp(content) {
  const snippet = '<script src="./admin-rpc-optimizer.js"></script>';
  let html = String(content);
  if (html.includes('admin-rpc-optimizer.js')) return html;
  if (html.includes('src="./app.js"')) return html.replace('<script src="./app.js"></script>', `${snippet}\n<script src="./app.js"></script>`);
  if (html.includes('src="app.js"')) return html.replace('<script src="app.js"></script>', `${snippet}\n<script src="app.js"></script>`);
  if (html.includes('</body>')) return html.replace('</body>', `${snippet}\n</body>`);
  return `${html}\n${snippet}`;
}

function normalizeAdminHtml(content) {
  return injectBeforeApp(String(content)
    .replace(/href="styles\.css"/g, 'href="./styles.css"')
    .replace(/src="app\.js"/g, 'src="./app.js"')
    .replace(/src="supabase-cache-layer\.js"/g, 'src="./supabase-cache-layer.js"')
    .replace(/src="\/node_modules\/xlsx\/dist\/xlsx\.full\.min\.js"/g, 'src="./vendor/xlsx.full.min.js"'));
}

function injectPublicStaticCache(content) {
  const snippet = '<script src="/public-supabase-static-cache.js"></script>';
  const html = String(content);
  if (html.includes('public-supabase-static-cache.js')) return html;
  if (html.includes('</head>')) return html.replace('</head>', `  ${snippet}\n</head>`);
  if (html.includes('<body')) return html.replace('<body', `${snippet}\n<body`);
  return `${snippet}\n${html}`;
}

async function safeExists(target) {
  try { await fs.access(target); return true; } catch { return false; }
}

async function copyDirContents(sourceDir, destinationDir) {
  await fs.mkdir(destinationDir, { recursive: true });
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destinationPath = path.join(destinationDir, entry.name);
    if (entry.isDirectory()) await fs.cp(sourcePath, destinationPath, { recursive: true, force: true });
    else await fs.copyFile(sourcePath, destinationPath);
  }
}

async function injectIntoBuiltHtmlFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'admin') await injectIntoBuiltHtmlFiles(target);
      continue;
    }
    if (!entry.name.endsWith('.html')) continue;
    const html = await fs.readFile(target, 'utf8');
    await fs.writeFile(target, injectPublicStaticCache(html), 'utf8');
  }
}

async function main() {
  if (!(await safeExists(shopDistDir))) throw new Error('Le dossier mv-para-sparkle-main/dist est introuvable. Lancez d abord le build du site web.');

  for (const requiredFile of [adminHtmlPath, adminAppPath, adminStylesPath, adminCachePath, adminRpcOptimizerPath, publicStaticCachePath, adminLogoPath, xlsxVendorPath]) {
    if (!(await safeExists(requiredFile))) throw new Error(`Fichier introuvable: ${requiredFile}`);
  }

  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(adminVendorDir, { recursive: true });
  await fs.mkdir(sqlDir, { recursive: true });

  await copyDirContents(shopDistDir, httpdocsDir);
  await injectIntoBuiltHtmlFiles(httpdocsDir);
  await fs.copyFile(publicStaticCachePath, path.join(httpdocsDir, 'public-supabase-static-cache.js'));

  if (await safeExists(staticDataDir)) await fs.cp(staticDataDir, path.join(httpdocsDir, 'static-data'), { recursive: true, force: true });
  else console.warn('ATTENTION: static-data/ absent. Lancez npm run build:static-data pour supprimer l egress public produits/categories.');

  const adminHtml = await fs.readFile(adminHtmlPath, 'utf8');
  await fs.writeFile(path.join(adminDir, 'index.html'), normalizeAdminHtml(adminHtml), 'utf8');
  await fs.copyFile(adminAppPath, path.join(adminDir, 'app.js'));
  await fs.copyFile(adminStylesPath, path.join(adminDir, 'styles.css'));
  await fs.copyFile(adminCachePath, path.join(adminDir, 'supabase-cache-layer.js'));
  await fs.copyFile(adminRpcOptimizerPath, path.join(adminDir, 'admin-rpc-optimizer.js'));
  await fs.copyFile(adminLogoPath, path.join(adminDir, 'logo.png'));
  await fs.copyFile(xlsxVendorPath, path.join(adminVendorDir, 'xlsx.full.min.js'));

  await fs.writeFile(path.join(httpdocsDir, '.htaccess'), rootHtaccess, 'utf8');
  await fs.writeFile(path.join(adminDir, '.htaccess'), adminHtaccess, 'utf8');

  for (const sqlFile of sqlSourceFiles) {
    const src = path.join(rootDir, sqlFile);
    if (await safeExists(src)) await fs.copyFile(src, path.join(sqlDir, sqlFile));
  }

  const readme = [
    'DEPLOIEMENT PLESK — Boutique + Admin',
    '',
    'Envoyer le contenu du dossier httpdocs/ vers la racine web du domaine/sous-domaine cible.',
    '',
    'Optimisation egress Supabase :',
    '- Boutique : public-supabase-static-cache.js + static-data/products.json + static-data/web_categories.json',
    '- Admin : supabase-cache-layer.js + admin-rpc-optimizer.js',
    '- SQL admin RPC : executer sql/SUPABASE_ADMIN_RPC_OPTIMIZATIONS.sql dans Supabase avant test admin',
    '',
    'URLs attendues :',
    '- https:// / -> boutique',
    '- https:// /admin/ -> backoffice',
    '',
    'Important :',
    '- les fichiers SQL sont hors httpdocs : ils ne doivent pas etre servis par le web',
    '- l admin reste temps reel mais avec des RPC slim + cache court'
  ].join('\n');

  await fs.writeFile(path.join(outputDir, 'README.txt'), readme, 'utf8');

  console.log(`DEPLOY_DIR=${outputDir}`);
  console.log(`SHOP_DIR=${httpdocsDir}`);
  console.log(`ADMIN_DIR=${adminDir}`);
  console.log(`SQL_DIR=${sqlDir}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
