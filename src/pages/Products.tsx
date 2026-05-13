import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import SEO from "@/components/SEO";
import { breadcrumb } from "@/lib/seo-schemas";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { SlidersHorizontal, X } from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useVendorsMap } from "@/hooks/useVendorsMap";

const FilterSidebar = ({
  categories,
  selectedCategory,
  onCategorySelect,
  priceRange,
  onPriceChange,
  maxPrice,
  onReset,
}: {
  categories: any[] | undefined;
  selectedCategory: string;
  onCategorySelect: (name: string) => void;
  priceRange: [number, number];
  onPriceChange: (val: [number, number]) => void;
  maxPrice: number;
  onReset: () => void;
}) => (
  <div className="space-y-5">
    {/* Price Range Filter - on top */}
    <div>
      <h3 className="mb-3 text-sm font-semibold text-foreground">মূল্য পরিসীমা</h3>
      <div className="px-1">
        <Slider
          min={0}
          max={maxPrice}
          step={50}
          value={priceRange}
          onValueChange={(val) => onPriceChange(val as [number, number])}
          className="mb-3"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="rounded border bg-muted/50 px-2 py-1 font-medium text-foreground">৳{priceRange[0]}</span>
          <span className="text-[10px]">থেকে</span>
          <span className="rounded border bg-muted/50 px-2 py-1 font-medium text-foreground">৳{priceRange[1]}</span>
        </div>
      </div>
    </div>

    <Separator />

    {/* Category Filter */}
    <div>
      <h3 className="mb-3 text-sm font-semibold text-foreground">ক্যাটাগরি</h3>
      <div className="space-y-1">
        <button
          onClick={() => onCategorySelect("")}
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
            onClick={() => onCategorySelect(cat.name)}
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

    {/* Reset */}
    <Button variant="outline" size="sm" className="w-full" onClick={onReset}>
      <X className="mr-1.5 h-3.5 w-3.5" /> ফিল্টার রিসেট করুন
    </Button>
  </div>
);

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
      let query = supabase
        .from("products")
        .select("id,name,name_bn,price,compare_price,image_url,weight,grade,coming_soon,is_active,category_id,vendor_id,created_at,categories(name,name_bn)")
        .eq("is_active", true);
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

  const maxPrice = useMemo(() => {
    if (!products?.length) return 10000;
    return Math.ceil(Math.max(...products.map((p: any) => Number(p.price))) / 100) * 100;
  }, [products]);

  // Properly reset price range when products load
  useEffect(() => {
    if (maxPrice > 0) {
      setPriceRange([0, maxPrice]);
    }
  }, [maxPrice]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p: any) => {
      const price = Number(p.price);
      return price >= priceRange[0] && price <= priceRange[1];
    });
  }, [products, priceRange]);

  const { data: vendorMap } = useVendorsMap(filteredProducts?.map((p: any) => p.vendor_id));

  const handleCategorySelect = useCallback((catName: string) => {
    if (catName) {
      setSearchParams({ category: catName });
    } else {
      setSearchParams({});
    }
    setMobileFilterOpen(false);
  }, [setSearchParams]);

  const handleReset = useCallback(() => {
    setSearchParams({});
    setPriceRange([0, maxPrice]);
  }, [setSearchParams, maxPrice]);

  const catLabel = selectedCategory
    ? categories?.find((c: any) => c.name === selectedCategory)?.name_bn || selectedCategory
    : "";
  const seoTitle = catLabel
    ? `${catLabel} — সাপাহারের সেরা আম`
    : "সকল আম — আম্রপালি, হাড়িভাঙা, ফজলি, কাঁঠিমুন";
  const seoDesc = catLabel
    ? `${catLabel} — Sapahar Shop থেকে সরাসরি বাগানের ১০০% খাঁটি আম। সারাদেশে দ্রুত ডেলিভারি।`
    : "Sapahar Shop-এর সম্পূর্ণ আমের তালিকা — আম্রপালি, হাড়িভাঙা, ফজলি, কাঁঠিমুন। সরাসরি বাগান থেকে খাঁটি আম।";
  const crumbs = [
    { name: "হোম", path: "/" },
    { name: "পণ্যসমূহ", path: "/products" },
  ];
  if (catLabel) crumbs.push({ name: catLabel, path: `/products?category=${selectedCategory}` });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seoTitle}
        description={seoDesc}
        // Always use /products as canonical so filtered views don't create
        // duplicate URLs in Google Search Console.
        path="/products"
        noindex={!!selectedCategory}
        jsonLd={breadcrumb(crumbs)}
      />
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">{catLabel || "পণ্যসমূহ"}</h1>
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
          {/* Desktop Sidebar */}
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-4 rounded-lg border bg-card p-4">
              <div className="mb-4 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">ফিল্টার</h2>
              </div>
              <FilterSidebar
                categories={categories}
                selectedCategory={selectedCategory}
                onCategorySelect={handleCategorySelect}
                priceRange={priceRange}
                onPriceChange={setPriceRange}
                maxPrice={maxPrice}
                onReset={handleReset}
              />
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
                  <FilterSidebar
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onCategorySelect={handleCategorySelect}
                    priceRange={priceRange}
                    onPriceChange={setPriceRange}
                    maxPrice={maxPrice}
                    onReset={handleReset}
                  />
                </SheetContent>
              </Sheet>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">এই ফিল্টারে কোনো পণ্য নেই</div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((p: any) => {
                  const v = vendorMap?.[p.vendor_id];
                  return (
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
                      grade={p.grade}
                      coming_soon={p.coming_soon}
                      vendor_shop_name_bn={v?.shop_name_bn}
                      vendor_shop_slug={v?.shop_slug}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
