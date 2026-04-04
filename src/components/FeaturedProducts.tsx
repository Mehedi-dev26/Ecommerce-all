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
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <h2 className="mb-2 text-3xl font-bold text-foreground">জনপ্রিয় পণ্যসমূহ</h2>
          <p className="text-muted-foreground">আমাদের সবচেয়ে বেশি বিক্রিত পণ্যগুলো দেখুন</p>
        </div>
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="mt-10 text-center">
          <Button asChild size="lg" variant="outline">
            <Link to="/products">সব পণ্য দেখুন <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
