import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const FeaturedProducts = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name_bn)")
        .eq("is_featured", true)
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="bg-muted/50 py-10 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="mb-6 text-center sm:mb-10">
          <h2 className="mb-1 text-xl font-bold text-foreground sm:mb-2 sm:text-3xl">জনপ্রিয় পণ্যসমূহ</h2>
          <p className="text-xs text-muted-foreground sm:text-base">সবচেয়ে বেশি বিক্রিত পণ্যগুলো</p>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-xl sm:h-72" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
            {products?.map((p: any) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                name_bn={p.name_bn}
                price={Number(p.price)}
                compare_price={p.compare_price ? Number(p.compare_price) : null}
                image_url={p.image_url}
                weight={p.weight}
                category_name_bn={p.categories?.name_bn}
              />
            ))}
          </div>
        )}
        <div className="mt-6 text-center sm:mt-10">
          <Button asChild variant="outline" className="sm:h-11 sm:px-6">
            <Link to="/products">সব পণ্য দেখুন <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
