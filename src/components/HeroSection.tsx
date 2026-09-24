import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BannerSlide {
  image: string;
  title: string;
  subtitle: string;
  cta: string;
  ctaLink: string;
  showTextOverlay: boolean;
}

// Append cache-busting version + ensure Unsplash images are right-sized for the viewport.
// Smaller payloads = faster LCP on mobile (Lighthouse "Properly size images" + "Efficient image formats").
const optimizeImageUrl = (url: string | null, updatedAt: string) => {
  if (!url) return "";
  let optimized = url;
  // Tune Unsplash params: cap width, auto-format (webp/avif), 75% quality
  if (optimized.includes("images.unsplash.com")) {
    try {
      const u = new URL(optimized);
      u.searchParams.set("w", "1600");
      u.searchParams.set("q", "70");
      u.searchParams.set("auto", "format");
      u.searchParams.set("fit", "crop");
      optimized = u.toString();
    } catch {
      /* fall through */
    }
  }
  const separator = optimized.includes("?") ? "&" : "?";
  return `${optimized}${separator}v=${new Date(updatedAt).getTime()}`;
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
            image: optimizeImageUrl(banner.image_url, banner.updated_at),
            title: banner.title,
            subtitle: banner.subtitle || "",
            cta: banner.cta_text || "অর্ডার করুন",
            ctaLink: banner.cta_link || "/products",
            showTextOverlay: banner.show_text_overlay !== false,
          }))
          .filter((slide) => slide.image.trim().length > 0);

        setSlides(mappedSlides);
        setCurrent(0);
        setLoading(false);

        // Warm cache for remaining slides in background — don't block first paint
        if (mappedSlides.length > 1) {
          void Promise.allSettled(mappedSlides.slice(1).map((slide) => preloadImage(slide.image)));
        }
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

  // Swipe / drag handling — works for touch & mouse
  const dragState = useRef<{ startX: number; active: boolean }>({ startX: 0, active: false });

  if (loading) {
    return (
      <section className="relative w-full overflow-hidden">
        <div className="relative aspect-[21/9] overflow-hidden bg-muted" />
      </section>
    );
  }

  if (slides.length === 0) return null;

  const slide = slides[current];

  // Swipe / drag handling — works for touch & mouse

  const handleDragStart = (clientX: number) => {
    dragState.current = { startX: clientX, active: true };
  };

  const handleDragEnd = (clientX: number) => {
    if (!dragState.current.active) return;
    const delta = clientX - dragState.current.startX;
    dragState.current.active = false;
    const threshold = 40; // px — minimum swipe distance
    if (Math.abs(delta) < threshold) return;
    if (delta < 0) next();
    else prev();
  };

  return (
    <section className="relative w-full">
      <div className="w-full md:max-w-7xl md:mx-auto md:px-6 lg:px-8 md:pt-4 lg:pt-6">
        <div
          className="relative aspect-[21/9] overflow-hidden bg-muted select-none touch-pan-y rounded-none md:rounded-2xl lg:rounded-3xl shadow-none md:shadow-lg ring-0 md:ring-1 md:ring-black/5"
          onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
          onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientX)}
          onMouseDown={(e) => handleDragStart(e.clientX)}
          onMouseUp={(e) => handleDragEnd(e.clientX)}
          onMouseLeave={() => { dragState.current.active = false; }}
        >
          {slides.map((slideItem, index) => (
            <img
              key={`${slideItem.image}-${index}`}
              src={slideItem.image}
              alt={slideItem.title || "হোমপেজ ব্যানার"}
              draggable={false}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${index === current ? "opacity-100" : "pointer-events-none opacity-0"}`}
              width={1920}
              height={820}
              sizes="(max-width: 768px) 100vw, 1280px"
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
              <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12">
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
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 sm:bottom-4">
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
        )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
