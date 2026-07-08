const BACKEND_URL = typeof localStorage !== 'undefined' ? localStorage.getItem('backend_url') || '' : '';

export const supabaseUrl = BACKEND_URL
  ? BACKEND_URL.replace(/\/+$/, '') + '/rest/v1/'
  : "https://sckhssxmgtyqrwwsoqtk.supabase.co/rest/v1/";
export const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNja2hzc3htZ3R5cXJ3d3NvcXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MDg2MDUsImV4cCI6MjA5ODk4NDYwNX0.N7M-c7HVpcJ85iFFY5xCVAOnZB6TTzRv9A2l-4Kb4kY";
export const supabaseAuthUrl = BACKEND_URL
  ? BACKEND_URL.replace(/\/+$/, '') + '/auth/v1/'
  : "https://sckhssxmgtyqrwwsoqtk.supabase.co/auth/v1/";

export const supabaseHeaders: HeadersInit = {
  apikey: BACKEND_URL ? '' : supabaseKey,
  Authorization: BACKEND_URL ? '' : `Bearer ${supabaseKey}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Product = {
  id: string;
  code_article: string;
  code_barre?: string | null;
  designation: string;
  forme?: string | null;
  product_brand?: string | null;
  prix_vente_ht?: number | null;
  prix_vente_ttc?: number | null;
  prix_vente_web_ttc?: number | null;
  remise_web_pct?: number | null;
  old_price_ttc?: number | null;
  promo_badge?: string | null;
  stock_actuel?: number | null;
  peremption?: string | null;
  image_url?: string | null;
  product_gallery_urls?: string | null;
  description_web?: string | null;
  product_specs?: string | null;
  tva?: number | null;
  web_category_slug?: string | null;
  is_web_hidden?: boolean | null;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type ProductFilters = {
  search?: string;
  categorySlug?: string;
  leafSlug?: string;
  brands?: string[];
  priceRange?: "lt50" | "50to100" | "gt100" | "all";
  sort?: "default" | "price-asc" | "price-desc" | "name-asc";
  page?: number;
  perPage?: number;
};

export type ProductReview = {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  review_title?: string | null;
  comment: string;
  is_approved?: boolean | null;
  created_at?: string | null;
};

export type WebOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone?: string | null;
  customer_address?: string | null;
  notes?: string | null;
  payment_mode?: string | null;
  delivery_mode?: string | null;
  delivery_fee_ttc?: number | null;
  stock_decremented?: boolean | null;
  total_ttc?: number | null;
  status?: string | null;
  created_at?: string | null;
  items?: WebOrderItem[];
};

export type WebOrderItem = {
  id?: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: Product | null;
};

export type CartLine = {
  product: Product;
  quantity: number;
};

export type WebCategory = {
  id?: string;
  parent_id?: string | null;
  name: string;
  slug: string;
  image_url?: string | null;
  description?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
  children?: WebCategory[];
};

type WebCategoryRow = Omit<WebCategory, "children">;
const WEB_CUSTOMER_SESSION_STORAGE_KEY = "para_mv_web_customer_session";

export type WebCustomerProfile = {
  id: string;
  email?: string | null;
  full_name: string;
  phone?: string | null;
  address?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type WebCustomerSession = {
  access_token: string;
  refresh_token?: string | null;
  expires_at?: number | null;
  user: {
    id: string;
    phone: string;
    email?: string | null;
  };
  profile: WebCustomerProfile | null;
};

export type CompanySettings = {
  companyName?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  deliveryFeeStandard?: number | null;
  deliveryFeeExpress?: number | null;
  deliveryFeePickup?: number | null;
};

export const STORE_CATEGORIES = [
  "Visage",
  "Corps",
  "Capillaire",
  "Solaire",
  "Bébé & maman",
  "Nature & bio",
  "Compléments alimentaires",
  "Orthopedie",
  "Hygiène",
] as const;

const BROKEN_TEXT_PATTERN = /Ã.|Â.|Ãƒ|Ã‚|Ã¢â‚¬â„¢|Ã¢â‚¬Å“|Ã¢â‚¬|Ã¢â‚¬Â¢|Ã¢â‚¬â€œ|Ã¢â‚¬â€/;

export const DEFAULT_WEB_CATEGORY_TREE: WebCategory[] = [
  {
    name: "Visage",
    slug: "visage",
    sort_order: 1,
    children: [
      {
        name: "Nettoyant & démaquillant",
        slug: "visage-nettoyant-demaquillant",
        sort_order: 1,
        children: [
          { name: "Lait démaquillant", slug: "lait-demaquillant", sort_order: 1 },
          { name: "Lotion", slug: "visage-lotion", sort_order: 2 },
          { name: "Gel lavant", slug: "gel-lavant", sort_order: 3 },
          { name: "Eau micellaire", slug: "eau-micellaire", sort_order: 4 },
          { name: "Eaux thermales", slug: "eaux-thermales", sort_order: 5 },
          { name: "Moussant", slug: "moussant-visage", sort_order: 6 },
          { name: "Masque visage", slug: "masque-visage", sort_order: 7 },
          { name: "Gommage visage", slug: "gommage-visage", sort_order: 8 },
          { name: "Pains nettoyants", slug: "pains-nettoyants", sort_order: 9 },
        ],
      },
      {
        name: "Soin anti-âge",
        slug: "visage-soin-anti-age",
        sort_order: 2,
        children: [
          { name: "Sérum anti-âge", slug: "serum-anti-age", sort_order: 1 },
          { name: "Crème premières rides", slug: "creme-premieres-rides", sort_order: 2 },
          { name: "Crème anti-rides peau sèche", slug: "creme-anti-rides-peau-seche", sort_order: 3 },
          { name: "Crème anti-rides peau grasse", slug: "creme-anti-rides-peau-grasse", sort_order: 4 },
          { name: "Soin liftant", slug: "soin-liftant", sort_order: 5 },
          { name: "Fermeté et peau mature", slug: "fermete-peau-mature", sort_order: 6 },
        ],
      },
      {
        name: "Hydratation et nutrition",
        slug: "visage-hydratation-nutrition",
        sort_order: 3,
        children: [
          { name: "Masque visage hydratant", slug: "masque-visage-hydratant", sort_order: 1 },
          { name: "Crème hydratante peau normale à mixte", slug: "creme-hydratante-peau-normale-mixte", sort_order: 2 },
          { name: "Crème hydratante pour peau sèche", slug: "creme-hydratante-peau-seche", sort_order: 3 },
          { name: "Crème hydratante pour peau grasse", slug: "creme-hydratante-peau-grasse", sort_order: 4 },
          { name: "Crème hydratante peau sensible", slug: "creme-hydratante-peau-sensible", sort_order: 5 },
          { name: "Crème de nuit", slug: "creme-de-nuit", sort_order: 6 },
          { name: "Pains hydratants", slug: "pains-hydratants", sort_order: 7 },
        ],
      },
      {
        name: "Peaux mixtes, grasses, acné et imperfections",
        slug: "visage-peaux-mixtes-grasses-acne",
        sort_order: 4,
        children: [
          { name: "Nettoyant & purifiant", slug: "nettoyant-purifiant", sort_order: 1 },
          { name: "Lotion", slug: "lotion-acne", sort_order: 2 },
          { name: "Crème & soin traitant", slug: "creme-soin-traitant", sort_order: 3 },
          { name: "Traitant matin et soir", slug: "traitant-matin-soir", sort_order: 4 },
          { name: "Concentré", slug: "concentre-imperfections", sort_order: 5 },
          { name: "Maquillage et fluide", slug: "maquillage-fluide", sort_order: 6 },
          { name: "Pains", slug: "pains-acne", sort_order: 7 },
        ],
      },
      {
        name: "Peaux sensibles et rougeurs",
        slug: "visage-peaux-sensibles-rougeurs",
        sort_order: 5,
        children: [
          { name: "Nettoyant pour peaux sensibles", slug: "nettoyant-peaux-sensibles", sort_order: 1 },
          { name: "Masques apaisants", slug: "masques-apaisants", sort_order: 2 },
          { name: "Lotion apaisante", slug: "lotion-apaisante", sort_order: 3 },
          { name: "Crème peaux sensibles", slug: "creme-peaux-sensibles", sort_order: 4 },
          { name: "Anti-rougeurs", slug: "anti-rougeurs", sort_order: 5 },
        ],
      },
      {
        name: "Cicatrices",
        slug: "visage-cicatrices",
        sort_order: 6,
        children: [{ name: "Crème cicatrisante", slug: "creme-cicatrisante", sort_order: 1 }],
      },
      {
        name: "Anti tache, dépigmentant",
        slug: "visage-anti-tache-depigmentant",
        sort_order: 7,
        children: [
          { name: "Sérums", slug: "anti-tache-serums", sort_order: 1 },
          { name: "Crèmes anti taches", slug: "cremes-anti-taches", sort_order: 2 },
          { name: "Ecran solaire anti taches", slug: "ecran-solaire-anti-taches", sort_order: 3 },
          { name: "Pains unifiants", slug: "pains-unifiants", sort_order: 4 },
        ],
      },
      {
        name: "Éclat du teint",
        slug: "visage-eclat-du-teint",
        sort_order: 8,
        children: [
          { name: "BB crème", slug: "bb-creme", sort_order: 1 },
          { name: "CC crème", slug: "cc-creme", sort_order: 2 },
          { name: "Éclat du teint et anti-fatigue", slug: "eclat-du-teint-anti-fatigue", sort_order: 3 },
        ],
      },
      {
        name: "Yeux",
        slug: "visage-yeux",
        sort_order: 9,
        children: [
          { name: "Maquillage", slug: "yeux-maquillage", sort_order: 1 },
          { name: "Anti-cernes & anti-poches", slug: "anti-cernes-anti-poches", sort_order: 2 },
          { name: "Contour des yeux", slug: "contour-des-yeux", sort_order: 3 },
        ],
      },
      {
        name: "Lèvres",
        slug: "visage-levres",
        sort_order: 10,
        children: [
          { name: "Hydratation lèvres", slug: "hydratation-levres", sort_order: 1 },
          { name: "Stick solaire lèvres", slug: "stick-solaire-levres", sort_order: 2 },
          { name: "Baume réparateur", slug: "baume-reparateur-levres", sort_order: 3 },
        ],
      },
    ],
  },
  {
    name: "Corps",
    slug: "corps",
    sort_order: 2,
    children: [
      {
        name: "Soins corps",
        slug: "corps-soins",
        sort_order: 1,
        children: [
          { name: "Hydratation corps", slug: "hydratation-corps", sort_order: 1 },
          { name: "Gommage corps", slug: "gommage-corps", sort_order: 2 },
          { name: "Mains & pieds", slug: "mains-pieds", sort_order: 3 },
        ],
      },
    ],
  },
  {
    name: "Capillaire",
    slug: "capillaire",
    sort_order: 3,
    children: [
      {
        name: "Cheveux",
        slug: "capillaire-cheveux",
        sort_order: 1,
        children: [
          { name: "Shampooing", slug: "shampooing", sort_order: 1 },
          { name: "Après-shampooing", slug: "apres-shampooing", sort_order: 2 },
          { name: "Masque cheveux", slug: "masque-cheveux", sort_order: 3 },
        ],
      },
    ],
  },
  {
    name: "Solaire",
    slug: "solaire",
    sort_order: 4,
    children: [
      {
        name: "Protection solaire",
        slug: "solaire-protection",
        sort_order: 1,
        children: [
          { name: "Visage SPF", slug: "visage-spf", sort_order: 1 },
          { name: "Corps SPF", slug: "corps-spf", sort_order: 2 },
          { name: "Après soleil", slug: "apres-soleil", sort_order: 3 },
        ],
      },
    ],
  },
  {
    name: "Bébé & maman",
    slug: "bebe-maman",
    sort_order: 5,
    children: [
      {
        name: "Maternité & bébé",
        slug: "bebe-maman-selection",
        sort_order: 1,
        children: [
          { name: "Toilette bébé", slug: "toilette-bebe", sort_order: 1 },
          { name: "Crèmes change", slug: "cremes-change", sort_order: 2 },
          { name: "Grossesse & maternité", slug: "grossesse-maternite", sort_order: 3 },
        ],
      },
    ],
  },
  {
    name: "Nature & bio",
    slug: "nature-bio",
    sort_order: 6,
    children: [
      {
        name: "Naturel",
        slug: "nature-bio-selection",
        sort_order: 1,
        children: [
          { name: "Huiles", slug: "huiles-naturelles", sort_order: 1 },
          { name: "Plantes", slug: "plantes", sort_order: 2 },
          { name: "Soins bio", slug: "soins-bio", sort_order: 3 },
        ],
      },
    ],
  },
  {
    name: "Compléments alimentaires",
    slug: "complements-alimentaires",
    sort_order: 7,
    children: [
      {
        name: "Compléments",
        slug: "complements-selection",
        sort_order: 1,
        children: [
          { name: "Vitamines", slug: "vitamines", sort_order: 1 },
          { name: "Minceur", slug: "minceur", sort_order: 2 },
          { name: "Immunité", slug: "immunite", sort_order: 3 },
        ],
      },
    ],
  },
  {
    name: "Orthopedie",
    slug: "orthopedie",
    sort_order: 8,
    children: [
      {
        name: "Maintien & posture",
        slug: "orthopedie-maintien-posture",
        sort_order: 1,
        children: [
          { name: "Ceintures lombaires", slug: "ceintures-lombaires", sort_order: 1 },
          { name: "Genouilleres", slug: "genouilleres", sort_order: 2 },
          { name: "Chevillieres", slug: "chevillieres", sort_order: 3 },
        ],
      },
      {
        name: "Mobilite & confort",
        slug: "orthopedie-mobilite-confort",
        sort_order: 2,
        children: [
          { name: "Attelles", slug: "attelles", sort_order: 1 },
          { name: "Bas de contention", slug: "bas-contention", sort_order: 2 },
          { name: "Poignets & coudieres", slug: "poignets-coudieres", sort_order: 3 },
        ],
      },
      {
        name: "Podologie",
        slug: "orthopedie-podologie",
        sort_order: 3,
        children: [
          { name: "Semelles", slug: "semelles", sort_order: 1 },
          { name: "Talonnieres", slug: "talonnieres", sort_order: 2 },
          { name: "Correcteurs d orteils", slug: "correcteurs-orteils", sort_order: 3 },
        ],
      },
    ],
  },
  {
    name: "Hygiène",
    slug: "hygiene",
    sort_order: 9,
    children: [
      {
        name: "Hygiène quotidienne",
        slug: "hygiene-selection",
        sort_order: 1,
        children: [
          { name: "Gel douche", slug: "gel-douche", sort_order: 1 },
          { name: "Hygiène bucco-dentaire", slug: "hygiene-bucco-dentaire", sort_order: 2 },
          { name: "Intime", slug: "hygiene-intime", sort_order: 3 },
        ],
      },
    ],
  },
];

const MAIN_CATEGORY_INFERENCE: Array<{ slug: string; label: string; pattern: RegExp }> = [
  { slug: "visage", label: "Visage", pattern: /(visage|serum|sérum|creme visage|crème visage|anti age|anti-âge|acne|acné|eclaircissant|éclaircissant|ecran teint|eau micellaire|levres|lèvres|yeux)/ },
  { slug: "corps", label: "Corps", pattern: /(corps|lait corps|baume corps|gommage corps|deodorant|déodorant|main|mains|pied|pieds|vergeture)/ },
  { slug: "capillaire", label: "Capillaire", pattern: /(capillaire|cheveux|shampoo|shampoing|apres shampooing|après-shampooing|masque cheveux|coloration|chute)/ },
  { slug: "solaire", label: "Solaire", pattern: /(solaire|spf|ecran solaire|écran solaire|after sun|apres soleil|après soleil)/ },
  { slug: "bebe-maman", label: "Bébé & maman", pattern: /(bebe|bébé|maman|maternite|maternité|maternel|grossesse|allaitement|couche|nourrisson)/ },
  { slug: "nature-bio", label: "Nature & bio", pattern: /(bio|nature|naturel|phyt|plante|herbal|essentielle)/ },
  { slug: "complements-alimentaires", label: "Compléments alimentaires", pattern: /(complement|complément|vitamine|magnesium|magnésium|omega|oméga|probiot|collagene|collagène|minceur|drain|detox|détox)/ },
  { slug: "orthopedie", label: "Orthopedie", pattern: /(orthoped|attelle|ceinture lombaire|lombaire|genouill|chevill|contention|semelle|talonniere|poignet|coudiere)/ },
  { slug: "hygiene", label: "Hygiène", pattern: /(hygiene|hygiène|savon|gel douche|dentifrice|brosse|bain bouche|intime|antiseptique)/ },
];

// ---------------------------------------------------------------------------
// Minimal product select for lists / cards (avoids heavy fields)
// ---------------------------------------------------------------------------
const PRODUCT_LIST_SELECT =
  "id,code_article,designation,forme,product_brand,prix_vente_ht,prix_vente_ttc,prix_vente_web_ttc,remise_web_pct,old_price_ttc,promo_badge,stock_actuel,image_url,tva,web_category_slug,is_web_hidden";

// ---------------------------------------------------------------------------
// Helper: build Supabase query string from filters
// ---------------------------------------------------------------------------
function buildProductQuery(filters: ProductFilters): { select: string; params: string[] } {
  const select = PRODUCT_LIST_SELECT;
  const params: string[] = [];

  // --- Filters ---
  if (filters.search) {
    const term = filters.search.trim();
    params.push(`or=(designation.ilike.*${term}*,code_article.ilike.*${term}*,product_brand.ilike.*${term}*,forme.ilike.*${term}*)`);
  }

  if (filters.categorySlug) {
    const allSlugs = collectAllCategorySlugs(filters.categorySlug);
    if (allSlugs.length === 1) {
      params.push(`web_category_slug=eq.${allSlugs[0]}`);
    } else if (allSlugs.length > 1) {
      const orClause = allSlugs.map((s) => `web_category_slug.eq.${s}`).join(",");
      params.push(`or=(${orClause})`);
    }
  }

  if (filters.leafSlug && filters.leafSlug !== "all") {
    params.push(`web_category_slug=eq.${filters.leafSlug}`);
  }

  params.push(`is_web_hidden=eq.false`);

  // --- Price range ---
  if (filters.priceRange && filters.priceRange !== "all") {
    if (filters.priceRange === "lt50") params.push("prix_vente_ttc=lt.50");
    else if (filters.priceRange === "50to100") {
      params.push("prix_vente_ttc=gte.50");
      params.push("prix_vente_ttc=lte.100");
    } else if (filters.priceRange === "gt100") params.push("prix_vente_ttc=gt.100");
  }

  // --- Sorting ---
  let orderClause = "designation.asc";
  switch (filters.sort) {
    case "price-asc":
      orderClause = "prix_vente_ttc.asc";
      break;
    case "price-desc":
      orderClause = "prix_vente_ttc.desc";
      break;
    case "name-asc":
      orderClause = "designation.asc";
      break;
    default:
      orderClause = "designation.asc";
  }

  // We append order at the end; the caller assembles the full URL
  params.push(`order=${orderClause}`);

  return { select, params };
}

function collectAllCategorySlugs(slug: string): string[] {
  const node = findCategoryBySlug(DEFAULT_WEB_CATEGORY_TREE, slug);
  if (!node) return [slug];
  return collectCategorySlugs(node);
}

// ---------------------------------------------------------------------------
// Core API: Paginated product fetching (SQL-level)
// ---------------------------------------------------------------------------

export async function fetchProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
  const page = filters.page || 1;
  const perPage = filters.perPage || 12;
  const offset = (page - 1) * perPage;

  const { select, params } = buildProductQuery(filters);

  // Remove order from params — we append it as a query param
  const orderParam = params.find((p) => p.startsWith("order=")) || "order=designation.asc";
  const filterParams = params.filter((p) => !p.startsWith("order="));

  // Build URL for data
  const filterString = filterParams.length ? `&${filterParams.join("&")}` : "";
  const dataUrl = `${supabaseUrl}products?select=${select}${filterString}&${orderParam}&limit=${perPage}&offset=${offset}`;

  // Build URL for count (only the filters, no select/order/limit)
  const countParams = filterParams.filter((p) => !p.startsWith("order="));
  const countFilterString = countParams.length ? `&${countParams.join("&")}` : "";
  const countUrl = `${supabaseUrl}products?select=count${countFilterString}&limit=1`;

  const [dataResponse, countResponse] = await Promise.all([
    fetch(dataUrl, { headers: supabaseHeaders }),
    fetch(countUrl, { headers: { ...supabaseHeaders, Prefer: "count=exact" } }),
  ]);

  if (!dataResponse.ok) {
    const errText = await dataResponse.text();
    throw new Error(`Erreur chargement produits: ${errText}`);
  }

  const rows: Product[] = await dataResponse.json();
  const total = (() => {
    const contentRange = countResponse.headers.get("content-range");
    if (contentRange) {
      const match = contentRange.match(/\/(\d+)$/);
      if (match) return Number(match[1]);
    }
    return rows.length;
  })();

  return {
    data: rows.map(normalizeProductPricing),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

// ---------------------------------------------------------------------------
// Lightweight search for autocomplete suggestions (minimal fields)
// ---------------------------------------------------------------------------

export async function searchProducts(term: string, limit = 8): Promise<Product[]> {
  const trimmed = term.trim();
  if (!trimmed) return [];

  const encoded = encodeURIComponent(trimmed);
  const url = `${supabaseUrl}products?select=id,code_article,designation,forme,product_brand,prix_vente_ttc,image_url,web_category_slug,is_web_hidden&or=(designation.ilike.*${encoded}*,code_article.ilike.*${encoded}*,product_brand.ilike.*${encoded}*)&is_web_hidden=eq.false&order=designation.asc&limit=${limit}`;

  const response = await fetch(url, { headers: supabaseHeaders });
  if (!response.ok) return [];
  const rows: Product[] = await response.json();
  return rows.map(normalizeProductPricing);
}

// ---------------------------------------------------------------------------
// Fetch single product by code_article (for detail page)
// ---------------------------------------------------------------------------

export async function fetchProductByCode(codeArticle: string): Promise<Product | null> {
  const encoded = encodeURIComponent(codeArticle);
  const url = `${supabaseUrl}products?select=${PRODUCT_LIST_SELECT},code_barre,product_gallery_urls,description_web,product_specs,peremption&code_article=eq.${encoded}&limit=1`;

  const response = await fetch(url, { headers: supabaseHeaders });
  if (!response.ok) return null;
  const rows: Product[] = await response.json();
  return rows.length > 0 ? normalizeProductPricing(rows[0]) : null;
}

// ---------------------------------------------------------------------------
// Fetch product detail (gallery, description, specs) — lazy loaded
// ---------------------------------------------------------------------------

export async function fetchProductDetail(productId: string): Promise<Partial<Product> | null> {
  try {
    const response = await fetch(
      `${supabaseUrl}products?select=id,description_web,product_gallery_urls,product_specs&id=eq.${productId}&limit=1`,
      { headers: supabaseHeaders }
    );
    if (!response.ok) return null;
    const rows = await response.json();
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Fetch distinct brands for a given category
// ---------------------------------------------------------------------------

export async function fetchCategoryBrands(categorySlug: string): Promise<string[]> {
  const allSlugs = collectAllCategorySlugs(categorySlug);
  const orClause = allSlugs.map((s) => `web_category_slug.eq.${s}`).join(",");
  const url = `${supabaseUrl}products?select=product_brand&or=(${orClause})&is_web_hidden=eq.false&order=product_brand.asc&limit=500`;

  const response = await fetch(url, { headers: supabaseHeaders });
  if (!response.ok) return [];
  const rows: Array<{ product_brand: string | null }> = await response.json();
  const brands = rows
    .map((r) => decodeBrokenText(String(r.product_brand || "").trim()))
    .filter(Boolean);
  return [...new Set(brands)].sort((a, b) => a.localeCompare(b, "fr"));
}

// ---------------------------------------------------------------------------
// Fetch a small batch for the home page (avoids loading everything)
// ---------------------------------------------------------------------------

export async function fetchHomeProducts(): Promise<Product[]> {
  const url = `${supabaseUrl}products?select=${PRODUCT_LIST_SELECT}&is_web_hidden=eq.false&order=image_url.asc,designation.asc&limit=50`;

  const response = await fetch(url, { headers: supabaseHeaders });
  if (!response.ok) throw new Error("Erreur chargement produits home");
  const rows: Product[] = await response.json();
  return rows.map(normalizeProductPricing);
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function fetchWebCategories(): Promise<WebCategory[]> {
  try {
    const response = await fetch(
      `${supabaseUrl}web_categories?select=id,parent_id,name,slug,image_url,description,sort_order,is_active&is_active=eq.true&order=sort_order.asc,name.asc`,
      { headers: supabaseHeaders }
    );

    if (!response.ok) return sanitizeCategoryTree(DEFAULT_WEB_CATEGORY_TREE);

    const rows = (await response.json()) as WebCategoryRow[];
    if (!rows.length) return sanitizeCategoryTree(DEFAULT_WEB_CATEGORY_TREE);

    return sanitizeCategoryTree(buildCategoryTree(rows));
  } catch {
    return sanitizeCategoryTree(DEFAULT_WEB_CATEGORY_TREE);
  }
}

export function buildCategoryTree(rows: WebCategoryRow[]) {
  const nodes = new Map<string, WebCategory>();
  const roots: WebCategory[] = [];

  rows.forEach((row) => {
    nodes.set(row.slug, { ...row, children: [] });
  });

  rows.forEach((row) => {
    const node = nodes.get(row.slug);
    if (!node) return;

    if (!row.parent_id) {
      roots.push(node);
      return;
    }

    const parent = Array.from(nodes.values()).find((candidate) => candidate.id === row.parent_id);
    if (parent) {
      parent.children = [...(parent.children || []), node];
    } else {
      roots.push(node);
    }
  });

  const sortTree = (items: WebCategory[]) =>
    items
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || a.name.localeCompare(b.name, "fr"))
      .map((item) => ({ ...item, children: sortTree(item.children || []) }));

  return sortTree(roots);
}

export function flattenCategories(tree: WebCategory[]) {
  const flat: WebCategory[] = [];
  const visit = (node: WebCategory) => {
    flat.push(node);
    (node.children || []).forEach(visit);
  };
  tree.forEach(visit);
  return flat;
}

export function findCategoryBySlug(tree: WebCategory[], slug: string | null | undefined): WebCategory | null {
  if (!slug) return null;
  for (const node of tree) {
    if (node.slug === slug) return node;
    const nested = findCategoryBySlug(node.children || [], slug);
    if (nested) return nested;
  }
  return null;
}

export function collectCategorySlugs(node: WebCategory | null): string[] {
  if (!node) return [];
  return [node.slug, ...(node.children || []).flatMap((child) => collectCategorySlugs(child))];
}

// ---------------------------------------------------------------------------
// Company settings
// ---------------------------------------------------------------------------

export async function fetchCompanySettings(): Promise<CompanySettings> {
  try {
    const response = await fetch(
      `${supabaseUrl}company_settings?select=company_name,address,city,phone,mobile,email,delivery_fee_standard,delivery_fee_express,delivery_fee_pickup&id=eq.1&limit=1`,
      { headers: supabaseHeaders }
    );

    if (!response.ok) return {};

    const rows = (await response.json()) as Array<{
      company_name?: string | null;
      address?: string | null;
      city?: string | null;
      phone?: string | null;
      mobile?: string | null;
      email?: string | null;
      delivery_fee_standard?: number | null;
      delivery_fee_express?: number | null;
      delivery_fee_pickup?: number | null;
    }>;
    const row = rows[0];
    if (!row) return {};

    return {
      companyName: decodeBrokenText(String(row.company_name || "").trim()) || null,
      address: decodeBrokenText(String(row.address || "").trim()) || null,
      city: decodeBrokenText(String(row.city || "").trim()) || null,
      phone: String(row.phone || "").trim() || null,
      mobile: String(row.mobile || "").trim() || null,
      email: String(row.email || "").trim() || null,
      deliveryFeeStandard: Number(row.delivery_fee_standard || 0) || 0,
      deliveryFeeExpress: Number(row.delivery_fee_express || 0) || 0,
      deliveryFeePickup: Number(row.delivery_fee_pickup || 0) || 0,
    };
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export async function fetchProductReviews(productId: string): Promise<ProductReview[]> {
  const response = await fetch(
    `${supabaseUrl}web_product_reviews?select=id,customer_name,rating,review_title,comment,created_at&product_id=eq.${encodeURIComponent(productId)}&is_approved=eq.true&order=created_at.desc`,
    { headers: supabaseHeaders }
  );
  if (!response.ok) return [];
  return response.json();
}

export async function createProductReview(input: {
  productId: string;
  customerName: string;
  rating: number;
  reviewTitle?: string;
  comment: string;
}) {
  const response = await fetch(`${supabaseUrl}web_product_reviews`, {
    method: "POST",
    headers: supabaseHeaders,
    body: JSON.stringify({
      product_id: input.productId,
      customer_name: input.customerName,
      rating: input.rating,
      review_title: input.reviewTitle || null,
      comment: input.comment,
      is_approved: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }
  return response.json();
}

// ---------------------------------------------------------------------------
// Customer auth (fast RPC)
// ---------------------------------------------------------------------------

export function readStoredWebCustomerSession(): WebCustomerSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(WEB_CUSTOMER_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WebCustomerSession | null;
    return parsed?.access_token ? parsed : null;
  } catch {
    return null;
  }
}

export function storeWebCustomerSession(session: WebCustomerSession | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(WEB_CUSTOMER_SESSION_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(WEB_CUSTOMER_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredWebCustomerSession() {
  storeWebCustomerSession(null);
}

export async function loadWebCustomerSession(): Promise<WebCustomerSession | null> {
  const session = readStoredWebCustomerSession();
  if (!session?.access_token || !session.user?.id) return null;
  try {
    const fresh = await fetchCurrentWebCustomer(session.user.id, session.access_token);
    storeWebCustomerSession(fresh);
    return fresh;
  } catch {
    clearStoredWebCustomerSession();
    return null;
  }
}

export async function signUpWebCustomer(input: {
  fullName: string;
  email?: string;
  phone: string;
  password: string;
  address?: string;
}): Promise<WebCustomerSession> {
  const payload = await callFastAuthRpc("web_customer_fast_register", {
    p_full_name: input.fullName,
    p_email: String(input.email || "").trim() || null,
    p_phone: input.phone,
    p_password: input.password,
    p_address: input.address || null,
  });
  const session = buildFastWebCustomerSession(payload);
  storeWebCustomerSession(session);
  return session;
}

export async function signInWebCustomer(input: { phone: string; password: string }): Promise<WebCustomerSession> {
  const payload = await callFastAuthRpc("web_customer_fast_login", {
    p_phone: input.phone,
    p_password: input.password,
  });
  const session = buildFastWebCustomerSession(payload);
  storeWebCustomerSession(session);
  return session;
}

export async function fetchCurrentWebCustomer(accountId: string, accessToken: string): Promise<WebCustomerSession> {
  const payload = await callFastAuthRpc("web_customer_fast_session", {
    p_account_id: accountId,
    p_session_token: accessToken,
  });
  return buildFastWebCustomerSession(payload);
}

export async function saveWebCustomerProfile(
  accessToken: string,
  input: { id: string; email?: string | null; full_name: string; phone?: string | null; address?: string | null }
): Promise<WebCustomerProfile> {
  const normalized = {
    id: input.id,
    email: String(input.email || "").trim() || null,
    full_name: input.full_name.trim(),
    phone: normalizePhone(input.phone),
    address: String(input.address || "").trim() || null,
  };

  try {
    const payload = await callFastAuthRpc("web_customer_fast_update_profile", {
      p_account_id: normalized.id,
      p_session_token: accessToken,
      p_email: normalized.email,
      p_full_name: normalized.full_name,
      p_phone: normalized.phone,
      p_address: normalized.address,
    });
    return mapFastAccountToProfile(payload);
  } catch {
    return { ...normalized, created_at: null, updated_at: null };
  }
}

export async function signOutWebCustomer(session?: WebCustomerSession | null) {
  try {
    if (session?.user?.id && session?.access_token) {
      await callFastAuthRpc("web_customer_fast_logout", {
        p_account_id: session.user.id,
        p_session_token: session.access_token,
      });
    }
  } catch { /* ignore */ }
  clearStoredWebCustomerSession();
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export async function createWebOrder(input: {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes: string;
  paymentMode: string;
  deliveryMode: string;
  deliveryFeeTtc: number;
  cart: CartLine[];
}): Promise<{ order: WebOrder; orderNumber: string }> {
  const orderNumber = generateWebOrderNumber();
  const subtotal = input.cart.reduce((sum, line) => sum + getProductWebPrice(line.product) * line.quantity, 0);
  const deliveryFee = Number(input.deliveryFeeTtc || 0);
  const total = subtotal + deliveryFee;

  let response = await fetch(`${supabaseUrl}web_orders`, {
    method: "POST",
    headers: supabaseHeaders,
    body: JSON.stringify({
      order_number: orderNumber,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      customer_address: input.customerAddress || null,
      notes: input.notes || null,
      payment_mode: input.paymentMode,
      delivery_mode: input.deliveryMode,
      delivery_fee_ttc: deliveryFee,
      total_ttc: total,
      status: "Nouvelle",
    }),
  });

  if (!response.ok) {
    response = await fetch(`${supabaseUrl}web_orders`, {
      method: "POST",
      headers: supabaseHeaders,
      body: JSON.stringify({
        order_number: orderNumber,
        customer_name: `${input.customerName} - ${input.customerPhone}`,
        delivery_fee_ttc: deliveryFee,
        total_ttc: total,
        status: "Nouvelle",
      }),
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }

  const [order] = (await response.json()) as WebOrder[];

  const itemsPayload: WebOrderItem[] = input.cart.map((line) => ({
    order_id: order.id,
    product_id: line.product.id,
    quantity: line.quantity,
    unit_price: getProductWebPrice(line.product),
  }));

  const itemsResponse = await fetch(`${supabaseUrl}web_order_items`, {
    method: "POST",
    headers: supabaseHeaders,
    body: JSON.stringify(itemsPayload),
  });

  if (!itemsResponse.ok) {
    const errorText = await itemsResponse.text();
    throw new Error(errorText || `HTTP ${itemsResponse.status}`);
  }

  await fetch(`${supabaseUrl}web_order_status_history`, {
    method: "POST",
    headers: supabaseHeaders,
    body: JSON.stringify({
      order_id: order.id,
      old_status: null,
      new_status: "Nouvelle",
      note: "Commande créée depuis le site public",
    }),
  });

  return { order, orderNumber };
}

export async function trackWebOrder(orderNumber: string, phone: string): Promise<WebOrder | null> {
  const normalizedOrder = encodeURIComponent(orderNumber.trim());
  const normalizedPhone = encodeURIComponent(phone.trim());

  const response = await fetch(
    `${supabaseUrl}web_orders?select=id,order_number,customer_name,customer_phone,status,total_ttc,delivery_mode,payment_mode,delivery_fee_ttc,notes,created_at&order_number=eq.${normalizedOrder}&customer_phone=eq.${normalizedPhone}&limit=1`,
    { headers: supabaseHeaders }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }

  const rows = (await response.json()) as WebOrder[];
  const order = rows[0] || null;
  if (!order) return null;

  const itemsResponse = await fetch(
    `${supabaseUrl}web_order_items?select=id,order_id,product_id,quantity,unit_price&order_id=eq.${encodeURIComponent(order.id)}`,
    { headers: supabaseHeaders }
  );

  if (!itemsResponse.ok) {
    const errorText = await itemsResponse.text();
    throw new Error(errorText || `HTTP ${itemsResponse.status}`);
  }

  const items = (await itemsResponse.json()) as WebOrderItem[];
  const productIds = Array.from(new Set(items.map((item) => item.product_id).filter(Boolean)));

  const products =
    productIds.length === 0
      ? []
      : ((await (async () => {
          const productResponse = await fetch(
            `${supabaseUrl}products?select=id,code_article,designation,forme,image_url,product_gallery_urls,web_category_slug&or=(${productIds.map((id) => `id.eq.${id}`).join(",")})`,
            { headers: supabaseHeaders }
          );
          if (!productResponse.ok) return [];
          return productResponse.json();
        })()) as Product[]);

  const productMap = new Map(products.map((product) => [product.id, product]));
  return {
    ...order,
    items: items.map((item) => ({ ...item, product: productMap.get(item.product_id) || null })),
  };
}

// ---------------------------------------------------------------------------
// Product helpers
// ---------------------------------------------------------------------------

export function getProductWebPrice(product: Product): number {
  const dedicated = Number(product?.prix_vente_web_ttc || 0);
  if (Number.isFinite(dedicated) && dedicated > 0) return dedicated;
  const base = Number(product?.prix_vente_ttc || 0);
  const remise = Number(product?.remise_web_pct || 0);
  if (Number.isFinite(remise) && remise > 0) return Math.max(0, base - (base * remise) / 100);
  return base;
}

export function normalizeProductPricing(product: Product): Product {
  const resolvedWebPrice = getProductWebPrice(product);
  return {
    ...product,
    designation: decodeBrokenText(String(product.designation || "").trim()),
    forme: decodeBrokenText(String(product.forme || "").trim()) || null,
    product_brand: decodeBrokenText(String(product.product_brand || "").trim()) || null,
    description_web: decodeBrokenText(String(product.description_web || "").trim()) || null,
    product_specs: decodeBrokenText(String(product.product_specs || "").trim()) || null,
    promo_badge: decodeBrokenText(String(product.promo_badge || "").trim()) || null,
    prix_vente_ttc: resolvedWebPrice,
    remise_web_pct: Number(product?.remise_web_pct || 0),
    prix_vente_web_ttc: resolvedWebPrice,
    is_web_hidden: Boolean(product?.is_web_hidden ?? false),
  };
}

export function getProductImage(product: Product) {
  return String(product.image_url || "").trim() || "/placeholder.svg";
}

export function getProductGalleryImages(product: Product) {
  const values = new Set<string>();
  const mainImage = String(product.image_url || "").trim();
  if (mainImage) values.add(mainImage);

  const raw = String(product.product_gallery_urls || "").trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          const value = String(item || "").trim();
          if (value) values.add(value);
        });
      }
    } catch {
      raw
        .split(/[\n,;]+/)
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .forEach((item) => values.add(item));
    }
  }

  if (!values.size) values.add("/placeholder.svg");
  return Array.from(values);
}

export function getProductBrand(product: Product) {
  const explicitBrand = decodeBrokenText(String(product.product_brand || "").trim());
  if (explicitBrand) return explicitBrand;
  const designation = String(product.designation || "").trim();
  const words = designation.split(/\s+/).filter(Boolean);
  const firstAlphaWord = words.find((word) => /[a-zA-Z]/.test(word)) || words[0] || "Marque";
  return firstAlphaWord.toUpperCase();
}

export function getProductCategory(product: Product) {
  return getCategoryLabelFromSlug(getProductCategorySlug(product));
}

export function getProductCategorySlug(product: Product) {
  const assignedSlug = String(product.web_category_slug || "").trim();
  if (assignedSlug) return findTopLevelSlugFromAssignedSlug(assignedSlug);
  const haystack = normalizeText([product.forme, product.designation, product.description_web, product.code_article].join(" "));
  const match = MAIN_CATEGORY_INFERENCE.find(({ pattern }) => pattern.test(haystack));
  return match?.slug || "visage";
}

export function getCategoryLabelFromSlug(slug: string) {
  return decodeBrokenText(MAIN_CATEGORY_INFERENCE.find((item) => item.slug === slug)?.label || "Visage");
}

export function getProductOldPrice(product: Product) {
  const oldPrice = Number(product.old_price_ttc || 0);
  const currentPrice = getProductWebPrice(product);
  return oldPrice > currentPrice ? oldPrice : null;
}

export function getProductPromoBadge(product: Product) {
  const explicitBadge = decodeBrokenText(String(product.promo_badge || "").trim());
  if (explicitBadge) return explicitBadge;
  const oldPrice = getProductOldPrice(product);
  const currentPrice = getProductWebPrice(product);
  if (!oldPrice || currentPrice <= 0 || oldPrice <= currentPrice) return "";
  const discount = Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
  return discount > 0 ? `-${discount}%` : "";
}

export function getProductSpecs(product: Product) {
  const raw = String(product.product_specs || "").trim();
  if (!raw) return [];
  return raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...valueParts] = line.split(":");
      if (!valueParts.length) return { label: "Détail", value: decodeBrokenText(line) };
      return { label: decodeBrokenText(label.trim()), value: decodeBrokenText(valueParts.join(":").trim()) };
    });
}

export function formatMoney(value: number | null | undefined) {
  return `${Number(value || 0).toFixed(3)} DT`;
}

export function normalizeText(value: string | null | undefined) {
  return decodeBrokenText(String(value || ""))
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function findTopLevelSlugFromAssignedSlug(slug: string) {
  for (const root of DEFAULT_WEB_CATEGORY_TREE) {
    const slugs = collectCategorySlugs(root);
    if (slugs.includes(slug)) return root.slug;
  }
  return slug;
}

function generateWebOrderNumber() {
  const now = new Date();
  return `WEB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
}

function sanitizeCategoryTree(tree: WebCategory[]): WebCategory[] {
  return tree.map((node) => ({
    ...node,
    name: decodeBrokenText(node.name),
    description: decodeBrokenText(node.description || ""),
    children: sanitizeCategoryTree(node.children || []),
  }));
}

type FastWebCustomerAccountRow = {
  id: string;
  full_name: string;
  email?: string | null;
  phone: string;
  address?: string | null;
  session_token?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function normalizePhone(value: string | null | undefined) {
  return String(value || "").replace(/\D+/g, "").trim();
}

function mapFastAccountToProfile(row: FastWebCustomerAccountRow | null | undefined): WebCustomerProfile {
  return {
    id: String(row?.id || ""),
    email: String(row?.email || "").trim() || null,
    full_name: String(row?.full_name || "").trim() || "Client web",
    phone: normalizePhone(row?.phone),
    address: String(row?.address || "").trim() || null,
    created_at: row?.created_at || null,
    updated_at: row?.updated_at || null,
  };
}

function buildFastWebCustomerSession(row: FastWebCustomerAccountRow | null | undefined): WebCustomerSession {
  const profile = mapFastAccountToProfile(row);
  const accessToken = String(row?.session_token || "").trim();
  if (!profile.id || !profile.phone || !accessToken) throw new Error("Session client indisponible.");
  return {
    access_token: accessToken,
    refresh_token: null,
    expires_at: null,
    user: { id: profile.id, phone: profile.phone, email: profile.email || null },
    profile,
  };
}

async function callFastAuthRpc<T = FastWebCustomerAccountRow>(functionName: string, payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${supabaseUrl}rpc/${functionName}`, {
    method: "POST",
    headers: supabaseHeaders,
    body: JSON.stringify(payload),
  });

  const rawText = await response.text().catch(() => "");
  let parsed: any = null;
  if (rawText) {
    try { parsed = JSON.parse(rawText); } catch { parsed = null; }
  }

  if (!response.ok) throw new Error(readFastAuthErrorMessage(parsed, rawText, response.status));
  if (Array.isArray(parsed)) {
    if (!parsed.length) throw new Error("Aucune reponse recue depuis le service client.");
    return parsed[0] as T;
  }
  return parsed as T;
}

function readFastAuthErrorMessage(payload: Record<string, any> | null, rawText: string, status: number) {
  const message = String(
    payload?.message || payload?.msg || payload?.error_description || payload?.error || rawText || ""
  ).trim();

  if (
    status === 404 ||
    /web_customer_fast_(register|login|session|update_profile|logout)/i.test(message) ||
    /Could not find the function/i.test(message)
  ) {
    return `Le module Authentification Rapide n'est pas encore active dans Supabase.\n\nExecute ce SQL dans Supabase:\n${getWebCustomerFastAuthMigrationSql()}`;
  }

  return message || `HTTP ${status}`;
}

function decodeBrokenText(value: string) {
  if (!value || !BROKEN_TEXT_PATTERN.test(value)) return value;
  try {
    return decodeURIComponent(escape(value));
  } catch {
    return value
      .replaceAll("ÃƒÂ©", "Ã©")
      .replaceAll("ÃƒÂ¨", "Ã¨")
      .replaceAll("ÃƒÂª", "Ãª")
      .replaceAll("ÃƒÂ«", "Ã«")
      .replaceAll("Ãƒ ", "Ã ")
      .replaceAll("ÃƒÂ¢", "Ã¢")
      .replaceAll("ÃƒÂ®", "Ã®")
      .replaceAll("ÃƒÂ´", "Ã´")
      .replaceAll("ÃƒÂ¹", "Ã¹")
      .replaceAll("ÃƒÂ»", "Ã»")
      .replaceAll("ÃƒÂ§", "Ã§")
      .replaceAll("Ãƒâ€°", "Ã‰")
      .replaceAll("Ãƒâ‚¬", "Ã€")
      .replaceAll("Ã¢â‚¬â„¢", "'")
      .replaceAll("Ã¢â‚¬â€œ", "-")
      .replaceAll("Ã¢â‚¬â€", "-")
      .replaceAll("Ã‚", "");
  }
}

// ---------------------------------------------------------------------------
// SQL migration for auth (kept as-is)
// ---------------------------------------------------------------------------

export function getWebCustomerFastAuthMigrationSql() {
  return `
create extension if not exists pgcrypto;

create table if not exists public.web_customer_accounts (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  email text,
  password_hash text not null,
  full_name text not null,
  address text,
  session_token uuid,
  last_login_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.web_customer_accounts
add column if not exists email text;

alter table public.customers
add column if not exists email text;

alter table public.customers
add column if not exists source_client text;

drop function if exists public.web_customer_fast_register(text, text, text, text);
drop function if exists public.web_customer_fast_register(text, text, text, text, text);
drop function if exists public.web_customer_fast_login(text, text);
drop function if exists public.web_customer_fast_session(uuid, uuid);
drop function if exists public.web_customer_fast_update_profile(uuid, uuid, text, text, text);
drop function if exists public.web_customer_fast_update_profile(uuid, uuid, text, text, text, text);
drop function if exists public.web_customer_fast_logout(uuid, uuid);
drop function if exists public.sync_web_customer_to_customers(text, text, text, text);

create index if not exists idx_web_customer_accounts_phone on public.web_customer_accounts(phone);
create index if not exists idx_web_customer_accounts_session on public.web_customer_accounts(session_token);
create unique index if not exists idx_web_customer_accounts_email
on public.web_customer_accounts(lower(email))
where email is not null and trim(email) <> '';

create or replace function public.set_updated_at_web_customer_accounts()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_web_customer_accounts_updated_at on public.web_customer_accounts;
create trigger trg_web_customer_accounts_updated_at
before update on public.web_customer_accounts
for each row
execute function public.set_updated_at_web_customer_accounts();

alter table public.web_customer_accounts enable row level security;

create or replace function public.sync_web_customer_to_customers(
  p_full_name text,
  p_phone text,
  p_email text default null,
  p_address text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\\D', '', 'g');
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_customer_id uuid;
begin
  if length(v_phone) < 8 then
    return;
  end if;

  select account.id
  into v_customer_id
  from public.customers account
  where regexp_replace(coalesce(account.telephone, ''), '\\D', '', 'g') = v_phone
  limit 1;

  if v_customer_id is null then
    insert into public.customers (nom, telephone, adresse, email, source_client)
    values (trim(coalesce(p_full_name, 'Client web')), v_phone, nullif(trim(coalesce(p_address, '')), ''), v_email, 'CLIENT_WEB');
    return;
  end if;

  update public.customers
  set nom = trim(coalesce(p_full_name, public.customers.nom)),
      telephone = v_phone,
      adresse = nullif(trim(coalesce(p_address, '')), ''),
      email = v_email,
      source_client = 'CLIENT_WEB'
  where public.customers.id = v_customer_id;
end;
$$;

create or replace function public.web_customer_fast_register(
  p_full_name text, p_phone text, p_password text, p_email text default null, p_address text default null
)
returns table (id uuid, full_name text, email text, phone text, address text, session_token uuid, created_at timestamptz, updated_at timestamptz)
language plpgsql security definer set search_path = public
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\\D', '', 'g');
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_account public.web_customer_accounts%rowtype;
begin
  if length(v_phone) < 8 then raise exception 'Numero de telephone invalide.'; end if;
  if coalesce(length(trim(p_password)), 0) < 4 then raise exception 'Mot de passe trop court.'; end if;
  if exists(select 1 from public.web_customer_accounts account where account.phone = v_phone) then raise exception 'Ce numero de telephone est deja utilise.'; end if;
  if v_email is not null and exists(select 1 from public.web_customer_accounts account where lower(account.email) = v_email) then raise exception 'Cet email est deja utilise.'; end if;

  insert into public.web_customer_accounts (phone, email, password_hash, full_name, address, session_token, last_login_at)
  values (v_phone, v_email, extensions.crypt(p_password, extensions.gen_salt('bf')), trim(coalesce(p_full_name, 'Client web')), nullif(trim(coalesce(p_address, '')), ''), gen_random_uuid(), now())
  returning * into v_account;

  perform public.sync_web_customer_to_customers(v_account.full_name, v_account.phone, v_account.email, v_account.address);
  return query select v_account.id, v_account.full_name, v_account.email, v_account.phone, v_account.address, v_account.session_token, v_account.created_at, v_account.updated_at;
end;
$$;

create or replace function public.web_customer_fast_login(p_phone text, p_password text)
returns table (id uuid, full_name text, email text, phone text, address text, session_token uuid, created_at timestamptz, updated_at timestamptz)
language plpgsql security definer set search_path = public
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\\D', '', 'g');
  v_account public.web_customer_accounts%rowtype;
begin
  select * into v_account from public.web_customer_accounts account where account.phone = v_phone and account.is_active = true limit 1;
  if v_account.id is null then raise exception 'Compte introuvable.'; end if;
  if extensions.crypt(p_password, v_account.password_hash) <> v_account.password_hash then raise exception 'Mot de passe incorrect.'; end if;
  update public.web_customer_accounts set session_token = gen_random_uuid(), last_login_at = now() where public.web_customer_accounts.id = v_account.id returning * into v_account;
  return query select v_account.id, v_account.full_name, v_account.email, v_account.phone, v_account.address, v_account.session_token, v_account.created_at, v_account.updated_at;
end;
$$;

create or replace function public.web_customer_fast_session(p_account_id uuid, p_session_token uuid)
returns table (id uuid, full_name text, email text, phone text, address text, session_token uuid, created_at timestamptz, updated_at timestamptz)
language sql security definer set search_path = public
as $$
  select account.id, account.full_name, account.email, account.phone, account.address, account.session_token, account.created_at, account.updated_at
  from public.web_customer_accounts account
  where account.id = p_account_id and account.session_token = p_session_token and account.is_active = true limit 1;
$$;

create or replace function public.web_customer_fast_update_profile(
  p_account_id uuid, p_session_token uuid, p_full_name text, p_phone text, p_email text default null, p_address text default null
)
returns table (id uuid, full_name text, email text, phone text, address text, session_token uuid, created_at timestamptz, updated_at timestamptz)
language plpgsql security definer set search_path = public
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\\D', '', 'g');
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_account public.web_customer_accounts%rowtype;
begin
  if length(v_phone) < 8 then raise exception 'Numero de telephone invalide.'; end if;
  if exists(select 1 from public.web_customer_accounts account where account.phone = v_phone and account.id <> p_account_id) then raise exception 'Ce numero de telephone est deja utilise.'; end if;
  if v_email is not null and exists(select 1 from public.web_customer_accounts account where lower(account.email) = v_email and account.id <> p_account_id) then raise exception 'Cet email est deja utilise.'; end if;

  update public.web_customer_accounts
  set email = v_email, full_name = trim(coalesce(p_full_name, web_customer_accounts.full_name)), phone = v_phone, address = nullif(trim(coalesce(p_address, '')), '')
  where public.web_customer_accounts.id = p_account_id and public.web_customer_accounts.session_token = p_session_token and public.web_customer_accounts.is_active = true
  returning * into v_account;

  if v_account.id is null then raise exception 'Session client invalide.'; end if;
  perform public.sync_web_customer_to_customers(v_account.full_name, v_account.phone, v_account.email, v_account.address);
  return query select v_account.id, v_account.full_name, v_account.email, v_account.phone, v_account.address, v_account.session_token, v_account.created_at, v_account.updated_at;
end;
$$;

create or replace function public.web_customer_fast_logout(p_account_id uuid, p_session_token uuid)
returns boolean language plpgsql security definer set search_path = public
as $$
begin
  update public.web_customer_accounts set session_token = null where public.web_customer_accounts.id = p_account_id and public.web_customer_accounts.session_token = p_session_token;
  return true;
end;
$$;

grant execute on function public.web_customer_fast_register(text, text, text, text, text) to anon, authenticated;
grant execute on function public.web_customer_fast_login(text, text) to anon, authenticated;
grant execute on function public.web_customer_fast_session(uuid, uuid) to anon, authenticated;
grant execute on function public.web_customer_fast_update_profile(uuid, uuid, text, text, text, text) to anon, authenticated;
grant execute on function public.web_customer_fast_logout(uuid, uuid) to anon, authenticated;
grant execute on function public.sync_web_customer_to_customers(text, text, text, text) to anon, authenticated;
`.trim();
}
