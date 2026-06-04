import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useVendor } from "@/hooks/useVendor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Save, Trash2, Plus, Eye,
  Sparkles, Package, Palette, FileText, Zap, BarChart3,
  GripVertical, X, Check, Loader2, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { LANDING_THEMES } from "@/lib/landing-page-themes";
import { slugify } from "@/lib/landing-page-slugs";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;

interface ProductSel { product_id: string; special_price?: number | null; }
interface BulletPoint { text: string; }
interface FaqItem { question: string; answer: string; }
interface TrustBadge { icon: string; label: string; }

interface FormState {
  slug: string;
  status: "draft" | "published" | "paused";
  title: string;
  meta_description: string;
  theme_preset: string;
  hero_headline: string;
  hero_subheadline: string;
  hero_image_url: string;
  cta_text: string;
  products: ProductSel[];
  enable_bundle: boolean;
  bundle_discount_percent: number;
  bundle_label: string;
  bullet_points: BulletPoint[];
  long_description: string;
  faq_items: FaqItem[];
  trust_badges: TrustBadge[];
  countdown_enabled: boolean;
  countdown_end_at: string;
  stock_counter_enabled: boolean;
  stock_counter_value: number;
  facebook_pixel_id: string;
}

const emptyState: FormState = {
  slug: "",
  status: "draft",
  title: "",
  meta_description: "",
  theme_preset: "mango_yellow",
  hero_headline: "",
  hero_subheadline: "",
  hero_image_url: "",
  cta_text: "এখনই অর্ডার করুন",
  products: [],
  enable_bundle: false,
  bundle_discount_percent: 0,
  bundle_label: "",
  bullet_points: [],
  long_description: "",
  faq_items: [],
  trust_badges: [
    { icon: "truck", label: "ক্যাশ অন ডেলিভারি" },
    { icon: "shield", label: "১০০% মানি ব্যাক গ্যারান্টি" },
    { icon: "clock", label: "২৪-৪৮ ঘণ্টায় ডেলিভারি" },
  ],
  countdown_enabled: false,
  countdown_end_at: "",
  stock_counter_enabled: false,
  stock_counter_value: 50,
  facebook_pixel_id: "",
};

interface ProductLite { id: string; name_bn: string; price: number; image_url: string | null; stock: number; }

const VendorLandingPageEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vendor } = useVendor();
  const isNew = !id || id === "new";

  const [form, setForm] = useState<FormState>(emptyState);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [slugReason, setSlugReason] = useState<string>("");
  const [origin, setOrigin] = useState("");

  useEffect(() => { setOrigin(window.location.origin); }, []);

  // Load vendor's own active products only
  useEffect(() => {
    if (!vendor?.id) return;
    supabase
      .from("products")
      .select("id,name_bn,price,image_url,stock")
      .eq("vendor_id", vendor.id)
      .eq("is_active", true)
      .order("name_bn")
      .then(({ data }) => setProducts(data || []));
  }, [vendor?.id]);

  // Load existing page
  useEffect(() => {
    if (isNew || !vendor?.id) return;
    (supabase as any)
      .from("landing_pages")
      .select("*")
      .eq("id", id!)
      .eq("vendor_id", vendor.id)
      .maybeSingle()
      .then(({ data, error }: any) => {
        if (error || !data) {
          toast.error("লোড করা যায়নি");
          navigate("/vendor/landing-pages");
          return;
        }
        setForm({
          slug: data.slug,
          status: data.status,
          title: data.title,
          meta_description: data.meta_description || "",
          theme_preset: data.theme_preset,
          hero_headline: data.hero_headline,
          hero_subheadline: data.hero_subheadline || "",
          hero_image_url: data.hero_image_url || "",
          cta_text: data.cta_text,
          products: data.products || [],
          enable_bundle: data.enable_bundle,
          bundle_discount_percent: Number(data.bundle_discount_percent || 0),
          bundle_label: data.bundle_label || "",
          bullet_points: data.bullet_points || [],
          long_description: data.long_description || "",
          faq_items: data.faq_items || [],
          trust_badges: (data.trust_badges || []).length > 0 ? data.trust_badges : emptyState.trust_badges,
          countdown_enabled: data.countdown_enabled,
          countdown_end_at: data.countdown_end_at ? new Date(data.countdown_end_at).toISOString().slice(0, 16) : "",
          stock_counter_enabled: data.stock_counter_enabled,
          stock_counter_value: data.stock_counter_value || 50,
          facebook_pixel_id: data.facebook_pixel_id || "",
        });
        setLoading(false);
      });
  }, [id, isNew, vendor?.id, navigate]);

  // Live slug availability check
  useEffect(() => {
    const s = form.slug.trim().toLowerCase();
    if (!s) { setSlugStatus("idle"); setSlugReason(""); return; }
    if (s.length < 2) { setSlugStatus("invalid"); setSlugReason("কমপক্ষে ২ অক্ষর"); return; }
    if (!SLUG_RE.test(s)) { setSlugStatus("invalid"); setSlugReason("শুধু a-z, 0-9, hyphen"); return; }
    if (!vendor?.id) return;
    setSlugStatus("checking");
    const t = setTimeout(async () => {
      const { data, error } = await (supabase as any).rpc("check_vendor_landing_slug_available", {
        _vendor_id: vendor.id,
        _slug: s,
        _exclude_id: isNew ? null : id,
      });
      if (error) { setSlugStatus("invalid"); setSlugReason("চেক ব্যর্থ"); return; }
      if (data === true) { setSlugStatus("available"); setSlugReason(""); }
      else { setSlugStatus("taken"); setSlugReason("এই URL আগে থেকেই ব্যবহৃত"); }
    }, 350);
    return () => clearTimeout(t);
  }, [form.slug, vendor?.id, id, isNew]);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((s) => ({ ...s, [k]: v }));

  const handleSave = async (publishNow = false) => {
    if (!vendor?.id) { toast.error("ভেন্ডর তথ্য লোড হয়নি"); return; }
    if (!form.title.trim()) { toast.error("পেজ টাইটেল লিখুন"); return; }
    if (!form.hero_headline.trim()) { toast.error("হিরো হেডলাইন লিখুন"); return; }
    if (slugStatus !== "available") { toast.error(slugReason || "একটি বৈধ URL দিন"); return; }
    if (form.products.length === 0) { toast.error("কমপক্ষে একটি প্রোডাক্ট সিলেক্ট করুন"); return; }

    setSaving(true);
    const payload: any = {
      vendor_id: vendor.id,
      slug: form.slug.toLowerCase().trim(),
      status: publishNow ? "published" : form.status,
      title: form.title.trim(),
      meta_description: form.meta_description.trim() || null,
      theme_preset: form.theme_preset,
      hero_headline: form.hero_headline.trim(),
      hero_subheadline: form.hero_subheadline.trim() || null,
      hero_image_url: form.hero_image_url.trim() || null,
      cta_text: form.cta_text.trim() || "এখনই অর্ডার করুন",
      products: form.products,
      enable_bundle: form.enable_bundle,
      bundle_discount_percent: form.bundle_discount_percent,
      bundle_label: form.bundle_label.trim() || null,
      bullet_points: form.bullet_points,
      long_description: form.long_description.trim() || null,
      faq_items: form.faq_items,
      trust_badges: form.trust_badges,
      countdown_enabled: form.countdown_enabled,
      countdown_end_at: form.countdown_end_at ? new Date(form.countdown_end_at).toISOString() : null,
      stock_counter_enabled: form.stock_counter_enabled,
      stock_counter_value: form.stock_counter_value,
      facebook_pixel_id: form.facebook_pixel_id.trim() || null,
    };

    let resultId = id;
    if (isNew) {
      const { data, error } = await (supabase as any).from("landing_pages").insert(payload).select("id").single();
      if (error) { toast.error("সেভ ব্যর্থ: " + error.message); setSaving(false); return; }
      resultId = data.id;
    } else {
      const { error } = await (supabase as any).from("landing_pages").update(payload).eq("id", id!);
      if (error) { toast.error("আপডেট ব্যর্থ: " + error.message); setSaving(false); return; }
    }

    toast.success(publishNow ? "পেজ প্রকাশিত হয়েছে!" : "সেভ হয়েছে");
    setSaving(false);
    if (isNew && resultId) navigate(`/vendor/landing-pages/${resultId}`, { replace: true });
  };

  const addProduct = (pid: string) => {
    if (form.products.find((p) => p.product_id === pid)) return;
    update("products", [...form.products, { product_id: pid, special_price: null }]);
  };
  const removeProduct = (pid: string) => update("products", form.products.filter((p) => p.product_id !== pid));
  const setSpecial = (pid: string, price: number | null) =>
    update("products", form.products.map((p) => p.product_id === pid ? { ...p, special_price: price } : p));

  const availableProducts = useMemo(
    () => products.filter((p) => !form.products.find((s) => s.product_id === p.id)),
    [products, form.products]
  );

  if (loading || !vendor) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const previewUrl = form.slug && slugStatus === "available" ? `${origin}/${vendor.shop_slug}/${form.slug}` : "";

  return (
    <div className="space-y-5 pb-10">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 sticky top-0 bg-background/95 backdrop-blur z-20 py-2 -mx-4 px-4 border-b">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate("/vendor/landing-pages")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-base font-bold truncate">
              {isNew ? "নতুন ল্যান্ডিং পেজ" : form.title || "ল্যান্ডিং পেজ এডিট"}
            </h2>
            {previewUrl && <code className="text-[10px] text-muted-foreground">{previewUrl}</code>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && form.status === "published" && previewUrl && (
            <Button variant="outline" size="sm" onClick={() => window.open(previewUrl, "_blank")}>
              <Eye className="h-3.5 w-3.5 mr-1.5" /> দেখুন
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => handleSave(false)} disabled={saving}>
            <Save className="h-3.5 w-3.5 mr-1.5" /> সেভ
          </Button>
          <Button size="sm" onClick={() => handleSave(true)} disabled={saving}>
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> প্রকাশ করুন
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic">
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 h-auto">
          <TabsTrigger value="basic" className="text-xs"><FileText className="h-3.5 w-3.5 mr-1" /> মূল</TabsTrigger>
          <TabsTrigger value="products" className="text-xs"><Package className="h-3.5 w-3.5 mr-1" /> পণ্য</TabsTrigger>
          <TabsTrigger value="theme" className="text-xs"><Palette className="h-3.5 w-3.5 mr-1" /> থিম</TabsTrigger>
          <TabsTrigger value="content" className="text-xs"><FileText className="h-3.5 w-3.5 mr-1" /> কনটেন্ট</TabsTrigger>
          <TabsTrigger value="conversion" className="text-xs"><Zap className="h-3.5 w-3.5 mr-1" /> কনভার্সন</TabsTrigger>
          <TabsTrigger value="tracking" className="text-xs"><BarChart3 className="h-3.5 w-3.5 mr-1" /> ট্র্যাকিং</TabsTrigger>
        </TabsList>

        {/* BASIC */}
        <TabsContent value="basic" className="space-y-4 mt-4">
          <Card className="p-5 space-y-4">
            <div>
              <Label>পেজ টাইটেল *</Label>
              <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="যেমন: ল্যাংড়া আম স্পেশাল অফার" className="mt-1.5" />
            </div>

            <div>
              <Label>কাস্টম URL *</Label>
              <div className="flex items-stretch gap-0 mt-1.5 rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring overflow-hidden">
                <span className="text-sm text-muted-foreground bg-muted px-3 py-2 border-r border-input font-mono shrink-0 hidden sm:flex items-center">
                  {origin}/{vendor.shop_slug}/
                </span>
                <span className="text-sm text-muted-foreground bg-muted px-2 py-2 border-r border-input font-mono shrink-0 sm:hidden flex items-center">
                  /{vendor.shop_slug}/
                </span>
                <Input
                  value={form.slug}
                  onChange={(e) => update("slug", e.target.value.toLowerCase())}
                  placeholder="langra-offer"
                  className="font-mono border-0 focus-visible:ring-0 flex-1"
                />
                <div className="px-3 flex items-center shrink-0">
                  {slugStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  {slugStatus === "available" && <Check className="h-5 w-5 text-primary" strokeWidth={3} />}
                  {(slugStatus === "taken" || slugStatus === "invalid") && <AlertCircle className="h-5 w-5 text-destructive" />}
                </div>
                {!form.slug && form.title && (
                  <Button type="button" variant="ghost" size="sm" className="rounded-none border-l" onClick={() => update("slug", slugify(form.title))}>
                    Auto
                  </Button>
                )}
              </div>
              {slugStatus === "available" && (
                <p className="text-xs text-primary mt-1.5 flex items-center gap-1"><Check className="h-3 w-3" /> এই URL ব্যবহার করা যাবে</p>
              )}
              {(slugStatus === "taken" || slugStatus === "invalid") && (
                <p className="text-xs text-destructive mt-1.5">{slugReason}</p>
              )}
              <p className="text-[11px] text-muted-foreground mt-1">শুধু ছোট হাতের a-z, 0-9 এবং hyphen (-)</p>
            </div>

            <div>
              <Label>মেটা ডিসক্রিপশন (SEO)</Label>
              <Textarea value={form.meta_description} onChange={(e) => update("meta_description", e.target.value)}
                placeholder="Google/Facebook এ যা দেখাবে — ১৬০ অক্ষরের মধ্যে" maxLength={160} rows={2} className="mt-1.5" />
              <p className="text-[11px] text-muted-foreground mt-1">{form.meta_description.length}/160</p>
            </div>

            <div>
              <Label>স্ট্যাটাস</Label>
              <Select value={form.status} onValueChange={(v) => update("status", v as FormState["status"])}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">ড্রাফট (অপ্রকাশিত)</SelectItem>
                  <SelectItem value="published">চালু (Live)</SelectItem>
                  <SelectItem value="paused">বিরতি (Paused)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        </TabsContent>

        {/* PRODUCTS */}
        <TabsContent value="products" className="space-y-4 mt-4">
          <Card className="p-5 space-y-4">
            <div>
              <Label>প্রোডাক্ট যোগ করুন <span className="text-xs text-muted-foreground">(শুধু আপনার নিজস্ব পণ্য)</span></Label>
              <Select onValueChange={addProduct}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="একটি প্রোডাক্ট বেছে নিন..." /></SelectTrigger>
                <SelectContent>
                  {availableProducts.length === 0 ? (
                    <div className="text-xs text-muted-foreground p-3 text-center">
                      {products.length === 0 ? "প্রথমে পণ্য যোগ করুন" : "সব পণ্য যোগ করা হয়েছে"}
                    </div>
                  ) : (
                    availableProducts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name_bn} — ৳{p.price}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {form.products.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">সিলেক্টেড ({form.products.length})</Label>
                {form.products.map((sel) => {
                  const p = products.find((x) => x.id === sel.product_id);
                  if (!p) return null;
                  return (
                    <div key={sel.product_id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="h-12 w-12 rounded bg-muted shrink-0 overflow-hidden">
                        {p.image_url && <img src={p.image_url} alt={p.name_bn} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name_bn}</p>
                        <p className="text-xs text-muted-foreground">নিয়মিত: ৳{p.price} • স্টক: {p.stock}</p>
                      </div>
                      <div className="w-24">
                        <Input type="number" placeholder="স্পেশাল ৳" value={sel.special_price ?? ""}
                          onChange={(e) => setSpecial(sel.product_id, e.target.value ? Number(e.target.value) : null)}
                          className="h-9 text-sm" />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeProduct(sel.product_id)} className="h-8 w-8 text-destructive shrink-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>বান্ডেল অফার</Label>
                <p className="text-xs text-muted-foreground mt-0.5">সব প্রোডাক্ট একসাথে কিনলে অতিরিক্ত ছাড়</p>
              </div>
              <Switch checked={form.enable_bundle} onCheckedChange={(v) => update("enable_bundle", v)} />
            </div>
            {form.enable_bundle && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">ছাড় (%)</Label>
                  <Input type="number" min={0} max={90} value={form.bundle_discount_percent}
                    onChange={(e) => update("bundle_discount_percent", Number(e.target.value))} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-xs">বান্ডেল লেবেল</Label>
                  <Input value={form.bundle_label} onChange={(e) => update("bundle_label", e.target.value)} placeholder="কম্বো প্যাক" className="mt-1.5" />
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* THEME */}
        <TabsContent value="theme" className="space-y-4 mt-4">
          <Card className="p-5">
            <div className="mb-4">
              <h3 className="font-semibold text-base mb-1">থিম প্রিসেট বেছে নিন</h3>
              <p className="text-xs text-muted-foreground">আপনার পেজের রঙ ও স্টাইল নির্ধারণ করে।</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {LANDING_THEMES.map((t) => {
                const active = form.theme_preset === t.id;
                return (
                  <button key={t.id} type="button" onClick={() => update("theme_preset", t.id)}
                    className={`group relative rounded-2xl border-2 overflow-hidden transition-all text-left ${
                      active ? "border-primary ring-4 ring-primary/20 shadow-lg scale-[1.02]" : "border-border hover:border-primary/40 hover:shadow-md"
                    }`}>
                    <div className="h-44 relative overflow-hidden" style={{ backgroundColor: t.preview.bg }}>
                      <div className="h-7 flex items-center px-3 gap-1.5" style={{ backgroundColor: t.preview.primary }}>
                        <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
                        <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
                        <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
                      </div>
                      <div className="p-3 space-y-2">
                        <div className="h-2 rounded-full w-3/4" style={{ backgroundColor: t.preview.accent, opacity: 0.85 }} />
                        <div className="h-1.5 rounded-full w-1/2" style={{ backgroundColor: t.preview.accent, opacity: 0.4 }} />
                        <div className="h-7 rounded-lg w-2/3 mx-auto mt-2 flex items-center justify-center" style={{ backgroundColor: t.preview.primary }}>
                          <div className="h-1.5 w-12 rounded-full bg-white/80" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-card border-t">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{t.nameBn}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{t.name}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: t.preview.primary }} />
                          <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: t.preview.accent }} />
                        </div>
                      </div>
                    </div>
                    {active && (
                      <div className="absolute top-2 right-2 h-7 w-7 rounded-full bg-primary flex items-center justify-center shadow-lg ring-2 ring-background">
                        <Check className="h-4 w-4 text-primary-foreground" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* CONTENT */}
        <TabsContent value="content" className="space-y-4 mt-4">
          <Card className="p-5 space-y-4">
            <h3 className="font-semibold text-sm">হিরো সেকশন</h3>
            <div>
              <Label>হেডলাইন *</Label>
              <Input value={form.hero_headline} onChange={(e) => update("hero_headline", e.target.value)}
                placeholder="যেমন: সেরা ল্যাংড়া আম — সরাসরি বাগান থেকে" className="mt-1.5" />
            </div>
            <div>
              <Label>সাব-হেডলাইন</Label>
              <Input value={form.hero_subheadline} onChange={(e) => update("hero_subheadline", e.target.value)}
                placeholder="যেমন: ১০০% অর্গানিক, কেমিক্যাল-মুক্ত" className="mt-1.5" />
            </div>
            <div>
              <Label>হিরো ইমেজ URL</Label>
              <Input value={form.hero_image_url} onChange={(e) => update("hero_image_url", e.target.value)} placeholder="https://..." className="mt-1.5" />
              {form.hero_image_url && <img src={form.hero_image_url} alt="hero preview" className="mt-2 max-h-32 rounded border" />}
            </div>
            <div>
              <Label>CTA বাটন টেক্সট</Label>
              <Input value={form.cta_text} onChange={(e) => update("cta_text", e.target.value)} className="mt-1.5" />
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">কী কী পাবেন (bullet points)</h3>
              <Button size="sm" variant="outline" onClick={() => update("bullet_points", [...form.bullet_points, { text: "" }])}>
                <Plus className="h-3.5 w-3.5 mr-1" /> যোগ
              </Button>
            </div>
            {form.bullet_points.map((b, i) => (
              <div key={i} className="flex gap-2">
                <Input value={b.text} onChange={(e) => {
                  const next = [...form.bullet_points]; next[i] = { text: e.target.value }; update("bullet_points", next);
                }} placeholder={`বেনিফিট ${i + 1}`} />
                <Button variant="ghost" size="icon" onClick={() => update("bullet_points", form.bullet_points.filter((_, idx) => idx !== i))}
                  className="text-destructive shrink-0"><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </Card>

          <Card className="p-5 space-y-3">
            <Label>বিস্তারিত বর্ণনা</Label>
            <Textarea value={form.long_description} onChange={(e) => update("long_description", e.target.value)} rows={6} placeholder="পণ্য সম্পর্কে বিস্তারিত লিখুন..." />
          </Card>

          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">FAQ</h3>
              <Button size="sm" variant="outline" onClick={() => update("faq_items", [...form.faq_items, { question: "", answer: "" }])}>
                <Plus className="h-3.5 w-3.5 mr-1" /> যোগ
              </Button>
            </div>
            {form.faq_items.map((f, i) => (
              <div key={i} className="space-y-2 p-3 border rounded-lg">
                <div className="flex gap-2">
                  <Input value={f.question} onChange={(e) => {
                    const next = [...form.faq_items]; next[i] = { ...next[i], question: e.target.value }; update("faq_items", next);
                  }} placeholder="প্রশ্ন..." />
                  <Button variant="ghost" size="icon" onClick={() => update("faq_items", form.faq_items.filter((_, idx) => idx !== i))}
                    className="text-destructive shrink-0"><Trash2 className="h-4 w-4" /></Button>
                </div>
                <Textarea value={f.answer} onChange={(e) => {
                  const next = [...form.faq_items]; next[i] = { ...next[i], answer: e.target.value }; update("faq_items", next);
                }} placeholder="উত্তর..." rows={2} />
              </div>
            ))}
          </Card>

          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">ট্রাস্ট ব্যাজ</h3>
              <Button size="sm" variant="outline" onClick={() => update("trust_badges", [...form.trust_badges, { icon: "check", label: "" }])}>
                <Plus className="h-3.5 w-3.5 mr-1" /> যোগ
              </Button>
            </div>
            {form.trust_badges.map((b, i) => (
              <div key={i} className="flex gap-2">
                <Select value={b.icon} onValueChange={(v) => {
                  const next = [...form.trust_badges]; next[i] = { ...next[i], icon: v }; update("trust_badges", next);
                }}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="truck">🚚 ট্রাক</SelectItem>
                    <SelectItem value="shield">🛡️ শিল্ড</SelectItem>
                    <SelectItem value="clock">⏰ ঘড়ি</SelectItem>
                    <SelectItem value="check">✅ চেক</SelectItem>
                    <SelectItem value="star">⭐ স্টার</SelectItem>
                    <SelectItem value="phone">📞 ফোন</SelectItem>
                    <SelectItem value="leaf">🌿 অর্গানিক</SelectItem>
                  </SelectContent>
                </Select>
                <Input value={b.label} onChange={(e) => {
                  const next = [...form.trust_badges]; next[i] = { ...next[i], label: e.target.value }; update("trust_badges", next);
                }} placeholder="যেমন: ক্যাশ অন ডেলিভারি" />
                <Button variant="ghost" size="icon" onClick={() => update("trust_badges", form.trust_badges.filter((_, idx) => idx !== i))}
                  className="text-destructive shrink-0"><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </Card>
        </TabsContent>

        {/* CONVERSION */}
        <TabsContent value="conversion" className="space-y-4 mt-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div><Label>কাউন্টডাউন টাইমার</Label>
                <p className="text-xs text-muted-foreground mt-0.5">"অফার শেষ হবে" — urgency তৈরি করে</p></div>
              <Switch checked={form.countdown_enabled} onCheckedChange={(v) => update("countdown_enabled", v)} />
            </div>
            {form.countdown_enabled && (
              <div>
                <Label className="text-xs">কাউন্টডাউন শেষ হবে</Label>
                <Input type="datetime-local" value={form.countdown_end_at} onChange={(e) => update("countdown_end_at", e.target.value)} className="mt-1.5" />
              </div>
            )}
          </Card>

          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div><Label>স্টক কাউন্টার</Label>
                <p className="text-xs text-muted-foreground mt-0.5">"মাত্র X টি বাকি" — scarcity তৈরি করে</p></div>
              <Switch checked={form.stock_counter_enabled} onCheckedChange={(v) => update("stock_counter_enabled", v)} />
            </div>
            {form.stock_counter_enabled && (
              <div>
                <Label className="text-xs">কতগুলি দেখাবে?</Label>
                <Input type="number" min={1} value={form.stock_counter_value}
                  onChange={(e) => update("stock_counter_value", Number(e.target.value))} className="mt-1.5" />
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TRACKING */}
        <TabsContent value="tracking" className="space-y-4 mt-4">
          <Card className="p-5 space-y-4">
            <div>
              <Label>Facebook Pixel ID</Label>
              <Input value={form.facebook_pixel_id} onChange={(e) => update("facebook_pixel_id", e.target.value)}
                placeholder="যেমন: 1234567890123456" className="mt-1.5 font-mono" />
              <p className="text-[11px] text-muted-foreground mt-1.5">আপনার নিজস্ব Pixel ID — ad ক্যাম্পেইন আলাদা ট্র্যাক করতে</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorLandingPageEditor;
