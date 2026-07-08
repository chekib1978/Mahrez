import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Eye, ShoppingBag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import bebe from "@/assets/cat-bebe.jpg";
import cheveux from "@/assets/cat-cheveux.jpg";
import complements from "@/assets/cat-complements.jpg";
import corps from "@/assets/cat-corps.jpg";
import visage from "@/assets/cat-visage.jpg";
import {
  collectCategorySlugs,
  formatMoney,
  getProductBrand,
  getProductCategorySlug,
  getProductImage,
  getProductOldPrice,
  getProductPromoBadge,
  getProductWebPrice,
  Product,
  WebCategory,
} from "@/lib/store-api";

type CategoryShowcaseProps = {
  categories: WebCategory[];
  products: Product[];
  onAddToCart: (product: Product) => void;
  onOpenProduct: (product: Product) => void;
  onSelectCategory: (slug: string) => void;
};

const categoryFallbackImageMap: Record<string, string> = {
  visage,
  corps,
  capillaire: cheveux,
  "bebe-maman": bebe,
  "nature-bio": complements,
  "complements-alimentaires": complements,
  orthopedie: corps,
  hygiene: corps,
  solaire: visage,
};

const categoryDescriptionMap: Record<string, string> = {
  visage: "Découvrez une sélection experte de soins visage, textures plaisir et routines ciblées pour chaque besoin de peau.",
  corps: "Hydratation, nutrition et confort au quotidien avec des soins corps choisis pour allier efficacité et sensorialité.",
  capillaire: "Shampooings, masques et soins ciblés pour révéler la beauté du cheveu et accompagner chaque routine capillaire.",
  solaire: "Nos essentiels solaires pour protéger, corriger et sublimer la peau avant, pendant et après l’exposition.",
  "bebe-maman": "Des soins doux et sûrs pour bébé et maman, pensés pour le confort, la toilette et les moments précieux.",
  "nature-bio": "Une sélection naturelle et bio inspirée des actifs végétaux, pour une routine plus pure et plus responsable.",
  "complements-alimentaires": "Vitamines, immunité, énergie et minceur : des compléments choisis pour soutenir vos objectifs bien-être.",
  orthopedie: "Une selection orthopedique pour le maintien, le confort articulaire et le bien-etre au quotidien.",
  hygiene: "Les indispensables d’hygiène du quotidien, avec des références fiables pour toute la famille.",
};

const categoryAccentMap: Record<string, { tab: string; panel: string; button: string }> = {
  visage: {
    tab: "bg-[#12b79a] text-white shadow-[0_10px_24px_rgba(18,183,154,0.22)]",
    panel: "from-[#4f3328]/15 via-[#8b5b45]/18 to-[#1b120f]/50",
    button: "bg-[#12b79a] hover:bg-[#0ea387]",
  },
  corps: {
    tab: "bg-[#b7658a] text-white shadow-[0_10px_24px_rgba(183,101,138,0.22)]",
    panel: "from-[#4f2837]/18 via-[#8d4b69]/18 to-[#140d11]/52",
    button: "bg-[#b7658a] hover:bg-[#a54f77]",
  },
  capillaire: {
    tab: "bg-[#6f62d7] text-white shadow-[0_10px_24px_rgba(111,98,215,0.24)]",
    panel: "from-[#312853]/18 via-[#5a4fb4]/18 to-[#130f24]/52",
    button: "bg-[#6f62d7] hover:bg-[#5f53c5]",
  },
  solaire: {
    tab: "bg-[#d38b12] text-white shadow-[0_10px_24px_rgba(211,139,18,0.24)]",
    panel: "from-[#5a3711]/18 via-[#a86a1f]/20 to-[#1d1206]/52",
    button: "bg-[#d38b12] hover:bg-[#bc7a09]",
  },
  "bebe-maman": {
    tab: "bg-[#199b8d] text-white shadow-[0_10px_24px_rgba(25,155,141,0.22)]",
    panel: "from-[#1a4e49]/18 via-[#2c8177]/20 to-[#101d1b]/52",
    button: "bg-[#199b8d] hover:bg-[#148779]",
  },
  "nature-bio": {
    tab: "bg-[#5d9a36] text-white shadow-[0_10px_24px_rgba(93,154,54,0.24)]",
    panel: "from-[#244118]/18 via-[#4f7b33]/20 to-[#10170b]/52",
    button: "bg-[#5d9a36] hover:bg-[#4f862c]",
  },
  "complements-alimentaires": {
    tab: "bg-[#3b6bcf] text-white shadow-[0_10px_24px_rgba(59,107,207,0.24)]",
    panel: "from-[#1c3358]/18 via-[#3157a5]/20 to-[#0d1220]/52",
    button: "bg-[#3b6bcf] hover:bg-[#2f5fbe]",
  },
  orthopedie: {
    tab: "bg-[#6c7f9f] text-white shadow-[0_10px_24px_rgba(108,127,159,0.22)]",
    panel: "from-[#2d3442]/18 via-[#5b6b87]/20 to-[#12161d]/52",
    button: "bg-[#6c7f9f] hover:bg-[#5a6d8d]",
  },
  hygiene: {
    tab: "bg-[#148f86] text-white shadow-[0_10px_24px_rgba(20,143,134,0.22)]",
    panel: "from-[#184844]/18 via-[#22776f]/20 to-[#0f1615]/52",
    button: "bg-[#148f86] hover:bg-[#0f7b73]",
  },
};

const categoryPriorityOrder = [
  "complements-alimentaires",
];

const CategoryShowcase = ({
  categories,
  products,
  onAddToCart,
  onOpenProduct,
  onSelectCategory,
}: CategoryShowcaseProps) => {
  const rootCategories = useMemo(
    () => categories.filter((category) => category.slug && category.name),
    [categories]
  );

  const productsByCategory = useMemo(() => {
    return rootCategories
      .map((category) => {
        const slugs = new Set(collectCategorySlugs(category));
        const items = products
          .filter((product) => {
            const assigned = String(product.web_category_slug || "").trim();
            return assigned ? slugs.has(assigned) : getProductCategorySlug(product) === category.slug;
          })
          .sort((a, b) => {
            const aHasImage = String(a.image_url || "").trim() ? 1 : 0;
            const bHasImage = String(b.image_url || "").trim() ? 1 : 0;
            return bHasImage - aHasImage;
          })
          .slice(0, 10);

        return { category, items };
      })
      .sort((a, b) => {
        const aPriority = categoryPriorityOrder.indexOf(a.category.slug);
        const bPriority = categoryPriorityOrder.indexOf(b.category.slug);

        if (aPriority !== -1 || bPriority !== -1) {
          if (aPriority === -1) return 1;
          if (bPriority === -1) return -1;
          return aPriority - bPriority;
        }

        return 0;
      });
  }, [products, rootCategories]);

  const [activeSlug, setActiveSlug] = useState("");

  useEffect(() => {
    if (!productsByCategory.length) {
      setActiveSlug("");
      return;
    }

    if (!productsByCategory.some((entry) => entry.category.slug === activeSlug)) {
      setActiveSlug(productsByCategory[0].category.slug);
    }
  }, [productsByCategory, activeSlug]);

  const activeEntry =
    productsByCategory.find((entry) => entry.category.slug === activeSlug) || productsByCategory[0];

  if (!activeEntry) return null;

  const activeCategory = activeEntry.category;
  const accent = categoryAccentMap[activeCategory.slug] || categoryAccentMap.visage;
  const categoryImage =
    String(activeCategory.image_url || "").trim() ||
    categoryFallbackImageMap[activeCategory.slug] ||
    visage;
  const categoryDescription =
    String(activeCategory.description || "").trim() ||
    categoryDescriptionMap[activeCategory.slug] ||
    "Retrouvez une sélection ciblée de produits avec un univers visuel dédié et des références choisies pour cette catégorie.";

  return (
    <section className="bg-white py-10 lg:py-14">
      <div className="container">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[#b48968]">Selection par univers</p>
            <h2 className="mt-2 font-display text-4xl text-[#20303d] md:text-5xl">
              Nos categories vedettes
            </h2>
          </div>
        </div>

        <div className="pb-1">
          <div className="grid grid-cols-2 border border-[#dfe6f3] bg-[linear-gradient(180deg,#eef3fb_0%,#e4edf9_100%)] shadow-[0_10px_24px_rgba(44,62,80,0.05)] sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
            {productsByCategory.map(({ category }) => {
              const isActive = category.slug === activeCategory.slug;
              const palette = categoryAccentMap[category.slug] || categoryAccentMap.visage;

              return (
                <button
                  key={category.slug}
                  type="button"
                  onClick={() => setActiveSlug(category.slug)}
                  className={`relative min-w-0 border-r border-b border-[#d7e0ef] px-2 py-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.01em] transition-colors last:border-r-0 sm:text-[0.7rem] lg:border-b-0 xl:px-3 xl:py-4 xl:text-[0.8rem] ${
                    isActive
                      ? palette.tab
                      : "bg-transparent text-[#24405d]"
                  }`}
                >
                  {category.name}
                  {isActive ? (
                    <span className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 rotate-45 bg-inherit" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-[305px_minmax(0,1fr)] xl:gap-5">
          <div className="relative overflow-hidden rounded-[0.35rem] min-h-[320px] shadow-[0_18px_34px_rgba(38,28,18,0.14)] sm:min-h-[420px] xl:min-h-[515px]">
            <img
              src={categoryImage}
              alt={activeCategory.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-b ${accent.panel}`} />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-6">
              <div className="max-w-[245px]">
                <p className="text-[0.72rem] font-medium uppercase tracking-[0.24em] text-white/80">
                  {activeCategory.name}
                </p>
                <h3 className="mt-3 font-display text-[1.65rem] leading-tight sm:text-[2rem]">
                  {activeCategory.name}
                </h3>
                <p className="mt-3 text-[0.82rem] leading-5 text-white/88 sm:text-[0.88rem] sm:leading-6">{categoryDescription}</p>
                <Button
                  type="button"
                  className={`mt-5 h-11 rounded-[0.28rem] px-5 text-[0.82rem] font-semibold uppercase tracking-[0.05em] text-white ${accent.button}`}
                  onClick={() => onSelectCategory(activeCategory.slug)}
                >
                  Tous les produits
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {activeEntry.items.length === 0 ? (
              <div className="col-span-full flex min-h-[200px] items-center justify-center rounded-[0.35rem] border border-dashed border-[#d7e0ef] bg-[#f8fafc] text-[0.9rem] text-[#64748b]">
                Aucun produit disponible dans cette categorie pour le moment.
              </div>
            ) : null}
            {activeEntry.items.map((product) => {
              const oldPrice = getProductOldPrice(product);
              const promoBadge = getProductPromoBadge(product);
              return (
                <article
                  key={product.id}
                  className="group flex h-full self-start flex-col overflow-hidden border border-[#ece6de] bg-white shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_16px_30px_rgba(15,23,42,0.12)]"
                >
                  <div className="relative flex h-[168px] items-center justify-center overflow-hidden border-b border-[#efe8df] bg-white p-3 sm:h-[188px]">
                    {promoBadge ? (
                      <span className="absolute right-2 top-2 z-10 rounded-[0.2rem] bg-[#e11d48] px-1.5 py-1 text-[0.82rem] font-bold text-white">
                        {promoBadge}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onOpenProduct(product)}
                      className="flex h-full w-full items-center justify-center"
                    >
                      <img
                        src={getProductImage(product)}
                        alt={product.designation}
                        className="max-h-[132px] max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.04] sm:max-h-[152px]"
                      />
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col space-y-1.5 bg-[linear-gradient(180deg,#fffdfa_0%,#f7f1ea_100%)] p-3">
                    <div className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#7f8b97]">
                      {getProductBrand(product)}
                    </div>
                    <button type="button" onClick={() => onOpenProduct(product)} className="text-left">
                      <h3 className="min-h-[54px] text-[0.82rem] font-medium leading-5 text-[#263646] line-clamp-3 sm:text-[0.9rem]">
                        {product.designation}
                      </h3>
                    </button>

                    <div className="min-h-[46px] space-y-0.5">
                      {oldPrice ? (
                        <div className="text-[0.8rem] font-medium tracking-[0.01em] text-[#98a3af] line-through decoration-[#98a3af] decoration-[1.5px]">
                          {formatMoney(oldPrice)}
                        </div>
                      ) : null}
                      <div className="font-price text-[1.08rem] leading-none text-[#d61f3a]">
                        {formatMoney(getProductWebPrice(product))}
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 text-[#f4b81d]">
                      {[0, 1, 2, 3, 4].map((index) => (
                        <Star key={index} className="h-3 w-3 fill-current" />
                      ))}
                    </div>

                    <div className="mt-auto grid grid-cols-2 items-stretch gap-2 pt-2">
                      <Button
                        variant="outline"
                        className="h-9 w-full rounded-[0.28rem] border-[#ccd6e0] px-2 text-[0.74rem] text-[#22303a] hover:bg-[#faf6f1] sm:text-[0.8rem]"
                        onClick={() => onOpenProduct(product)}
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Voir
                      </Button>
                      <Button
                        type="button"
                        className={`h-9 w-full min-w-0 rounded-[0.28rem] px-2 text-[0.74rem] text-white sm:text-[0.8rem] ${accent.button}`}
                        onClick={() => onAddToCart(product)}
                      >
                        <ShoppingBag className="mr-1.5 h-3.5 w-3.5" />
                        Panier
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoryShowcase;
