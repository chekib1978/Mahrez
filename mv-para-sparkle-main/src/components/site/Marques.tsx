const brands = [
  "La Roche-Posay", "Avène", "Bioderma", "Vichy", "Nuxe", "Caudalie",
  "Eucerin", "Ducray", "Klorane", "Mustela", "Uriage", "SVR",
];

const Marques = () => (
  <section className="py-16 border-y border-border bg-card overflow-hidden">
    <div className="container">
      <p className="text-center text-xs uppercase tracking-[0.3em] text-muted-foreground mb-8">
        Plus de 150 marques de confiance
      </p>
    </div>
    <div className="relative">
      <div className="flex animate-marquee gap-16 whitespace-nowrap">
        {[...brands, ...brands].map((b, i) => (
          <span key={i} className="font-display text-2xl md:text-3xl text-primary/40 hover:text-primary transition-smooth">
            {b}
          </span>
        ))}
      </div>
    </div>
  </section>
);

export default Marques;
