import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import mawraBanner from "@/assets/mawra-banner.jpg";
import mawraBannerText from "@/assets/mawra-banner-text.jpg";
import { useState, useEffect, useCallback } from "react";

const slides = [
  { src: mawraBannerText, alt: "MAWRA - বাংলাদেশের খাঁটি স্বাদ", hasOverlay: false },
  { src: mawraBanner, alt: "MAWRA Banner", hasOverlay: true },
];

const HeroSection = () => {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((p) => (p + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next]);

  return (
    <section className="relative overflow-hidden bg-primary">
      {/* Slides */}
      <div className="relative w-full" style={{ aspectRatio: "16/7" }}>
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === current ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              className="h-full w-full object-contain sm:object-cover"
            />

            {/* Text overlay only for the original banner slide */}
            {slide.hasOverlay && (
              <div className="absolute inset-0 flex items-center">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/60 to-transparent" />
                <div className="container relative mx-auto px-4">
                  <div className="max-w-lg">
                    <p className="mb-1.5 text-[10px] font-semibold tracking-widest text-secondary uppercase sm:mb-2 sm:text-sm">
                      নির্ভেজাল এবং সেরা পণ্য
                    </p>
                    <h1 className="mb-2 text-xl font-extrabold leading-tight text-primary-foreground sm:mb-3 sm:text-3xl md:text-4xl lg:text-5xl">
                      বাংলাদেশের <span className="text-secondary">খাঁটি স্বাদ</span> আপনার ঘরে
                    </h1>
                    <p className="mb-3 text-[11px] leading-relaxed text-primary-foreground/85 sm:mb-6 sm:text-sm md:text-base">
                      ঐতিহ্যবাহী আচার, খাঁটি সরিষার তেল, মধু, খেজুর — সরাসরি বাংলাদেশ থেকে।
                    </p>
                    <div className="flex gap-2 sm:gap-3">
                      <Button asChild size="sm" className="h-8 bg-secondary text-secondary-foreground hover:bg-secondary/90 sm:h-11 sm:px-6 sm:text-sm">
                        <Link to="/products">পণ্য দেখুন <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="h-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 sm:h-11 sm:px-6 sm:text-sm">
                        <Link to="/contact">যোগাযোগ</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Nav arrows */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-primary/50 p-1.5 text-primary-foreground backdrop-blur-sm transition hover:bg-primary/80 sm:left-4 sm:p-2"
        aria-label="Previous"
      >
        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-primary/50 p-1.5 text-primary-foreground backdrop-blur-sm transition hover:bg-primary/80 sm:right-4 sm:p-2"
        aria-label="Next"
      >
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-4">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${i === current ? "w-6 bg-secondary" : "w-2 bg-primary-foreground/40"}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
