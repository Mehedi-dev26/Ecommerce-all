import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Upload, Search, Package, Star, X, TrendingDown, Award } from "lucide-react";
import AdminPageState from "@/components/admin/AdminPageState";
import { getErrorMessage } from "@/lib/error-message";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  name_bn: string;
  description: string | null;
  description_bn: string | null;
  price: number;
  cost_price: number;
  compare_price: number | null;
  image_url: string | null;
  images: string[] | null;
  category_id: string | null;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  weight: string | null;
  unit: string | null;
  grade: string | null;
}

interface Category {
  id: string;
  name: string;
  name_bn: string;
  requires_weight: boolean;
}

const MAX_IMAGES = 5;

const emptyProduct = {
  name: "", name_bn: "", description: "", description_bn: "",
  price: 0, cost_price: 0, compare_price: 0,
  images: [] as string[],
  category_id: "", stock: 0, is_active: true, is_featured: false,
  weight: "", unit: "kg",
  grade: "none",
};

const GRADE_OPTIONS = [
  { value: "none", label: "কোনোটি নয়" },
  { value: "A", label: "A Grade (প্রিমিয়াম)" },
  { value: "B", label: "B Grade (স্ট্যান্ডার্ড)" },
  { value: "C", label: "C Grade (ইকোনমি)" },
  { value: "D", label: "D Grade (বেসিক)" },
];

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [prodRes, catRes] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("categories").select("id, name, name_bn, requires_weight").order("sort_order"),
      ]);

      if (prodRes.error) throw prodRes.error;
      if (catRes.error) throw catRes.error;

      setProducts((prodRes.data || []) as Product[]);
      setCategories((catRes.data || []) as Category[]);
    } catch (error) {
      console.error("Failed to load products", error);
      setError(getErrorMessage(error, "প্রোডাক্ট ডেটা লোড করা যায়নি।"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchData(); }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = MAX_IMAGES - form.images.length;
    if (remaining <= 0) {
      toast({ title: "সর্বোচ্চ সীমা", description: `সর্বোচ্চ ${MAX_IMAGES}টি ছবি যোগ করা যাবে।`, variant: "destructive" });
      return;
    }

    setUploading(true);
    const toUpload = files.slice(0, remaining);
    const uploaded: string[] = [];

    for (const file of toUpload) {
      const ext = file.name.split(".").pop();
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) {
        toast({ title: "আপলোড ব্যর্থ", description: error.message, variant: "destructive" });
        continue;
      }
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }

    if (uploaded.length > 0) {
      setForm((current) => ({ ...current, images: [...current.images, ...uploaded] }));
    }
    setUploading(false);
    // reset the input so re-selecting same files works
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setForm((current) => ({ ...current, images: current.images.filter((_, i) => i !== idx) }));
  };

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === form.category_id),
    [categories, form.category_id],
  );
  const showWeight = selectedCategory?.requires_weight ?? false;

  const discountPercent = useMemo(() => {
    const p = Number(form.price);
    const cp = Number(form.compare_price);
    if (!p || !cp || cp <= p) return 0;
    return Math.round(((cp - p) / cp) * 100);
  }, [form.price, form.compare_price]);

  const handleSave = async () => {
    if (form.images.length === 0) {
      toast({ title: "ছবি প্রয়োজন", description: "অন্তত একটি ছবি যোগ করুন।", variant: "destructive" });
      return;
    }

    const payload = {
      name: form.name,
      name_bn: form.name_bn,
      description: form.description || null,
      description_bn: form.description_bn || null,
      price: Number(form.price),
      cost_price: Number(form.cost_price) || 0,
      compare_price: form.compare_price ? Number(form.compare_price) : null,
      image_url: form.images[0] || null,
      images: form.images,
      category_id: form.category_id || null,
      stock: Number(form.stock),
      is_active: form.is_active,
      is_featured: form.is_featured,
      weight: showWeight ? (form.weight || null) : null,
      unit: showWeight ? (form.unit || null) : null,
      grade: form.grade && form.grade !== "none" ? form.grade : null,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from("products").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("products").insert(payload));
    }

    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editing ? "আপডেট সফল" : "প্রোডাক্ট যোগ হয়েছে" });
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyProduct);
      void fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই প্রোডাক্টটি মুছে ফেলতে চান?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "প্রোডাক্ট মুছে ফেলা হয়েছে" });
      void fetchData();
    }
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    const existingImages = p.images && p.images.length > 0 ? p.images : (p.image_url ? [p.image_url] : []);
    setForm({
      name: p.name, name_bn: p.name_bn, description: p.description || "",
      description_bn: p.description_bn || "", price: p.price,
      cost_price: p.cost_price || 0,
      compare_price: p.compare_price || 0,
      images: existingImages,
      category_id: p.category_id || "", stock: p.stock,
      is_active: p.is_active, is_featured: p.is_featured,
      weight: p.weight || "", unit: p.unit || "kg",
      grade: p.grade || "none",
    });
    setDialogOpen(true);
  };

  const getCategoryName = (id: string | null) => {
    if (!id) return null;
    return categories.find((c) => c.id === id)?.name_bn;
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.name_bn.includes(search);
    const matchCategory = categoryFilter === "all" || p.category_id === categoryFilter;
    const matchStatus = statusFilter === "all" ||
      (statusFilter === "active" && p.is_active) ||
      (statusFilter === "inactive" && !p.is_active) ||
      (statusFilter === "featured" && p.is_featured);
    return matchSearch && matchCategory && matchStatus;
  });

  const activeCount = products.filter((p) => p.is_active).length;
  const lowStockCount = products.filter((p) => p.stock < 10).length;

  if (loading) return <AdminPageState loading message="প্রোডাক্ট লোড হচ্ছে..." />;

  if (error) return <AdminPageState title="প্রোডাক্ট লোড করা যায়নি" message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-card rounded-xl border border-border/50 p-3 sm:p-4">
          <p className="text-lg sm:text-2xl font-bold">{products.length}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">মোট প্রোডাক্ট</p>
        </div>
        <div className="bg-card rounded-xl border border-border/50 p-3 sm:p-4">
          <p className="text-lg sm:text-2xl font-bold text-secondary">{activeCount}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">সক্রিয়</p>
        </div>
        <div className="bg-card rounded-xl border border-border/50 p-3 sm:p-4">
          <p className="text-lg sm:text-2xl font-bold text-primary">{products.length - activeCount}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">নিষ্ক্রিয়</p>
        </div>
        <div className="bg-card rounded-xl border border-border/50 p-3 sm:p-4">
          <p className="text-lg sm:text-2xl font-bold text-destructive">{lowStockCount}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">কম স্টক (&lt;10)</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row flex-1 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="প্রোডাক্ট খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card" />
          </div>
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="flex-1 sm:w-[160px] bg-card"><SelectValue placeholder="ক্যাটাগরি" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সকল ক্যাটাগরি</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name_bn}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1 sm:w-[140px] bg-card"><SelectValue placeholder="স্ট্যাটাস" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সকল</SelectItem>
                <SelectItem value="active">সক্রিয়</SelectItem>
                <SelectItem value="inactive">নিষ্ক্রিয়</SelectItem>
                <SelectItem value="featured">ফিচারড</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditing(null); setForm(emptyProduct); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" />নতুন প্রোডাক্ট
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                {editing ? "প্রোডাক্ট এডিট" : "নতুন প্রোডাক্ট যোগ করুন"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">নাম (English)</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">নাম (বাংলা)</Label>
                <Input value={form.name_bn} onChange={(e) => setForm({ ...form, name_bn: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ক্যাটাগরি</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="বাছাই করুন" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name_bn}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-primary" /> গ্রেড (ঐচ্ছিক)
                </Label>
                <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GRADE_OPTIONS.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">একই পণ্যের বিভিন্ন কোয়ালিটি (যেমন: A Grade সাইকেল, B Grade সাইকেল) আলাদা করতে গ্রেড ব্যবহার করুন।</p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">বিবরণ (English)</Label>
                <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">বিবরণ (বাংলা)</Label>
                <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" rows={2} value={form.description_bn} onChange={(e) => setForm({ ...form, description_bn: e.target.value })} />
              </div>

              {/* Pricing block with live discount */}
              <div className="md:col-span-2 rounded-xl border border-border/50 bg-muted/30 p-3 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">বিক্রয় মূল্য (৳)</Label>
                    <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} placeholder="যেমন: 9500" />
                    <p className="text-[11px] text-muted-foreground">গ্রাহক যে দামে পণ্যটি কিনবে।</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">তুলনামূলক দাম / MRP (৳)</Label>
                    <Input type="number" value={form.compare_price} onChange={(e) => setForm({ ...form, compare_price: +e.target.value })} placeholder="যেমন: 11000" />
                    <p className="text-[11px] text-muted-foreground">পুরাতন/মার্কেট দাম। কাটাকাটি করে দেখানো হবে।</p>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ক্রয় মূল্য / Cost Price (৳)</Label>
                    <Input type="number" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: +e.target.value })} placeholder="যেমন: 7000" />
                    <p className="text-[11px] text-muted-foreground">প্রতি ইউনিট কেনার খরচ। লাভ-ক্ষতি হিসাব করার জন্য ব্যবহৃত হবে। (গ্রাহকের কাছে দেখানো হবে না)</p>
                    {form.price > 0 && form.cost_price > 0 && (
                      <p className="text-[11px] font-semibold text-secondary">
                        সম্ভাব্য লাভ: ৳{(Number(form.price) - Number(form.cost_price)).toLocaleString()} প্রতি ইউনিট ({Math.round(((Number(form.price) - Number(form.cost_price)) / Number(form.price)) * 100)}% মার্জিন)
                      </p>
                    )}
                  </div>
                </div>
                {discountPercent > 0 && (
                  <div className="flex items-center justify-between rounded-lg bg-secondary/15 px-3 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingDown className="h-4 w-4 text-secondary" />
                      <span className="font-medium text-foreground">গ্রাহক সাশ্রয় করবে</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">৳{(Number(form.compare_price) - Number(form.price)).toLocaleString()}</span>
                      <Badge className="bg-destructive text-destructive-foreground">-{discountPercent}% ছাড়</Badge>
                    </div>
                  </div>
                )}
                {form.compare_price > 0 && form.price > 0 && form.compare_price <= form.price && (
                  <p className="text-[11px] text-destructive">⚠ তুলনামূলক দাম বিক্রয় মূল্যের বেশি হতে হবে, নাহলে ছাড় দেখাবে না।</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">স্টক</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: +e.target.value })} />
              </div>

              {showWeight ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ওজন</Label>
                    <Input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="যেমন: 14kg" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ইউনিট</Label>
                    <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="kg / piece" />
                  </div>
                </>
              ) : (
                form.category_id && (
                  <div className="md:col-span-1 rounded-lg bg-muted/30 border border-dashed border-border p-2.5 text-[11px] text-muted-foreground">
                    এই ক্যাটাগরিতে ওজন প্রয়োজন নেই। প্রয়োজন হলে ক্যাটাগরি settings থেকে "ওজন প্রয়োজন" toggle on করুন।
                  </div>
                )
              )}

              {/* Multi-image upload */}
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  পণ্যের ছবি ({form.images.length}/{MAX_IMAGES}) — প্রথমটি প্রধান ছবি হবে
                </Label>
                <div className="flex flex-wrap items-center gap-3">
                  {form.images.map((url, idx) => (
                    <div key={url + idx} className="relative group">
                      <img src={url} alt="" className="h-24 w-24 rounded-xl object-cover border-2 border-border" />
                      {idx === 0 && (
                        <span className="absolute left-1 top-1 rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">প্রধান</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md hover:scale-110 transition"
                        aria-label="ছবি সরান"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {form.images.length < MAX_IMAGES && (
                    <label className="cursor-pointer flex flex-col items-center justify-center gap-2 px-6 py-4 h-24 w-24 border-2 border-dashed border-primary/30 rounded-xl text-sm text-primary hover:bg-primary/5 hover:border-primary/50 transition-all">
                      <Upload className="h-5 w-5" />
                      <span className="text-[10px] text-center leading-tight">{uploading ? "আপলোড..." : "ছবি যোগ করুন"}</span>
                      <input type="file" multiple className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">একসাথে একাধিক ছবি সিলেক্ট করতে পারেন (সর্বোচ্চ {MAX_IMAGES}টি)।</p>
              </div>

              <div className="flex items-center gap-6 md:col-span-2 pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                  <Label>সক্রিয়</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                  <Label>ফিচারড</Label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>বাতিল</Button>
              <Button onClick={handleSave} className="shadow-lg shadow-primary/20">{editing ? "আপডেট" : "সেভ করুন"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} টি প্রোডাক্ট দেখানো হচ্ছে
      </p>

      {/* Mobile Product Cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((p) => (
          <Card key={p.id} className="border-border/50 overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <img src={p.image_url || "/placeholder.svg"} alt={p.name_bn} className="h-16 w-16 rounded-xl object-cover border border-border/50" />
                  {p.is_featured && <Star className="absolute -top-1 -right-1 h-4 w-4 text-primary fill-primary" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-foreground truncate">{p.name_bn}</p>
                        {p.grade && <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] px-1.5 py-0">Grade {p.grade}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{p.name}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="text-muted-foreground">দাম</p>
                      <p className="font-bold text-foreground">৳{p.price.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="text-muted-foreground">স্টক</p>
                      <p className={p.stock < 10 ? "font-bold text-destructive" : "font-bold text-foreground"}>{p.stock}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {getCategoryName(p.category_id) ? <Badge variant="secondary">{getCategoryName(p.category_id)}</Badge> : null}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${p.is_active ? "bg-secondary/15 text-secondary" : "bg-destructive/15 text-destructive"}`}>
                      {p.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                    </span>
                    {p.compare_price ? <span className="text-xs text-muted-foreground line-through">৳{p.compare_price.toLocaleString()}</span> : null}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">কোনো প্রোডাক্ট পাওয়া যায়নি</p>
          </div>
        )}
      </div>

      {/* Product Table */}
      <Card className="border-border/50 overflow-hidden hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border/50">
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">পণ্য</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">ক্যাটাগরি</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">দাম</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">স্টক</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">স্ট্যাটাস</th>
                  <th className="text-right py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={p.image_url || "/placeholder.svg"} alt={p.name_bn} className="h-12 w-12 rounded-xl object-cover border border-border/50" />
                          {p.is_featured && (
                            <Star className="absolute -top-1 -right-1 h-4 w-4 text-primary fill-primary" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-semibold text-foreground truncate">{p.name_bn}</p>
                            {p.grade && <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] px-1.5 py-0">Grade {p.grade}</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{p.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      {getCategoryName(p.category_id) ? (
                        <Badge variant="secondary" className="font-normal">{getCategoryName(p.category_id)}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div>
                        <span className="font-bold text-foreground">৳{p.price.toLocaleString()}</span>
                        {p.compare_price ? (
                          <span className="text-xs text-muted-foreground line-through ml-2">৳{p.compare_price.toLocaleString()}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${p.stock < 10 ? "bg-destructive" : p.stock < 50 ? "bg-primary" : "bg-secondary"}`} />
                        <span className={p.stock < 10 ? "text-destructive font-semibold" : ""}>{p.stock}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${p.is_active ? "bg-secondary/15 text-secondary" : "bg-destructive/15 text-destructive"}`}>
                        {p.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" onClick={() => openEdit(p)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">কোনো প্রোডাক্ট পাওয়া যায়নি</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProducts;
