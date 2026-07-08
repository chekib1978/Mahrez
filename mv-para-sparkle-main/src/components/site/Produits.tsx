import { Eye, Heart, ShoppingBag, Star, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatMoney,
  getProductBrand,
  getProductCategory,
  getProductGalleryImages,
  getProductImage,
  getProductOldPrice,
  getProductPromoBadge,
  Product,
} from "@/lib/store-api";

type ProduitsProps = {
  products: Product[];
  loading?: boolean;
  onAddToCart: (product: Product) => void;
  onOpenProduct: (product: Product) => void;
};

type ProductDetailProps = {
  product: Product;
  onAddToCart: () => void;
  onBuyNow: () => void;
};

const ProduitsComponent = ({
  products,
  loading = false,
  onAddToCart,
  onOpenProduct,
}: ProduitsProps) => (
  <section id="catalogue" className="gradient-soft pt-2 pb-16 lg:pt-4 lg:pb-20">
    <div className="container">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-accent-deep">
          Selection
        </p>
        <h2 className="mb-4 font-display text-4xl text-primary md:text-5xl">
          Nos produits en ligne
        </h2>
        <p className="text-muted-foreground">
          Retrouvez une selection de soins et de produits essentiels, choisis pour repondre
          aux besoins du quotidien.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-5 lg:gap-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="h-[300px] rounded-[1.2rem] border border-border bg-card animate-pulse"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center text-muted-foreground">
          Aucun produit n'est disponible pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => {
            const oldPrice = getProductOldPrice(product);
            const promoBadge = getProductPromoBadge(product);

            return (
              <article
                key={product.id}
                className="group overflow-hidden rounded-[0.35rem] border border-[#e7e2db] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition-smooth hover:-translate-y-1 hover:border-[#d9b8a0] hover:shadow-[0_18px_36px_rgba(15,23,42,0.12),0_0_28px_rgba(226,179,145,0.22)]"
              >
                <div className="relative flex h-[168px] items-center justify-center overflow-hidden border-b border-[#ebe5dd] bg-white px-2.5 pb-2 pt-2.5 sm:h-[178px]">
                  <span className="absolute left-2.5 top-2.5 z-10 rounded-md bg-[#e7b690] px-2 py-1 text-[0.56rem] font-semibold uppercase tracking-[0.14em] text-white">
                    {getProductCategory(product)}
                  </span>
                  {promoBadge ? (
                    <span className="absolute right-2.5 top-2.5 z-10 rounded-[0.3rem] bg-[#e11d48] px-2 py-1 text-[0.7rem] font-bold text-white">
                      {promoBadge}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className="absolute right-2.5 bottom-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#eadfce] bg-white text-[#9299a1] transition-smooth hover:text-[#d48f74]"
                  >
                    <Heart className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenProduct(product)}
                    className="flex h-full w-full items-start justify-center pt-5 sm:pt-4"
                  >
                    <img
                      src={getProductImage(product)}
                      alt={product.designation}
                      loading="lazy"
                      className="max-h-[128px] max-w-full object-contain transition-spring group-hover:scale-[1.05] sm:max-h-[138px]"
                    />
                  </button>
                </div>

                <div className="space-y-1 rounded-t-[1.05rem] bg-[linear-gradient(180deg,#fffdfb_0%,#f8f2eb_100%)] px-2.5 pb-2.5 pt-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                  <button type="button" onClick={() => onOpenProduct(product)} className="text-left">
                    <h3 className="min-h-[38px] font-sans text-[0.86rem] font-medium leading-[1rem] text-[#233341] line-clamp-2">
                      {product.designation}
                    </h3>
                  </button>

                  <div className="space-y-0.5 pt-0">
                    {oldPrice ? (
                      <div className="text-[0.72rem] text-[#8b95a1] line-through">
                        {formatMoney(oldPrice)}
                      </div>
                    ) : null}
                    <div className="font-price text-[1.08rem] leading-none text-[#d72638]">
                      {formatMoney(product.prix_vente_ttc || 0)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="flex items-center gap-1 text-[#d4a186]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-2.5 w-2.5 fill-current" />
                      ))}
                      <span className="text-[0.74rem] text-[#0f9d6b]">Disponible</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <Button
                      variant="outline"
                      className="h-8 min-w-[78px] rounded-[0.35rem] border-[#cfd6df] bg-white px-2.5 text-[0.82rem] text-[#22303a] hover:bg-[#faf6f1]"
                      onClick={() => onOpenProduct(product)}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      Voir
                    </Button>
                    <Button
                      type="button"
                      className="h-8 min-w-[96px] rounded-[0.35rem] gradient-primary px-2.5 text-[0.82rem] shadow-[0_8px_20px_rgba(59,94,75,0.18)] transition-smooth group-hover:shadow-[0_10px_24px_rgba(59,94,75,0.28)]"
                      onClick={() => onAddToCart(product)}
                    >
                      <ShoppingBag className="mr-1 h-3.5 w-3.5" />
                      Panier
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  </section>
);

const ProductDetail = ({ product, onAddToCart, onBuyNow }: ProductDetailProps) => {
  const description =
    String(product.description_web || "").trim() ||
    `${product.designation} fait partie de notre selection parapharmacie premium, pensee pour accompagner votre routine bien-etre avec qualite et confiance.`;
  const gallery = getProductGalleryImages(product);
  const brand = getProductBrand(product);

  return (
    <div className="bg-white">
      <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border-b border-[#efe7de] bg-white p-6 lg:border-b-0 lg:border-r lg:p-8">
          <div className="grid gap-4 lg:grid-cols-[92px_minmax(0,1fr)]">
            <div className="hidden flex-col gap-3 lg:flex">
              {gallery.slice(0, 2).map((image, thumb) => (
                <div
                  key={`${image}-${thumb}`}
                  className="flex h-[92px] w-[92px] items-center justify-center rounded-2xl border border-[#e8ddd0] bg-[#fffdfb] p-2"
                >
                  <img
                    src={image}
                    alt={product.designation}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ))}
            </div>

            <div className="relative flex min-h-[420px] items-center justify-center rounded-[2rem] bg-[#fffdfb] p-6">
              <span className="absolute left-5 top-5 rounded-full bg-[#e2b391] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                {getProductCategory(product)}
              </span>
              <span className="absolute right-5 top-5 rounded-full border border-[#ece4da] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f6b5a]">
                {brand}
              </span>
              <img
                src={gallery[0] || getProductImage(product)}
                alt={product.designation}
                className="max-h-[460px] max-w-full object-contain"
              />
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-8">
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-6">
            <div className="min-w-0">
              <h2 className="text-4xl font-semibold uppercase tracking-tight text-[#1f2937]">
                {product.designation}
              </h2>
              <div className="mt-3 h-[2px] w-32 bg-[#ea8f61]" />
            </div>
            <div className="w-full sm:max-w-[210px] lg:justify-self-end">
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8b6b57]">Disponibilite</div>
              <div className="text-[13px] font-semibold leading-snug text-[#15803d]">
                Disponible a la commande
              </div>
              <div className="mt-2 text-[12px] text-[#7c6b5d]">
                Ref. <span className="font-semibold text-[#1f2937]">{product.code_article}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="space-y-3">
              <div className="font-price text-[3rem] leading-none text-[#c61e2d]">
                {formatMoney(product.prix_vente_ttc || 0)}
              </div>
              <div className="text-xl text-[#64748b]">
                Prix hors taxes : {formatMoney(product.prix_vente_ht || 0)}
              </div>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-[#efe7de] bg-[#fcfaf7] p-5">
              <div className="text-lg font-semibold text-[#12a05c]">
                DISPONIBLE A LA COMMANDE
              </div>
              <div className="space-y-1 text-[1.05rem] text-[#1f2937]">
                <div>Modele : {getProductCategory(product)}</div>
                <div>MPN : {product.code_barre || product.code_article}</div>
                <div>Reference : {product.code_article}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[92px_1fr_1fr]">
            <div className="flex h-14 items-center justify-center rounded-xl border border-[#d8dee6] bg-white text-lg font-medium text-[#22303a]">
              1
            </div>
            <Button
              className="h-14 rounded-xl bg-[#13b07a] text-base font-semibold uppercase tracking-wide text-white hover:bg-[#0f9d6b]"
              onClick={onAddToCart}
            >
              <ShoppingBag className="mr-3 h-5 w-5" />
              Ajouter au panier
            </Button>
            <Button
              className="h-14 rounded-xl bg-[#0f9d6b] text-base font-semibold uppercase tracking-wide text-white hover:bg-[#0b8a5d]"
              onClick={onBuyNow}
            >
              Acheter maintenant
            </Button>
          </div>

          <div className="mt-7 flex items-center gap-2 text-[#d4a186]">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-current" />
            ))}
            <span className="ml-2 text-base text-[#64748b]">Commande en ligne disponible</span>
          </div>

          <div className="mt-7 rounded-[1.5rem] bg-[#f6f8fb] p-5">
            <div className="flex items-start gap-3">
              <Truck className="mt-1 h-6 w-6 text-[#13b07a]" />
              <div>
                <p className="text-2xl font-medium text-[#1f2937]">
                  Livraison a domicile offerte des 99,000 TND d'achats dans toute la Tunisie.
                </p>
                <p className="mt-2 text-xl text-[#13b07a]">
                  Voir les informations et delais de livraison
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-[#e4ebf2]">
            <div className="flex border-b border-[#dce5ef] bg-[#eef3fb]">
              <div className="relative bg-[#0fb07b] px-8 py-4 text-lg font-semibold uppercase text-white">
                Description
                <span className="absolute left-1/2 top-full h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#0fb07b]" />
              </div>
              <div className="px-8 py-4 text-lg font-semibold uppercase text-[#22303a]">Avis</div>
            </div>
            <div className="space-y-5 bg-white p-7">
              <h3 className="text-[2rem] font-semibold uppercase text-[#1f2937]">
                {product.designation}
              </h3>
              <div className="space-y-4 text-[1.08rem] leading-8 text-[#475569]">
                {description
                  .split(/\n+/)
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type ProduitsComponentType = typeof ProduitsComponent & {
  ProductDetail: typeof ProductDetail;
};

const Produits = ProduitsComponent as ProduitsComponentType;
Produits.ProductDetail = ProductDetail;

export default Produits;
