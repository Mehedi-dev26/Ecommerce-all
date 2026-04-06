import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import mangoBanner1 from "@/assets/mango-banner.jpg";
import mangoBanner2 from "@/assets/mango-banner-2.jpg";
import mangoBanner3 from "@/assets/mango-banner-3.jpg";

const slides = [
  {
    image: mangoBanner1,
    title: "সাপাহারের দেশি আম",
    subtitle: "নওগাঁ জেলার সাপাহার উপজেলার বাগান থেকে সরাসরি আপনার ঘরে",
    cta: "আম অর্ডার করুন",
  },
  {
    image: mangoBanner2,
    title: "গাছপাকা খাঁটি আম",
    subtitle: "কার্বাইড ও কেমিক্যালমুক্ত, প্রাকৃতিকভাবে পাকা সুস্বাদু আম",
    cta: "এখনই অর্ডার করুন",
  },
  {
    image: mangoBanner3,
    title: "ল্যাংড়া, হিমসাগর, গোপালভোগ",
    subtitle: "বাংলাদেশের সেরা জাতের আম এখন আপনার হাতের কাছে",
    cta: "সকল আম দেখুন",
  },
];

const HeroSection = () => {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((p) => (p + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];

  return (
    <section className="relative w-full overflow-hidden">
      {/* Background images - use object-contain on mobile for full banner visibility */}
      {slides.map((s, i) => (
        <img
          key={i}
          src={s.image}
          alt={s.title}
          className={`absolute inset-0 h-full w-full object-cover sm:object-cover transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}
          width={1920}
          height={720}
          {...(i === 0 ? {} : { loading: "lazy" as const })}
        />
      ))}

      {/* Aspect ratio container - taller on mobile to show full banner */}
      <div className="relative aspect-[16/9] sm:aspect-[21/9] lg:h-[520px] lg:aspect-auto">
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />

        {/* Content */}
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
                <Link to="/products">{slide.cta} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation arrows */}
        <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/50 sm:left-4 sm:p-3">
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/50 sm:right-4 sm:p-3">
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${i === current ? "w-8 bg-accent" : "w-2.5 bg-white/50 hover:bg-white/80"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
