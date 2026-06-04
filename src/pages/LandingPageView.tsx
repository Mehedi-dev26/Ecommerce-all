import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Truck, Shield, Clock, Check, Star, Phone, Leaf, Loader2, Minus, Plus, ShoppingBag, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { themeToStyle, getThemeById } from "@/lib/landing-page-themes";
import { divisions as bdLocations } from "@/data/bd-locations";
import SEO from "@/components/SEO";
import NotFound from "./NotFound";

const iconMap: Record<string, typeof Truck> = {
  truck: Truck, shield: Shield, clock: Clock, check: Check,
  star: Star, phone: Phone, leaf: Leaf,
};

interface LandingPageData {
  id: string;
  slug: string;
  title: string;
  meta_description: string | null;
  theme_preset: string;
  hero_headline: string;
  hero_subheadline: string | null;
  hero_image_url: string | null;
  cta_text: string;
  products: Array<{ product_id: string; special_price?: number | null }>;
  enable_bundle: boolean;
  bundle_discount_percent: number;
  bundle_label: string | null;
  bullet_points: Array<{ text: string }>;
  long_description: string | null;
  faq_items: Array<{ question: string; answer: string }>;
  trust_badges: Array<{ icon: string; label: string }>;
  countdown_enabled: boolean;
  countdown_end_at: string | null;
  stock_counter_enabled: boolean;
  stock_counter_value: number | null;
  facebook_pixel_id: string | null;
}

interface ProductInfo {
  id: string;
  name_bn: string;
  price: number;
  image_url: string | null;
  description_bn: string | null;
}

const Countdown = ({ endAt, compact = false }: { endAt: string; compact?: boolean }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, new Date(endAt).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (diff === 0) return null;
  return (
    <div className={`flex items-center justify-center gap-1.5 sm:gap-2 ${compact ? "" : "my-4"}`}>
      {[
        { v: d, l: "দিন" }, { v: h, l: "ঘন্টা" }, { v: m, l: "মিনিট" }, { v: s, l: "সেকেন্ড" },
      ].map((x, i) => (
        <div
          key={i}
          className={`rounded-lg text-center ${compact ? "px-2 py-1.5 min-w-[44px]" : "px-3 py-2 min-w-[56px]"}`}
          style={{ backgroundColor: "hsl(var(--lp-urgent))", color: "hsl(var(--lp-primary-foreground))" }}
        >
          <div className={`font-bold tabular-nums ${compact ? "text-base" : "text-xl"}`}>{String(x.v).padStart(2, "0")}</div>
          <div className="text-[10px] opacity-90 leading-none">{x.l}</div>
        </div>
      ))}
    </div>
  );
};

const LandingPageView = () => {
  const params = useParams<{ slug?: string; vendorSlug?: string; customSlug?: string }>();
  const isVendorRoute = !!params.vendorSlug && !!params.customSlug;
  const slug = isVendorRoute ? params.customSlug! : params.slug!;
  const navigate = useNavigate();
  const [data, setData] = useState<LandingPageData | null>(null);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Order form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      let lp: any = null;
      if (isVendorRoute) {
        const { data: rpcData } = await supabase.rpc("lookup_vendor_landing_page" as any, {
          _vendor_slug: params.vendorSlug!,
          _custom_slug: params.customSlug!,
        });
        lp = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      } else {
        const { data: row } = await supabase
          .from("landing_pages")
          .select("*")
          .eq("slug", slug)
          .is("vendor_id", null)
          .eq("status", "published")
          .maybeSingle();
        lp = row;
      }

      if (!lp) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const typed = lp as unknown as LandingPageData;
      setData(typed);

      const productIds = typed.products.map((p) => p.product_id);
      if (productIds.length > 0) {
        const { data: prods } = await supabase
          .from("products")
          .select("id,name_bn,price,image_url,description_bn")
          .in("id", productIds);
        setProducts(prods || []);
        const initQ: Record<string, number> = {};
        (prods || []).forEach((p) => { initQ[p.id] = 1; });
        setQuantities(initQ);
      }
      setLoading(false);
      if (!isVendorRoute) {
        void supabase.rpc("increment_landing_page_view", { _slug: slug });
      } else {
        const lpId = (typed as any).id;
        void supabase.rpc("increment_landing_page_view" as any, { _slug: slug }).then(() => {
          // RPC is scoped to vendor_id IS NULL admin pages — fall back to direct update for vendor pages
        });
        if (lpId) {
          void supabase
            .from("landing_pages")
            .update({ view_count: ((typed as any).view_count || 0) + 1 } as any)
            .eq("id", lpId);
        }
      }
    })();
  }, [slug, isVendorRoute, params.vendorSlug, params.customSlug]);

  // Inject Facebook Pixel
  useEffect(() => {
    if (!data?.facebook_pixel_id) return;
    const pixelId = data.facebook_pixel_id;
    const script = document.createElement("script");
    script.innerHTML = `
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init','${pixelId}');fbq('track','PageView');
    `;
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [data?.facebook_pixel_id]);

  const theme = useMemo(() => getThemeById(data?.theme_preset || "mango_yellow"), [data]);

  const districts = useMemo(
    () => (division ? bdLocations.find((d) => d.name === division)?.districts || [] : []),
    [division]
  );
  const upazilas = useMemo(
    () => (district ? districts.find((d) => d.name === district)?.upazilas || [] : []),
    [district, districts]
  );

  const { subtotal, total, savings, totalItems } = useMemo(() => {
    if (!data) return { subtotal: 0, total: 0, savings: 0, totalItems: 0 };
    let sub = 0;
    let items = 0;
    data.products.forEach((sel) => {
      const p = products.find((x) => x.id === sel.product_id);
      if (!p) return;
      const qty = quantities[p.id] || 0;
      const price = sel.special_price ?? p.price;
      sub += price * qty;
      items += qty;
    });
    const disc = data.enable_bundle && data.products.length > 1
      ? sub * (data.bundle_discount_percent / 100) : 0;
    return { subtotal: sub, total: sub - disc, savings: disc, totalItems: items };
  }, [data, products, quantities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    if (!name.trim() || !/^01[3-9]\d{8}$/.test(phone)) {
      toast.error("নাম ও সঠিক ফোন নম্বর দিন");
      return;
    }
    if (!division || !district || !upazila || !address.trim()) {
      toast.error("সম্পূর্ণ ঠিকানা দিন");
      return;
    }
    const items = data.products
      .map((sel) => {
        const p = products.find((x) => x.id === sel.product_id);
        if (!p) return null;
        const qty = quantities[p.id] || 0;
        if (qty < 1) return null;
        return {
          product_id: p.id,
          product_name: p.name_bn,
          price: sel.special_price ?? p.price,
          quantity: qty,
        };
      })
      .filter(Boolean) as Array<{ product_id: string; product_name: string; price: number; quantity: number }>;
    if (items.length === 0) {
      toast.error("কমপক্ষে ১টি পণ্য নিন");
      return;
    }

    setSubmitting(true);
    const orderNumber = `SM-${Date.now().toString().slice(-6)}`;
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: name.trim(),
        customer_phone: phone,
        shipping_address: address.trim(),
        city: upazila,
        district: district,
        subtotal: subtotal,
        shipping_cost: 0,
        total: total,
        landing_page_id: data.id,
        notes: `Landing page: ${data.slug}`,
      })
      .select("id,order_number")
      .single();

    if (error || !order) {
      toast.error("অর্ডার ব্যর্থ: " + (error?.message || ""));
      setSubmitting(false);
      return;
    }
    await supabase.from("order_items").insert(
      items.map((it) => ({ ...it, order_id: order.id }))
    );

    if (data.facebook_pixel_id && (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq) {
      (window as unknown as { fbq: (...a: unknown[]) => void }).fbq("track", "Purchase", {
        value: total,
        currency: "BDT",
      });
    }

    toast.success("অর্ডার সফল হয়েছে!");
    navigate(`/order-success/${order.order_number}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (notFound || !data) return <NotFound />;

  // Reusable Order Form (used in both mobile inline + desktop sticky aside)
  const OrderForm = ({ idSuffix = "" }: { idSuffix?: string }) => (
    <form
      onSubmit={handleSubmit}
      className="p-4 sm:p-5 lg:p-6 rounded-2xl space-y-3.5"
      style={{ backgroundColor: "hsl(var(--lp-card))", border: "1px solid hsl(var(--lp-border))" }}
    >
      <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: "hsl(var(--lp-border))" }}>
        <ShoppingBag className="h-5 w-5" style={{ color: "hsl(var(--lp-primary))" }} />
        <h3 className="font-bold text-base lg:text-lg">অর্ডার ফর্ম</h3>
      </div>

      {/* Products with qty */}
      <div className="space-y-2">
        {data.products.map((sel) => {
          const p = products.find((x) => x.id === sel.product_id);
          if (!p) return null;
          const price = sel.special_price ?? p.price;
          const qty = quantities[p.id] || 0;
          return (
            <div
              key={p.id}
              className="flex items-center gap-2.5 p-2.5 rounded-lg"
              style={{ backgroundColor: "hsl(var(--lp-muted))" }}
            >
              {p.image_url && (
                <img src={p.image_url} alt={p.name_bn} loading="lazy" className="h-12 w-12 rounded object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs sm:text-sm leading-tight truncate">{p.name_bn}</p>
                <p className="text-xs sm:text-sm font-semibold mt-0.5" style={{ color: "hsl(var(--lp-primary))" }}>
                  ৳{price}
                  {sel.special_price && (
                    <span className="line-through ml-1.5 text-[10px] opacity-60 font-normal">৳{p.price}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  type="button" size="icon" variant="outline" className="h-7 w-7"
                  onClick={() => setQuantities((q) => ({ ...q, [p.id]: Math.max(0, (q[p.id] || 0) - 1) }))}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-7 text-center font-semibold text-sm">{qty}</span>
                <Button
                  type="button" size="icon" variant="outline" className="h-7 w-7"
                  onClick={() => setQuantities((q) => ({ ...q, [p.id]: (q[p.id] || 0) + 1 }))}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {data.enable_bundle && savings > 0 && (
        <div
          className="p-2.5 rounded-lg text-xs sm:text-sm font-semibold text-center flex items-center justify-center gap-1.5"
          style={{ backgroundColor: "hsl(var(--lp-success) / 0.15)", color: "hsl(var(--lp-success))" }}
        >
          <Sparkles className="h-4 w-4" />
          {data.bundle_label || "বান্ডেল ছাড়"}: ৳{Math.round(savings)} সাশ্রয়!
        </div>
      )}

      <div className="space-y-3">
        <div>
          <Label htmlFor={`name${idSuffix}`} className="text-xs sm:text-sm">আপনার নাম *</Label>
          <Input id={`name${idSuffix}`} value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} className="mt-1 h-10" />
        </div>
        <div>
          <Label htmlFor={`phone${idSuffix}`} className="text-xs sm:text-sm">মোবাইল নম্বর *</Label>
          <Input
            id={`phone${idSuffix}`} type="tel" inputMode="numeric"
            value={phone} onChange={(e) => setPhone(e.target.value)}
            required placeholder="01XXXXXXXXX" maxLength={11}
            className="mt-1 h-10"
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          <Select value={division} onValueChange={(v) => { setDivision(v); setDistrict(""); setUpazila(""); }}>
            <SelectTrigger className="h-10"><SelectValue placeholder="বিভাগ *" /></SelectTrigger>
            <SelectContent>
              {bdLocations.map((d) => <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={district} onValueChange={(v) => { setDistrict(v); setUpazila(""); }} disabled={!division}>
            <SelectTrigger className="h-10"><SelectValue placeholder="জেলা *" /></SelectTrigger>
            <SelectContent>
              {districts.map((d) => <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={upazila} onValueChange={setUpazila} disabled={!district}>
            <SelectTrigger className="h-10"><SelectValue placeholder="উপজেলা *" /></SelectTrigger>
            <SelectContent>
              {upazilas.map((u) => <SelectItem key={u.name} value={u.name}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={`address${idSuffix}`} className="text-xs sm:text-sm">সম্পূর্ণ ঠিকানা *</Label>
          <Textarea id={`address${idSuffix}`} value={address} onChange={(e) => setAddress(e.target.value)} required maxLength={500} rows={2} className="mt-1" />
        </div>
      </div>

      <div
        className="p-3 rounded-lg flex items-center justify-between font-bold"
        style={{ backgroundColor: "hsl(var(--lp-primary) / 0.1)" }}
      >
        <span className="text-sm">মোট ({totalItems} পণ্য)</span>
        <span className="text-lg lg:text-xl" style={{ color: "hsl(var(--lp-primary))" }}>৳{Math.round(total)}</span>
      </div>

      <Button
        type="submit" disabled={submitting || total === 0}
        className="w-full h-12 text-sm sm:text-base font-bold"
        style={{
          backgroundColor: "hsl(var(--lp-primary))",
          color: "hsl(var(--lp-primary-foreground))",
        }}
      >
        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>🛒 {data.cta_text}</>}
      </Button>

      <p className="text-[11px] text-center" style={{ color: "hsl(var(--lp-muted-foreground))" }}>
        🔒 ক্যাশ অন ডেলিভারি · নিরাপদ অর্ডার
      </p>
    </form>
  );

  return (
    <div style={themeToStyle(theme)}>
      <SEO
        title={data.title}
        description={data.meta_description || data.hero_headline}
        path={`/${data.slug}`}
        image={data.hero_image_url || undefined}
      />

      <div
        className="min-h-screen pb-20 lg:pb-0"
        style={{ backgroundColor: "hsl(var(--lp-bg))", color: "hsl(var(--lp-fg))" }}
      >
        {/* ========== HERO + ORDER FORM (Split layout on desktop) ========== */}
        <section className="px-4 sm:px-6 lg:px-8 py-6 lg:py-12 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6 lg:gap-10 items-start">
            {/* LEFT: Hero content */}
            <div className="text-center lg:text-left">
              {data.stock_counter_enabled && data.stock_counter_value && (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-3 lg:mb-4"
                  style={{ backgroundColor: "hsl(var(--lp-urgent) / 0.15)", color: "hsl(var(--lp-urgent))" }}
                >
                  ⚡ মাত্র {data.stock_counter_value} টি বাকি!
                </span>
              )}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight mb-3 lg:mb-4">
                {data.hero_headline}
              </h1>
              {data.hero_subheadline && (
                <p
                  className="text-sm sm:text-base lg:text-lg xl:text-xl mb-4 lg:mb-5 leading-relaxed"
                  style={{ color: "hsl(var(--lp-muted-foreground))" }}
                >
                  {data.hero_subheadline}
                </p>
              )}
              {data.hero_image_url && (
                <img
                  src={data.hero_image_url}
                  alt={data.hero_headline}
                  loading="eager"
                  className="w-full max-w-md lg:max-w-full mx-auto lg:mx-0 rounded-xl lg:rounded-2xl shadow-xl lg:shadow-2xl mb-4 lg:mb-6 aspect-[4/3] object-cover"
                />
              )}
              {data.countdown_enabled && data.countdown_end_at && (
                <div className="mb-4">
                  <p className="text-xs font-semibold mb-2 opacity-80">⏰ অফার শেষ হতে বাকি:</p>
                  <Countdown endAt={data.countdown_end_at} />
                </div>
              )}
              {/* Mobile-only inline CTA to scroll to form */}
              <a
                href={`#order-form`}
                className="lg:hidden inline-block w-full px-6 py-3.5 rounded-full text-sm font-bold transition-transform active:scale-95 shadow-lg"
                style={{
                  backgroundColor: "hsl(var(--lp-primary))",
                  color: "hsl(var(--lp-primary-foreground))",
                }}
              >
                🛒 {data.cta_text}
              </a>
            </div>

            {/* RIGHT: Order form (sticky on desktop) */}
            <div id="order-form" className="lg:sticky lg:top-6">
              <OrderForm idSuffix="-desktop" />
            </div>
          </div>
        </section>

        {/* ========== TRUST BADGES ========== */}
        {data.trust_badges.length > 0 && (
          <section className="px-4 sm:px-6 py-5 lg:py-8" style={{ backgroundColor: "hsl(var(--lp-muted))" }}>
            <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-6">
              {data.trust_badges.map((b, i) => {
                const Icon = iconMap[b.icon] || Check;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 lg:gap-3 justify-center p-3 lg:p-4 rounded-xl"
                    style={{ backgroundColor: "hsl(var(--lp-card))", border: "1px solid hsl(var(--lp-border))" }}
                  >
                    <div
                      className="h-9 w-9 lg:h-11 lg:w-11 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "hsl(var(--lp-primary) / 0.15)" }}
                    >
                      <Icon className="h-4 w-4 lg:h-5 lg:w-5" style={{ color: "hsl(var(--lp-primary))" }} />
                    </div>
                    <span className="font-semibold text-xs lg:text-sm">{b.label}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ========== MULTI-PRODUCT SHOWCASE (Desktop grid, mobile list) ========== */}
        {products.length > 1 && (
          <section className="px-4 sm:px-6 py-10 lg:py-14 max-w-6xl mx-auto">
            <div className="text-center mb-6 lg:mb-10">
              <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold mb-2">এই অফারে যা যা পাচ্ছেন</h2>
              <p className="text-sm lg:text-base" style={{ color: "hsl(var(--lp-muted-foreground))" }}>
                {products.length} টি প্রিমিয়াম পণ্য একসাথে
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {data.products.map((sel) => {
                const p = products.find((x) => x.id === sel.product_id);
                if (!p) return null;
                const price = sel.special_price ?? p.price;
                const hasDiscount = sel.special_price && sel.special_price < p.price;
                return (
                  <div
                    key={p.id}
                    className="rounded-2xl overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-xl"
                    style={{ backgroundColor: "hsl(var(--lp-card))", border: "1px solid hsl(var(--lp-border))" }}
                  >
                    {p.image_url && (
                      <div className="relative aspect-square overflow-hidden" style={{ backgroundColor: "hsl(var(--lp-muted))" }}>
                        <img
                          src={p.image_url} alt={p.name_bn} loading="lazy"
                          className="w-full h-full object-cover"
                        />
                        {hasDiscount && (
                          <span
                            className="absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-bold"
                            style={{ backgroundColor: "hsl(var(--lp-urgent))", color: "hsl(var(--lp-primary-foreground))" }}
                          >
                            -{Math.round(((p.price - price) / p.price) * 100)}%
                          </span>
                        )}
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-base lg:text-lg mb-2 line-clamp-2">{p.name_bn}</h3>
                      {p.description_bn && (
                        <p className="text-xs lg:text-sm mb-3 line-clamp-2" style={{ color: "hsl(var(--lp-muted-foreground))" }}>
                          {p.description_bn}
                        </p>
                      )}
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl lg:text-2xl font-bold" style={{ color: "hsl(var(--lp-primary))" }}>
                          ৳{price}
                        </span>
                        {hasDiscount && (
                          <span className="text-sm line-through opacity-50">৳{p.price}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ========== BULLETS — 2 col on desktop ========== */}
        {data.bullet_points.length > 0 && (
          <section className="px-4 sm:px-6 py-10 lg:py-14 max-w-5xl mx-auto">
            <h2 className="text-2xl lg:text-3xl font-bold mb-6 lg:mb-8 text-center">কী কী পাবেন</h2>
            <div className="grid md:grid-cols-2 gap-3 lg:gap-4">
              {data.bullet_points.map((b, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 lg:p-5 rounded-xl transition-transform hover:translate-y-[-2px]"
                  style={{ backgroundColor: "hsl(var(--lp-card))", border: "1px solid hsl(var(--lp-border))" }}
                >
                  <div
                    className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "hsl(var(--lp-primary) / 0.15)" }}
                  >
                    <Check className="h-5 w-5" style={{ color: "hsl(var(--lp-primary))" }} />
                  </div>
                  <p className="text-sm lg:text-base leading-relaxed pt-1">{b.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========== DESCRIPTION ========== */}
        {data.long_description && (
          <section className="px-4 sm:px-6 py-8 lg:py-12 max-w-4xl mx-auto">
            <div
              className="p-5 lg:p-8 rounded-2xl whitespace-pre-wrap text-sm lg:text-base leading-relaxed"
              style={{ backgroundColor: "hsl(var(--lp-card))", border: "1px solid hsl(var(--lp-border))" }}
            >
              {data.long_description}
            </div>
          </section>
        )}

        {/* ========== MOBILE-ONLY ORDER FORM (Desktop already has it sticky in hero) ========== */}
        <section
          id="order-form-mobile"
          className="lg:hidden px-4 py-10"
          style={{ backgroundColor: "hsl(var(--lp-muted))" }}
        >
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4 text-center">এখনই অর্ডার করুন</h2>
            <OrderForm idSuffix="-mobile" />
          </div>
        </section>

        {/* ========== FAQ — 2 col on desktop ========== */}
        {data.faq_items.length > 0 && (
          <section className="px-4 sm:px-6 py-10 lg:py-14 max-w-5xl mx-auto">
            <h2 className="text-2xl lg:text-3xl font-bold mb-6 lg:mb-8 text-center">সাধারণ প্রশ্ন</h2>
            <div className="grid md:grid-cols-2 gap-3 lg:gap-4">
              {data.faq_items.map((f, i) => (
                <details
                  key={i}
                  className="p-4 lg:p-5 rounded-xl cursor-pointer group"
                  style={{ backgroundColor: "hsl(var(--lp-card))", border: "1px solid hsl(var(--lp-border))" }}
                >
                  <summary className="font-semibold text-sm lg:text-base flex items-center justify-between gap-2 list-none">
                    <span>{f.question}</span>
                    <span className="text-xl transition-transform group-open:rotate-45 shrink-0" style={{ color: "hsl(var(--lp-primary))" }}>+</span>
                  </summary>
                  <p className="mt-3 text-xs lg:text-sm leading-relaxed" style={{ color: "hsl(var(--lp-muted-foreground))" }}>
                    {f.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        <footer className="text-center py-6 text-xs px-4" style={{ color: "hsl(var(--lp-muted-foreground))" }}>
          © {new Date().getFullYear()} {data.title} · সকল অধিকার সংরক্ষিত
        </footer>

        {/* Sticky mobile CTA */}
        <a
          href="#order-form-mobile"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-50 text-center py-3.5 font-bold text-sm shadow-[0_-4px_16px_rgba(0,0,0,0.15)] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          style={{
            backgroundColor: "hsl(var(--lp-primary))",
            color: "hsl(var(--lp-primary-foreground))",
          }}
        >
          <ShoppingBag className="h-4 w-4" />
          {data.cta_text} {total > 0 && `— ৳${Math.round(total)}`}
        </a>
      </div>
    </div>
  );
};

export default LandingPageView;
