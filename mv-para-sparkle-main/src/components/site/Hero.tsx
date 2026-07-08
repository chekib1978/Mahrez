import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import bann1 from "../../../bann1.jpg";
import bann2 from "../../../bann2.jpg";
import bann3 from "../../../bann3.jpg";
import bann4 from "../../../bann4.jpg";

type HeroProps = {
  productsCount: number;
  categoriesCount: number;
  inStockCount: number;
};

const slides = [
  { image: bann1, title: "Sunny Days" },
  { image: bann2, title: "Sensilis Skin Glow" },
  { image: bann3, title: "Filorga Revitalize" },
  { image: bann4, title: "Routine ideale" },
] as const;

const AUTO_SLIDE_DELAY = 5500;

const Hero = (_props: HeroProps) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [progressKey, setProgressKey] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, AUTO_SLIDE_DELAY);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setProgressKey((current) => current + 1);
  }, [activeSlide]);

  return (
    <section className="bg-[#f8f4ef] py-6 lg:py-8">
      <div className="container">
        <div className="relative overflow-hidden rounded-[2rem] border border-[#efe3d7] bg-white shadow-[0_28px_70px_rgba(93,72,52,0.10)]">
          <div className="absolute inset-x-0 top-0 z-30 h-[3px] bg-[#f3e6dc]">
            <div
              key={progressKey}
              className="h-full origin-left animate-[heroProgress_5.5s_linear_forwards] bg-[#f47d3c]"
            />
          </div>

          <div className="relative h-[240px] bg-[#fcfaf7] sm:h-[320px] lg:h-[520px]">
            {slides.map((item, index) => (
              <div
                key={item.image}
                className={`absolute inset-0 flex items-center justify-center transition-all duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  index === activeSlide
                    ? "translate-x-0 opacity-100"
                    : index < activeSlide
                      ? "-translate-x-8 opacity-0"
                      : "translate-x-8 opacity-0"
                }`}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className={`h-full w-full bg-[#fcfaf7] object-contain transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    index === activeSlide ? "scale-100" : "scale-[1.015]"
                  }`}
                />
              </div>
            ))}

            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white/28 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white/28 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-4 pb-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2">
                {slides.map((item, index) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setActiveSlide(index)}
                    className={`relative h-2.5 overflow-hidden rounded-full transition-all duration-500 ${
                      activeSlide === index
                        ? "w-12 bg-[#ead8cb]"
                        : "w-6 bg-[#d8c3b4] hover:bg-[#cfa78e]"
                    }`}
                    aria-label={`Afficher ${item.title}`}
                  >
                    {activeSlide === index ? (
                      <span
                        key={`${progressKey}-${item.title}`}
                        className="absolute inset-y-0 left-0 origin-left rounded-full bg-[#f47d3c] animate-[heroProgress_5.5s_linear_forwards]"
                      />
                    ) : null}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSlide((activeSlide - 1 + slides.length) % slides.length)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/78 text-[#4d5f56] shadow-[0_10px_22px_rgba(93,72,52,0.10)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
                  aria-label="Slide precedent"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlide((activeSlide + 1) % slides.length)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/78 text-[#4d5f56] shadow-[0_10px_22px_rgba(93,72,52,0.10)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
                  aria-label="Slide suivant"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes heroProgress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </section>
  );
};

export default Hero;
