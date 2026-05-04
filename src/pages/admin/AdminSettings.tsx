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
import { Save, Upload, Store, Phone, Globe, Image as ImageIcon, Loader2 } from "lucide-react";
import { useSiteSettings, SITE_DEFAULTS } from "@/contexts/SiteSettingsContext";

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
      for (const key of allKeys) {
        const value = formValues[key] ?? SITE_DEFAULTS[key] ?? "";
        const label = GROUPS.flatMap((g) => g.fields).find((f) => f.key === key)?.label;
        await upsertKey(key, value, label);
      }
      await fetchSettings();
      await refreshSiteSettings();
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

  if (loading) return <AdminPageState loading message="সেটিংস লোড হচ্ছে..." />;
  if (error) return <AdminPageState title="সেটিংস লোড করা যায়নি" message={error} onRetry={fetchSettings} />;

  const currentLogo = formValues.brand_logo_url?.trim() || logoUrl;

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
