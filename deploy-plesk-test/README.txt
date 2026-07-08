DEPLOIEMENT PLESK — Boutique + Admin

Envoyer le contenu du dossier httpdocs/ vers la racine web du domaine/sous-domaine cible.

URLs attendues :
- https://<votre-domaine>/         -> boutique (React SPA)
- https://<votre-domaine>/admin/   -> backoffice (admin.html)

Structure :
- httpdocs/        = boutique (build React de mv-para-sparkle-main)
- httpdocs/admin/  = backoffice (index.html + app.js + styles.css + supabase-cache-layer.js + logo.png + vendor/xlsx.full.min.js)
- httpdocs/.htaccess        = rewrite SPA racine
- httpdocs/admin/.htaccess  = rewrite SPA admin
- sql/             = scripts SQL de reference (NE PAS uploader dans httpdocs)

Important :
- la boutique et le backoffice pointent sur la meme base Supabase
- les fichiers SQL sont hors httpdocs : ils ne doivent pas etre servis par le web
- les .htaccess sont prets pour Plesk/Apache (mod_rewrite)