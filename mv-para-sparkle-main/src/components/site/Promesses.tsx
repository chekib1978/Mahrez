import { Truck, ShieldCheck, HeartHandshake, Sparkles } from "lucide-react";

const items = [
  { icon: Truck, title: "Livraison rapide", desc: "Partout en Tunisie en 24-48h" },
  { icon: ShieldCheck, title: "100% authentique", desc: "Produits certifiés d'origine" },
  { icon: HeartHandshake, title: "Conseil pharmacien", desc: "À votre écoute 7j/7" },
  { icon: Sparkles, title: "Paiement sécurisé", desc: "À la livraison ou en ligne" },
];

const Promesses = () => (
  <section className="border-y border-border bg-card">
    <div className="container grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
      {items.map(({ icon: Icon, title, desc }) => (
        <div key={title} className="flex items-center gap-4 px-4 py-4">
          <div className="h-11 w-11 rounded-full bg-primary-soft flex items-center justify-center text-primary shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-sm text-foreground">{title}</div>
            <div className="text-xs text-muted-foreground">{desc}</div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default Promesses;
