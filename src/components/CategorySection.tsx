import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";

const categoryImages: Record<string, string> = {
  Pickles: "https://images.unsplash.com/photo-1589135233689-0ef70de0de09?w=400&h=400&fit=crop",
  Fruits: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&h=400&fit=crop",
  Oils: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop",
  "Dry Foods": "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=400&fit=crop",
  "Honey & Dates": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=400&fit=crop",
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

  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center sm:mb-10">
          <h2 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">আমাদের ক্যাটাগরি</h2>
          <p className="text-sm text-muted-foreground sm:text-base">আপনার পছন্দের ক্যাটাগরি থেকে পণ্য বেছে নিন</p>
        </div>
        {isLoading ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
            {categories?.map((cat: any) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.name}`}
                className="group relative overflow-hidden rounded-xl shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="aspect-[4/5] sm:aspect-square">
                  <img
                    src={categoryImages[cat.name] || "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=400&h=400&fit=crop"}
                    alt={cat.name_bn}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <h3 className="text-base font-bold text-primary-foreground sm:text-lg">{cat.name_bn}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-primary-foreground/70 opacity-0 transition-opacity group-hover:opacity-100">
                    দেখুন <ArrowRight className="h-3 w-3" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategorySection;
