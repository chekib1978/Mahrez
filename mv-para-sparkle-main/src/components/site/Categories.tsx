import visage from "../../../cerave.jpg";
import corps from "../../../gommage.jpg";
import capillaire from "../../../capilaire.jpg";
import bebeMaman from "../../../bebe maman.jpg";
import complements from "@/assets/cat-complements.jpg";
import solaire from "../../../solaire.jpg";
import { ArrowUpRight } from "lucide-react";
import { WebCategory } from "@/lib/store-api";

type CategoriesProps = {
  categories: WebCategory[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  productCount: number;
};

const categoryVisuals: Record<string, string> = {
  visage,
  corps,
  capillaire,
  solaire,
  "bebe-maman": bebeMaman,
  "nature-bio": complements,
  "complements-alimentaires": complements,
  orthopedie: corps,
  hygiene: corps,
};

const fallbackVisuals = [visage, corps, capillaire, bebeMaman, complements];

const Categories = ({
  categories,
  activeCategory,
  onSelectCategory,
  productCount,
}: CategoriesProps) => {
  const items = categories.slice(0, 5).map((category, index) => ({
    title: category.name,
    slug: category.slug,
    count: `${productCount}+ produits`,
    img: categoryVisuals[category.slug] || fallbackVisuals[index % fallbackVisuals.length],
    span: index === 0 ? "lg:col-span-2 lg:row-span-2" : "",
  }));

  return (
    <section className="pt-8 pb-8 lg:pt-10 lg:pb-12">
      <div className="container">
        <div className="mb-7 flex items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-accent-deep">Univers</p>
            <h2 className="max-w-xl font-display text-4xl text-primary md:text-5xl">
              Nos categories phares
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onSelectCategory("all")}
            className="hidden items-center gap-2 text-sm font-medium text-primary transition-smooth hover:text-accent-deep md:inline-flex"
          >
            Voir tout <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onSelectCategory("all")}
            className={`rounded-full px-5 py-2.5 text-sm font-medium transition-smooth ${
              activeCategory === "all"
                ? "gradient-primary text-primary-foreground shadow-soft"
                : "bg-secondary text-foreground hover:bg-primary-soft"
            }`}
          >
            Tous les produits
          </button>
          {categories.map((category) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => onSelectCategory(category.slug)}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition-smooth ${
                activeCategory === category.slug
                  ? "gradient-primary text-primary-foreground shadow-soft"
                  : "bg-secondary text-foreground hover:bg-primary-soft"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:grid-rows-2 lg:gap-6 lg:h-[640px]">
          {items.map((category) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => onSelectCategory(category.slug)}
              className={`group relative overflow-hidden rounded-3xl text-left shadow-card transition-smooth hover:shadow-elegant ${category.span}`}
            >
              <img
                src={category.img}
                alt={category.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-spring group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/10 to-transparent" />
              <div className="relative flex h-full min-h-[200px] flex-col justify-end p-6 text-primary-foreground">
                <p className="mb-1 text-xs uppercase tracking-widest opacity-80">{category.count}</p>
                <h3 className="font-display text-2xl lg:text-3xl">{category.title}</h3>
                <span className="mt-3 inline-flex -translate-y-2 items-center gap-1 text-sm opacity-0 transition-smooth group-hover:translate-y-0 group-hover:opacity-100">
                  Decouvrir <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
