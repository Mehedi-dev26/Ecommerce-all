import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Droplets, Apple, FlaskConical, Candy } from "lucide-react";

const categoryMeta: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  Pickles: { icon: FlaskConical, color: "text-amber-600", bg: "bg-amber-50", label: "আচার" },
  Fruits: { icon: Apple, color: "text-green-600", bg: "bg-green-50", label: "ফলমূল" },
  Oils: { icon: Droplets, color: "text-yellow-600", bg: "bg-yellow-50", label: "সরিষার তেল" },
  "Honey & Dates": { icon: Candy, color: "text-amber-700", bg: "bg-amber-50", label: "মধু ও খেজুর" },
};

const CategorySection = () => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      // Filter out "Dry Foods"
      return data?.filter((c: any) => c.name !== "Dry Foods") || [];
    },
  });

  if (isLoading) {
    return (
      <section className="py-8 sm:py-14">
        <div className="container mx-auto px-4">
          <Skeleton className="mx-auto mb-6 h-7 w-40" />
          <div className="grid grid-cols-4 gap-3 sm:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl sm:h-32" />
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

        <div className="mx-auto grid max-w-2xl grid-cols-4 gap-2.5 sm:gap-4">
          {categories?.slice(0, 4).map((cat: any) => {
            const meta = categoryMeta[cat.name] || { icon: FlaskConical, color: "text-primary", bg: "bg-muted", label: cat.name_bn };
            const Icon = meta.icon;
            return (
              <Link
                key={cat.id}
                to={`/products?category=${cat.name}`}
                className="group flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-2.5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md sm:gap-3 sm:p-5"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-full ${meta.bg} transition-transform duration-200 group-hover:scale-110 sm:h-16 sm:w-16`}>
                  <Icon className={`h-5 w-5 ${meta.color} sm:h-8 sm:w-8`} />
                </div>
                <span className="text-center text-[10px] font-semibold leading-tight text-foreground sm:text-sm">
                  {meta.label}
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
