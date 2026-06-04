import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Store, MapPin, Package, ShoppingCart, Search, Calendar, ShieldCheck,
  MessageCircle, Phone, Star, Facebook, Share2, Heart, Sparkles, ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/ProductCard";
import SEO from "@/components/SEO";
import { buildTelUrl, buildWhatsAppUrl } from "@/lib/contact-helpers";
import { toast } from "@/hooks/use-toast";

const VendorShop = () => {
  const { slug } = useParams<{ slug: string }>();
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [following, setFollowing] = useState(false);

  const { data: vendor, isLoading: vLoading } = useQuery({
    queryKey: ["vendor-public", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendors" as any)
        .select("id,shop_name,shop_name_bn,shop_slug,logo_url,banner_url,description,division,district,upazila,total_orders,created_at,owner_name,whatsapp_number,phone,facebook_url")
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
        .select("id,name,name_bn,price,compare_price,image_url,weight,grade,coming_soon,serial_number,category_id,is_featured,categories(name,name_bn)")
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

  const featured = useMemo(() => (products || []).filter((p: any) => p.is_featured).slice(0, 8), [products]);

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
        <Skeleton className="h-44 w-full rounded-2xl sm:h-64" />
        <Skeleton className="mt-4 h-32 w-full rounded-xl" />
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
  const monthsActive = Math.max(
    1,
    Math.floor((Date.now() - new Date(vendor.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
  );
  const wa = vendor.whatsapp_number || vendor.phone || "";
  const tel = vendor.phone || "";
  const waMsg = `আসসালামু আলাইকুম, ${vendor.shop_name_bn}! আপনার দোকানের পণ্য সম্পর্কে জানতে চাচ্ছি।`;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: vendor.shop_name_bn, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "লিংক কপি হয়েছে" });
    }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <SEO
        title={`${vendor.shop_name_bn} — Sapahar Shop`}
        description={vendor.description || `${vendor.shop_name_bn} এর সকল পণ্য এক জায়গায়।`}
        path={`/shop/${vendor.shop_slug}`}
      />

      {/* HERO BANNER */}
      <div className="relative overflow-hidden">
        <div className="h-44 w-full bg-gradient-to-br from-primary via-primary/85 to-accent sm:h-56 lg:h-72 relative">
          {vendor.banner_url ? (
            <img src={vendor.banner_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0px, transparent 60%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 0px, transparent 50%)",
            }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
        </div>

        {/* Floating shop card overlapping the hero */}
        <div className="container mx-auto px-3 sm:px-4">
          <div className="-mt-20 sm:-mt-24 relative z-10">
            <div className="rounded-2xl border border-border/60 bg-card/95 backdrop-blur-md p-4 shadow-2xl shadow-primary/10 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="shrink-0 mx-auto sm:mx-0">
                  {vendor.logo_url ? (
                    <img src={vendor.logo_url} alt={vendor.shop_name_bn} className="h-24 w-24 rounded-2xl border-4 border-card object-cover shadow-xl ring-2 ring-primary/30 sm:h-28 sm:w-28" />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-card bg-gradient-to-br from-primary to-accent shadow-xl ring-2 ring-primary/30 sm:h-28 sm:w-28">
                      <Store className="h-11 w-11 text-primary-foreground sm:h-12 sm:w-12" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h1 className="text-xl font-bold text-foreground sm:text-2xl lg:text-3xl">{vendor.shop_name_bn}</h1>
                    <Badge className="bg-blue-500/10 text-blue-600 border border-blue-500/30 hover:bg-blue-500/15">
                      <ShieldCheck className="mr-1 h-3 w-3" />যাচাইকৃত
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{vendor.shop_name}</p>

                  <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground sm:justify-start sm:text-xs">
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> ৪.৮ <span className="text-muted-foreground/70">(জনপ্রিয়)</span>
                    </span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{vendor.upazila}, {vendor.district}</span>
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{monthsActive}+ মাস সক্রিয়</span>
                  </div>

                  {vendor.description && (
                    <p className="mt-2 text-xs text-foreground/75 line-clamp-2 sm:text-sm">{vendor.description}</p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 sm:flex-col sm:items-stretch sm:justify-start">
                  <Button
                    onClick={() => { setFollowing(!following); toast({ title: following ? "অনুসরণ বাতিল" : "এই দোকান অনুসরণ করছেন!" }); }}
                    variant={following ? "outline" : "default"}
                    size="sm"
                    className={following ? "border-primary/40" : "bg-primary text-primary-foreground hover:bg-primary/90"}
                  >
                    <Heart className={`mr-1.5 h-4 w-4 ${following ? "fill-primary text-primary" : ""}`} />
                    {following ? "অনুসরণ করছেন" : "অনুসরণ করুন"}
                  </Button>
                  {wa && (
                    <Button asChild size="sm" className="bg-[#25D366] text-white hover:bg-[#1faa54]">
                      <a href={buildWhatsAppUrl(wa, waMsg)} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-1.5 h-4 w-4" /> চ্যাট করুন
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Stats strip */}
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                {[
                  { icon: Package, val: products?.length || 0, label: "মোট পণ্য" },
                  { icon: ShoppingCart, val: vendor.total_orders || 0, label: "মোট অর্ডার" },
                  { icon: Sparkles, val: featured.length, label: "ফিচার্ড" },
                  { icon: Calendar, val: joinDate, label: "যোগদান", small: true },
                ].map((s, i) => (
                  <div key={i} className="rounded-xl border border-border/50 bg-gradient-to-br from-muted/40 to-transparent p-3 text-center transition hover:border-primary/30">
                    <s.icon className="mx-auto mb-1 h-4 w-4 text-primary" />
                    <p className={`font-bold text-foreground ${s.small ? "text-xs sm:text-sm" : "text-base sm:text-lg"}`}>{s.val}</p>
                    <p className="text-[10px] text-muted-foreground sm:text-xs">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Quick action bar (Daraz-style) */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground sm:text-xs">
                  {vendor.facebook_url && (
                    <a href={vendor.facebook_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-blue-600">
                      <Facebook className="h-3.5 w-3.5" /> Facebook
                    </a>
                  )}
                  {tel && (
                    <a href={buildTelUrl(tel)} className="inline-flex items-center gap-1 hover:text-primary">
                      <Phone className="h-3.5 w-3.5" /> {tel}
                    </a>
                  )}
                </div>
                <button onClick={handleShare} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary sm:text-xs">
                  <Share2 className="h-3.5 w-3.5" /> দোকান শেয়ার করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH + CATEGORIES */}
      <div className="container mx-auto px-3 sm:px-4 mt-5">
        <div className="rounded-2xl border border-border/50 bg-card p-3 shadow-sm sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`${vendor.shop_name_bn}-এ পণ্য খুঁজুন...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 bg-muted/30 border-border/60 focus-visible:ring-primary/40"
            />
          </div>

          {grouped.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              <button
                onClick={() => setActiveCat("all")}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition sm:text-sm ${activeCat === "all" ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card text-foreground hover:border-primary/50"}`}
              >
                সব ({products?.length || 0})
              </button>
              {grouped.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setActiveCat(g.id)}
                  className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition sm:text-sm ${activeCat === g.id ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card text-foreground hover:border-primary/50"}`}
                >
                  {g.name_bn} <span className="opacity-70">({g.items.length})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FEATURED STRIP */}
      {featured.length > 0 && activeCat === "all" && !search && (
        <div className="container mx-auto px-3 sm:px-4 mt-5">
          <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-card to-card p-4 shadow-sm dark:from-amber-950/20">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-bold text-foreground sm:text-base">⭐ এই দোকানের সেরা পণ্য</h2>
              </div>
              <span className="text-[10px] text-muted-foreground sm:text-xs">{featured.length}টি</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
              {featured.map((p: any) => (
                <ProductCard key={p.id} {...p} category_name_bn={p.categories?.name_bn} hideSeller />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS */}
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {pLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-lg" />)}
          </div>
        ) : activeCat === "all" && !search ? (
          <div className="space-y-8">
            {grouped.map((g) => (
              <section key={g.id} className="rounded-2xl border border-border/40 bg-card/70 p-4 shadow-sm sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-base font-bold text-foreground sm:text-lg">
                    <span className="inline-block h-5 w-1 rounded-full bg-primary" />
                    {g.name_bn}
                  </h2>
                  <button
                    onClick={() => setActiveCat(g.id)}
                    className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
                  >
                    সব দেখুন ({g.items.length}) <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
                  {g.items.slice(0, 8).map((p: any) => (
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

      {/* FLOATING CONTACT BUTTONS */}
      {(wa || tel) && (
        <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-2 sm:bottom-6 sm:right-6">
          {wa && (
            <a
              href={buildWhatsAppUrl(wa, waMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 transition hover:scale-110 hover:bg-[#1faa54] sm:h-14 sm:w-14"
              aria-label="WhatsApp"
            >
              <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
            </a>
          )}
          {tel && (
            <a
              href={buildTelUrl(tel)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-110 hover:bg-primary/90 sm:h-14 sm:w-14"
              aria-label="Call"
            >
              <Phone className="h-5 w-5 sm:h-6 sm:w-6" />
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default VendorShop;
