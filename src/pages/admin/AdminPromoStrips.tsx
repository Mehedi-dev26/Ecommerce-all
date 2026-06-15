import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import AdminPageState from "@/components/admin/AdminPageState";
import { getErrorMessage } from "@/lib/error-message";
import { Plus, Pencil, Trash2, Upload, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PromoStrip {
  id: string;
  image_url: string;
  link_url: string | null;
  alt_text: string | null;
  position: "top" | "bottom";
  sort_order: number;
  is_active: boolean;
}

const emptyForm = {
  image_url: "",
  link_url: "/products",
  alt_text: "",
  position: "top" as "top" | "bottom",
  sort_order: 0,
  is_active: true,
};

const AdminPromoStrips = () => {
  const [strips, setStrips] = useState<PromoStrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PromoStrip | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchStrips = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await (supabase as any)
        .from("promo_strips")
        .select("*")
        .order("position")
        .order("sort_order");
      if (error) throw error;
      setStrips((data || []) as PromoStrip[]);
    } catch (err) {
      setError(getErrorMessage(err, "প্রোমো স্ট্রিপ লোড করা যায়নি"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStrips();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const name = `promo-strip-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(name, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("product-images").getPublicUrl(name);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      toast({ title: "ছবি আপলোড হয়েছে" });
    } catch (err) {
      toast({ title: "আপলোড ব্যর্থ", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (s: PromoStrip) => {
    setEditing(s);
    setForm({
      image_url: s.image_url,
      link_url: s.link_url || "",
      alt_text: s.alt_text || "",
      position: s.position,
      sort_order: s.sort_order,
      is_active: s.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.image_url) {
      toast({ title: "ছবি প্রয়োজন", variant: "destructive" });
      return;
    }
    try {
      const payload = {
        image_url: form.image_url,
        link_url: form.link_url || null,
        alt_text: form.alt_text || null,
        position: form.position,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
      };
      if (editing) {
        const { error } = await (supabase as any).from("promo_strips").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast({ title: "আপডেট হয়েছে" });
      } else {
        const { error } = await (supabase as any).from("promo_strips").insert(payload);
        if (error) throw error;
        toast({ title: "তৈরি হয়েছে" });
      }
      setDialogOpen(false);
      void fetchStrips();
    } catch (err) {
      toast({ title: "সেভ ব্যর্থ", description: getErrorMessage(err), variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ডিলিট করবেন?")) return;
    try {
      const { error } = await (supabase as any).from("promo_strips").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "ডিলিট হয়েছে" });
      void fetchStrips();
    } catch (err) {
      toast({ title: "ডিলিট ব্যর্থ", description: getErrorMessage(err), variant: "destructive" });
    }
  };

  const toggleActive = async (s: PromoStrip) => {
    await (supabase as any).from("promo_strips").update({ is_active: !s.is_active }).eq("id", s.id);
    void fetchStrips();
  };

  if (loading || error) {
    return <AdminPageState loading={loading} error={error} onRetry={fetchStrips} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">প্রোমো স্ট্রিপ ব্যানার</h2>
          <p className="text-sm text-muted-foreground">
            হোমপেজে প্রদর্শিত চিকন/লম্বা অফার ব্যানার। প্রস্তাবিত resolution:{" "}
            <span className="font-semibold">1600 × 200 px</span> (8:1 ratio)
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> নতুন স্ট্রিপ
        </Button>
      </div>

      {strips.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">কোনো প্রোমো স্ট্রিপ নেই</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {strips.map((s) => (
            <Card key={s.id} className="overflow-hidden">
              <CardContent className="p-4 flex flex-col md:flex-row items-stretch gap-4">
                <div className="md:w-2/3">
                  <img
                    src={s.image_url}
                    alt={s.alt_text || ""}
                    className="w-full rounded-lg object-cover"
                    style={{ aspectRatio: "8 / 1" }}
                  />
                </div>
                <div className="flex-1 space-y-2 text-sm">
                  <div>
                    <span className="font-semibold">অবস্থান: </span>
                    <span className="inline-block px-2 py-0.5 bg-muted rounded">
                      {s.position === "top" ? "উপরে (Featured-এর আগে)" : "নিচে (Reviews-এর আগে)"}
                    </span>
                  </div>
                  <div className="text-muted-foreground break-all">
                    <span className="font-semibold text-foreground">Link: </span>
                    {s.link_url || "—"}
                  </div>
                  <div className="text-muted-foreground">
                    <span className="font-semibold text-foreground">Sort: </span>
                    {s.sort_order}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => toggleActive(s)}>
                      {s.is_active ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                      {s.is_active ? "Active" : "Inactive"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                      <Pencil className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(s.id)}>
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "স্ট্রিপ এডিট করুন" : "নতুন প্রোমো স্ট্রিপ"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              📐 প্রস্তাবিত resolution: <b>1600 × 200 px</b> (8:1 aspect ratio) — চিকন ও লম্বা অফার ব্যানার।
            </div>

            <div>
              <Label>ছবি</Label>
              {form.image_url && (
                <img
                  src={form.image_url}
                  alt=""
                  className="w-full rounded-lg mb-2 object-cover"
                  style={{ aspectRatio: "8 / 1" }}
                />
              )}
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                  <span className="inline-flex items-center px-3 py-2 border rounded-md text-sm hover:bg-muted">
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? "আপলোড হচ্ছে..." : "ছবি আপলোড"}
                  </span>
                </label>
              </div>
              <Input
                className="mt-2"
                placeholder="অথবা ছবির URL paste করুন"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Link URL</Label>
                <Input
                  placeholder="/products বা /lp/offer"
                  value={form.link_url}
                  onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                />
              </div>
              <div>
                <Label>Alt টেক্সট</Label>
                <Input
                  placeholder="অফার বর্ণনা"
                  value={form.alt_text}
                  onChange={(e) => setForm({ ...form, alt_text: e.target.value })}
                />
              </div>
              <div>
                <Label>অবস্থান</Label>
                <Select
                  value={form.position}
                  onValueChange={(v) => setForm({ ...form, position: v as "top" | "bottom" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">উপরে — Featured-এর আগে</SelectItem>
                    <SelectItem value="bottom">নিচে — Reviews-এর আগে</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Active</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                বাতিল
              </Button>
              <Button onClick={handleSave}>সেভ করুন</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPromoStrips;
