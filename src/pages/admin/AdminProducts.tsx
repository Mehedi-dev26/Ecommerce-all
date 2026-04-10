import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Upload, Search, Package, Filter, Star } from "lucide-react";
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
  compare_price: number | null;
  image_url: string | null;
  category_id: string | null;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  weight: string | null;
  unit: string | null;
}

interface Category {
  id: string;
  name: string;
  name_bn: string;
}

const emptyProduct = {
  name: "", name_bn: "", description: "", description_bn: "",
  price: 0, compare_price: 0, image_url: "",
  category_id: "", stock: 0, is_active: true, is_featured: false,
  weight: "", unit: "kg",
};

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
        supabase.from("categories").select("id, name, name_bn").order("sort_order"),
      ]);

      if (prodRes.error) throw prodRes.error;
      if (catRes.error) throw catRes.error;

      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (error) {
      console.error("Failed to load products", error);
      setError(getErrorMessage(error, "প্রোডাক্ট ডেটা লোড করা যায়নি।"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchData(); }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `products/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast({ title: "আপলোড ব্যর্থ", description: error.message, variant: "destructive" });
    } else {
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm((current) => ({ ...current, image_url: data.publicUrl }));
    }
    setUploading(false);
  };

  const handleSave = async () => {
    const payload = {
      name: form.name,
      name_bn: form.name_bn,
      description: form.description || null,
      description_bn: form.description_bn || null,
      price: Number(form.price),
      compare_price: form.compare_price ? Number(form.compare_price) : null,
      image_url: form.image_url || null,
      category_id: form.category_id || null,
      stock: Number(form.stock),
      is_active: form.is_active,
      is_featured: form.is_featured,
      weight: form.weight || null,
      unit: form.unit || null,
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
    setForm({
      name: p.name, name_bn: p.name_bn, description: p.description || "",
      description_bn: p.description_bn || "", price: p.price,
      compare_price: p.compare_price || 0, image_url: p.image_url || "",
      category_id: p.category_id || "", stock: p.stock,
      is_active: p.is_active, is_featured: p.is_featured,
      weight: p.weight || "", unit: p.unit || "kg",
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
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">বিবরণ (English)</Label>
                <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">বিবরণ (বাংলা)</Label>
                <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" rows={2} value={form.description_bn} onChange={(e) => setForm({ ...form, description_bn: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">দাম (৳)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">তুলনামূলক দাম (৳)</Label>
                <Input type="number" value={form.compare_price} onChange={(e) => setForm({ ...form, compare_price: +e.target.value })} />
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
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">স্টক</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: +e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ওজন</Label>
                <Input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="3kg" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ইউনিট</Label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="kg" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ছবি</Label>
                <div className="flex items-center gap-4">
                  {form.image_url && (
                    <div className="relative group">
                      <img src={form.image_url} alt="" className="h-24 w-24 rounded-xl object-cover border-2 border-border" />
                    </div>
                  )}
                  <label className="cursor-pointer flex flex-col items-center justify-center gap-2 px-6 py-4 border-2 border-dashed border-primary/30 rounded-xl text-sm text-primary hover:bg-primary/5 hover:border-primary/50 transition-all">
                    <Upload className="h-5 w-5" />
                    <span className="text-xs">{uploading ? "আপলোড হচ্ছে..." : "ছবি আপলোড"}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
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

      {/* Product Table */}
      <Card className="border-border/50 overflow-hidden">
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
                          <p className="font-semibold text-foreground truncate">{p.name_bn}</p>
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
