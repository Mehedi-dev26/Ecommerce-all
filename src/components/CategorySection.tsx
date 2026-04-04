import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Droplets, Apple, FlaskConical, Fish, Candy } from "lucide-react";

const categoryMeta: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  Pickles: { icon: FlaskConical, color: "text-amber-600", bg: "bg-amber-50" },
  Fruits: { icon: Apple, color: "text-green-600", bg: "bg-green-50" },
  Oils: { icon: Droplets, color: "text-yellow-600", bg: "bg-yellow-50" },
  "Dry Foods": { icon: Fish, color: "text-orange-600", bg: "bg-orange-50" },
  "Honey & Dates": { icon: Candy, color: "text-amber-700", bg: "bg-amber-50" },
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
      <section className="py-8 sm:py-14">
        <div className="container mx-auto px-4">
          <Skeleton className="mx-auto mb-6 h-7 w-40" />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 sm:gap-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl sm:h-36" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-14">
      <div className="container mx-auto px-4">
        <div className="mb-5 text-center sm:mb-8">
          <h2 className="mb-1 text-lg font-bold text-foreground sm:text-2xl">ক্যাটাগরি</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">পছন্দের ক্যাটাগরি থেকে পণ্য বেছে নিন</p>
        </div>

        {/* Clean icon-based grid like Daraz / professional e-commerce */}
        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-3 sm:grid-cols-5 sm:gap-4">
          {categories?.map((cat: any) => {
            const meta = categoryMeta[cat.name] || { icon: FlaskConical, color: "text-primary", bg: "bg-muted" };
            const Icon = meta.icon;
            return (
              <Link
                key={cat.id}
                to={`/products?category=${cat.name}`}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md sm:gap-3 sm:p-5"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${meta.bg} transition-transform duration-200 group-hover:scale-110 sm:h-16 sm:w-16`}>
                  <Icon className={`h-6 w-6 ${meta.color} sm:h-8 sm:w-8`} />
                </div>
                <span className="text-center text-[11px] font-semibold leading-tight text-foreground sm:text-sm">
                  {cat.name_bn}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
