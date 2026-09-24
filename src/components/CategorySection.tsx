import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { optimizeRemoteImage } from "@/lib/image-url";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";

interface Category {
  id: string;
  name: string;
  name_bn: string;
  image_url: string | null;
  sort_order?: number | null;
  description?: string | null;
}

const DEFAULT_CATEGORY_FALLBACK = "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80";

const CategorySection = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; time: number; hasMoved: boolean }>({ x: 0, time: 0, hasMoved: false });

  // Fetch categories from Supabase
  const { data: rawCategories, isLoading } = useQuery<Category[]>({
    queryKey: ["home-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Ensure enough items for an infinite 3D coverflow loop
  const categories = useMemo(() => {
    if (!rawCategories || rawCategories.length === 0) return [];
    if (rawCategories.length < 5) {
      return [...rawCategories, ...rawCategories];
    }
    return rawCategories;
  }, [rawCategories]);

  const total = categories.length;

  // Responsive breakpoint check
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile, { passive: true });
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Navigation callbacks
  const nextSlide = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Autoplay functionality (pauses on hover or during interaction)
  useEffect(() => {
    if (isLoading || total <= 1 || isPaused || isDragging) return;
    const interval = window.setInterval(nextSlide, 4500);
    return () => window.clearInterval(interval);
  }, [isLoading, total, isPaused, isDragging, nextSlide]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevSlide();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nextSlide();
    }
  };

  // Drag / Swipe handling
  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    dragStartRef.current = { x: clientX, time: Date.now(), hasMoved: false };
    setDragOffset(0);
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    const deltaX = clientX - dragStartRef.current.x;
    if (Math.abs(deltaX) > 8) {
      dragStartRef.current.hasMoved = true;
    }
    setDragOffset(deltaX);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const deltaX = dragOffset;
    const swipeThreshold = isMobile ? 40 : 60;

    if (deltaX < -swipeThreshold) {
      nextSlide();
    } else if (deltaX > swipeThreshold) {
      prevSlide();
    }
    setDragOffset(0);
  };

  // Calculate shortest distance in circular carousel
  const getDistance = (index: number) => {
    if (total === 0) return 0;
    let diff = index - activeIndex;
    while (diff > total / 2) diff -= total;
    while (diff < -total / 2) diff += total;

    // Apply smooth continuous drag offset
    const cardStepPx = isMobile ? 180 : 260;
    const dragProgress = dragOffset / cardStepPx;
    return diff - dragProgress;
  };

  // 3D Coverflow positioning, scaling and opacity calculation
  const getSlideStyle = (dist: number) => {
    const absDist = Math.abs(dist);

    // Hide slides that are beyond peripheral view
    if (absDist > 2.3) {
      return {
        opacity: 0,
        pointerEvents: "none" as const,
        transform: `translateX(${dist > 0 ? (isMobile ? 180 : 280) : (isMobile ? -180 : -280)}%) scale(0.6) translateZ(-200px)`,
        zIndex: 0,
        visibility: "hidden" as const,
      };
    }

    // Spacing between cards (percentage of card width)
    const spacingPercent = isMobile ? 86 : 108;
    const translateX = dist * spacingPercent;

    // Scale calculation: Center = 1.0, Edge cards = 0.84 (desktop) / 0.82 (mobile)
    const scale = Math.max(0.68, 1 - absDist * (isMobile ? 0.18 : 0.15));

    // Opacity: Center = 1.0, 1 step away = ~0.72, 2 steps away = ~0.35
    const opacity = absDist < 0.15 ? 1 : Math.max(0, 1 - absDist * 0.32);

    // 3D rotation angle creating coverflow depth
    const rotateY = dist * (isMobile ? -10 : -14);

    // Z-index hierarchy: Center card is always on top
    const zIndex = Math.round(30 - absDist * 10);

    // Z-depth push
    const translateZ = -absDist * (isMobile ? 60 : 90);

    return {
      transform: `translateX(${translateX}%) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
      opacity,
      zIndex,
      pointerEvents: absDist > 1.3 ? ("none" as const) : ("auto" as const),
      visibility: "visible" as const,
    };
  };

  const handleCardClick = (index: number, cat: Category) => {
    if (dragStartRef.current.hasMoved) return; // Prevent click after dragging
    const dist = getDistance(index);
    if (Math.abs(dist) < 0.2) {
      // Center card clicked: navigate to category products
      navigate(`/products?category=${encodeURIComponent(cat.name)}`);
    } else {
      // Side card clicked: smoothly center this card
      setActiveIndex(index % total);
    }
  };

  return (
    <section
      className="py-5 sm:py-7 md:py-8 overflow-hidden select-none bg-gradient-to-b from-background via-secondary/10 to-background"
      aria-label="ক্যাটাগরি সমূহ"
    >
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
        {/* Compact Heading */}
        <div className="mb-3 sm:mb-5 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold mb-1">
            <Sparkles className="h-3 w-3" />
            <span>প্রিমিয়াম ক্যাটাগরি</span>
          </div>
          <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            ক্যাটাগরি সমূহ
          </h2>
          <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground">
            পছন্দের তাজা ফল ও পণ্যের ক্যাটাগরি বেছে নিন
          </p>
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="relative h-[170px] sm:h-[210px] flex items-center justify-center">
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              <Skeleton className="hidden sm:block h-[160px] w-[180px] rounded-2xl opacity-60 scale-90" />
              <Skeleton className="h-[180px] w-[170px] sm:w-[220px] rounded-2xl shadow-md" />
              <Skeleton className="hidden sm:block h-[160px] w-[180px] rounded-2xl opacity-60 scale-90" />
            </div>
          </div>
        ) : (
          /* Compact 3D Centered Coverflow Carousel Stage */
          <div
            ref={containerRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => {
              setIsPaused(false);
              handleDragEnd();
            }}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
            onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
            onTouchEnd={handleDragEnd}
            onMouseDown={(e) => handleDragStart(e.clientX)}
            onMouseMove={(e) => handleDragMove(e.clientX)}
            onMouseUp={handleDragEnd}
            className="relative h-[180px] sm:h-[215px] md:h-[230px] w-full flex items-center justify-center focus:outline-none cursor-grab active:cursor-grabbing"
            style={{ perspective: "1000px" }}
            role="region"
            aria-roledescription="carousel"
          >
            {/* Left Navigation Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              aria-label="পূর্ববর্তী ক্যাটাগরি"
              className="absolute left-1 sm:left-3 md:left-6 z-40 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-background/90 text-foreground backdrop-blur-md border border-border shadow-md transition-all duration-200 hover:bg-background hover:scale-110 active:scale-95 hover:border-primary/40 focus:outline-none"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Right Navigation Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              aria-label="পরবর্তী ক্যাটাগরি"
              className="absolute right-1 sm:right-3 md:right-6 z-40 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-background/90 text-foreground backdrop-blur-md border border-border shadow-md transition-all duration-200 hover:bg-background hover:scale-110 active:scale-95 hover:border-primary/40 focus:outline-none"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Slides container */}
            <div
              className="relative w-full h-full flex items-center justify-center"
              style={{ transformStyle: "preserve-3d" }}
            >
              {categories.map((cat, index) => {
                const dist = getDistance(index);
                const absDist = Math.abs(dist);
                const isCenter = absDist < 0.2;
                const slideStyle = getSlideStyle(dist);

                return (
                  <div
                    key={`${cat.id}-${index}`}
                    onClick={() => handleCardClick(index, cat)}
                    style={{
                      ...slideStyle,
                      transition: isDragging
                        ? "none"
                        : "transform 450ms cubic-bezier(0.25, 1, 0.5, 1), opacity 450ms cubic-bezier(0.25, 1, 0.5, 1), box-shadow 450ms ease",
                    }}
                    className={`absolute w-[160px] sm:w-[200px] md:w-[220px] h-[160px] sm:h-[195px] md:h-[210px] rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center cursor-pointer border transition-colors ${
                      isCenter
                        ? "bg-card/98 border-primary/50 shadow-xl shadow-primary/10 ring-2 ring-primary/25 backdrop-blur-md"
                        : "bg-card/85 border-border/70 shadow-sm backdrop-blur-sm hover:border-primary/30"
                    }`}
                  >
                    {/* Category Image */}
                    <div
                      className={`relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-xl overflow-hidden border transition-all duration-300 ${
                        isCenter
                          ? "border-primary/40 shadow-md scale-100 ring-2 ring-primary/10"
                          : "border-border/60 shadow-sm scale-95"
                      }`}
                    >
                      <img
                        src={optimizeRemoteImage(cat.image_url, 300) || DEFAULT_CATEGORY_FALLBACK}
                        alt={cat.name_bn || cat.name}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        loading={isCenter ? "eager" : "lazy"}
                        decoding="async"
                        draggable={false}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_CATEGORY_FALLBACK;
                        }}
                      />
                    </div>

                    {/* Category Name in Bengali ONLY (clean & compact) */}
                    <h3
                      className={`mt-2 font-bold transition-colors text-center line-clamp-1 w-full px-1 ${
                        isCenter
                          ? "text-xs sm:text-sm md:text-base text-foreground font-extrabold"
                          : "text-xs sm:text-sm text-foreground/80"
                      }`}
                    >
                      {cat.name_bn || cat.name}
                    </h3>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Pagination Dots */}
        {!isLoading && total > 0 && (
          <div className="mt-3 sm:mt-4 flex items-center justify-center gap-1.5">
            {(rawCategories || []).map((_, idx) => {
              const currentModulo = activeIndex % (rawCategories?.length || 1);
              const isActive = currentModulo === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`ক্যাটাগরি ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none ${
                    isActive
                      ? "w-5 sm:w-6 bg-primary shadow-sm"
                      : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                  }`}
                />
              );
            })}
          </div>
        )}

        {/* Compact All Products link */}
        <div className="mt-2.5 text-center">
          <Link
            to="/products"
            className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <span>সবগুলো ক্যাটাগরি ও পণ্য দেখুন</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;

