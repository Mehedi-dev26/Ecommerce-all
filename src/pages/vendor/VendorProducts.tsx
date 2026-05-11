import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVendor } from "@/hooks/useVendor";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Upload, Package } from "lucide-react";

const emptyForm = {
  id: "" as string | "",
  name: "",
  name_bn: "",
  description: "",
  description_bn: "",
  price: "",
  compare_price: "",
  stock: "",
  weight: "",
  category_id: "",
  image_url: "",
  is_active: true,
};

const VendorProducts = () => {
  const { vendor } = useVendor();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return data || [];
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["vendor-products", vendor?.id],
    enabled: !!vendor?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, categories(name_bn)")
        .eq("vendor_id", vendor!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const openNew = () => {
    setForm(emptyForm);
    setImageFile(null);
    setDialogOpen(true);
  };

  const openEdit = (p: any) => {
    setForm({
      id: p.id,
      name: p.name || "",
      name_bn: p.name_bn || "",
      description: p.description || "",
      description_bn: p.description_bn || "",
      price: String(p.price ?? ""),
      compare_price: String(p.compare_price ?? ""),
      stock: String(p.stock ?? ""),
      weight: p.weight || "",
      category_id: p.category_id || "",
      image_url: p.image_url || "",
      is_active: p.is_active ?? true,
    });
    setImageFile(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!vendor) return;
    if (!form.name_bn || !form.name || !form.price) {
      toast({ title: "ত্রুটি", description: "নাম ও মূল্য পূরণ করুন", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let image_url = form.image_url;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop() || "jpg";
        const path = `vendor-products/${vendor.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("product-images")
          .upload(path, imageFile, { upsert: true, contentType: imageFile.type });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
        image_url = pub.publicUrl;
      }

      const payload: any = {
        name: form.name,
        name_bn: form.name_bn,
        description: form.description || null,
        description_bn: form.description_bn || null,
        price: Number(form.price),
        compare_price: form.compare_price ? Number(form.compare_price) : null,
        stock: form.stock ? Number(form.stock) : 0,
        weight: form.weight || null,
        category_id: form.category_id || null,
        image_url: image_url || null,
        is_active: form.is_active,
      };

      if (form.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", form.id);
        if (error) throw error;
        toast({ title: "✅ আপডেট হয়েছে" });
      } else {
        const { error } = await supabase
          .from("products")
          .insert({ ...payload, vendor_id: vendor.id, vendor_status: "pending" });
        if (error) throw error;
        toast({
          title: "✅ পণ্য জমা হয়েছে",
          description: "অ্যাডমিন অনুমোদনের পর লাইভ হবে।",
        });
      }
      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: ["vendor-products"] });
    } catch (err: any) {
      toast({ title: "ব্যর্থ", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত? পণ্যটি মুছে যাবে।")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast({ title: "ব্যর্থ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ মুছে ফেলা হয়েছে" });
      qc.invalidateQueries({ queryKey: ["vendor-products"] });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">আমার পণ্য</h1>
          <p className="text-muted-foreground text-sm mt-1">আপনার দোকানের পণ্য পরিচালনা করুন</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-1.5" /> নতুন পণ্য
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{form.id ? "পণ্য সম্পাদনা" : "নতুন পণ্য যোগ"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>পণ্যের নাম (বাংলা) *</Label>
                  <Input value={form.name_bn} onChange={(e) => setForm({ ...form, name_bn: e.target.value })} />
                </div>
                <div>
                  <Label>Name (English) *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label>মূল্য (৳) *</Label>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div>
                  <Label>তুলনামূলক মূল্য (ঐচ্ছিক)</Label>
                  <Input
                    type="number"
                    value={form.compare_price}
                    onChange={(e) => setForm({ ...form, compare_price: e.target.value })}
                  />
                </div>
                <div>
                  <Label>স্টক</Label>
                  <Input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
                <div>
                  <Label>ওজন (যেমন: 5kg)</Label>
                  <Input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Label>ক্যাটাগরি</Label>
                  <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="সিলেক্ট করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name_bn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>বিবরণ (বাংলা)</Label>
                <Textarea
                  value={form.description_bn}
                  onChange={(e) => setForm({ ...form, description_bn: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label>পণ্যের ছবি</Label>
                <div className="flex items-center gap-3 mt-1">
                  <div className="h-20 w-20 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden bg-muted/30">
                    {imageFile ? (
                      <img src={URL.createObjectURL(imageFile)} alt="" className="h-full w-full object-cover" />
                    ) : form.image_url ? (
                      <img src={form.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <div className="pt-3 flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>বাতিল</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  সংরক্ষণ করুন
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
      ) : !products?.length ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>এখনো কোনো পণ্য যোগ করেননি</p>
            <Button onClick={openNew} className="mt-4">প্রথম পণ্য যোগ করুন</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="p-3">
                <div className="aspect-square rounded-lg bg-muted overflow-hidden mb-2">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name_bn} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground"><Package className="h-8 w-8" /></div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <p className="font-bold text-sm truncate">{p.name_bn}</p>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-primary">৳{Number(p.price).toLocaleString("bn-BD")}</p>
                    <Badge
                      variant={p.vendor_status === "approved" ? "default" : p.vendor_status === "rejected" ? "destructive" : "secondary"}
                      className="text-[10px]"
                    >
                      {p.vendor_status === "approved" ? "অনুমোদিত" : p.vendor_status === "rejected" ? "প্রত্যাখ্যাত" : "অপেক্ষমাণ"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">স্টক: {p.stock} • {p.categories?.name_bn || "—"}</p>
                  <div className="flex gap-1 pt-1">
                    <Button size="sm" variant="outline" className="flex-1 h-8" onClick={() => openEdit(p)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> এডিট
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-destructive" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorProducts;
