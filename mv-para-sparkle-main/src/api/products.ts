import {
  Product,
  supabaseUrl,
  supabaseHeaders,
  normalizeProductPricing,
} from "@/lib/store-api";

export const ALL_PRODUCT_FIELDS =
  "id,code_article,code_barre,designation,forme,product_brand,prix_vente_ht,prix_vente_ttc,prix_vente_web_ttc,remise_web_pct,old_price_ttc,promo_badge,stock_actuel,peremption,image_url,product_gallery_urls,description_web,product_specs,tva,web_category_slug,is_web_hidden";

export async function fetchAllProducts(): Promise<Product[]> {
  const all: Product[] = [];
  const batchSize = 1000;
  let offset = 0;
  while (true) {
    const url = `${supabaseUrl}products?select=${ALL_PRODUCT_FIELDS}&is_web_hidden=eq.false&order=id.asc&limit=${batchSize}&offset=${offset}`;
    const response = await fetch(url, { headers: supabaseHeaders });
    if (!response.ok) throw new Error(`HTTP ${response.status} — ${await response.text()}`);
    const rows: Product[] = await response.json();
    if (!rows.length) break;
    all.push(...rows);
    offset += rows.length;
    if (rows.length < batchSize) break;
  }
  return all.map(normalizeProductPricing);
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const url = `${supabaseUrl}products?select=${ALL_PRODUCT_FIELDS}&id=eq.${encodeURIComponent(id)}&limit=1`;
  const response = await fetch(url, { headers: supabaseHeaders });
  if (!response.ok) return null;
  const rows: Product[] = await response.json();
  return rows.length > 0 ? normalizeProductPricing(rows[0]) : null;
}
