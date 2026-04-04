import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { SlidersHorizontal, X } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category") || "";
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

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

  // Get max price from products
  const maxPrice = useMemo(() => {
    if (!products?.length) return 10000;
    return Math.ceil(Math.max(...products.map((p: any) => Number(p.price))) / 100) * 100;
  }, [products]);

  // Filter products by price
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p: any) => {
      const price = Number(p.price);
      return price >= priceRange[0] && price <= priceRange[1];
    });
  }, [products, priceRange]);

  // Reset price when max changes
  useMemo(() => {
    if (maxPrice > 0 && priceRange[1] === 10000) {
      setPriceRange([0, maxPrice]);
    }
  }, [maxPrice]);

  const handleCategorySelect = (catName: string) => {
    if (catName) {
      setSearchParams({ category: catName });
    } else {
      setSearchParams({});
    }
    setMobileFilterOpen(false);
  };

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">ক্যাটাগরি</h3>
        <div className="space-y-1">
          <button
            onClick={() => handleCategorySelect("")}
            className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
              !selectedCategory
                ? "bg-primary text-primary-foreground font-medium"
                : "text-foreground hover:bg-muted"
            }`}
          >
            সকল পণ্য
          </button>
          {categories?.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.name)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                selectedCategory === cat.name
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {cat.name_bn}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range Filter */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">মূল্য পরিসীমা</h3>
        <div className="px-1">
          <Slider
            min={0}
            max={maxPrice}
            step={50}
            value={priceRange}
            onValueChange={(val) => setPriceRange(val as [number, number])}
            className="mb-3"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="rounded border bg-muted/50 px-2 py-1 font-medium">৳{priceRange[0]}</span>
            <span className="text-[10px]">থেকে</span>
            <span className="rounded border bg-muted/50 px-2 py-1 font-medium">৳{priceRange[1]}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Reset */}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => {
          setSearchParams({});
          setPriceRange([0, maxPrice]);
        }}
      >
        <X className="mr-1.5 h-3.5 w-3.5" /> ফিল্টার রিসেট করুন
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">পণ্যসমূহ</h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            আমাদের সকল খাঁটি পণ্য এখানে দেখুন
            {filteredProducts.length > 0 && (
              <span className="ml-1">({filteredProducts.length}টি পণ্য)</span>
            )}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar - hidden on mobile */}
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-4 rounded-lg border bg-card p-4">
              <div className="mb-4 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">ফিল্টার</h2>
              </div>
              <FilterSidebar />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter Button */}
            <div className="mb-4 lg:hidden">
              <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5" /> ফিল্টার
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-4 pt-10">
                  <FilterSidebar />
                </SheetContent>
              </Sheet>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-lg sm:h-72" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">এই ফিল্টারে কোনো পণ্য নেই</div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((p: any) => (
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
        </div>
      </div>
    </div>
  );
};

export default Products;
