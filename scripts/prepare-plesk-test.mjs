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
const adminLogoPath = path.join(rootDir, 'logo.png');
const xlsxVendorPath = path.join(rootDir, 'node_modules', 'xlsx', 'dist', 'xlsx.full.min.js');

// Fichiers SQL à regrouper hors de httpdocs (ne JAMAIS les exposer sur le web).
// Ils servent de référence pour initialiser/migrer Supabase côté hébergeur.
const sqlSourceFiles = [
  'SUPABASE_SCHEMA_COMPLET.sql',
  'SUPABASE_SEED_CATEGORIES.sql',
  'MIGRATION_INITIALISATION_SUPABASE.sql'
];

const rootHtaccess = `<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^index\\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
</IfModule>
`;

const adminHtaccess = `<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /admin/
RewriteRule ^index\\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /admin/index.html [L]
</IfModule>
`;

function normalizeAdminHtml(content) {
  return String(content)
    .replace(/href="styles\.css"/g, 'href="./styles.css"')
    .replace(/src="app\.js"/g, 'src="./app.js"')
    .replace(/src="supabase-cache-layer\.js"/g, 'src="./supabase-cache-layer.js"')
    .replace(/src="\/node_modules\/xlsx\/dist\/xlsx\.full\.min\.js"/g, 'src="./vendor/xlsx.full.min.js"');
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

async function main() {
  if (!(await safeExists(shopDistDir))) {
    throw new Error('Le dossier mv-para-sparkle-main/dist est introuvable. Lancez d abord le build du site web.');
  }

  for (const requiredFile of [adminHtmlPath, adminAppPath, adminStylesPath, adminCachePath, adminLogoPath, xlsxVendorPath]) {
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
    '- https://<votre-domaine>/         -> boutique (React SPA)',
    '- https://<votre-domaine>/admin/   -> backoffice (admin.html)',
    '',
    'Structure :',
    '- httpdocs/        = boutique (build React de mv-para-sparkle-main)',
    '- httpdocs/admin/  = backoffice (index.html + app.js + styles.css + supabase-cache-layer.js + logo.png + vendor/xlsx.full.min.js)',
    '- httpdocs/.htaccess        = rewrite SPA racine',
    '- httpdocs/admin/.htaccess  = rewrite SPA admin',
    '- sql/             = scripts SQL de reference (NE PAS uploader dans httpdocs)',
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
