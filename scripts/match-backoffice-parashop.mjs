import fs from 'node:fs/promises';
import path from 'node:path';
import XLSX from 'xlsx';

const REQUIRED_IMPORT_COLUMNS = [
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
    'StockArticle'
];

const OPTIONAL_IMPORT_COLUMNS = [
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

const MATCHED_HEADERS = [
    ...REQUIRED_IMPORT_COLUMNS,
    ...OPTIONAL_IMPORT_COLUMNS,
    'MatchMethod',
    'MatchScore',
    'MatchedWebDesignation',
    'MatchedWebBrand',
    'MatchedWebUrl'
];

const REVIEW_HEADERS = [
    ...REQUIRED_IMPORT_COLUMNS,
    ...OPTIONAL_IMPORT_COLUMNS,
    'ReviewReason',
    'SuggestedCodeArticle',
    'SuggestedDesignation',
    'SuggestedBrand',
    'SuggestedScore',
    'SuggestedMethod',
    'SuggestedWebUrl'
];

const UNMATCHED_HEADERS = [
    ...REQUIRED_IMPORT_COLUMNS,
    ...OPTIONAL_IMPORT_COLUMNS,
    'UnmatchedReason'
];

const COLUMN_ALIASES = {
    CodeArticle: ['CodeArticle', 'code_article', 'codearticle', 'articlecode', 'ref', 'reference'],
    CodeABarre: ['CodeABarre', 'code_barre', 'codeabarre', 'barcode', 'ean', 'ean13', 'codebarre'],
    Designation: ['Designation', 'designation', 'libelle', 'nom', 'produit', 'article'],
    PrixAchatHT: ['PrixAchatHT', 'prix_achat_ht', 'prixachatht'],
    PrixAchatTTC: ['PrixAchatTTC', 'prix_achat_ttc', 'prixachatttc'],
    PrixVenteHT: ['PrixVenteHT', 'prix_vente_ht', 'prixventeht'],
    PrixVenteTTC: ['PrixVenteTTC', 'prix_vente_ttc', 'prixventettc', 'prix'],
    TVA: ['TVA', 'tva', 'taxe'],
    Marge: ['Marge', 'marge'],
    DateAlerte: ['DateAlerte', 'date_alerte', 'datealerte'],
    StockArticle: ['StockArticle', 'stock_article', 'stock', 'stockactuel', 'stock_actuel'],
    ImageURL: ['ImageURL', 'image_url', 'imageurl'],
    DescriptionWeb: ['DescriptionWeb', 'description_web', 'descriptionweb', 'description'],
    ProductBrand: ['ProductBrand', 'product_brand', 'brand', 'marque', 'marqueproduit'],
    WebCategorySlug: ['WebCategorySlug', 'web_category_slug', 'category_slug', 'categorie_web', 'webcategoryslug'],
    OldPriceTTC: ['OldPriceTTC', 'old_price_ttc', 'ancienprixttc'],
    PromoBadge: ['PromoBadge', 'promo_badge', 'badgepromo', 'badge'],
    ProductGalleryURLs: ['ProductGalleryURLs', 'product_gallery_urls', 'galerieimagesproduit'],
    ProductSpecs: ['ProductSpecs', 'product_specs', 'caracteristiques', 'specs'],
    Forme: ['Forme', 'forme'],
    ProductUrl: ['ProductUrl', 'product_url', 'urlproduit', 'url']
};

const NOISE_WORDS = new Set([
    'offert',
    'offerte',
    'offerts',
    'offertes',
    'gratuit',
    'gratuite',
    'gratuites',
    'gratis',
    'pack',
    'coffret',
    'trousse',
    'lot',
    'duo',
    'promo',
    'nouveau',
    'new',
    'avec',
    'sans',
    'pour',
    'sur',
    'the',
    'and',
    'set',
    'plus',
    'offre'
]);

const args = parseArgs(process.argv.slice(2));

function parseArgs(argv) {
    const options = {
        backoffice: '',
        web: path.resolve(process.cwd(), 'parashop-public-import.ready.csv'),
        outDir: process.cwd(),
        prefix: 'catalogue-web-match'
    };

    for (let index = 0; index < argv.length; index += 1) {
        const current = argv[index];
        const next = argv[index + 1];

        if (current === '--backoffice' && next) {
            options.backoffice = path.resolve(process.cwd(), next);
            index += 1;
            continue;
        }

        if (current === '--web' && next) {
            options.web = path.resolve(process.cwd(), next);
            index += 1;
            continue;
        }

        if (current === '--out-dir' && next) {
            options.outDir = path.resolve(process.cwd(), next);
            index += 1;
            continue;
        }

        if (current === '--prefix' && next) {
            options.prefix = String(next).trim() || options.prefix;
            index += 1;
        }
    }

    return options;
}

function normalizeHeader(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '');
}

function normalizeText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeUnits(value) {
    return String(value || '')
        .replace(/(\d+)\s*ml\b/gi, '$1ml')
        .replace(/(\d+)\s*g\b/gi, '$1g')
        .replace(/(\d+)\s*mg\b/gi, '$1mg')
        .replace(/(\d+)\s*kg\b/gi, '$1kg')
        .replace(/(\d+)\s*l\b/gi, '$1l')
        .replace(/(\d+)\s*cl\b/gi, '$1cl');
}

function extractMeasurementTokens(value) {
    return Array.from(
        new Set(
            (normalizeUnits(value).match(/\b\d+(?:[.,]\d+)?(?:ml|mg|g|kg|l|cl)\b/gi) || [])
                .map(item => item.toLowerCase().replace(',', '.'))
        )
    );
}

function buildUsefulTokens(value, brand = '') {
    const normalizedValue = normalizeUnits(normalizeText(value));
    const normalizedBrand = normalizeText(brand);
    return normalizedValue
        .split(' ')
        .filter(Boolean)
        .filter(token => token !== normalizedBrand)
        .filter(token => token.length > 1)
        .filter(token => !NOISE_WORDS.has(token))
        .filter(token => !/^\d+$/.test(token));
}

function buildFingerprint(value, brand = '') {
    return buildUsefulTokens(value, brand).sort().join(' ');
}

function jaccardSimilarity(listA, listB) {
    const setA = new Set(listA || []);
    const setB = new Set(listB || []);
    if (setA.size === 0 || setB.size === 0) return 0;

    let common = 0;
    for (const item of setA) {
        if (setB.has(item)) common += 1;
    }

    const union = new Set([...setA, ...setB]).size;
    return union > 0 ? common / union : 0;
}

function normalizeBarcode(value) {
    return String(value || '').replace(/\D+/g, '').trim();
}

function escapeCsv(value) {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
}

function parseCsvLine(line, delimiter) {
    const values = [];
    let current = '';
    let quoted = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const next = line[index + 1];

        if (char === '"') {
            if (quoted && next === '"') {
                current += '"';
                index += 1;
            } else {
                quoted = !quoted;
            }
            continue;
        }

        if (char === delimiter && !quoted) {
            values.push(current);
            current = '';
            continue;
        }

        current += char;
    }

    values.push(current);
    return values;
}

function detectDelimiter(firstLine) {
    const delimiters = [';', '\t', ','];
    let best = ';';
    let bestCount = -1;

    for (const delimiter of delimiters) {
        const count = parseCsvLine(firstLine, delimiter).length;
        if (count > bestCount) {
            best = delimiter;
            bestCount = count;
        }
    }

    return best;
}

function parseCsv(content) {
    const lines = String(content || '')
        .replace(/^\uFEFF/, '')
        .split(/\r?\n/)
        .filter(line => line.trim() !== '');

    if (lines.length === 0) {
        return { headers: [], rows: [] };
    }

    const delimiter = detectDelimiter(lines[0]);
    const headers = parseCsvLine(lines[0], delimiter).map(value => value.trim());
    const rows = lines.slice(1).map(line => {
        const values = parseCsvLine(line, delimiter);
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] ?? '';
        });
        return row;
    });

    return { headers, rows };
}

async function readTableFile(filePath) {
    const extension = path.extname(filePath).toLowerCase();

    if (extension === '.xlsx' || extension === '.xls') {
        const workbook = XLSX.readFile(filePath, { cellDates: false });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
        return { headers, rows };
    }

    const content = await fs.readFile(filePath, 'utf8');
    return parseCsv(content);
}

function toCsv(headers, rows) {
    const lines = [headers.map(escapeCsv).join(';')];
    for (const row of rows) {
        lines.push(headers.map(header => escapeCsv(row[header] ?? '')).join(';'));
    }
    return `${lines.join('\n')}\n`;
}

function getColumnValue(row, logicalName) {
    const aliases = COLUMN_ALIASES[logicalName] || [logicalName];
    const entries = Object.entries(row || {});
    for (const alias of aliases) {
        const normalizedAlias = normalizeHeader(alias);
        const match = entries.find(([key]) => normalizeHeader(key) === normalizedAlias);
        if (match) {
            return String(match[1] ?? '').trim();
        }
    }
    return '';
}

function inferBrand(row) {
    const explicit = getColumnValue(row, 'ProductBrand');
    if (explicit) return explicit.trim();

    const designation = getColumnValue(row, 'Designation');
    const firstWord = designation.trim().split(/\s+/)[0] || '';
    if (firstWord.length >= 3 && /^[A-Z0-9-]+$/.test(firstWord)) {
        return firstWord;
    }
    return '';
}

function buildNormalizedRecord(row, source) {
    const normalized = {
        source,
        original: row,
        CodeArticle: getColumnValue(row, 'CodeArticle'),
        CodeABarre: getColumnValue(row, 'CodeABarre'),
        Designation: getColumnValue(row, 'Designation'),
        PrixAchatHT: getColumnValue(row, 'PrixAchatHT'),
        PrixAchatTTC: getColumnValue(row, 'PrixAchatTTC'),
        PrixVenteHT: getColumnValue(row, 'PrixVenteHT'),
        PrixVenteTTC: getColumnValue(row, 'PrixVenteTTC'),
        TVA: getColumnValue(row, 'TVA'),
        Marge: getColumnValue(row, 'Marge'),
        DateAlerte: getColumnValue(row, 'DateAlerte'),
        StockArticle: getColumnValue(row, 'StockArticle'),
        ImageURL: getColumnValue(row, 'ImageURL'),
        DescriptionWeb: getColumnValue(row, 'DescriptionWeb'),
        ProductBrand: inferBrand(row),
        WebCategorySlug: getColumnValue(row, 'WebCategorySlug'),
        OldPriceTTC: getColumnValue(row, 'OldPriceTTC'),
        PromoBadge: getColumnValue(row, 'PromoBadge'),
        ProductGalleryURLs: getColumnValue(row, 'ProductGalleryURLs'),
        ProductSpecs: getColumnValue(row, 'ProductSpecs'),
        Forme: getColumnValue(row, 'Forme'),
        ProductUrl: getColumnValue(row, 'ProductUrl')
    };

    normalized.normBarcode = normalizeBarcode(normalized.CodeABarre);
    normalized.normDesignation = normalizeText(normalized.Designation);
    normalized.normBrand = normalizeText(normalized.ProductBrand);
    normalized.normDesignationNoBrand = normalized.normBrand && normalized.normDesignation.startsWith(normalized.normBrand)
        ? normalized.normDesignation.slice(normalized.normBrand.length).trim()
        : normalized.normDesignation;
    normalized.measurements = extractMeasurementTokens(normalized.Designation);
    normalized.usefulTokens = buildUsefulTokens(normalized.Designation, normalized.ProductBrand);
    normalized.fingerprint = buildFingerprint(normalized.Designation, normalized.ProductBrand);
    normalized.normDescription = normalizeText(normalized.DescriptionWeb);

    return normalized;
}

function addToMap(map, key, value) {
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(value);
}

function buildIndexes(backofficeRows) {
    const indexes = {
        byBarcode: new Map(),
        byDesignationBrand: new Map(),
        byDesignationOnly: new Map(),
        byDesignationNoBrand: new Map(),
        byFingerprint: new Map(),
        byBrand: new Map()
    };

    for (const row of backofficeRows) {
        addToMap(indexes.byBarcode, row.normBarcode, row);
        addToMap(indexes.byDesignationBrand, `${row.normDesignation}|${row.normBrand}`, row);
        addToMap(indexes.byDesignationOnly, row.normDesignation, row);
        addToMap(indexes.byDesignationNoBrand, row.normDesignationNoBrand, row);
        addToMap(indexes.byFingerprint, `${row.fingerprint}|${row.normBrand}`, row);
        addToMap(indexes.byBrand, row.normBrand, row);
    }

    return indexes;
}

function uniqueCandidates(list) {
    const seen = new Set();
    return (list || []).filter(item => {
        const key = item.CodeArticle || `${item.Designation}|${item.normBarcode}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function computeLooseScore(webRow, candidate) {
    const tokenSimilarity = jaccardSimilarity(webRow.usefulTokens, candidate.usefulTokens);
    const fingerprintSimilarity = webRow.fingerprint && webRow.fingerprint === candidate.fingerprint ? 1 : 0;
    const brandSimilarity = webRow.normBrand && candidate.normBrand && webRow.normBrand === candidate.normBrand ? 1 : 0;

    let measurementScore = 0;
    if (webRow.measurements.length === 0 && candidate.measurements.length === 0) {
        measurementScore = 0.65;
    } else if (webRow.measurements.some(item => candidate.measurements.includes(item))) {
        measurementScore = 1;
    } else if (webRow.measurements.length > 0 && candidate.measurements.length > 0) {
        measurementScore = 0;
    } else {
        measurementScore = 0.45;
    }

    const prefixBoost = candidate.normDesignationNoBrand.includes(webRow.normDesignationNoBrand)
        || webRow.normDesignationNoBrand.includes(candidate.normDesignationNoBrand)
        ? 0.08
        : 0;

    const rawScore = (tokenSimilarity * 0.55)
        + (fingerprintSimilarity * 0.15)
        + (brandSimilarity * 0.15)
        + (measurementScore * 0.15)
        + prefixBoost;

    return Math.min(0.99, rawScore);
}

function getApproximateCandidates(webRow, indexes) {
    const pool = webRow.normBrand
        ? uniqueCandidates(indexes.byBrand.get(webRow.normBrand))
        : [];

    if (pool.length > 0) return pool;

    const firstToken = webRow.usefulTokens[0];
    if (!firstToken) return [];

    return Array.from(indexes.byDesignationNoBrand.values())
        .flat()
        .filter(candidate => candidate.usefulTokens.includes(firstToken));
}

function findMatch(webRow, indexes) {
    if (webRow.normBarcode) {
        const barcodeMatches = uniqueCandidates(indexes.byBarcode.get(webRow.normBarcode));
        if (barcodeMatches.length === 1) {
            return {
                status: 'matched',
                candidate: barcodeMatches[0],
                method: 'barcode',
                score: 100
            };
        }
        if (barcodeMatches.length > 1) {
            return {
                status: 'review',
                reason: 'Plusieurs articles backoffice partagent le meme code barre.',
                suggestions: barcodeMatches.slice(0, 5).map(candidate => ({
                    candidate,
                    method: 'barcode',
                    score: 100
                }))
            };
        }
    }

    const exactBrandKey = `${webRow.normDesignation}|${webRow.normBrand}`;
    const exactBrandMatches = uniqueCandidates(indexes.byDesignationBrand.get(exactBrandKey));
    if (exactBrandMatches.length === 1) {
        return {
            status: 'matched',
            candidate: exactBrandMatches[0],
            method: 'designation+brand',
            score: 96
        };
    }
    if (exactBrandMatches.length > 1) {
        return {
            status: 'review',
            reason: 'Plusieurs articles backoffice correspondent exactement a la designation et a la marque.',
            suggestions: exactBrandMatches.slice(0, 5).map(candidate => ({
                candidate,
                method: 'designation+brand',
                score: 96
            }))
        };
    }

    const exactDesignationMatches = uniqueCandidates(indexes.byDesignationOnly.get(webRow.normDesignation));
    if (exactDesignationMatches.length === 1) {
        return {
            status: 'matched',
            candidate: exactDesignationMatches[0],
            method: 'designation',
            score: 92
        };
    }
    if (exactDesignationMatches.length > 1) {
        return {
            status: 'review',
            reason: 'La designation existe plusieurs fois dans le backoffice.',
            suggestions: exactDesignationMatches.slice(0, 5).map(candidate => ({
                candidate,
                method: 'designation',
                score: 92
            }))
        };
    }

    const noBrandMatches = uniqueCandidates(indexes.byDesignationNoBrand.get(webRow.normDesignationNoBrand));
    if (noBrandMatches.length === 1) {
        return {
            status: 'matched',
            candidate: noBrandMatches[0],
            method: 'designation-sans-marque',
            score: 88
        };
    }

    const fingerprintMatches = uniqueCandidates(indexes.byFingerprint.get(`${webRow.fingerprint}|${webRow.normBrand}`));
    if (fingerprintMatches.length === 1) {
        return {
            status: 'matched',
            candidate: fingerprintMatches[0],
            method: 'empreinte+marque',
            score: 90
        };
    }

    const approximateCandidates = uniqueCandidates([
        ...noBrandMatches,
        ...fingerprintMatches,
        ...getApproximateCandidates(webRow, indexes)
    ])
        .map(candidate => ({
            candidate,
            method: 'approximation-intelligente',
            score: Math.round(computeLooseScore(webRow, candidate) * 100)
        }))
        .filter(item => item.score >= 70)
        .sort((a, b) => b.score - a.score);

    if (approximateCandidates.length > 0) {
        const top = approximateCandidates[0];
        const second = approximateCandidates[1];
        const clearlyAhead = !second || top.score - second.score >= 8;

        if (top.score >= 86 && clearlyAhead) {
            return {
                status: 'matched',
                candidate: top.candidate,
                method: top.method,
                score: top.score
            };
        }

        return {
            status: 'review',
            reason: 'Correspondance probable mais pas assez fiable pour etre appliquee automatiquement.',
            suggestions: approximateCandidates.slice(0, 5)
        };
    }

    return {
        status: 'unmatched',
        reason: 'Aucune correspondance fiable trouvee dans le backoffice.'
    };
}

function mergedValue(primary, fallback) {
    return String(primary || '').trim() || String(fallback || '').trim();
}

function buildMatchedRow(backofficeRow, webRow, match) {
    return {
        CodeArticle: mergedValue(backofficeRow.CodeArticle, webRow.CodeArticle),
        CodeABarre: mergedValue(backofficeRow.CodeABarre, webRow.CodeABarre),
        Designation: mergedValue(backofficeRow.Designation, webRow.Designation),
        PrixAchatHT: mergedValue(backofficeRow.PrixAchatHT, webRow.PrixAchatHT),
        PrixAchatTTC: mergedValue(backofficeRow.PrixAchatTTC, webRow.PrixAchatTTC),
        PrixVenteHT: mergedValue(backofficeRow.PrixVenteHT, webRow.PrixVenteHT),
        PrixVenteTTC: mergedValue(backofficeRow.PrixVenteTTC, webRow.PrixVenteTTC),
        TVA: mergedValue(backofficeRow.TVA, webRow.TVA),
        Marge: mergedValue(backofficeRow.Marge, webRow.Marge),
        DateAlerte: mergedValue(backofficeRow.DateAlerte, webRow.DateAlerte),
        StockArticle: mergedValue(backofficeRow.StockArticle, webRow.StockArticle),
        ImageURL: mergedValue(backofficeRow.ImageURL, webRow.ImageURL),
        DescriptionWeb: mergedValue(backofficeRow.DescriptionWeb, webRow.DescriptionWeb),
        ProductBrand: mergedValue(backofficeRow.ProductBrand, webRow.ProductBrand),
        WebCategorySlug: mergedValue(backofficeRow.WebCategorySlug, webRow.WebCategorySlug),
        OldPriceTTC: mergedValue(backofficeRow.OldPriceTTC, webRow.OldPriceTTC),
        PromoBadge: mergedValue(backofficeRow.PromoBadge, webRow.PromoBadge),
        ProductGalleryURLs: mergedValue(backofficeRow.ProductGalleryURLs, webRow.ProductGalleryURLs),
        ProductSpecs: mergedValue(backofficeRow.ProductSpecs, webRow.ProductSpecs),
        Forme: mergedValue(backofficeRow.Forme, webRow.Forme),
        ProductUrl: mergedValue(backofficeRow.ProductUrl, webRow.ProductUrl),
        MatchMethod: match.method,
        MatchScore: String(match.score),
        MatchedWebDesignation: webRow.Designation,
        MatchedWebBrand: webRow.ProductBrand,
        MatchedWebUrl: webRow.ProductUrl
    };
}

function buildReviewRow(webRow, result) {
    const top = result.suggestions?.[0];
    return {
        CodeArticle: webRow.CodeArticle,
        CodeABarre: webRow.CodeABarre,
        Designation: webRow.Designation,
        PrixAchatHT: webRow.PrixAchatHT,
        PrixAchatTTC: webRow.PrixAchatTTC,
        PrixVenteHT: webRow.PrixVenteHT,
        PrixVenteTTC: webRow.PrixVenteTTC,
        TVA: webRow.TVA,
        Marge: webRow.Marge,
        DateAlerte: webRow.DateAlerte,
        StockArticle: webRow.StockArticle,
        ImageURL: webRow.ImageURL,
        DescriptionWeb: webRow.DescriptionWeb,
        ProductBrand: webRow.ProductBrand,
        WebCategorySlug: webRow.WebCategorySlug,
        OldPriceTTC: webRow.OldPriceTTC,
        PromoBadge: webRow.PromoBadge,
        ProductGalleryURLs: webRow.ProductGalleryURLs,
        ProductSpecs: webRow.ProductSpecs,
        Forme: webRow.Forme,
        ProductUrl: webRow.ProductUrl,
        ReviewReason: result.reason,
        SuggestedCodeArticle: top?.candidate?.CodeArticle || '',
        SuggestedDesignation: top?.candidate?.Designation || '',
        SuggestedBrand: top?.candidate?.ProductBrand || '',
        SuggestedScore: top ? String(top.score) : '',
        SuggestedMethod: top?.method || '',
        SuggestedWebUrl: webRow.ProductUrl
    };
}

function buildUnmatchedRow(webRow, reason) {
    return {
        CodeArticle: webRow.CodeArticle,
        CodeABarre: webRow.CodeABarre,
        Designation: webRow.Designation,
        PrixAchatHT: webRow.PrixAchatHT,
        PrixAchatTTC: webRow.PrixAchatTTC,
        PrixVenteHT: webRow.PrixVenteHT,
        PrixVenteTTC: webRow.PrixVenteTTC,
        TVA: webRow.TVA,
        Marge: webRow.Marge,
        DateAlerte: webRow.DateAlerte,
        StockArticle: webRow.StockArticle,
        ImageURL: webRow.ImageURL,
        DescriptionWeb: webRow.DescriptionWeb,
        ProductBrand: webRow.ProductBrand,
        WebCategorySlug: webRow.WebCategorySlug,
        OldPriceTTC: webRow.OldPriceTTC,
        PromoBadge: webRow.PromoBadge,
        ProductGalleryURLs: webRow.ProductGalleryURLs,
        ProductSpecs: webRow.ProductSpecs,
        Forme: webRow.Forme,
        ProductUrl: webRow.ProductUrl,
        UnmatchedReason: reason
    };
}

async function main() {
    if (!args.backoffice) {
        throw new Error('Utilisez --backoffice chemin-vers-votre-export.csv');
    }

    const [backofficeParsed, webParsed] = await Promise.all([
        readTableFile(args.backoffice),
        readTableFile(args.web)
    ]);

    const backofficeRows = backofficeParsed.rows
        .map(row => buildNormalizedRecord(row, 'backoffice'))
        .filter(row => row.Designation);

    const webRows = webParsed.rows
        .map(row => buildNormalizedRecord(row, 'web'))
        .filter(row => row.Designation);

    const indexes = buildIndexes(backofficeRows);
    const matchedRows = [];
    const reviewRows = [];
    const unmatchedRows = [];

    for (const webRow of webRows) {
        const result = findMatch(webRow, indexes);
        if (result.status === 'matched') {
            matchedRows.push(buildMatchedRow(result.candidate, webRow, result));
            continue;
        }
        if (result.status === 'review') {
            reviewRows.push(buildReviewRow(webRow, result));
            continue;
        }
        unmatchedRows.push(buildUnmatchedRow(webRow, result.reason));
    }

    await fs.mkdir(args.outDir, { recursive: true });

    const matchedPath = path.join(args.outDir, `${args.prefix}.matched.csv`);
    const reviewPath = path.join(args.outDir, `${args.prefix}.review.csv`);
    const unmatchedPath = path.join(args.outDir, `${args.prefix}.unmatched.csv`);

    await Promise.all([
        fs.writeFile(matchedPath, toCsv(MATCHED_HEADERS, matchedRows), 'utf8'),
        fs.writeFile(reviewPath, toCsv(REVIEW_HEADERS, reviewRows), 'utf8'),
        fs.writeFile(unmatchedPath, toCsv(UNMATCHED_HEADERS, unmatchedRows), 'utf8')
    ]);

    console.log(`MATCHED=${matchedRows.length}`);
    console.log(`REVIEW=${reviewRows.length}`);
    console.log(`UNMATCHED=${unmatchedRows.length}`);
    console.log(`MATCHED_FILE=${matchedPath}`);
    console.log(`REVIEW_FILE=${reviewPath}`);
    console.log(`UNMATCHED_FILE=${unmatchedPath}`);
}

main().catch(error => {
    console.error(error.message || error);
    process.exitCode = 1;
});
