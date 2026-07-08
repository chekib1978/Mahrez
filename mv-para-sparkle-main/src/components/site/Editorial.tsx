import { ArrowRight } from "lucide-react";
import articleOne from "../../../1.jpg";
import articleTwo from "../../../2.jpg";
import articleThree from "../../../3.jpg";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const editorialCards = [
  {
    image: articleOne,
    title: "Quel ecran solaire ISDIN Fusion Water choisir ?",
    excerpt:
      "Invisible, glow, teinte ou anti-age : trouvez la texture solaire qui correspond vraiment a votre peau et a votre routine.",
    description:
      "La gamme ISDIN Fusion Water se distingue par ses textures legeres, son fini confortable et sa protection quotidienne. Si vous cherchez un rendu invisible, une touche d'eclat, une correction teintee ou une approche anti-age, chaque version repond a un besoin different sans alourdir la peau.",
    details:
      "Dans ce guide, l'objectif est de vous aider a choisir plus vite selon votre type de peau, votre mode de vie et le resultat souhaite. Le bon solaire n'est pas seulement une protection : c'est aussi un geste de confort et de confiance au quotidien.",
    accent: "Protection solaire",
  },
  {
    image: articleTwo,
    title: "Ete leger : solutions pour combattre la retention d'eau",
    excerpt:
      "Quand les jambes semblent plus lourdes et la silhouette moins confortable, quelques gestes et soins bien choisis peuvent faire la difference.",
    description:
      "La sensation de jambes lourdes ou de retention d'eau s'intensifie souvent avec la chaleur, le rythme de la journee et la fatigue. Associer une routine de drainage doux, une hydratation adaptee et des soins ciblés permet de retrouver plus de confort au quotidien.",
    details:
      "Cette selection met l'accent sur des solutions simples : textures legeres, application agreable et sensations de fraicheur. L'idee n'est pas de promettre l'impossible, mais d'apporter un vrai mieux-etre visible dans la routine.",
    accent: "Confort & silhouette",
  },
  {
    image: articleThree,
    title: "Le gel de silicone : un geste expert pour les cicatrices",
    excerpt:
      "Discret, souple et facile a integrer dans la routine, le gel de silicone accompagne la peau dans une demarche de soin plus precise.",
    description:
      "Le gel de silicone est souvent recommande pour prendre soin de l'apparence des cicatrices anciennes ou recentes. Sa texture forme un film protecteur souple qui aide a maintenir une hydratation adaptee et a soutenir une routine plus reguliere.",
    details:
      "Dans un usage quotidien, l'interet est autant dans la constance que dans le produit lui-meme. Bien choisi et bien applique, ce type de soin s'integre facilement dans une routine elegante, simple et rassurante.",
    accent: "Soin reparateur",
  },
];

const Editorial = () => (
  <section className="relative overflow-hidden py-14 lg:py-18">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,202,177,0.24),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(171,221,211,0.22),transparent_30%)]" />
    <div className="container">
      <div className="mb-10 flex flex-col items-start gap-3">
        <span className="text-sm font-medium uppercase tracking-[0.24em] text-accent-deep">
          Conseils & inspiration
        </span>
        <h2 className="font-display text-4xl text-primary md:text-5xl">
          Trois lectures pour mieux choisir vos soins
        </h2>
        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
          Des contenus courts, visuels et utiles pour mieux comprendre les textures, les usages et les routines qui vous correspondent.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {editorialCards.map((card) => (
          <Dialog key={card.title}>
            <article className="group relative overflow-hidden rounded-[1.6rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,248,243,0.96))] shadow-[0_20px_55px_rgba(15,23,42,0.08)] backdrop-blur-sm transition-smooth hover:-translate-y-1.5 hover:border-[#f0cdb7] hover:shadow-[0_28px_70px_rgba(15,23,42,0.12),0_0_38px_rgba(239,197,170,0.26)]">
              <div className="pointer-events-none absolute inset-x-10 top-0 h-24 rounded-full bg-[radial-gradient(circle,rgba(255,214,191,0.36),transparent_72%)] opacity-0 blur-2xl transition duration-500 group-hover:opacity-100" />
              <div className="relative h-[255px] overflow-hidden bg-[#faf6f1]">
                <img
                  src={card.image}
                  alt={card.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#101828]/38 via-transparent to-transparent opacity-80" />
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/22 to-transparent" />
              </div>

              <div className="relative space-y-4 px-6 pb-6 pt-5">
                <span className="inline-flex rounded-full border border-[#f3d8c7] bg-white/80 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#b46f53] shadow-[0_8px_22px_rgba(180,111,83,0.10)]">
                  {card.accent}
                </span>
                <h3 className="font-display text-[2rem] leading-[2.1rem] text-[#8f4d62] line-clamp-2 transition-colors group-hover:text-[#7d4058]">
                  {card.title}
                </h3>
                <p className="text-[1rem] leading-7 text-[#5b6470] line-clamp-4">{card.excerpt}</p>

                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-[#ead9cb] bg-white px-4 py-2 text-[0.96rem] font-medium text-[#435b74] shadow-[0_10px_24px_rgba(67,91,116,0.08)] transition hover:border-[#efc6ac] hover:text-[#b46f53] hover:shadow-[0_14px_30px_rgba(180,111,83,0.14)]"
                  >
                    En savoir plus
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </DialogTrigger>
              </div>
            </article>

            <DialogContent className="max-w-4xl overflow-hidden rounded-[2rem] border-none bg-[#fffaf6] p-0 shadow-[0_30px_80px_rgba(15,23,42,0.22),0_0_42px_rgba(239,197,170,0.22)]">
              <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
                <div className="relative min-h-[260px] bg-[#f8f1ea] lg:min-h-[520px]">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/35 via-transparent to-transparent" />
                </div>

                <div className="p-7 lg:p-10">
                  <DialogHeader className="space-y-4 text-left">
                    <span className="inline-flex w-fit rounded-full bg-[#f3e3d8] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#b46f53]">
                      {card.accent}
                    </span>
                    <DialogTitle className="font-display text-4xl leading-tight text-[#7e465b]">
                      {card.title}
                    </DialogTitle>
                    <DialogDescription className="text-base leading-8 text-[#5c6672]">
                      {card.description}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-6 h-px w-full bg-[#eadfd6]" />

                  <p className="mt-6 text-[1rem] leading-8 text-[#46515d]">{card.details}</p>

                  <div className="mt-8 rounded-[1.5rem] border border-[#ecdfd4] bg-white/80 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b46f53]">
                      Notre suggestion
                    </p>
                    <p className="mt-3 text-[1rem] leading-7 text-[#59636f]">
                      Associez toujours vos soins a une routine simple, reguliere et adaptee a votre confort. Un bon produit fonctionne encore mieux quand son usage reste clair, agreable et facile a maintenir dans le temps.
                    </p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  </section>
);

export default Editorial;
