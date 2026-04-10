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

const getVersionedImageUrl = (url: string | null, updatedAt: string) => {
  if (!url) return "";
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${new Date(updatedAt).getTime()}`;
};

const preloadImage = (src: string) =>
  new Promise<void>((resolve) => {
    if (!src) {
      resolve();
      return;
    }

    const image = new Image();
    image.decoding = "async";
    image.src = src;

    if (image.complete) {
      resolve();
      return;
    }

    const done = () => resolve();
    image.onload = done;
    image.onerror = done;
  });

const HeroSection = () => {
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadBanners = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("banners")
          .select("*")
          .eq("is_active", true)
          .order("sort_order");

        if (error) throw error;
        if (cancelled) return;

        const mappedSlides = (data || [])
          .map((banner) => ({
            image: getVersionedImageUrl(banner.image_url, banner.updated_at),
            title: banner.title,
            subtitle: banner.subtitle || "",
            cta: banner.cta_text || "অর্ডার করুন",
            ctaLink: banner.cta_link || "/products",
            showTextOverlay: banner.show_text_overlay !== false,
          }))
          .filter((slide) => slide.image.trim().length > 0);

        setSlides(mappedSlides);
        setCurrent(0);

        if (mappedSlides.length === 0) {
          setLoading(false);
          return;
        }

        await preloadImage(mappedSlides[0].image);
        if (cancelled) return;

        setLoading(false);
        void Promise.allSettled(mappedSlides.slice(1).map((slide) => preloadImage(slide.image)));
      } catch {
        if (!cancelled) {
          setSlides([]);
          setLoading(false);
        }
      }
    };

    void loadBanners();

    return () => {
      cancelled = true;
    };
  }, []);

  const next = useCallback(() => {
    setCurrent((previous) => (previous + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((previous) => (previous - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (loading || slides.length <= 1) return;
    const timer = window.setInterval(next, 5000);
    return () => window.clearInterval(timer);
  }, [loading, next, slides.length]);

  if (loading) {
    return (
      <section className="relative w-full overflow-hidden">
        <div className="relative aspect-[2/1] overflow-hidden bg-muted sm:aspect-[21/9]">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted-foreground/10 to-muted" />
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.1s_infinite] bg-gradient-to-r from-transparent via-background/70 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4">
              <div className="max-w-lg space-y-2.5 sm:space-y-4">
                <div className="h-5 w-3/4 rounded-full bg-background/70 sm:h-10" />
                <div className="h-3 w-2/3 rounded-full bg-background/60 sm:h-5" />
                <div className="h-9 w-28 rounded-full bg-background/80 sm:h-11 sm:w-36" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (slides.length === 0) return null;

  const slide = slides[current];

  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative aspect-[2/1] overflow-hidden bg-muted sm:aspect-[21/9]">
        {slides.map((slideItem, index) => (
          <img
            key={`${slideItem.image}-${index}`}
            src={slideItem.image}
            alt={slideItem.title || "হোমপেজ ব্যানার"}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${index === current ? "opacity-100" : "pointer-events-none opacity-0"}`}
            width={1920}
            height={820}
            sizes="100vw"
            decoding="async"
            {...(index === 0
              ? { loading: "eager" as const, fetchPriority: "high" as const }
              : { loading: "lazy" as const })}
          />
        ))}

        {slide.showTextOverlay && (
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />
        )}

        {slide.showTextOverlay && (
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4">
              <div className="max-w-lg">
                <h1
                  key={`title-${current}`}
                  className="mb-2 text-xl font-bold leading-tight text-white animate-in fade-in slide-in-from-bottom-4 duration-500 sm:text-4xl lg:text-5xl"
                >
                  {slide.title}
                </h1>
                <p
                  key={`sub-${current}`}
                  className="mb-4 text-xs text-white/90 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 sm:text-lg lg:text-xl"
                >
                  {slide.subtitle}
                </p>
                <Button asChild size="lg" className="bg-accent text-xs text-accent-foreground animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 hover:bg-accent/90 sm:text-sm">
                  <Link to={slide.ctaLink}>
                    {slide.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/50 sm:left-4 sm:p-3"
              aria-label="আগের ব্যানার"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/50 sm:right-4 sm:p-3"
              aria-label="পরের ব্যানার"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrent(index)}
                  aria-label={`ব্যানার ${index + 1}`}
                  className={`h-2.5 rounded-full transition-all duration-300 ${index === current ? "w-8 bg-accent" : "w-2.5 bg-white/50 hover:bg-white/80"}`}
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
