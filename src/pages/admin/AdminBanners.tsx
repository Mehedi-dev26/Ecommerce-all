import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import AdminPageState from "@/components/admin/AdminPageState";
import { getErrorMessage } from "@/lib/error-message";
import { Plus, Pencil, Trash2, Upload, Image as ImageIcon, Eye, EyeOff, Crop, Type, Smartphone, Monitor } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ImageCropper from "@/components/admin/ImageCropper";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  cta_text: string | null;
  cta_link: string | null;
  image_url: string | null;
  mobile_image_url: string | null;
  mobile_aspect_ratio: string | null;
  sort_order: number;
  is_active: boolean;
  show_text_overlay: boolean;
}

const emptyForm = {
  title: "",
  subtitle: "",
  cta_text: "অর্ডার করুন",
  cta_link: "/products",
  image_url: "",
  mobile_image_url: "",
  mobile_aspect_ratio: "16/9",
  sort_order: 0,
  is_active: true,
  show_text_overlay: true,
};

const AdminBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchBanners = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      setBanners(data || []);
    } catch (err) {
      setError(getErrorMessage(err, "ব্যানার লোড করা যায়নি"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchBanners(); }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleCroppedImage = async (blob: Blob) => {
    setUploading(true);
    const path = `banners/${Date.now()}.jpg`;
    const file = new File([blob], "banner.jpg", { type: "image/jpeg" });
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast({ title: "আপলোড ব্যর্থ", description: error.message, variant: "destructive" });
    } else {
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      toast({ title: "ডেস্কটপ ছবি আপলোড সফল" });
    }
    setUploading(false);
  };

  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `banners/${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast({ title: "আপলোড ব্যর্থ", description: error.message, variant: "destructive" });
    } else {
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      toast({ title: "ডেস্কটপ ছবি আপলোড সফল" });
    }
    setUploading(false);
  };

  const handleMobileDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMobile(true);
    const path = `banners/mobile-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast({ title: "আপলোড ব্যর্থ", description: error.message, variant: "destructive" });
    } else {
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm((f) => ({ ...f, mobile_image_url: data.publicUrl }));
      toast({ title: "মোবাইল ছবি আপলোড সফল" });
    }
    setUploadingMobile(false);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: "ত্রুটি", description: "ব্যানার টাইটেল আবশ্যক", variant: "destructive" });
      return;
    }

    const payload = {
      title: form.title,
      subtitle: form.subtitle || null,
      cta_text: form.cta_text || null,
      cta_link: form.cta_link || null,
      image_url: form.image_url || null,
      mobile_image_url: form.mobile_image_url || null,
      mobile_aspect_ratio: form.mobile_aspect_ratio || "16/9",
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
      show_text_overlay: form.show_text_overlay,
    };

    let err;
    if (editing) {
      ({ error: err } = await supabase.from("banners").update(payload).eq("id", editing.id));
    } else {
      ({ error: err } = await supabase.from("banners").insert(payload));
    }

    if (err) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    } else {
      toast({ title: editing ? "আপডেট সফল" : "ব্যানার যোগ হয়েছে" });
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      void fetchBanners();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই ব্যানারটি মুছে ফেলতে চান?")) return;
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "ব্যানার মুছে ফেলা হয়েছে" });
      void fetchBanners();
    }
  };

  const toggleActive = async (banner: Banner) => {
    // Optimistic update for instant UX
    const next = !banner.is_active;
    setBanners((prev) => prev.map((b) => (b.id === banner.id ? { ...b, is_active: next } : b)));
    const { error } = await supabase
      .from("banners")
      .update({ is_active: next })
      .eq("id", banner.id);
    if (error) {
      // Rollback on failure
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? { ...b, is_active: !next } : b)));
      toast({ title: "পরিবর্তন ব্যর্থ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: next ? "ব্যানার সক্রিয় হয়েছে" : "ব্যানার নিষ্ক্রিয় হয়েছে" });
    }
  };

  const toggleTextOverlay = async (banner: Banner) => {
    const next = !banner.show_text_overlay;
    setBanners((prev) => prev.map((b) => (b.id === banner.id ? { ...b, show_text_overlay: next } : b)));
    const { error } = await supabase
      .from("banners")
      .update({ show_text_overlay: next })
      .eq("id", banner.id);
    if (error) {
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? { ...b, show_text_overlay: !next } : b)));
      toast({ title: "পরিবর্তন ব্যর্থ", description: error.message, variant: "destructive" });
    }
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      title: b.title,
      subtitle: b.subtitle || "",
      cta_text: b.cta_text || "",
      cta_link: b.cta_link || "",
      image_url: b.image_url || "",
      mobile_image_url: b.mobile_image_url || "",
      mobile_aspect_ratio: b.mobile_aspect_ratio || "16/9",
      sort_order: b.sort_order,
      is_active: b.is_active,
      show_text_overlay: b.show_text_overlay,
    });
    setDialogOpen(true);
  };

  if (loading) return <AdminPageState loading message="ব্যানার লোড হচ্ছে..." />;
  if (error) return <AdminPageState title="ব্যানার লোড করা যায়নি" message={error} onRetry={fetchBanners} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">ব্যানার স্লাইডার ম্যানেজমেন্ট</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {banners.length} টি ব্যানার • {banners.filter((b) => b.is_active).length} টি সক্রিয়
          </p>
        </div>
        <Button
          className="w-full gap-2 shadow-lg shadow-primary/20 sm:w-auto"
          onClick={() => { setEditing(null); setForm(emptyForm); setDialogOpen(true); }}
        >
          <Plus className="h-4 w-4" />নতুন ব্যানার
        </Button>
      </div>

      {/* Banner List */}
      <div className="space-y-4">
        {banners.map((b) => (
          <Card key={b.id} className={`overflow-hidden border-border/50 rounded-2xl transition-all ${!b.is_active ? "opacity-60" : ""}`}>
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row">
                {/* Images Preview Section (Desktop & Mobile) */}
                <div className="flex sm:flex-col md:flex-row gap-2 p-2 sm:p-3 bg-muted/20 sm:w-80 flex-shrink-0 items-center justify-center">
                  {/* Desktop Preview */}
                  <div className="flex-1 w-full h-32 sm:h-28 relative rounded-xl overflow-hidden border bg-muted">
                    {b.image_url ? (
                      <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute top-1.5 left-1.5 flex gap-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${b.is_active ? "bg-green-500/90 text-white" : "bg-muted text-muted-foreground"}`}>
                        #{b.sort_order}
                      </span>
                    </div>
                    <span className="absolute bottom-1 right-1 text-[9px] font-semibold bg-black/70 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Monitor className="h-2.5 w-2.5" /> ডেস্কটপ (21:9)
                    </span>
                  </div>

                  {/* Mobile Preview if exists */}
                  <div className="w-20 sm:w-full md:w-24 h-32 sm:h-16 md:h-28 relative rounded-xl overflow-hidden border bg-muted flex-shrink-0">
                    {b.mobile_image_url ? (
                      <img src={b.mobile_image_url} alt="Mobile preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[9px] text-muted-foreground/50 p-1 text-center">
                        <Smartphone className="h-4 w-4 mb-0.5" />
                        <span>অটো</span>
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 text-[8px] font-bold bg-primary/90 text-white px-1 rounded flex items-center gap-0.5">
                      <Smartphone className="h-2 w-2" />
                      {b.mobile_image_url ? (b.mobile_aspect_ratio || "16/9") : "অটো"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground text-base sm:text-lg">{b.title}</h3>
                          {b.mobile_image_url ? (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              📱 কাস্টম মোবাইল ব্যানার যুক্ত আছে ({b.mobile_aspect_ratio || "16/9"})
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              📱 ডেস্কটপ ব্যানার দিয়ে চলবে
                            </span>
                          )}
                        </div>
                        {b.subtitle && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{b.subtitle}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleTextOverlay(b)}
                          title={b.show_text_overlay ? "লেখা বন্ধ করুন" : "লেখা চালু করুন"}
                        >
                          <Type className={`h-4 w-4 ${b.show_text_overlay ? "text-blue-500" : "text-muted-foreground"}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleActive(b)}
                          title={b.is_active ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                        >
                          {b.is_active ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(b.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    {b.cta_text && <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-medium">{b.cta_text}</span>}
                    {b.cta_link && <span>→ {b.cta_link}</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {banners.length === 0 && (
          <div className="text-center py-16">
            <ImageIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">কোনো ব্যানার নেই</p>
            <p className="text-xs text-muted-foreground mt-1">নতুন ব্যানার যোগ করে হোমপেজ স্লাইডার সেটআপ করুন</p>
          </div>
        )}
      </div>

      {/* Dialog for Add / Edit */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditing(null); setForm(emptyForm); } }}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              {editing ? "ব্যানার এডিট" : "নতুন ব্যানার তৈরি করুন"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">টাইটেল *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="যেমন: সেরা ও খাঁটি আম সরাসরি বাগান থেকে" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">সাবটাইটেল</Label>
              <textarea
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[50px]"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="নওগাঁ ও চাঁপাইনবাবগঞ্জের আসল আম্রপালি ও ফজলি"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">বাটন টেক্সট</Label>
                <Input value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} placeholder="অর্ডার করুন" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">বাটন লিংক</Label>
                <Input value={form.cta_link} onChange={(e) => setForm({ ...form, cta_link: e.target.value })} placeholder="/products" className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ক্রম (Sort Order)</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: +e.target.value })} className="rounded-xl" />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label className="cursor-pointer">সক্রিয় রাখুন</Label>
              </div>
            </div>

            {/* Text overlay toggle */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
              <Type className="h-5 w-5 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">ব্যানারের উপর লেখা দেখান</p>
                <p className="text-[10px] text-muted-foreground">গ্রাফিক্সে ইতিমধ্যে লেখা থাকলে এটি বন্ধ রাখতে পারেন</p>
              </div>
              <Switch checked={form.show_text_overlay} onCheckedChange={(v) => setForm({ ...form, show_text_overlay: v })} />
            </div>

            {/* SECTION 1: Desktop Banner */}
            <div className="rounded-2xl border p-4 space-y-3 bg-muted/20">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-primary" />
                <Label className="text-sm font-bold text-foreground">১. ডেস্কটপ ব্যানার (Desktop Banner)</Label>
              </div>
              <p className="text-[11px] text-muted-foreground">
                • প্রস্তাবিত রেজুলেশন: <strong>1920 × 820 px</strong> (২১:৯ ওয়াইড রেশিও)<br />
                • এটি কম্পিউটার ও ল্যাপটপে ফুল-উইডথ প্রদর্শিত হবে।
              </p>

              {form.image_url ? (
                <div className="relative rounded-xl overflow-hidden border bg-background">
                  <img src={form.image_url} alt="Desktop Preview" className="w-full h-32 sm:h-36 object-cover" />
                </div>
              ) : (
                <div className="w-full h-28 rounded-xl bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  ডেস্কটপ ছবি আপলোড করা হয়নি
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <label className="cursor-pointer flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-primary/30 rounded-xl text-xs text-primary hover:bg-primary/5 transition-all flex-1">
                  <Crop className="h-4 w-4" />
                  <span>{uploading ? "আপলোড হচ্ছে..." : "ক্রপ করে আপলোড (21:9)"}</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                </label>
                <label className="cursor-pointer flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-xl text-xs text-muted-foreground hover:bg-muted/50 transition-all flex-1">
                  <Upload className="h-4 w-4" />
                  <span>{uploading ? "আপলোড হচ্ছে..." : "সরাসরি ফাইল আপলোড"}</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleDirectUpload} />
                </label>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">অথবা সরাসরি ইমেজ URL দিন:</Label>
                <Input
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                  className="rounded-xl h-8 text-xs"
                />
              </div>
            </div>

            {/* SECTION 2: Custom Mobile Banner */}
            <div className="rounded-2xl border p-4 space-y-3 bg-muted/20 border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-bold text-foreground">২. মোবাইল ব্যানার (Custom Mobile Banner)</Label>
                </div>
                {form.mobile_image_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => setForm({ ...form, mobile_image_url: "" })}
                  >
                    ছবি সরান
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                📱 মোবাইলের জন্য গ্রাফিক্স ডিজাইনারের আলাদা রেশিওর ব্যানার দিন, যাতে মোবাইলে ব্যানার চ্যাপ্টা বা ছোট না দেখায়।
              </p>

              {/* Mobile Aspect Ratio Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">মোবাইল ডিসপ্লে রেশিও নির্বাচন করুন:</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: "16/9", label: "16:9 ওয়াইড", hint: "১০৮০×৬০৮" },
                    { value: "4/3", label: "4:3 স্ট্যান্ডার্ড", hint: "১০৮০×৮১০" },
                    { value: "1/1", label: "1:1 স্কয়ার", hint: "১০৮০×১০৮০" },
                    { value: "9/16", label: "9:16 পোর্ট্রেট", hint: "১০৮০×১৯২০" },
                  ].map((ratio) => (
                    <button
                      key={ratio.value}
                      type="button"
                      onClick={() => setForm({ ...form, mobile_aspect_ratio: ratio.value })}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        form.mobile_aspect_ratio === ratio.value
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                          : "border-border bg-background hover:bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <div className="text-xs">{ratio.label}</div>
                      <div className="text-[10px] opacity-75">{ratio.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              {form.mobile_image_url ? (
                <div className="relative rounded-xl overflow-hidden border bg-background max-w-xs mx-auto">
                  <img
                    src={form.mobile_image_url}
                    alt="Mobile Preview"
                    className="w-full object-cover max-h-48"
                  />
                  <span className="absolute bottom-1 right-1 text-[9px] bg-black/75 text-white px-2 py-0.5 rounded">
                    রেশিও: {form.mobile_aspect_ratio || "16/9"}
                  </span>
                </div>
              ) : (
                <div className="w-full h-20 rounded-xl bg-muted/60 border border-dashed flex flex-col items-center justify-center text-xs text-muted-foreground text-center p-2">
                  <span>আলাদা মোবাইল ছবি দেওয়া হয়নি</span>
                  <span className="text-[10px] text-muted-foreground/70">ফাঁকা রাখলে স্বয়ংক্রিয়ভাবে ডেস্কটপ ছবি ব্যবহার হবে</span>
                </div>
              )}

              <div className="flex gap-2">
                <label className="cursor-pointer flex items-center justify-center gap-2 px-3 py-2 border border-primary/40 bg-primary/5 rounded-xl text-xs text-primary hover:bg-primary/10 transition-all flex-1">
                  <Upload className="h-4 w-4" />
                  <span>{uploadingMobile ? "আপলোড হচ্ছে..." : "মোবাইল ব্যানার আপলোড করুন"}</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleMobileDirectUpload} />
                </label>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">অথবা মোবাইল ছবির URL দিন:</Label>
                <Input
                  value={form.mobile_image_url}
                  onChange={(e) => setForm({ ...form, mobile_image_url: e.target.value })}
                  placeholder="https://..."
                  className="rounded-xl h-8 text-xs"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">বাতিল</Button>
            <Button onClick={handleSave} className="shadow-lg shadow-primary/20 rounded-xl">{editing ? "আপডেট" : "সেভ"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Cropper — fixed 21:9 banner output @ 1920x820 */}
      {rawImageSrc && (
        <ImageCropper
          open={cropperOpen}
          onClose={() => { setCropperOpen(false); setRawImageSrc(null); }}
          imageSrc={rawImageSrc}
          aspect={1920 / 820}
          outputWidth={1920}
          outputHeight={820}
          minSourceWidth={1600}
          minSourceHeight={700}
          onCropComplete={handleCroppedImage}
        />
      )}
    </div>
  );
};

export default AdminBanners;
