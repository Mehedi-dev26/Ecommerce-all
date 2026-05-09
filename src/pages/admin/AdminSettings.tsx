import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import AdminPageState from "@/components/admin/AdminPageState";
import { getErrorMessage } from "@/lib/error-message";
import { Save, Upload, Store, Phone, Globe, Image as ImageIcon, Loader2, Frame, Trash2 } from "lucide-react";
import { useSiteSettings, SITE_DEFAULTS } from "@/contexts/SiteSettingsContext";
import { clearProductFrameCache, PRODUCT_FRAME_KEY, PRODUCT_FRAME_INSET_KEY } from "@/lib/apply-product-frame";

interface Setting { id: string; key: string; value: string; label: string | null; }

type FieldType = "text" | "textarea" | "url" | "tel" | "email";
interface Field { key: string; label: string; type?: FieldType; placeholder?: string; }
interface Group { title: string; icon: React.ReactNode; description?: string; fields: Field[]; }

const GROUPS: Group[] = [
  {
    title: "ব্র্যান্ড পরিচিতি",
    icon: <Store className="h-5 w-5 text-primary" />,
    description: "শপের নাম, ট্যাগলাইন এবং লোগো",
    fields: [
      { key: "brand_name", label: "শপের নাম" },
      { key: "brand_tagline", label: "ট্যাগলাইন" },
    ],
  },
  {
    title: "যোগাযোগ তথ্য",
    icon: <Phone className="h-5 w-5 text-primary" />,
    description: "হেডার, ফুটার এবং কোম্পানির ফোন/ইমেইল",
    fields: [
      { key: "header_phone", label: "হেডার ফোন (উপরে দেখাবে)", type: "tel" },
      { key: "footer_phone", label: "ফুটার ফোন", type: "tel" },
      { key: "footer_email", label: "ফুটার ইমেইল", type: "email" },
      { key: "footer_location", label: "ঠিকানা / লোকেশন" },
      { key: "company_name", label: "কোম্পানির অফিসিয়াল নাম" },
      { key: "company_phone", label: "কোম্পানির ফোন (চালান/ইনভয়েস)", type: "tel" },
      { key: "company_email", label: "কোম্পানির ইমেইল", type: "email" },
    ],
  },
  {
    title: "সোশ্যাল মিডিয়া",
    icon: <Globe className="h-5 w-5 text-primary" />,
    description: "ফুটারের সোশ্যাল লিংক",
    fields: [
      { key: "footer_facebook", label: "Facebook URL", type: "url", placeholder: "https://facebook.com/..." },
      { key: "footer_instagram", label: "Instagram URL", type: "url", placeholder: "https://instagram.com/..." },
      { key: "footer_youtube", label: "YouTube URL", type: "url", placeholder: "https://youtube.com/..." },
    ],
  },
  {
    title: "ফুটার কন্টেন্ট",
    icon: <ImageIcon className="h-5 w-5 text-primary" />,
    fields: [
      { key: "footer_about", label: "ফুটার পরিচিতি (সংক্ষিপ্ত)", type: "textarea" },
      { key: "footer_copyright", label: "কপিরাইট টেক্সট ({year} = বর্তমান বছর)" },
    ],
  },
];

const AdminSettings = () => {
  const { refresh: refreshSiteSettings, logoUrl } = useSiteSettings();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFrame, setUploadingFrame] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .order("created_at");
      if (error) throw error;
      const items = (data || []) as Setting[];
      setSettings(items);
      const values: Record<string, string> = {};
      items.forEach((s) => { values[s.key] = s.value; });
      setFormValues(values);
    } catch (err) {
      setError(getErrorMessage(err, "সেটিংস লোড করা যায়নি"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchSettings(); }, []);

  const upsertKey = async (key: string, value: string, label?: string) => {
    const existing = settings.find((s) => s.key === key);
    if (existing) {
      const { error } = await supabase.from("site_settings").update({ value }).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("site_settings").insert({ key, value, label: label ?? key });
      if (error) throw error;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const allKeys = new Set<string>();
      GROUPS.forEach((g) => g.fields.forEach((f) => allKeys.add(f.key)));
      allKeys.add("brand_logo_url");
      allKeys.add(PRODUCT_FRAME_KEY);
      allKeys.add(PRODUCT_FRAME_INSET_KEY);
      for (const key of allKeys) {
        const value = formValues[key] ?? SITE_DEFAULTS[key] ?? "";
        const label = GROUPS.flatMap((g) => g.fields).find((f) => f.key === key)?.label;
        await upsertKey(key, value, label);
      }
      await fetchSettings();
      await refreshSiteSettings();
      clearProductFrameCache();
      toast({ title: "সেটিংস আপডেট হয়েছে ✓" });
    } catch (err) {
      toast({ title: "ত্রুটি", description: getErrorMessage(err, "সেভ করা যায়নি"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "ত্রুটি", description: "লোগো সর্বোচ্চ 2MB হতে পারে", variant: "destructive" });
      return;
    }
    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `site/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
      const url = pub.publicUrl;
      await upsertKey("brand_logo_url", url, "লোগো (URL)");
      setFormValues((p) => ({ ...p, brand_logo_url: url }));
      await fetchSettings();
      await refreshSiteSettings();
      toast({ title: "লোগো আপডেট হয়েছে ✓" });
    } catch (err) {
      toast({ title: "ত্রুটি", description: getErrorMessage(err, "লোগো আপলোড ব্যর্থ"), variant: "destructive" });
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleFrameUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast({ title: "ত্রুটি", description: "ফ্রেম সর্বোচ্চ 3MB হতে পারে", variant: "destructive" });
      return;
    }
    setUploadingFrame(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `site/product-frame-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
      const url = pub.publicUrl;
      await upsertKey(PRODUCT_FRAME_KEY, url, "প্রোডাক্ট ফ্রেম");
      setFormValues((p) => ({ ...p, [PRODUCT_FRAME_KEY]: url }));
      await fetchSettings();
      clearProductFrameCache();
      toast({ title: "ফ্রেম সেট হয়েছে ✓", description: "এখন থেকে নতুন প্রোডাক্ট ছবিতে ফ্রেম যোগ হবে।" });
    } catch (err) {
      toast({ title: "ত্রুটি", description: getErrorMessage(err, "ফ্রেম আপলোড ব্যর্থ"), variant: "destructive" });
    } finally {
      setUploadingFrame(false);
      e.target.value = "";
    }
  };

  const handleRemoveFrame = async () => {
    if (!confirm("ফ্রেম সরিয়ে ফেলতে চান? নতুন আপলোড করা ছবিতে আর ফ্রেম যোগ হবে না।")) return;
    try {
      await upsertKey(PRODUCT_FRAME_KEY, "", "প্রোডাক্ট ফ্রেম");
      setFormValues((p) => ({ ...p, [PRODUCT_FRAME_KEY]: "" }));
      await fetchSettings();
      clearProductFrameCache();
      toast({ title: "ফ্রেম সরানো হয়েছে" });
    } catch (err) {
      toast({ title: "ত্রুটি", description: getErrorMessage(err, "ফ্রেম সরানো যায়নি"), variant: "destructive" });
    }
  };

  if (loading) return <AdminPageState loading message="সেটিংস লোড হচ্ছে..." />;
  if (error) return <AdminPageState title="সেটিংস লোড করা যায়নি" message={error} onRetry={fetchSettings} />;

  const currentLogo = formValues.brand_logo_url?.trim() || logoUrl;
  const currentFrame = formValues[PRODUCT_FRAME_KEY]?.trim() || "";
  const parseInset = () => {
    try {
      const raw = formValues[PRODUCT_FRAME_INSET_KEY];
      if (raw) {
        const v = JSON.parse(raw);
        return {
          left: Number(v.left ?? 0.12),
          top: Number(v.top ?? 0.23),
          right: Number(v.right ?? 0.87),
          bottom: Number(v.bottom ?? 0.82),
        };
      }
    } catch {}
    return { left: 0.12, top: 0.23, right: 0.87, bottom: 0.82 };
  };
  const inset = parseInset();
  const updateInset = (k: "left" | "top" | "right" | "bottom", pct: number) => {
    const next = { ...inset, [k]: Math.max(0, Math.min(100, pct)) / 100 };
    setFormValues((p) => ({ ...p, [PRODUCT_FRAME_INSET_KEY]: JSON.stringify(next) }));
    clearProductFrameCache();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground">সাইট সেটিংস</h2>
        <p className="text-sm text-muted-foreground">এক জায়গা থেকে পুরো সাইটের ব্র্যান্ড, যোগাযোগ ও ফুটার আপডেট করুন</p>
      </div>

      {/* Logo card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            শপ লোগো
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start gap-5">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted ring-2 ring-border">
            <img src={currentLogo} alt="বর্তমান লোগো" className="h-full w-full object-contain" />
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-sm text-muted-foreground">ছবি আপলোড করুন (PNG/JPG, সর্বোচ্চ 2MB) — হেডার ও ফুটারে সাথে সাথে আপডেট হবে।</p>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex">
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                <Button type="button" variant="outline" disabled={uploadingLogo} asChild>
                  <span className="cursor-pointer gap-2">
                    {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploadingLogo ? "আপলোড হচ্ছে..." : "নতুন লোগো আপলোড"}
                  </span>
                </Button>
              </label>
              {formValues.brand_logo_url && (
                <Button type="button" variant="ghost" onClick={() => setFormValues((p) => ({ ...p, brand_logo_url: "" }))}>
                  ডিফল্ট লোগো ব্যবহার করুন
                </Button>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">অথবা সরাসরি URL দিন</Label>
              <Input
                value={formValues.brand_logo_url ?? ""}
                onChange={(e) => setFormValues((p) => ({ ...p, brand_logo_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product frame card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Frame className="h-5 w-5 text-primary" />
            প্রোডাক্ট ফ্রেম (ব্র্যান্ডিং)
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            একবার একটি স্বচ্ছ (transparent) সেন্টারের ব্র্যান্ডেড PNG ফ্রেম আপলোড করুন। এরপর নতুন প্রোডাক্ট ছবি আপলোড করার সময় স্বয়ংক্রিয়ভাবে ছবিটি ফ্রেমের ভেতরে বসে সেভ হবে।
            সেরা ফলাফলের জন্য বর্গাকার (square, যেমন 1200×1200 px) PNG ব্যবহার করুন যেখানে মাঝখান ফাঁকা/স্বচ্ছ এবং উপরে-নিচে আপনার ব্র্যান্ডিং থাকবে।
          </p>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start gap-5">
          <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[conic-gradient(at_50%_50%,#f3f4f6_25%,#e5e7eb_0_50%,#f3f4f6_0_75%,#e5e7eb_0)] bg-[length:16px_16px] ring-2 ring-border">
            {currentFrame ? (
              <img src={currentFrame} alt="বর্তমান ফ্রেম" className="h-full w-full object-contain" />
            ) : (
              <Frame className="h-10 w-10 text-muted-foreground/60" />
            )}
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex">
                <input type="file" accept="image/png,image/webp" className="hidden" onChange={handleFrameUpload} disabled={uploadingFrame} />
                <Button type="button" variant="outline" disabled={uploadingFrame} asChild>
                  <span className="cursor-pointer gap-2">
                    {uploadingFrame ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploadingFrame ? "আপলোড হচ্ছে..." : currentFrame ? "নতুন ফ্রেম আপলোড" : "ফ্রেম আপলোড করুন"}
                  </span>
                </Button>
              </label>
              {currentFrame && (
                <Button type="button" variant="ghost" onClick={handleRemoveFrame} className="gap-2 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  ফ্রেম সরান
                </Button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              পুরোনো প্রোডাক্ট ছবিতে ফ্রেম স্বয়ংক্রিয়ভাবে যোগ হবে না — শুধু নতুন আপলোড করা ছবিতে যোগ হবে। চাইলে পুরোনো প্রোডাক্ট এডিট করে ছবি পুনরায় আপলোড করুন।
            </p>
          </div>
        </CardContent>
      </Card>

      {GROUPS.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">{group.icon}{group.title}</CardTitle>
            {group.description && <p className="text-xs text-muted-foreground">{group.description}</p>}
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {group.fields.map((field) => (
              <div key={field.key} className={`space-y-1.5 ${field.type === "textarea" ? "sm:col-span-2" : ""}`}>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{field.label}</Label>
                {field.type === "textarea" ? (
                  <Textarea
                    rows={3}
                    value={formValues[field.key] ?? ""}
                    onChange={(e) => setFormValues((p) => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder || field.label}
                  />
                ) : (
                  <Input
                    type={field.type === "email" ? "email" : field.type === "tel" ? "tel" : field.type === "url" ? "url" : "text"}
                    value={formValues[field.key] ?? ""}
                    onChange={(e) => setFormValues((p) => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder || field.label}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2 shadow-xl shadow-primary/30">
          <Save className="h-4 w-4" />
          {saving ? "সেভ হচ্ছে..." : "সব সেটিংস সেভ করুন"}
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
