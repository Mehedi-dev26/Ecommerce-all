import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Star, Quote, ChevronLeft, ChevronRight, MapPin, PenLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ReviewSubmissionDialog from "@/components/ReviewSubmissionDialog";

interface Review {
  id: string;
  customer_name: string;
  customer_image: string | null;
  rating: number;
  review_text: string;
  location: string | null;
}

const CustomerReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [submitOpen, setSubmitOpen] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", slidesToScroll: 1 },
    [Autoplay({ delay: 4500, stopOnInteraction: false, stopOnMouseEnter: true })]
  );

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from("customer_reviews")
        .select("id, customer_name, customer_image, rating, review_text, location")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      setReviews(data || []);
      setLoading(false);
    };
    void fetchReviews();
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  // Don't hide the section while loading — we still want the "Write a review" button visible
  if (loading) return null;

  return (
    <section className="py-12 md:py-20 bg-gradient-to-b from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4">
        {/* Heading — matches LocationSection typography */}
        <div className="mb-8 text-center sm:mb-10">
          <h2 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">
            আমাদের <span className="font-brand text-primary text-3xl sm:text-4xl">Customers</span> দের মতামত
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base mb-4">
            আমাদের সেবায় সন্তুষ্ট গ্রাহকদের প্রকৃত অভিজ্ঞতা
          </p>
          <Button
            onClick={() => setSubmitOpen(true)}
            variant="outline"
            className="gap-2 rounded-full border-primary/30 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
          >
            <PenLine className="h-4 w-4" />
            আপনার মতামত দিন
          </Button>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            প্রথম রিভিউটি আপনিই দিন!
          </div>
        ) : (

        {/* Carousel */}
        <div className="relative max-w-6xl mx-auto">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="pl-3 sm:pl-4 min-w-0 shrink-0 grow-0 basis-1/2 md:basis-1/2 lg:basis-1/3"
                >
                  <div className="group h-full bg-card border border-border/60 rounded-2xl p-3 sm:p-6 md:p-7 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 relative overflow-hidden">
                    {/* Decorative quote */}
                    <Quote className="absolute top-3 right-3 h-8 w-8 sm:h-12 sm:w-12 text-primary/5 group-hover:text-primary/10 transition-colors" />

                    {/* Rating */}
                    <div className="flex items-center gap-0.5 mb-2 sm:mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3 w-3 sm:h-4 sm:w-4",
                            i < review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                          )}
                        />
                      ))}
                    </div>

                    {/* Review text */}
                    <p className="text-[12px] sm:text-sm md:text-[15px] text-foreground/85 leading-relaxed mb-3 sm:mb-6 line-clamp-4 sm:line-clamp-5 min-h-[72px] sm:min-h-[110px]">
                      "{review.review_text}"
                    </p>

                    {/* Customer info */}
                    <div className="flex items-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-border/50">
                      <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-full overflow-hidden ring-2 ring-primary/20 shrink-0 bg-muted">
                        {review.customer_image ? (
                          <img
                            src={review.customer_image}
                            alt={review.customer_name}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-sm sm:text-lg">
                            {review.customer_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground text-xs sm:text-sm truncate">
                          {review.customer_name}
                        </p>
                        {review.location && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 truncate">
                            <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                            {review.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nav buttons */}
          <button
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="পূর্ববর্তী"
            className="hidden md:flex absolute -left-4 lg:-left-6 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full bg-card border border-border shadow-lg hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all z-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            aria-label="পরবর্তী"
            className="hidden md:flex absolute -right-4 lg:-right-6 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full bg-card border border-border shadow-lg hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all z-10"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Slide ${i + 1}`}
                className={cn(
                  "h-2 rounded-full transition-all",
                  selectedIndex === i
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>
        </div>
        )}
      </div>
      <ReviewSubmissionDialog open={submitOpen} onOpenChange={setSubmitOpen} />
    </section>
  );
};

export default CustomerReviews;
