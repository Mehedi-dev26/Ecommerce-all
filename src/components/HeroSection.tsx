import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BannerSlide {
  image: string;
  title: string;
  subtitle: string;
  cta: string;
  ctaLink: string;
  showTextOverlay: boolean;
}

const HeroSection = () => {
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("banners")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setSlides(
            data.map((b) => ({
              image: b.image_url || "",
              title: b.title,
              subtitle: b.subtitle || "",
              cta: b.cta_text || "অর্ডার করুন",
              ctaLink: b.cta_link || "/products",
              showTextOverlay: b.show_text_overlay !== false,
            }))
          );
        }
        setLoading(false);
      });
  }, []);

  const next = useCallback(() => setCurrent((p) => (p + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  if (loading) {
    return <div className="w-full aspect-[16/9] sm:aspect-[21/9] bg-muted animate-pulse" />;
  }

  if (slides.length === 0) return null;

  const slide = slides[current];

  return (
    <section className="relative w-full overflow-hidden">
      {slides.map((s, i) => (
        <img
          key={i}
          src={s.image}
          alt={s.title}
          className={`absolute inset-0 h-full w-full object-contain sm:object-cover transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}
          width={1920}
          height={720}
          {...(i === 0 ? {} : { loading: "lazy" as const })}
        />
      ))}

      <div className="relative aspect-[16/9] sm:aspect-[21/9] lg:h-[520px] lg:aspect-auto bg-black/5">
        {slide.showTextOverlay && (
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />
        )}

        {slide.showTextOverlay && (
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4">
              <div className="max-w-lg">
                <h1
                  key={`title-${current}`}
                  className="mb-2 text-xl font-bold text-white sm:text-4xl lg:text-5xl leading-tight animate-in fade-in slide-in-from-bottom-4 duration-500"
                >
                  {slide.title}
                </h1>
                <p
                  key={`sub-${current}`}
                  className="mb-4 text-xs text-white/90 sm:text-lg lg:text-xl animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150"
                >
                  {slide.subtitle}
                </p>
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 text-xs sm:text-sm">
                  <Link to={slide.ctaLink}>{slide.cta} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {slides.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/50 sm:left-4 sm:p-3">
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/50 sm:right-4 sm:p-3">
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${i === current ? "w-8 bg-accent" : "w-2.5 bg-white/50 hover:bg-white/80"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
