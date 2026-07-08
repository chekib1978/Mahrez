import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

const Newsletter = () => (
  <section className="py-20 bg-accent-soft/60">
    <div className="container max-w-3xl text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full gradient-gold text-white shadow-gold mb-6">
        <Mail className="h-6 w-6" />
      </div>
      <h2 className="font-display text-4xl md:text-5xl text-primary mb-4">Restez dans la confidence</h2>
      <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
        Inscrivez-vous à notre newsletter et bénéficiez de <span className="text-accent-deep font-medium">-10%</span> sur votre première commande, conseils exclusifs et avant-premières.
      </p>
      <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input
          type="email"
          placeholder="votre@email.com"
          className="flex-1 h-12 px-5 rounded-full bg-background border border-border focus:border-primary outline-none transition-smooth text-sm"
        />
        <Button type="submit" className="gradient-primary text-primary-foreground rounded-full h-12 px-7 hover:opacity-90">
          S'inscrire
        </Button>
      </form>
    </div>
  </section>
);

export default Newsletter;
