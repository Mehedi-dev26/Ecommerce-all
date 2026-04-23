import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { optimizeRemoteImage } from "@/lib/image-url";

const CategorySection = () => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["home-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="py-8 sm:py-14">
      <div className="container mx-auto px-4">
        <div className="mb-5 text-center sm:mb-8">
          <h2 className="mb-1 text-lg font-bold text-foreground sm:text-2xl">ক্যাটাগরি সমূহ</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">পছন্দের ক্যাটাগরি থেকে পণ্য বেছে নিন</p>
        </div>

        {isLoading ? (
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-2.5 sm:gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="mx-auto grid max-w-4xl grid-cols-3 gap-3 sm:gap-5">
            {categories?.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md sm:gap-3 sm:p-5"
              >
                <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-primary/20 transition-transform duration-200 group-hover:scale-110 sm:h-20 sm:w-20">
                  <img
                    src={optimizeRemoteImage(cat.image_url, 200) || "/placeholder.svg"}
                    alt={cat.name_bn}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    width={160}
                    height={160}
                    sizes="(max-width: 640px) 25vw, 96px"
                  />
                </div>
                <span className="text-center text-xs font-semibold leading-tight text-foreground sm:text-base">
                  {cat.name_bn}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategorySection;
