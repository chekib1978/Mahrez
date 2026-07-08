import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import { Product, WebCategory, findCategoryBySlug, DEFAULT_WEB_CATEGORY_TREE } from "@/lib/store-api";
import { fetchAllProducts } from "@/api/products";

type ProductContextValue = {
  allProducts: Product[];
  isLoading: boolean;
  error: string | null;
  getProductByCode: (code: string) => Product | null;
  getProductById: (id: string) => Product | null;
  getBrands: (categorySlug?: string) => string[];
  getHomeProducts: () => Product[];
  getCategoryProducts: (categorySlug?: string) => Product[];
  getSimilarProducts: (product: Product, limit?: number) => Product[];
};

const ProductContext = createContext<ProductContextValue | null>(null);

function flatSlugs(node: WebCategory): string[] {
  return [node.slug, ...(node.children || []).flatMap((child) => flatSlugs(child))];
}

export function ProductProvider({ children }: { children: ReactNode }) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const products = await fetchAllProducts();
        if (!cancelled) setAllProducts(products);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur chargement produits");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const getProductByCode = useCallback(
    (code: string) => allProducts.find((p) => p.code_article === code) || null,
    [allProducts]
  );

  const getProductById = useCallback(
    (id: string) => allProducts.find((p) => p.id === id) || null,
    [allProducts]
  );

  const getBrands = useCallback(
    (categorySlug?: string) => {
      let filtered = allProducts;
      if (categorySlug) {
        const node = findCategoryBySlug(DEFAULT_WEB_CATEGORY_TREE, categorySlug);
        const slugs = node ? flatSlugs(node) : [categorySlug];
        filtered = filtered.filter((p) => p.web_category_slug && slugs.includes(p.web_category_slug));
      }
      const brands = filtered
        .map((p) => String(p.product_brand || "").trim())
        .filter(Boolean);
      return [...new Set(brands)].sort((a, b) => a.localeCompare(b, "fr"));
    },
    [allProducts]
  );

  const getHomeProducts = useCallback(
    () => allProducts.filter((p) => !!String(p.image_url || "").trim()).slice(0, 50),
    [allProducts]
  );

  const getCategoryProducts = useCallback(
    (categorySlug?: string) => {
      if (!categorySlug) return allProducts;
      const node = findCategoryBySlug(DEFAULT_WEB_CATEGORY_TREE, categorySlug);
      const slugs = node ? flatSlugs(node) : [categorySlug];
      return allProducts.filter((p) => p.web_category_slug && slugs.includes(p.web_category_slug));
    },
    [allProducts]
  );

  const getSimilarProducts = useCallback(
    (product: Product, limit = 4) => {
      if (!product.web_category_slug) return [];
      const slug = product.web_category_slug;
      const node = findCategoryBySlug(DEFAULT_WEB_CATEGORY_TREE, slug);
      const slugs = node ? flatSlugs(node) : [slug];
      return allProducts
        .filter((p) => p.web_category_slug && slugs.includes(p.web_category_slug) && p.id !== product.id)
        .slice(0, limit);
    },
    [allProducts]
  );

  const value = useMemo<ProductContextValue>(
    () => ({
      allProducts,
      isLoading,
      error,
      getProductByCode,
      getProductById,
      getBrands,
      getHomeProducts,
      getCategoryProducts,
      getSimilarProducts,
    }),
    [allProducts, isLoading, error, getProductByCode, getProductById, getBrands, getHomeProducts, getCategoryProducts, getSimilarProducts]
  );

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export function useProducts() {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error("useProducts must be used within ProductProvider");
  return ctx;
}
