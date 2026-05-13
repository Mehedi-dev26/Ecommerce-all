import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Store, MapPin, Package, ShoppingCart, Search, Calendar, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/ProductCard";
import SEO from "@/components/SEO";

const VendorShop = () => {
  const { slug } = useParams<{ slug: string }>();
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");

  const { data: vendor, isLoading: vLoading } = useQuery({
    queryKey: ["vendor-public", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendors" as any)
        .select("id,shop_name,shop_name_bn,shop_slug,logo_url,banner_url,description,division,district,upazila,total_orders,created_at,owner_name")
        .eq("shop_slug", slug!)
        .eq("status", "approved")
        .maybeSingle();
      return data as any;
    },
    enabled: !!slug,
  });

  const { data: products, isLoading: pLoading } = useQuery({
    queryKey: ["vendor-products", vendor?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,name_bn,price,compare_price,image_url,weight,grade,coming_soon,category_id,categories(name,name_bn)")
        .eq("vendor_id", vendor.id)
        .eq("is_active", true)
        .eq("vendor_status", "approved")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!vendor?.id,
  });

  const grouped = useMemo(() => {
    const map = new Map<string, { id: string; name_bn: string; items: any[] }>();
    (products || []).forEach((p: any) => {
      const cid = p.category_id || "uncat";
      const cname = p.categories?.name_bn || "অন্যান্য";
      if (!map.has(cid)) map.set(cid, { id: cid, name_bn: cname, items: [] });
      map.get(cid)!.items.push(p);
    });
    return Array.from(map.values());
  }, [products]);

  const filtered = useMemo(() => {
    let list = products || [];
    if (activeCat !== "all") list = list.filter((p: any) => (p.category_id || "uncat") === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p: any) => p.name_bn?.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q));
    }
    return list;
  }, [products, activeCat, search]);

  if (vLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Skeleton className="h-40 w-full rounded-2xl sm:h-56" />
        <Skeleton className="mt-4 h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Store className="mx-auto mb-4 h-16 w-16 text-muted-foreground/40" />
        <h1 className="text-xl font-bold text-foreground">দোকান পাওয়া যায়নি</h1>
        <p className="mt-2 text-sm text-muted-foreground">এই দোকানটি আর সক্রিয় নেই অথবা মুছে ফেলা হয়েছে।</p>
        <Button asChild className="mt-6"><Link to="/products">পণ্য ব্রাউজ করুন</Link></Button>
      </div>
    );
  }

  const joinDate = new Date(vendor.created_at).toLocaleDateString("bn-BD", { year: "numeric", month: "long" });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${vendor.shop_name_bn} — Sapahar Shop`}
        description={vendor.description || `${vendor.shop_name_bn} এর সকল পণ্য এক জায়গায়।`}
        path={`/shop/${vendor.shop_slug}`}
      />

      {/* Banner / Header */}
      <div className="relative">
        <div className="h-32 w-full bg-gradient-to-br from-primary/80 via-primary to-accent sm:h-44 lg:h-56 overflow-hidden">
          {vendor.banner_url && (
            <img src={vendor.banner_url} alt="" className="h-full w-full object-cover opacity-90" />
          )}
        </div>
        <div className="container mx-auto px-4">
          <div className="-mt-12 sm:-mt-16">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-lg sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="shrink-0">
                  {vendor.logo_url ? (
                    <img src={vendor.logo_url} alt={vendor.shop_name_bn} className="h-20 w-20 rounded-2xl border-4 border-card object-cover shadow-md sm:h-24 sm:w-24" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-card bg-primary/10 shadow-md sm:h-24 sm:w-24">
                      <Store className="h-9 w-9 text-primary sm:h-10 sm:w-10" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-bold text-foreground sm:text-2xl">{vendor.shop_name_bn}</h1>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20"><ShieldCheck className="mr-1 h-3 w-3" />যাচাইকৃত</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{vendor.shop_name}</p>
                  {vendor.description && (
                    <p className="mt-2 text-xs text-foreground/80 sm:text-sm line-clamp-2">{vendor.description}</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                <div className="rounded-xl border bg-muted/30 p-3 text-center">
                  <Package className="mx-auto mb-1 h-4 w-4 text-primary" />
                  <p className="text-base font-bold text-foreground sm:text-lg">{products?.length || 0}</p>
                  <p className="text-[10px] text-muted-foreground sm:text-xs">মোট পণ্য</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3 text-center">
                  <ShoppingCart className="mx-auto mb-1 h-4 w-4 text-primary" />
                  <p className="text-base font-bold text-foreground sm:text-lg">{vendor.total_orders || 0}</p>
                  <p className="text-[10px] text-muted-foreground sm:text-xs">মোট অর্ডার</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3 text-center">
                  <MapPin className="mx-auto mb-1 h-4 w-4 text-primary" />
                  <p className="text-xs font-bold text-foreground line-clamp-1 sm:text-sm">{vendor.district}</p>
                  <p className="text-[10px] text-muted-foreground sm:text-xs">{vendor.upazila}</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3 text-center">
                  <Calendar className="mx-auto mb-1 h-4 w-4 text-primary" />
                  <p className="text-xs font-bold text-foreground sm:text-sm">{joinDate}</p>
                  <p className="text-[10px] text-muted-foreground sm:text-xs">যোগদান</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Categories */}
      <div className="container mx-auto px-4 mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="এই দোকানে পণ্য খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Category pills */}
        {grouped.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveCat("all")}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition sm:text-sm ${activeCat === "all" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/50"}`}
            >
              সব ({products?.length || 0})
            </button>
            {grouped.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveCat(g.id)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition sm:text-sm ${activeCat === g.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/50"}`}
              >
                {g.name_bn} ({g.items.length})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {pLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-lg" />)}
          </div>
        ) : activeCat === "all" && !search ? (
          // Group by category
          <div className="space-y-8">
            {grouped.map((g) => (
              <section key={g.id}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-foreground sm:text-lg">{g.name_bn}</h2>
                  <span className="text-xs text-muted-foreground">{g.items.length}টি পণ্য</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
                  {g.items.map((p: any) => (
                    <ProductCard key={p.id} {...p} category_name_bn={p.categories?.name_bn} hideSeller />
                  ))}
                </div>
              </section>
            ))}
            {grouped.length === 0 && (
              <div className="py-16 text-center text-muted-foreground">
                <Package className="mx-auto mb-3 h-12 w-12 opacity-40" />
                <p>এই দোকানে এখনো কোনো পণ্য নেই।</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
            {filtered.map((p: any) => (
              <ProductCard key={p.id} {...p} category_name_bn={p.categories?.name_bn} hideSeller />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-16 text-center text-muted-foreground">
                <Package className="mx-auto mb-3 h-12 w-12 opacity-40" />
                <p>কোনো পণ্য পাওয়া যায়নি।</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorShop;
