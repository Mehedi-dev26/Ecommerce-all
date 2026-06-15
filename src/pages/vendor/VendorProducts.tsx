import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVendor } from "@/hooks/useVendor";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Upload, Package, ChevronRight, ArrowLeft, CheckCircle2, Info } from "lucide-react";

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
  requires_advance_payment: false,
  advance_percent: 50,
};

const VendorProducts = () => {
  const { vendor } = useVendor();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"category" | "details">("category");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories-vendor"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");
      return (data as any[]) || [];
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

  const selectedCategory = useMemo(
    () => (categories || []).find((c: any) => c.id === form.category_id),
    [categories, form.category_id]
  );

  const openNew = () => {
    setForm(emptyForm);
    setImageFile(null);
    setStep("category");
    setOpen(true);
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
      requires_advance_payment: !!p.requires_advance_payment,
      advance_percent: Number(p.advance_percent ?? 50),
    });
    setImageFile(null);
    setStep("details");
    setOpen(true);
  };

  const pickCategory = (id: string) => {
    const cat: any = (categories || []).find((c: any) => c.id === id);
    setForm((f) => ({
      ...f,
      category_id: id,
      // pre-fill suggested price if empty
      price: f.price || (cat?.suggested_price_per_kg ? String(cat.suggested_price_per_kg) : ""),
    }));
    setStep("details");
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
        requires_advance_payment: form.requires_advance_payment,
        advance_percent: Number(form.advance_percent) || 50,
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
      setOpen(false);
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">আমার পণ্য</h1>
          <p className="text-muted-foreground text-sm mt-1">আপনার দোকানের পণ্য পরিচালনা করুন</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button onClick={openNew} className="shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4 mr-1.5" /> নতুন পণ্য
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-full sm:max-w-xl overflow-y-auto p-0 flex flex-col"
          >
            <SheetHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10">
              <SheetTitle className="flex items-center gap-2">
                {step === "details" && !form.id && (
                  <button
                    onClick={() => setStep("category")}
                    className="h-8 w-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                <Package className="h-5 w-5 text-primary" />
                {form.id
                  ? "পণ্য সম্পাদনা"
                  : step === "category"
                  ? "ক্যাটাগরি বেছে নিন"
                  : `${selectedCategory?.name_bn || ""} - তথ্য পূরণ করুন`}
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {step === "category" && !form.id ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-3">
                    আপনি কোন ধরনের পণ্য যোগ করতে চান? সঠিক ক্যাটাগরি বাছাই করলে সাজেস্টেড দাম স্বয়ংক্রিয়ভাবে দেখানো হবে।
                  </p>
                  {!categories?.length ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    </div>
                  ) : (
                    categories.map((c: any) => (
                      <button
                        key={c.id}
                        onClick={() => pickCategory(c.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
                      >
                        <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {c.image_url ? (
                            <img src={c.image_url} alt={c.name_bn} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm">{c.name_bn}</p>
                          {c.pricing_note && (
                            <p className="text-xs text-muted-foreground truncate">{c.pricing_note}</p>
                          )}
                          {!c.pricing_note && c.suggested_price_per_kg > 0 && (
                            <p className="text-xs text-muted-foreground">
                              সাজেস্টেড: ৳{Number(c.suggested_price_per_kg).toLocaleString("bn-BD")}/কেজি
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedCategory && (selectedCategory.pricing_note || selectedCategory.suggested_price_per_kg > 0) && (
                    <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-start gap-2">
                      <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="text-xs">
                        <p className="font-semibold text-primary">দাম সংক্রান্ত গাইড</p>
                        <p className="text-muted-foreground mt-0.5">
                          {selectedCategory.pricing_note ||
                            `সাজেস্টেড: ৳${Number(selectedCategory.suggested_price_per_kg).toLocaleString("bn-BD")}/কেজি`}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">পণ্যের নাম (বাংলা) *</Label>
                      <Input value={form.name_bn} onChange={(e) => setForm({ ...form, name_bn: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">Name (English) *</Label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">প্রতি কেজি দাম (৳) *</Label>
                      <Input
                        type="number"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">তুলনামূলক দাম</Label>
                      <Input
                        type="number"
                        value={form.compare_price}
                        onChange={(e) => setForm({ ...form, compare_price: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">স্টক (কেজি)</Label>
                      <Input
                        type="number"
                        value={form.stock}
                        onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">প্যাক ওজন (যেমন 5kg)</Label>
                      <Input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">বিবরণ (বাংলা)</Label>
                    <Textarea
                      value={form.description_bn}
                      onChange={(e) => setForm({ ...form, description_bn: e.target.value })}
                      rows={3}
                    />
                  </div>

                  {/* Advance payment toggle */}
                  <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label className="text-sm font-semibold">অগ্রিম পেমেন্ট প্রয়োজন</Label>
                      <Switch
                        checked={form.requires_advance_payment}
                        onCheckedChange={(v) => setForm({ ...form, requires_advance_payment: v })}
                      />
                    </div>
                    {form.requires_advance_payment && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs whitespace-nowrap">শতাংশ:</Label>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={form.advance_percent}
                          onChange={(e) => setForm({ ...form, advance_percent: Number(e.target.value) })}
                          className="w-24"
                        />
                        <span className="text-xs text-muted-foreground">% checkout-এ advance দেখানো হবে।</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">পণ্যের ছবি</Label>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="h-20 w-20 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-muted/30">
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

                  <div className="rounded-xl bg-muted/40 p-3 flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
                    <p>পণ্যটি জমা দেওয়ার পর অ্যাডমিন অনুমোদনের জন্য অপেক্ষা করতে হবে। অনুমোদনের পর এটি মূল ওয়েবসাইটে লাইভ হবে।</p>
                  </div>
                </div>
              )}
            </div>

            {step === "details" && (
              <SheetFooter className="px-6 py-4 border-t sticky bottom-0 bg-background">
                <div className="flex gap-2 justify-end w-full">
                  <Button variant="outline" onClick={() => setOpen(false)}>বাতিল</Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                    সংরক্ষণ করুন
                  </Button>
                </div>
              </SheetFooter>
            )}
          </SheetContent>
        </Sheet>
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
