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
const publicStaticCachePath = path.join(rootDir, 'public-supabase-static-cache.js');
const staticDataDir = path.join(rootDir, 'static-data');
const adminLogoPath = path.join(rootDir, 'logo.png');
const xlsxVendorPath = path.join(rootDir, 'node_modules', 'xlsx', 'dist', 'xlsx.full.min.js');

// Fichiers SQL à regrouper hors de httpdocs (ne JAMAIS les exposer sur le web).
// Ils servent de référence pour initialiser/migrer Supabase côté hébergeur.
const sqlSourceFiles = [
  'SUPABASE_SCHEMA_COMPLET.sql',
  'SUPABASE_SEED_CATEGORIES.sql',
  'MIGRATION_INITIALISATION_SUPABASE.sql'
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

function normalizeAdminHtml(content) {
  return String(content)
    .replace(/href="styles\.css"/g, 'href="./styles.css"')
    .replace(/src="app\.js"/g, 'src="./app.js"')
    .replace(/src="supabase-cache-layer\.js"/g, 'src="./supabase-cache-layer.js"')
    .replace(/src="\/node_modules\/xlsx\/dist\/xlsx\.full\.min\.js"/g, 'src="./vendor/xlsx.full.min.js"');
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
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function copyDirContents(sourceDir, destinationDir) {
  await fs.mkdir(destinationDir, { recursive: true });
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destinationPath = path.join(destinationDir, entry.name);

    if (entry.isDirectory()) {
      await fs.cp(sourcePath, destinationPath, { recursive: true, force: true });
    } else {
      await fs.copyFile(sourcePath, destinationPath);
    }
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
  if (!(await safeExists(shopDistDir))) {
    throw new Error('Le dossier mv-para-sparkle-main/dist est introuvable. Lancez d abord le build du site web.');
  }

  for (const requiredFile of [adminHtmlPath, adminAppPath, adminStylesPath, adminCachePath, publicStaticCachePath, adminLogoPath, xlsxVendorPath]) {
    if (!(await safeExists(requiredFile))) {
      throw new Error(`Fichier introuvable: ${requiredFile}`);
    }
  }

  // Nettoyage complet du dossier de déploiement pour repartir d'un état propre
  // (évite le nesting parasite assets/assets/ et les restes de versions précédentes).
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(adminVendorDir, { recursive: true });
  await fs.mkdir(sqlDir, { recursive: true });

  // --- Boutique : contenu du build React ---
  await copyDirContents(shopDistDir, httpdocsDir);
  await injectIntoBuiltHtmlFiles(httpdocsDir);
  await fs.copyFile(publicStaticCachePath, path.join(httpdocsDir, 'public-supabase-static-cache.js'));

  if (await safeExists(staticDataDir)) {
    await fs.cp(staticDataDir, path.join(httpdocsDir, 'static-data'), { recursive: true, force: true });
  } else {
    console.warn('ATTENTION: static-data/ absent. Lancez npm run build:static-data pour supprimer l egress public produits/categories.');
  }

  // --- Admin : HTML normalisé + assets ---
  const adminHtml = await fs.readFile(adminHtmlPath, 'utf8');
  await fs.writeFile(path.join(adminDir, 'index.html'), normalizeAdminHtml(adminHtml), 'utf8');
  await fs.copyFile(adminAppPath, path.join(adminDir, 'app.js'));
  await fs.copyFile(adminStylesPath, path.join(adminDir, 'styles.css'));
  await fs.copyFile(adminCachePath, path.join(adminDir, 'supabase-cache-layer.js'));
  await fs.copyFile(adminLogoPath, path.join(adminDir, 'logo.png'));
  await fs.copyFile(xlsxVendorPath, path.join(adminVendorDir, 'xlsx.full.min.js'));

  // --- .htaccess (SPA routing pour boutique + admin) ---
  await fs.writeFile(path.join(httpdocsDir, '.htaccess'), rootHtaccess, 'utf8');
  await fs.writeFile(path.join(adminDir, '.htaccess'), adminHtaccess, 'utf8');

  // --- SQL de référence (HORS httpdocs : jamais servi sur le web) ---
  for (const sqlFile of sqlSourceFiles) {
    const src = path.join(rootDir, sqlFile);
    if (await safeExists(src)) {
      await fs.copyFile(src, path.join(sqlDir, sqlFile));
    }
  }

  const readme = [
    'DEPLOIEMENT PLESK — Boutique + Admin',
    '',
    'Envoyer le contenu du dossier httpdocs/ vers la racine web du domaine/sous-domaine cible.',
    '',
    'URLs attendues :',
    '- https:// / -> boutique (React SPA)',
    '- https:// /admin/ -> backoffice (admin.html)',
    '',
    'Optimisation egress Supabase :',
    '- public-supabase-static-cache.js est inclus dans la boutique publique',
    '- static-data/products.json et static-data/web_categories.json doivent être présents',
    '- générer ces fichiers avec npm run build:static-data avant le packaging Plesk',
    '- l admin reste en temps réel avec supabase-cache-layer.js',
    '',
    'Structure :',
    '- httpdocs/ = boutique (build React de mv-para-sparkle-main)',
    '- httpdocs/static-data/ = JSON publics produits/catégories sans egress Supabase navigateur',
    '- httpdocs/admin/ = backoffice (index.html + app.js + styles.css + supabase-cache-layer.js + logo.png + vendor/xlsx.full.min.js)',
    '- httpdocs/.htaccess = rewrite SPA racine + cache navigateur JSON/JS',
    '- httpdocs/admin/.htaccess = rewrite SPA admin',
    '- sql/ = scripts SQL de reference (NE PAS uploader dans httpdocs)',
    '',
    'Important :',
    '- la boutique et le backoffice pointent sur la meme base Supabase',
    '- les fichiers SQL sont hors httpdocs : ils ne doivent pas etre servis par le web',
    '- les .htaccess sont prets pour Plesk/Apache (mod_rewrite)'
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
