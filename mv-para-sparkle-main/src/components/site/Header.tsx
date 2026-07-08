import { useEffect, useMemo, useState } from "react";
import { Heart, MapPin, Menu, Phone, Search, ShoppingBag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import bebe from "@/assets/cat-bebe.jpg";
import cheveux from "@/assets/cat-cheveux.jpg";
import complements from "@/assets/cat-complements.jpg";
import corps from "@/assets/cat-corps.jpg";
import visage from "@/assets/cat-visage.jpg";
import logo from "@/assets/logo.png";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import heroMv from "@/assets/hero-mvpara.jpg";
import { collectCategorySlugs, CompanySettings, getProductBrand, Product, WebCategory } from "@/lib/store-api";

type HeaderProps = {
  query: string;
  onQueryChange: (value: string) => void;
  searchSuggestions: Product[];
  onSelectSearchProduct: (product: Product) => void;
  isAuthenticated: boolean;
  accountLabel?: string;
  onOpenAccount: () => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenTracking: () => void;
  onSelectCategory: (value: string) => void;
  categoryTree: WebCategory[];
  activeCategory: string;
  companySettings?: CompanySettings | null;
};

const Header = ({
  query,
  onQueryChange,
  searchSuggestions,
  onSelectSearchProduct,
  isAuthenticated,
  accountLabel,
  onOpenAccount,
  cartCount,
  onOpenCart,
  onOpenTracking,
  onSelectCategory,
  categoryTree,
  activeCategory,
  companySettings,
}: HeaderProps) => {
  const [openMegaMenu, setOpenMegaMenu] = useState<string | null>(null);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(0);
  const addressLine = [companySettings?.address, companySettings?.city].filter(Boolean).join(", ");
  const phoneLine = companySettings?.phone || companySettings?.mobile || "";

  const visibleRootCategories = useMemo(
    () => categoryTree.filter((category) => category.slug && category.name),
    [categoryTree]
  );

  useEffect(() => {
    setHighlightedSuggestionIndex(0);
  }, [query, searchSuggestions.length]);

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="bg-primary text-xs text-primary-foreground">
        <div className="container flex min-h-9 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-1">
          <p className="hidden tracking-wide sm:block">
            Livraison <span className="text-accent">offerte</span> des 150 DT - Conseil
            pharmaceutique 7j/7
          </p>
          <div className="flex items-center gap-4 sm:gap-5">
            <a
              href="#checkout"
              onClick={(event) => {
                event.preventDefault();
                onOpenCart();
              }}
              className="transition-smooth hover:text-accent"
            >
              Mon panier
            </a>
            <a
              href="#tracking"
              onClick={(event) => {
                event.preventDefault();
                onOpenTracking();
              }}
              className="transition-smooth hover:text-accent"
            >
              Suivi commande
            </a>
          </div>
        </div>
      </div>

      <div className="border-b border-border bg-background/95 shadow-soft backdrop-blur-md">
        <div className="container flex flex-wrap items-center justify-between gap-4 py-3 md:h-20 md:flex-nowrap md:gap-6 md:py-0">
          <a href="/" className="flex min-w-0 items-center gap-2 leading-none">
            <img
              src={logo}
              alt="PARA MV"
              className="h-14 w-auto object-contain sm:h-16 md:h-[4.5rem]"
            />
          </a>

          <div className="hidden flex-1 items-center gap-3 md:flex">
            <div className="max-w-lg flex-1">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (!searchSuggestions.length) return;

                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setHighlightedSuggestionIndex((current) =>
                        Math.min(current + 1, searchSuggestions.length - 1)
                      );
                    }

                    if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setHighlightedSuggestionIndex((current) => Math.max(current - 1, 0));
                    }

                    if (event.key === "Enter") {
                      event.preventDefault();
                      onSelectSearchProduct(
                        searchSuggestions[Math.min(highlightedSuggestionIndex, searchSuggestions.length - 1)]
                      );
                    }
                  }}
                  placeholder="Rechercher un produit, une marque..."
                  className="h-11 w-full rounded-full border-2 border-primary bg-white pl-11 pr-4 text-sm outline-none transition-smooth focus:border-primary/30 focus:bg-background"
                />
                {query.trim() && searchSuggestions.length ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.55rem)] z-50 overflow-hidden rounded-[1.4rem] border border-[#ece3d8] bg-[#fffdf9] shadow-[0_22px_48px_rgba(15,23,42,0.10)]">
                    {searchSuggestions.map((product, index) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => onSelectSearchProduct(product)}
                        className={`flex w-full items-center justify-between gap-4 border-b border-[#f2eadf] px-4 py-3 text-left last:border-b-0 ${
                          index === highlightedSuggestionIndex ? "bg-[#f8f3ec]" : "bg-transparent hover:bg-[#fbf7f2]"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-[#22303a]">
                            {product.designation}
                          </div>
                          <div className="truncate text-xs text-[#7a8793]">
                            {product.code_article} - {getProductBrand(product)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            {(phoneLine || addressLine) ? (
              <div className="hidden max-w-[520px] items-center gap-5 rounded-[1.1rem] border border-[#ece3d8] bg-[#fffdf9] px-4 py-2.5 text-xs text-[#52606d] lg:flex lg:flex-nowrap">
                {phoneLine ? (
                  <div className="flex shrink-0 items-center gap-2 font-semibold text-[#22303a]">
                    <Phone className="h-3.5 w-3.5 text-[#15796e]" />
                    <span>{phoneLine}</span>
                  </div>
                ) : null}
                {addressLine ? (
                  <div className="flex min-w-0 items-center gap-2 leading-5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-[#b86c06]" />
                    <span className="truncate">{addressLine}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              className={`relative rounded-full px-3 ${isAuthenticated ? "text-[#15796e]" : ""}`}
              onClick={onOpenAccount}
            >
              <User className="h-5 w-5" />
              {isAuthenticated ? (
                <>
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#19b47c] ring-2 ring-white" />
                  <span className="ml-2 hidden max-w-[118px] truncate text-xs font-semibold sm:inline-block">
                    {accountLabel || "Mon compte"}
                  </span>
                </>
              ) : null}
            </Button>
            <Button variant="ghost" size="icon" className="hidden rounded-full sm:inline-flex">
              <Heart className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full"
              onClick={onOpenCart}
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="gradient-gold absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-white shadow-soft">
                {cartCount}
              </span>
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <div className="w-full md:hidden">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                onKeyDown={(event) => {
                  if (!searchSuggestions.length) return;

                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setHighlightedSuggestionIndex((current) =>
                      Math.min(current + 1, searchSuggestions.length - 1)
                    );
                  }

                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setHighlightedSuggestionIndex((current) => Math.max(current - 1, 0));
                  }

                  if (event.key === "Enter") {
                    event.preventDefault();
                    onSelectSearchProduct(
                      searchSuggestions[Math.min(highlightedSuggestionIndex, searchSuggestions.length - 1)]
                    );
                  }
                }}
                placeholder="Rechercher un produit..."
                className="h-11 w-full rounded-full border-2 border-primary bg-white pl-11 pr-4 text-sm outline-none transition-smooth focus:border-primary/30 focus:bg-background"
              />
              {query.trim() && searchSuggestions.length ? (
                <div className="absolute left-0 right-0 top-[calc(100%+0.55rem)] z-50 overflow-hidden rounded-[1.2rem] border border-[#ece3d8] bg-[#fffdf9] shadow-[0_22px_48px_rgba(15,23,42,0.10)]">
                  {searchSuggestions.map((product, index) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => onSelectSearchProduct(product)}
                      className={`flex w-full items-center justify-between gap-4 border-b border-[#f2eadf] px-4 py-3 text-left last:border-b-0 ${
                        index === highlightedSuggestionIndex ? "bg-[#f8f3ec]" : "bg-transparent"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[#22303a]">
                          {product.designation}
                        </div>
                        <div className="truncate text-xs text-[#7a8793]">
                          {product.code_article} - {getProductBrand(product)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <nav
          className="hidden border-t border-[#dfd2c4] bg-[linear-gradient(180deg,#fffdfa_0%,#f0e9e0_100%)] md:block"
          onMouseLeave={() => setOpenMegaMenu(null)}
        >
          <div className="container relative">
            <ul className="flex h-[64px] items-center justify-center gap-1 text-[0.86rem] xl:gap-2">
              {visibleRootCategories.map((item, index) => {
                const isActive = collectCategorySlugs(item).includes(activeCategory);
                const accent = getMenuAccent(item.slug);

                return (
                  <li key={item.slug} className="relative flex h-full items-center pr-1 last:pr-0 xl:pr-2">
                    {index < visibleRootCategories.length - 1 ? (
                      <span className="pointer-events-none absolute right-0 top-1/2 h-6 w-px -translate-y-1/2 bg-[linear-gradient(180deg,rgba(191,167,144,0)_0%,rgba(191,167,144,0.75)_22%,rgba(223,205,190,0.95)_50%,rgba(191,167,144,0.75)_78%,rgba(191,167,144,0)_100%)]" />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCategory(item.slug);
                        setOpenMegaMenu(null);
                      }}
                      onMouseEnter={() => setOpenMegaMenu(item.slug)}
                      style={{
                        color: accent.text,
                        ["--menu-accent" as string]: accent.line,
                        ["--menu-accent-soft" as string]: accent.soft,
                        ["--menu-accent-shadow" as string]: accent.shadow,
                      }}
                      className={`relative overflow-hidden border px-3 py-2 font-semibold tracking-[0.025em] uppercase transition-all duration-300 before:absolute before:inset-x-[14%] before:top-[4px] before:h-[1px] before:bg-[linear-gradient(90deg,transparent,var(--menu-accent),transparent)] before:content-[''] after:absolute after:bottom-[-8px] after:left-1/2 after:h-[2px] after:-translate-x-1/2 after:bg-[var(--menu-accent)] after:content-[''] after:transition-all ${
                        isActive
                          ? "translate-y-[-1px] border-[rgba(0,0,0,0.07)] bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(255,255,255,0.98)_18%,rgba(255,255,255,0.92)_44%,var(--menu-accent-soft)_100%)] text-[#101827] shadow-[0_16px_30px_var(--menu-accent-shadow),inset_0_1px_0_rgba(255,255,255,0.9)] before:opacity-100 after:h-[3px] after:w-[calc(100%-1.65rem)]"
                          : "border-transparent bg-transparent shadow-none before:opacity-0 after:w-0"
                      }`}
                      onMouseOver={(event) => {
                        event.currentTarget.style.setProperty("--menu-accent", accent.line);
                        event.currentTarget.style.setProperty("--menu-accent-soft", accent.soft);
                        event.currentTarget.style.setProperty("--menu-accent-shadow", accent.shadow);
                      }}
                    >
                      {item.name}
                    </button>
                  </li>
                );
              })}
            </ul>

            {visibleRootCategories.map((rootCategory) =>
              openMegaMenu === rootCategory.slug && (rootCategory.children || []).length ? (
                <div
                  key={rootCategory.slug}
                  className="absolute left-0 right-0 top-full z-50 pt-3"
                  onMouseEnter={() => setOpenMegaMenu(rootCategory.slug)}
                >
                  <div className="rounded-[1.55rem] border border-[#eee6dd] bg-[#fffdf9] p-6 shadow-[0_22px_48px_rgba(15,23,42,0.08)]">
                    <div className="mb-5 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.28em] text-[#b28a6c]">
                          Univers
                        </p>
                        <h3 className="mt-2 font-display text-[2rem] text-[#101827]">
                          {rootCategory.name}
                        </h3>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full border-[#e1d8cd] px-5 text-[#22303a] hover:bg-[#fbf8f4]"
                        onClick={() => {
                          onSelectCategory(rootCategory.slug);
                          setOpenMegaMenu(null);
                        }}
                      >
                        Voir toute la categorie
                      </Button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {(rootCategory.children || []).map((section) => (
                        <div key={section.slug} className="space-y-4">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectCategory(section.slug);
                              setOpenMegaMenu(null);
                            }}
                            className="text-left"
                          >
                            <h4 className="text-[0.95rem] font-semibold uppercase tracking-[0.03em] text-[#111827]">
                              {section.name}
                            </h4>
                          </button>

                          <div className="flex gap-4">
                            <img
                              src={getMenuImage(section.slug)}
                              alt={section.name}
                              className="h-[92px] w-[118px] rounded-[1rem] object-cover shadow-[0_10px_22px_rgba(15,23,42,0.07)]"
                            />
                            <div className="space-y-1.5">
                              {(section.children || []).map((leaf) => (
                                <button
                                  key={leaf.slug}
                                  type="button"
                                  onClick={() => {
                                    onSelectCategory(leaf.slug);
                                    setOpenMegaMenu(null);
                                  }}
                                  className="block text-left text-[0.88rem] leading-6 text-[#5a6773] transition-smooth hover:text-[#111827]"
                                >
                                  {leaf.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

function getMenuAccent(slug: string) {
  const key = slug.toLowerCase();
  if (/visage/.test(key)) return { text: "#a04e2b", line: "#d97c52", soft: "rgba(217,124,82,0.18)", shadow: "rgba(160,78,43,0.22)" };
  if (/corps/.test(key)) return { text: "#934b67", line: "#cf7f9c", soft: "rgba(207,127,156,0.18)", shadow: "rgba(147,75,103,0.22)" };
  if (/(capillaire|cheveux)/.test(key)) return { text: "#5e4ca7", line: "#8f7be0", soft: "rgba(143,123,224,0.19)", shadow: "rgba(94,76,167,0.24)" };
  if (/solaire/.test(key)) return { text: "#b86c06", line: "#f0ad2e", soft: "rgba(240,173,46,0.2)", shadow: "rgba(184,108,6,0.24)" };
  if (/(bebe|maman)/.test(key)) return { text: "#15796e", line: "#42b8aa", soft: "rgba(66,184,170,0.19)", shadow: "rgba(21,121,110,0.23)" };
  if (/(bio|nature)/.test(key)) return { text: "#427529", line: "#6eb14f", soft: "rgba(110,177,79,0.19)", shadow: "rgba(66,117,41,0.23)" };
  if (/complement/.test(key)) return { text: "#2d5399", line: "#5e93ee", soft: "rgba(94,147,238,0.19)", shadow: "rgba(45,83,153,0.24)" };
  if (/orthoped/.test(key)) return { text: "#51627a", line: "#7f96b8", soft: "rgba(127,150,184,0.18)", shadow: "rgba(81,98,122,0.22)" };
  if (/hygiene/.test(key)) return { text: "#116f66", line: "#35b1a5", soft: "rgba(53,177,165,0.19)", shadow: "rgba(17,111,102,0.23)" };
  return { text: "#a85f39", line: "#df8f61", soft: "rgba(223,143,97,0.18)", shadow: "rgba(168,95,57,0.22)" };
}

function getMenuImage(slug: string) {
  const key = slug.toLowerCase();
  const exactImageMap: Record<string, string> = {
    "visage-nettoyant-demaquillant": product1,
    "lait-demaquillant": product1,
    "visage-lotion": product1,
    "gel-lavant": product1,
    "eau-micellaire": product1,
    "eaux-thermales": product1,
    "moussant-visage": product1,
    "masque-visage": product1,
    "gommage-visage": product1,
    "pains-nettoyants": product1,
    "visage-soin-anti-age": product2,
    "serum-anti-age": product2,
    "creme-premieres-rides": product2,
    "creme-anti-rides-peau-seche": product2,
    "creme-anti-rides-peau-grasse": product2,
    "soin-liftant": product2,
    "fermete-peau-mature": product2,
    "visage-hydratation-nutrition": product3,
    "masque-visage-hydratant": product3,
    "creme-hydratante-peau-normale-mixte": product3,
    "creme-hydratante-peau-seche": product3,
    "creme-hydratante-peau-grasse": product3,
    "creme-hydratante-peau-sensible": product3,
    "creme-de-nuit": product3,
    "pains-hydratants": product3,
    "visage-peaux-mixtes-grasses-acne": product4,
    "nettoyant-purifiant": product4,
    "lotion-acne": product4,
    "creme-soin-traitant": product4,
    "traitant-matin-soir": product4,
    "concentre-imperfections": product4,
    "maquillage-fluide": product4,
    "pains-acne": product4,
    "visage-peaux-sensibles-rougeurs": heroMv,
    "nettoyant-peaux-sensibles": heroMv,
    "masques-apaisants": heroMv,
    "lotion-apaisante": heroMv,
    "creme-peaux-sensibles": heroMv,
    "anti-rougeurs": heroMv,
    "visage-cicatrices": heroMv,
    "creme-cicatrisante": heroMv,
    "visage-anti-tache-depigmentant": product4,
    "anti-tache-serums": product4,
    "cremes-anti-taches": product4,
    "ecran-solaire-anti-taches": product4,
    "pains-unifiants": product4,
    "visage-eclat-du-teint": product4,
    "bb-creme": product4,
    "cc-creme": product4,
    "eclat-du-teint-anti-fatigue": product4,
    "visage-yeux": heroMv,
    "yeux-maquillage": heroMv,
    "anti-cernes-anti-poches": heroMv,
    "contour-des-yeux": heroMv,
    "visage-levres": heroMv,
    "hydratation-levres": heroMv,
    "stick-solaire-levres": heroMv,
    "baume-reparateur-levres": heroMv,
    "corps-hydratation": corps,
    "corps-soins-cibles": corps,
    "corps-hygiene": corps,
    "capillaire-shampooings": cheveux,
    "capillaire-soins": cheveux,
    "capillaire-coloration": cheveux,
    "solaire-protection": visage,
    "solaire-apres-soleil": visage,
    "bebe-maman-toilette": bebe,
    "bebe-maman-soins": bebe,
    "nature-bio-visage": complements,
    "nature-bio-corps": complements,
    "nature-bio-complements": complements,
    "complements-vitamines": complements,
    "complements-minceur": complements,
    "complements-immunite": complements,
    "orthopedie-maintien-posture": corps,
    "ceintures-lombaires": corps,
    "genouilleres": corps,
    "chevillieres": corps,
    "orthopedie-mobilite-confort": corps,
    attelles: corps,
    "bas-contention": corps,
    "poignets-coudieres": corps,
    "orthopedie-podologie": corps,
    semelles: corps,
    talonnieres: corps,
    "correcteurs-orteils": corps,
    "hygiene-quotidienne": corps,
    "hygiene-bucco": corps,
  };

  if (exactImageMap[key]) return exactImageMap[key];

  if (/(nettoyant|demaquillant|micellaire|lotion|moussant|gel-lavant|pains-nettoyants)/.test(key)) return product1;
  if (/(anti-age|rides|lift|fermete|mature|serum-anti-age)/.test(key)) return product2;
  if (/(hydrat|nutrition|creme-de-nuit|masque-visage-hydratant|peau-seche|peau-sensible)/.test(key)) return product3;
  if (/(acne|imperfections|purifiant|traitant|anti-tache|depigmentant|eclat|bb-creme|cc-creme)/.test(key)) return product4;
  if (/(yeux|levres|cicatrice|anti-rougeurs)/.test(key)) return heroMv;
  if (/(bebe|maman)/.test(key)) return bebe;
  if (/(capillaire|cheveux)/.test(key)) return cheveux;
  if (/(bio|nature|complement|vitamine)/.test(key)) return complements;
  if (/(corps|orthoped|hygiene)/.test(key)) return corps;
  return visage;
}

export default Header;
