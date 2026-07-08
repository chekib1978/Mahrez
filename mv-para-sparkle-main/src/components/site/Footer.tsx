import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { CompanySettings } from "@/lib/store-api";

type FooterProps = {
  companySettings?: CompanySettings | null;
};

const Footer = ({ companySettings }: FooterProps) => {
  const addressLine = [companySettings?.address, companySettings?.city].filter(Boolean).join(", ");
  const phoneLine = companySettings?.phone || companySettings?.mobile || "+216 70 000 000";
  const emailLine = companySettings?.email || "contact@mvpara.tn";

  return (
  <footer className="bg-primary text-primary-foreground">
    <div className="container grid gap-10 py-16 lg:grid-cols-4">
      <div className="space-y-5 lg:col-span-1">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-3xl font-semibold">MV</span>
          <span className="font-display text-3xl font-light text-accent">PARA</span>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-primary-foreground/70">
          Votre parapharmacie en ligne premium, avec une selection soignee de produits
          bien-etre et beaute pour toute la famille.
        </p>
        <div className="flex gap-3">
          {[Facebook, Instagram].map((Icon, i) => (
            <a
              key={i}
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-primary-foreground/20 transition-smooth hover:border-accent hover:bg-accent hover:text-accent-foreground"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>

      {[
        { title: "Boutique", links: ["Visage", "Corps", "Cheveux", "Bebe", "Complements"] },
        { title: "Service client", links: ["Contact", "Livraison", "Retours", "FAQ", "Suivi commande"] },
        { title: "Informations", links: ["Conseils", "Nouveautes", "Marques", "Offres", "Selection du moment"] },
      ].map((col) => (
        <div key={col.title}>
          <h4 className="mb-4 font-display text-lg text-accent">{col.title}</h4>
          <ul className="space-y-2.5 text-sm">
            {col.links.map((link) => (
              <li key={link}>
                <a href="#" className="text-primary-foreground/70 transition-smooth hover:text-accent">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>

    <div className="border-t border-primary-foreground/10">
      <div className="container flex flex-col items-center justify-between gap-4 py-6 text-xs text-primary-foreground/60 md:flex-row">
        <p>© 2026 MV PARA - Tous droits reserves.</p>
        <div className="flex flex-wrap items-center justify-center gap-5">
          <span className="inline-flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" /> {phoneLine}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" /> {emailLine}
          </span>
          {addressLine ? (
            <span className="hidden items-center gap-1.5 md:inline-flex">
              <MapPin className="h-3.5 w-3.5" /> {addressLine}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
