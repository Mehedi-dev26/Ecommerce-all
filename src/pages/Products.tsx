import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category") || "";

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", selectedCategory],
    queryFn: async () => {
      let query = supabase.from("products").select("*, categories(name, name_bn)");
      if (selectedCategory) {
        const cat = categories?.find((c: any) => c.name === selectedCategory);
        if (cat) query = query.eq("category_id", cat.id);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: categories !== undefined,
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold text-foreground">পণ্যসমূহ</h1>
      <p className="mb-8 text-muted-foreground">আমাদের সকল পণ্য এখানে দেখুন</p>

      <div className="mb-8 flex flex-wrap gap-2">
        <Button variant={!selectedCategory ? "default" : "outline"} size="sm" onClick={() => setSearchParams({})}>
          সকল
        </Button>
        {categories?.map((cat: any) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.name ? "default" : "outline"}
            size="sm"
            onClick={() => setSearchParams({ category: cat.name })}
          >
            {cat.name_bn}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-lg" />
          ))}
        </div>
      ) : products?.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">এই ক্যাটাগরিতে কোনো পণ্য নেই</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
    </div>
  );
};

export default Products;
