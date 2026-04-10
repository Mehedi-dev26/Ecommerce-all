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
import { Plus, Pencil, Trash2, Upload, Image as ImageIcon, Eye, EyeOff, Crop, Type } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ImageCropper from "@/components/admin/ImageCropper";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  cta_text: string | null;
  cta_link: string | null;
  image_url: string | null;
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
      toast({ title: "ছবি আপলোড সফল" });
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
    }
    setUploading(false);
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
    const { error } = await supabase
      .from("banners")
      .update({ is_active: !banner.is_active })
      .eq("id", banner.id);
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      void fetchBanners();
    }
  };

  const toggleTextOverlay = async (banner: Banner) => {
    const { error } = await supabase
      .from("banners")
      .update({ show_text_overlay: !banner.show_text_overlay })
      .eq("id", banner.id);
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      void fetchBanners();
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {banners.length} টি ব্যানার • {banners.filter((b) => b.is_active).length} টি সক্রিয়
          </p>
        </div>
        <Button
          className="gap-2 shadow-lg shadow-primary/20"
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
                {/* Image Preview */}
                <div className="sm:w-64 h-36 sm:h-auto flex-shrink-0 relative">
                  {b.image_url ? (
                    <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full min-h-[144px] bg-muted flex items-center justify-center">
                      <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${b.is_active ? "bg-green-500/90 text-white" : "bg-muted text-muted-foreground"}`}>
                      #{b.sort_order}
                    </span>
                  </div>
                  {/* Text overlay indicator */}
                  <div className="absolute top-2 right-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${b.show_text_overlay ? "bg-blue-500/90 text-white" : "bg-muted/80 text-muted-foreground"}`}>
                      <Type className="h-3 w-3" />
                      {b.show_text_overlay ? "লেখা চালু" : "লেখা বন্ধ"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-foreground text-lg">{b.title}</h3>
                        {b.subtitle && (
                          <p className="text-sm text-muted-foreground mt-1">{b.subtitle}</p>
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
                    {b.cta_text && <span className="bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">{b.cta_text}</span>}
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

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditing(null); setForm(emptyForm); } }}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              {editing ? "ব্যানার এডিট" : "নতুন ব্যানার"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">টাইটেল *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="সাপাহারের দেশি আম" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">সাবটাইটেল</Label>
              <textarea
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[60px]"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="বাগান থেকে সরাসরি আপনার ঘরে"
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
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ক্রম</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: +e.target.value })} className="rounded-xl" />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>সক্রিয়</Label>
              </div>
            </div>

            {/* Text overlay toggle */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
              <Type className="h-5 w-5 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">ব্যানারে লেখা দেখান</p>
                <p className="text-[10px] text-muted-foreground">টাইটেল, সাবটাইটেল ও বাটন ব্যানারের উপরে দেখাবে</p>
              </div>
              <Switch checked={form.show_text_overlay} onCheckedChange={(v) => setForm({ ...form, show_text_overlay: v })} />
            </div>

            {/* Banner Image with Crop */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ব্যানার ছবি</Label>
              <div className="space-y-3">
                {form.image_url ? (
                  <img src={form.image_url} alt="" className="w-full h-32 sm:h-40 rounded-xl object-cover border-2 border-border" />
                ) : (
                  <div className="w-full h-32 sm:h-40 rounded-xl bg-muted flex items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-primary/30 rounded-xl text-sm text-primary hover:bg-primary/5 hover:border-primary/50 transition-all flex-1">
                    <Crop className="h-4 w-4" />
                    <span className="text-xs">{uploading ? "আপলোড হচ্ছে..." : "ক্রপ করে আপলোড"}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                  </label>
                  <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:bg-muted/50 transition-all flex-1">
                    <Upload className="h-4 w-4" />
                    <span className="text-xs">{uploading ? "আপলোড হচ্ছে..." : "সরাসরি আপলোড"}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleDirectUpload} />
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">বাতিল</Button>
            <Button onClick={handleSave} className="shadow-lg shadow-primary/20 rounded-xl">{editing ? "আপডেট" : "সেভ"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Cropper */}
      {rawImageSrc && (
        <ImageCropper
          open={cropperOpen}
          onClose={() => { setCropperOpen(false); setRawImageSrc(null); }}
          imageSrc={rawImageSrc}
          aspect={21 / 9}
          onCropComplete={handleCroppedImage}
        />
      )}
    </div>
  );
};

export default AdminBanners;
