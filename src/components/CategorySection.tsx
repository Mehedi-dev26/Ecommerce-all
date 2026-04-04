import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const categoryEmojis: Record<string, string> = {
  Pickles: "🥒",
  Fruits: "🥭",
  Oils: "🫒",
  "Dry Foods": "🐟",
  "Honey & Dates": "🍯",
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
    <section className="bg-muted/50 py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <h2 className="mb-2 text-3xl font-bold text-foreground">ক্যাটাগরি</h2>
          <p className="text-muted-foreground">আপনার পছন্দের ক্যাটাগরি থেকে পণ্য বেছে নিন</p>
        </div>
        {isLoading ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {categories?.map((cat: any) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.name}`}
                className="group flex flex-col items-center gap-3 rounded-xl bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
              >
                <span className="text-4xl">{categoryEmojis[cat.name] || "📦"}</span>
                <span className="font-semibold text-foreground group-hover:text-primary">{cat.name_bn}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategorySection;
