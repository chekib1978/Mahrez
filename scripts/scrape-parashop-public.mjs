import fs from 'node:fs/promises';
import path from 'node:path';

const SITE_ROOT = 'https://www.parashop.tn';
const DEFAULT_OUTPUT = path.resolve(process.cwd(), 'parashop-public-import.csv');
const DEFAULT_CATEGORIES_OUTPUT = path.resolve(process.cwd(), 'parashop-categories.json');
const REQUEST_DELAY_MS = 350;
const MAIN_CATEGORY_NAMES = new Set([
    'visage',
    'corps',
    'capillaire',
    'solaire',
    'bebe & maman',
    'bébé & maman',
    'nature & bio',
    'complements alimentaires',
    'compléments alimentaires',
    'homme',
    'hygiene',
    'hygiène'
]);

const EXCLUDED_PATH_PREFIXES = [
    '/index.php',
    '/blog',
    '/nos-magasins',
    '/wishlist',
    '/checkout',
    '/cart',
    '/contact',
    '/search',
    '/login',
    '/register',
    '/account',
    '/information',
    '/manufacturer',
    '/brands'
];

const CSV_HEADERS = [
    'CodeArticle',
    'CodeABarre',
    'Designation',
    'PrixAchatHT',
    'PrixAchatTTC',
    'PrixVenteHT',
    'PrixVenteTTC',
    'TVA',
    'Marge',
    'DateAlerte',
    'StockArticle',
    'ImageURL',
    'DescriptionWeb',
    'ProductBrand',
    'WebCategorySlug',
    'OldPriceTTC',
    'PromoBadge',
    'ProductGalleryURLs',
    'ProductSpecs',
    'Forme',
    'ProductUrl'
];

const args = parseArgs(process.argv.slice(2));

function parseArgs(argv) {
    const options = {
        out: DEFAULT_OUTPUT,
        categoriesOut: DEFAULT_CATEGORIES_OUTPUT,
        limitCategories: 0,
        limitProducts: 0
    };

    for (let index = 0; index < argv.length; index += 1) {
        const current = argv[index];
        const next = argv[index + 1];

        if (current === '--out' && next) {
            options.out = path.resolve(process.cwd(), next);
            index += 1;
            continue;
        }

        if (current === '--categories-out' && next) {
            options.categoriesOut = path.resolve(process.cwd(), next);
            index += 1;
            continue;
        }

        if (current === '--limit-categories' && next) {
            options.limitCategories = Number(next) || 0;
            index += 1;
            continue;
        }

        if (current === '--limit-products' && next) {
            options.limitProducts = Number(next) || 0;
            index += 1;
        }
    }

    return options;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchText(url, attempt = 1) {
    await delay(REQUEST_DELAY_MS);
    const response = await fetch(url, {
        headers: {
            'user-agent': 'Mozilla/5.0 (compatible; ParashopImportBot/1.0; +https://www.parashop.tn/)',
            'accept-language': 'fr-FR,fr;q=0.9,en;q=0.8'
        }
    });

    if (!response.ok) {
        if (attempt < 3 && response.status >= 500) {
            return fetchText(url, attempt + 1);
        }
        throw new Error(`HTTP ${response.status} on ${url}`);
    }

    return response.text();
}

function decodeHtml(value) {
    return String(value || '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function stripHtml(value) {
    return decodeHtml(String(value || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function normalizeText(value) {
    return stripHtml(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function slugify(value) {
    return normalizeText(value)
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 120);
}

function makeAbsoluteUrl(href, baseUrl = SITE_ROOT) {
    try {
        return new URL(href, baseUrl).toString();
    } catch {
        return '';
    }
}

function getPathname(url) {
    try {
        return new URL(url).pathname;
    } catch {
        return '';
    }
}

function isSameDomain(url) {
    try {
        return new URL(url).hostname.endsWith('parashop.tn');
    } catch {
        return false;
    }
}

function isExcludedUrl(url) {
    const pathname = getPathname(url).toLowerCase();
    return EXCLUDED_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

function extractAnchors(html, baseUrl) {
    const anchors = [];
    const regex = /<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = regex.exec(html)) !== null) {
        const href = makeAbsoluteUrl(match[2], baseUrl);
        if (!href || !isSameDomain(href)) continue;

        anchors.push({
            href,
            text: stripHtml(match[3])
        });
    }

    return anchors;
}

function extractProductLinksFromListing(html, baseUrl) {
    const links = new Set();
    const blockRegex = /<div[^>]+class=["'][^"']*product-layout[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
    let blockMatch;

    while ((blockMatch = blockRegex.exec(html)) !== null) {
        const anchorRegex = /<a\b[^>]*href=(["'])(.*?)\1[^>]*>/gi;
        let anchorMatch;

        while ((anchorMatch = anchorRegex.exec(blockMatch[1])) !== null) {
            const href = makeAbsoluteUrl(anchorMatch[2], baseUrl);
            if (!href || !isSameDomain(href) || isExcludedUrl(href)) continue;
            links.add(href);
        }
    }

    if (links.size > 0) return [...links];

    const fallbackRegex = /<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
    let fallbackMatch;
    while ((fallbackMatch = fallbackRegex.exec(html)) !== null) {
        const href = makeAbsoluteUrl(fallbackMatch[2], baseUrl);
        const text = stripHtml(fallbackMatch[3]);
        if (!href || !isSameDomain(href) || isExcludedUrl(href)) continue;
        if (text.length < 8) continue;
        links.add(href);
    }

    return [...links];
}

function extractMetaContent(html, propertyName) {
    const patterns = [
        new RegExp(`<meta[^>]+property=["']${propertyName}["'][^>]+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${propertyName}["']`, 'i'),
        new RegExp(`<meta[^>]+name=["']${propertyName}["'][^>]+content=["']([^"']+)["']`, 'i')
    ];

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match?.[1]) return decodeHtml(match[1]).trim();
    }

    return '';
}

function extractMonetaryValues(html) {
    const values = [];
    const regex = /(\d[\d\s.,]{0,20})\s*DT/gi;
    let match;

    while ((match = regex.exec(html)) !== null) {
        const parsed = parsePrice(match[1]);
        if (parsed > 0) values.push(parsed);
    }

    return values;
}

function parsePrice(value) {
    const cleaned = String(value || '')
        .replace(/\s/g, '')
        .replace(/\.(?=\d{3}\b)/g, '')
        .replace(',', '.');
    return Number(cleaned) || 0;
}

function formatPrice(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number.toFixed(3) : '0.000';
}

function deriveTva(ttc, ht) {
    if (!ttc || !ht || ht <= 0) return '0.000';
    const rate = ((ttc / ht) - 1) * 100;
    if (!Number.isFinite(rate) || rate < 0) return '0.000';
    return formatPrice(Math.round(rate * 1000) / 1000);
}

function buildPageUrl(url, pageNumber) {
    const target = new URL(url);
    target.searchParams.set('page', String(pageNumber));
    return target.toString();
}

function parsePageCount(html) {
    const match = html.match(/Affichage\s+\d+\s+[àa]\s+\d+\s+sur\s+\d+\s+\((\d+)\s+pages?\)/i);
    return match ? Number(match[1]) || 1 : 1;
}

function looksLikeCategoryAnchor(anchor) {
    const text = normalizeText(anchor.text);
    if (!text || text.length < 3) return false;
    if (MAIN_CATEGORY_NAMES.has(text)) return true;

    const pathname = getPathname(anchor.href);
    if (!pathname || pathname === '/' || isExcludedUrl(anchor.href)) return false;

    if (pathname.split('/').filter(Boolean).length === 1) return true;
    return false;
}

function looksLikeProductLink(url, currentCategoryPath) {
    const pathname = getPathname(url);
    if (!pathname || pathname === '/' || isExcludedUrl(url)) return false;
    if (pathname === currentCategoryPath) return false;
    return pathname.split('/').filter(Boolean).length >= 1;
}

function detectPromoBadge(html) {
    const match = html.match(/-\s*\d+\s*%/);
    return match ? match[0].replace(/\s+/g, '') : '';
}

function extractBrand(html) {
    const text = stripHtml(html);
    const patterns = [
        /Brand:\s*([^\n\r:]{2,120})/i,
        /Marque\s*:\s*([^\n\r:]{2,120})/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match?.[1]) return match[1].trim();
    }

    return '';
}

function extractBreadcrumbs(html) {
    const breadcrumbs = [];
    const breadcrumbMatch = html.match(/<ul[^>]*class=["'][^"']*breadcrumb[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i);
    if (!breadcrumbMatch) return breadcrumbs;

    const anchorRegex = /<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = anchorRegex.exec(breadcrumbMatch[1])) !== null) {
        const label = stripHtml(match[3]);
        if (label) breadcrumbs.push(label);
    }

    return breadcrumbs;
}

function extractDescription(html) {
    const metaDescription = extractMetaContent(html, 'description');
    if (metaDescription) return metaDescription;

    const productDescriptionMatch = html.match(/<div[^>]+id=["']tab-description["'][^>]*>([\s\S]*?)<\/div>/i);
    if (productDescriptionMatch?.[1]) return stripHtml(productDescriptionMatch[1]);

    return '';
}

function generateCodeArticle(productUrl) {
    const pathname = getPathname(productUrl).replace(/\/+$/, '');
    const slug = pathname.split('/').filter(Boolean).pop() || 'article';
    const hash = [...productUrl].reduce((acc, char) => ((acc * 31) + char.charCodeAt(0)) >>> 0, 7).toString(16).toUpperCase();
    return `PS-${slugify(slug).toUpperCase().slice(0, 24)}-${hash.slice(-6)}`;
}

function toCsvRow(values) {
    return values.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(';');
}

async function discoverMainCategories() {
    const homepageHtml = await fetchText(SITE_ROOT);
    const anchors = extractAnchors(homepageHtml, SITE_ROOT);
    const categories = [];
    const seen = new Set();

    for (const anchor of anchors) {
        const normalizedName = normalizeText(anchor.text);
        if (!MAIN_CATEGORY_NAMES.has(normalizedName)) continue;
        if (seen.has(normalizedName)) continue;
        seen.add(normalizedName);
        categories.push({
            name: anchor.text.trim(),
            url: anchor.href
        });
    }

    return categories;
}

async function discoverProductsFromCategory(category) {
    const categoryHtml = await fetchText(category.url);
    const pageCount = parsePageCount(categoryHtml);
    const pages = [];

    for (let page = 1; page <= pageCount; page += 1) {
        pages.push(page === 1 ? category.url : buildPageUrl(category.url, page));
    }

    const productCandidates = new Set();
    const subcategories = new Map();

    for (const pageUrl of pages) {
        const html = pageUrl === category.url ? categoryHtml : await fetchText(pageUrl);
        const categoryPath = getPathname(category.url);
        const productLinks = extractProductLinksFromListing(html, pageUrl);

        for (const href of productLinks) {
            const pathname = getPathname(href);
            if (!pathname || pathname === '/' || pathname === categoryPath) continue;
            productCandidates.add(href);
        }

        const anchors = extractAnchors(html, pageUrl);
        for (const anchor of anchors) {
            if (!anchor.href || !isSameDomain(anchor.href) || isExcludedUrl(anchor.href)) continue;
            const pathname = getPathname(anchor.href);
            if (!pathname || pathname === '/') continue;

            if (pathname !== categoryPath && pathname.split('/').filter(Boolean).length === 1 && anchor.text.trim()) {
                subcategories.set(anchor.href, {
                    name: anchor.text.trim(),
                    url: anchor.href
                });
            }
        }
    }

    return {
        pages,
        subcategories: [...subcategories.values()],
        productCandidates: [...productCandidates]
    };
}

function isProductPage(html) {
    const text = stripHtml(html);
    return /Prix hors taxes/i.test(text) || /Ajouter au panier/i.test(text);
}

async function scrapeProduct(productUrl, categorySlug) {
    const html = await fetchText(productUrl);
    if (!isProductPage(html)) return null;

    const breadcrumbs = extractBreadcrumbs(html);
    const title = extractMetaContent(html, 'og:title') || stripHtml((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '');
    if (!title) return null;

    const priceHtMatch = stripHtml(html).match(/Prix hors taxes\s*:\s*([\d\s.,]+)\s*DT/i);
    const prixVenteHT = priceHtMatch ? parsePrice(priceHtMatch[1]) : 0;
    const prices = extractMonetaryValues(html);
    const prixVenteTTC = prices.find(value => !prixVenteHT || Math.abs(value - prixVenteHT) > 0.001) || prices[0] || 0;
    const oldPriceCandidates = prices.filter(value => value > prixVenteTTC);
    const oldPrice = oldPriceCandidates.length ? oldPriceCandidates[0] : 0;
    const webCategoryLabel = breadcrumbs.length >= 2 ? breadcrumbs[breadcrumbs.length - 2] : categorySlug;

    return {
        CodeArticle: generateCodeArticle(productUrl),
        CodeABarre: '',
        Designation: title,
        PrixAchatHT: '0.000',
        PrixAchatTTC: '0.000',
        PrixVenteHT: formatPrice(prixVenteHT),
        PrixVenteTTC: formatPrice(prixVenteTTC),
        TVA: deriveTva(prixVenteTTC, prixVenteHT),
        Marge: '0.000',
        DateAlerte: '',
        StockArticle: '0',
        ImageURL: extractMetaContent(html, 'og:image'),
        DescriptionWeb: extractDescription(html),
        ProductBrand: extractBrand(html),
        WebCategorySlug: slugify(webCategoryLabel || categorySlug),
        OldPriceTTC: oldPrice ? formatPrice(oldPrice) : '0.000',
        PromoBadge: detectPromoBadge(html),
        ProductGalleryURLs: '',
        ProductSpecs: '',
        Forme: '',
        ProductUrl: productUrl
    };
}

async function main() {
    const mainCategories = await discoverMainCategories();
    const selectedCategories = args.limitCategories > 0
        ? mainCategories.slice(0, args.limitCategories)
        : mainCategories;

    const discoveredCategoryRecords = [];
    const seenProductUrls = new Set();

    await fs.mkdir(path.dirname(args.out), { recursive: true });
    await fs.writeFile(args.out, `${toCsvRow(CSV_HEADERS)}\n`, 'utf8');

    for (const category of selectedCategories) {
        const categorySlug = slugify(category.name || getPathname(category.url));
        const details = await discoverProductsFromCategory(category);

        discoveredCategoryRecords.push({
            name: category.name,
            slug: categorySlug,
            url: category.url,
            pages: details.pages.length,
            subcategories: details.subcategories
        });

        for (const productUrl of details.productCandidates) {
            if (seenProductUrls.has(productUrl)) continue;
            if (args.limitProducts > 0 && seenProductUrls.size >= args.limitProducts) break;

            seenProductUrls.add(productUrl);

            try {
                const product = await scrapeProduct(productUrl, categorySlug);
                if (product) {
                    const row = `${toCsvRow(CSV_HEADERS.map(header => product[header] ?? ''))}\n`;
                    await fs.appendFile(args.out, row, 'utf8');
                }
            } catch (error) {
                console.warn(`Skip ${productUrl}: ${error.message}`);
            }
        }
    }

    await fs.mkdir(path.dirname(args.categoriesOut), { recursive: true });
    await fs.writeFile(args.categoriesOut, JSON.stringify(discoveredCategoryRecords, null, 2), 'utf8');

    console.log(`Categories: ${discoveredCategoryRecords.length}`);
    console.log(`Produits publics: ${seenProductUrls.size}`);
    console.log(`CSV: ${args.out}`);
    console.log(`Categories JSON: ${args.categoriesOut}`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
