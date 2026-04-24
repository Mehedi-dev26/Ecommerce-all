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
import { Truck, Shield, Clock, Check, Star, Phone, Leaf, Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { LANDING_THEMES, themeToStyle, getThemeById } from "@/lib/landing-page-themes";
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

const Countdown = ({ endAt }: { endAt: string }) => {
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
    <div className="flex items-center justify-center gap-2 my-4">
      {[
        { v: d, l: "দিন" }, { v: h, l: "ঘন্টা" }, { v: m, l: "মিনিট" }, { v: s, l: "সেকেন্ড" },
      ].map((x, i) => (
        <div
          key={i}
          className="px-3 py-2 rounded-lg min-w-[56px] text-center"
          style={{ backgroundColor: "hsl(var(--lp-urgent))", color: "hsl(var(--lp-primary-foreground))" }}
        >
          <div className="text-xl font-bold tabular-nums">{String(x.v).padStart(2, "0")}</div>
          <div className="text-[10px] opacity-90">{x.l}</div>
        </div>
      ))}
    </div>
  );
};

const LandingPageView = () => {
  const { slug } = useParams<{ slug: string }>();
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
      const { data: lp } = await supabase
        .from("landing_pages")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

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
      // Increment view count (fire-and-forget)
      void supabase.rpc("increment_landing_page_view", { _slug: slug });
    })();
  }, [slug]);

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

  const { subtotal, total, savings } = useMemo(() => {
    if (!data) return { subtotal: 0, total: 0, savings: 0 };
    let sub = 0;
    data.products.forEach((sel) => {
      const p = products.find((x) => x.id === sel.product_id);
      if (!p) return;
      const qty = quantities[p.id] || 0;
      const price = sel.special_price ?? p.price;
      sub += price * qty;
    });
    const disc = data.enable_bundle && data.products.length > 1
      ? sub * (data.bundle_discount_percent / 100) : 0;
    return { subtotal: sub, total: sub - disc, savings: disc };
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

    // FB Pixel Purchase
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

  return (
    <div style={themeToStyle(theme)}>
      <SEO
        title={data.title}
        description={data.meta_description || data.hero_headline}
        path={`/${data.slug}`}
        image={data.hero_image_url || undefined}
      />

      <div
        className="min-h-screen"
        style={{ backgroundColor: "hsl(var(--lp-bg))", color: "hsl(var(--lp-fg))" }}
      >
        {/* HERO */}
        <section className="px-4 py-8 md:py-14 max-w-5xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-3">
            {data.hero_headline}
          </h1>
          {data.hero_subheadline && (
            <p
              className="text-base md:text-xl mb-6"
              style={{ color: "hsl(var(--lp-muted-foreground))" }}
            >
              {data.hero_subheadline}
            </p>
          )}
          {data.hero_image_url && (
            <img
              src={data.hero_image_url}
              alt={data.hero_headline}
              className="w-full max-w-2xl mx-auto rounded-2xl shadow-2xl mb-6"
            />
          )}
          {data.countdown_enabled && data.countdown_end_at && (
            <Countdown endAt={data.countdown_end_at} />
          )}
          {data.stock_counter_enabled && data.stock_counter_value && (
            <p
              className="inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4"
              style={{ backgroundColor: "hsl(var(--lp-urgent) / 0.15)", color: "hsl(var(--lp-urgent))" }}
            >
              ⚡ মাত্র {data.stock_counter_value} টি বাকি!
            </p>
          )}
          <a
            href="#order-form"
            className="inline-block px-8 py-4 rounded-full text-base md:text-lg font-bold transition-transform hover:scale-105 shadow-lg"
            style={{
              backgroundColor: "hsl(var(--lp-primary))",
              color: "hsl(var(--lp-primary-foreground))",
            }}
          >
            {data.cta_text}
          </a>
        </section>

        {/* TRUST BADGES */}
        {data.trust_badges.length > 0 && (
          <section className="px-4 py-6" style={{ backgroundColor: "hsl(var(--lp-muted))" }}>
            <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.trust_badges.map((b, i) => {
                const Icon = iconMap[b.icon] || Check;
                return (
                  <div key={i} className="flex items-center gap-2 justify-center text-sm">
                    <Icon className="h-5 w-5" style={{ color: "hsl(var(--lp-primary))" }} />
                    <span className="font-medium">{b.label}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* BULLETS */}
        {data.bullet_points.length > 0 && (
          <section className="px-4 py-10 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">কী কী পাবেন</h2>
            <div className="space-y-3">
              {data.bullet_points.map((b, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ backgroundColor: "hsl(var(--lp-card))", border: "1px solid hsl(var(--lp-border))" }}
                >
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "hsl(var(--lp-primary) / 0.15)" }}
                  >
                    <Check className="h-4 w-4" style={{ color: "hsl(var(--lp-primary))" }} />
                  </div>
                  <p className="text-base">{b.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* DESCRIPTION */}
        {data.long_description && (
          <section className="px-4 py-8 max-w-3xl mx-auto">
            <div
              className="p-6 rounded-2xl whitespace-pre-wrap"
              style={{ backgroundColor: "hsl(var(--lp-card))", border: "1px solid hsl(var(--lp-border))" }}
            >
              {data.long_description}
            </div>
          </section>
        )}

        {/* ORDER FORM */}
        <section
          id="order-form"
          className="px-4 py-12"
          style={{ backgroundColor: "hsl(var(--lp-muted))" }}
        >
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
              অর্ডার করুন
            </h2>
            <form
              onSubmit={handleSubmit}
              className="p-6 rounded-2xl space-y-4"
              style={{ backgroundColor: "hsl(var(--lp-card))", border: "1px solid hsl(var(--lp-border))" }}
            >
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
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ backgroundColor: "hsl(var(--lp-muted))" }}
                    >
                      {p.image_url && (
                        <img src={p.image_url} alt={p.name_bn} className="h-14 w-14 rounded object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{p.name_bn}</p>
                        <p className="text-sm" style={{ color: "hsl(var(--lp-primary))" }}>
                          ৳{price}
                          {sel.special_price && (
                            <span className="line-through ml-2 text-xs opacity-60">৳{p.price}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => setQuantities((q) => ({ ...q, [p.id]: Math.max(0, (q[p.id] || 0) - 1) }))}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-semibold">{qty}</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
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
                  className="p-3 rounded-lg text-sm font-semibold text-center"
                  style={{ backgroundColor: "hsl(var(--lp-success) / 0.15)", color: "hsl(var(--lp-success))" }}
                >
                  🎉 {data.bundle_label || "বান্ডেল ছাড়"}: ৳{Math.round(savings)} সাশ্রয়!
                </div>
              )}

              <div>
                <Label>আপনার নাম *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} className="mt-1.5" />
              </div>
              <div>
                <Label>মোবাইল নম্বর *</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="01XXXXXXXXX"
                  maxLength={11}
                  className="mt-1.5"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Select value={division} onValueChange={(v) => { setDivision(v); setDistrict(""); setUpazila(""); }}>
                  <SelectTrigger><SelectValue placeholder="বিভাগ *" /></SelectTrigger>
                  <SelectContent>
                    {bdLocations.map((d) => <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={district} onValueChange={(v) => { setDistrict(v); setUpazila(""); }} disabled={!division}>
                  <SelectTrigger><SelectValue placeholder="জেলা *" /></SelectTrigger>
                  <SelectContent>
                    {districts.map((d) => <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={upazila} onValueChange={setUpazila} disabled={!district}>
                  <SelectTrigger><SelectValue placeholder="উপজেলা *" /></SelectTrigger>
                  <SelectContent>
                    {upazilas.map((u) => <SelectItem key={u.name} value={u.name}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>সম্পূর্ণ ঠিকানা *</Label>
                <Textarea value={address} onChange={(e) => setAddress(e.target.value)} required maxLength={500} rows={2} className="mt-1.5" />
              </div>

              <div
                className="p-4 rounded-lg flex items-center justify-between text-lg font-bold"
                style={{ backgroundColor: "hsl(var(--lp-primary) / 0.1)" }}
              >
                <span>মোট</span>
                <span style={{ color: "hsl(var(--lp-primary))" }}>৳{Math.round(total)}</span>
              </div>

              <Button
                type="submit"
                disabled={submitting || total === 0}
                className="w-full h-12 text-base font-bold"
                style={{
                  backgroundColor: "hsl(var(--lp-primary))",
                  color: "hsl(var(--lp-primary-foreground))",
                }}
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : data.cta_text}
              </Button>
            </form>
          </div>
        </section>

        {/* FAQ */}
        {data.faq_items.length > 0 && (
          <section className="px-4 py-12 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">প্রশ্ন উত্তর</h2>
            <div className="space-y-3">
              {data.faq_items.map((f, i) => (
                <details
                  key={i}
                  className="p-4 rounded-xl cursor-pointer"
                  style={{ backgroundColor: "hsl(var(--lp-card))", border: "1px solid hsl(var(--lp-border))" }}
                >
                  <summary className="font-semibold">{f.question}</summary>
                  <p className="mt-2 text-sm" style={{ color: "hsl(var(--lp-muted-foreground))" }}>
                    {f.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        <footer className="text-center py-6 text-xs" style={{ color: "hsl(var(--lp-muted-foreground))" }}>
          © {new Date().getFullYear()} {data.title}
        </footer>
      </div>
    </div>
  );
};

export default LandingPageView;
