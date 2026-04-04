import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";

const categoryData: Record<string, { emoji: string; img: string; gradient: string }> = {
  Pickles: {
    emoji: "🥒",
    img: "https://images.unsplash.com/photo-1589135233689-0ef70de0de09?w=600&h=600&fit=crop",
    gradient: "from-amber-900/80 to-amber-700/40",
  },
  Fruits: {
    emoji: "🥭",
    img: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&h=600&fit=crop",
    gradient: "from-green-900/80 to-green-700/40",
  },
  Oils: {
    emoji: "🫒",
    img: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&h=600&fit=crop",
    gradient: "from-yellow-900/80 to-yellow-700/40",
  },
  "Dry Foods": {
    emoji: "🐟",
    img: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600&h=600&fit=crop",
    gradient: "from-orange-900/80 to-orange-700/40",
  },
  "Honey & Dates": {
    emoji: "🍯",
    img: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&h=600&fit=crop",
    gradient: "from-amber-900/80 to-amber-700/40",
  },
};

const CategorySection = () => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <section className="py-10 sm:py-16">
        <div className="container mx-auto px-4">
          <Skeleton className="mx-auto mb-8 h-8 w-48" />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 sm:gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="mb-6 text-center sm:mb-10">
          <h2 className="mb-1 text-xl font-bold text-foreground sm:mb-2 sm:text-3xl">আমাদের ক্যাটাগরি</h2>
          <p className="text-xs text-muted-foreground sm:text-base">পছন্দের ক্যাটাগরি থেকে পণ্য বেছে নিন</p>
        </div>

        {/* Mobile: first row 2, second row 3 — Desktop: all 5 in a row */}
        <div className="grid grid-cols-6 gap-2.5 sm:gap-4">
          {categories?.map((cat: any, idx: number) => {
            const info = categoryData[cat.name] || { emoji: "📦", img: "", gradient: "from-primary/80 to-primary/40" };
            // On mobile (< sm): first 2 items span 3 cols each (50%), next 3 span 2 cols each (33%)
            // On sm+: all 5 evenly
            const colSpan = idx < 2 ? "col-span-3 sm:col-span-1" : "col-span-2 sm:col-span-1";
            // On desktop, we need 5 columns. We use a special grid for sm+
            return (
              <Link
                key={cat.id}
                to={`/products?category=${cat.name}`}
                className={`${colSpan} group relative overflow-hidden rounded-2xl shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
              >
                <div className="aspect-[3/4]">
                  <img
                    src={info.img}
                    alt={cat.name_bn}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${info.gradient}`} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-4">
                  <span className="mb-1 block text-lg sm:text-2xl">{info.emoji}</span>
                  <h3 className="text-xs font-bold text-primary-foreground sm:text-base">{cat.name_bn}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-primary-foreground/60 transition-all group-hover:text-primary-foreground/90 sm:text-xs">
                    দেখুন <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
