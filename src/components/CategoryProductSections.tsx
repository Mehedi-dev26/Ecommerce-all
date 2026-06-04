import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import { useVendorsMap } from "@/hooks/useVendorsMap";
import { getCategoryIcon } from "@/lib/category-icons";

const CategoryProductSections = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["home-category-products"],
    queryFn: async () => {
      const { data: cats, error: cErr } = await supabase
        .from("categories")
        .select("id,name,name_bn,sort_order")
        .order("sort_order", { ascending: true });
      if (cErr) throw cErr;

      const { data: prods, error: pErr } = await supabase
        .from("products")
        .select(
          "id,name,name_bn,price,compare_price,image_url,weight,grade,coming_soon,serial_number,vendor_id,category_id,categories(name_bn),created_at",
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (pErr) throw pErr;

      return (cats ?? [])
        .map((c) => ({
          ...c,
          products: (prods ?? []).filter((p: any) => p.category_id === c.id).slice(0, 8),
        }))
        .filter((c) => c.products.length > 0);
    },
    staleTime: 10 * 60 * 1000,
  });

  const allVendorIds = data?.flatMap((c) => c.products.map((p: any) => p.vendor_id)) ?? [];
  const { data: vendorMap } = useVendorsMap(allVendorIds);

  if (isLoading) {
    return (
      <section className="py-10 sm:py-14">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!data?.length) return null;

  return (
    <>
      {data.map((cat, idx) => {
        const { Icon, tone } = getCategoryIcon(cat.name, cat.name_bn);
        return (
        <section
          key={cat.id}
          className={`py-8 sm:py-12 ${idx % 2 === 0 ? "bg-background" : "bg-muted/40"}`}
        >
          <div className="container mx-auto px-4">
            <div className="mb-5 flex items-end justify-between gap-3 sm:mb-7">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tone} shadow-md ring-1 ring-black/5 transition-transform hover:scale-110 hover:rotate-3 sm:h-12 sm:w-12`}
                  aria-hidden="true"
                >
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </span>
                <div>
                  <h2 className="text-lg font-bold leading-tight text-foreground sm:text-2xl">
                    {cat.name_bn}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                    সেরা ও খাঁটি {cat.name_bn} সরাসরি বিশ্বস্ত উৎস থেকে
                  </p>
                </div>
              </div>
              <Link
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className="hidden shrink-0 text-sm font-semibold text-primary hover:underline sm:inline-flex sm:items-center sm:gap-1"
              >
                সব দেখুন <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
              {cat.products.map((p: any, i: number) => {
                const v = vendorMap?.[p.vendor_id];
                const visClass = i >= 4 ? (i >= 6 ? "hidden lg:block" : "hidden md:block") : "";
                return (
                  <div key={p.id} className={visClass}>
                    <ProductCard
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
                  </div>
                );
              })}
            </div>

            <div className="mt-6 text-center sm:hidden">
              <Button asChild variant="outline" size="sm">
                <Link to={`/products?category=${encodeURIComponent(cat.name)}`}>
                  সব {cat.name_bn} দেখুন <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
        );
      })}
    </>
  );
};

export default CategoryProductSections;
