import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X, Upload, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

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
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchData = async () => {
    const [prodRes, catRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name, name_bn").order("sort_order"),
    ]);
    setProducts(prodRes.data || []);
    setCategories(catRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

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
      setForm({ ...form, image_url: data.publicUrl });
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
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই প্রোডাক্টটি মুছে ফেলতে চান?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "প্রোডাক্ট মুছে ফেলা হয়েছে" });
      fetchData();
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

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.name_bn.includes(search)
  );

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">প্রোডাক্ট ম্যানেজমেন্ট</h1>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditing(null); setForm(emptyProduct); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />নতুন প্রোডাক্ট</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "প্রোডাক্ট এডিট" : "নতুন প্রোডাক্ট যোগ করুন"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>নাম (English)</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>নাম (বাংলা)</Label>
                <Input value={form.name_bn} onChange={(e) => setForm({ ...form, name_bn: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>বিবরণ (English)</Label>
                <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>বিবরণ (বাংলা)</Label>
                <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} value={form.description_bn} onChange={(e) => setForm({ ...form, description_bn: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>দাম (৳)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>তুলনামূলক দাম (৳)</Label>
                <Input type="number" value={form.compare_price} onChange={(e) => setForm({ ...form, compare_price: +e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>ক্যাটাগরি</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="বাছাই করুন" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name_bn}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>স্টক</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: +e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>ওজন</Label>
                <Input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="3kg" />
              </div>
              <div className="space-y-2">
                <Label>ইউনিট</Label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="kg" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>ছবি</Label>
                <div className="flex items-center gap-4">
                  {form.image_url && <img src={form.image_url} alt="" className="h-20 w-20 rounded-lg object-cover" />}
                  <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-dashed border-primary rounded-lg text-sm text-primary hover:bg-primary/5">
                    <Upload className="h-4 w-4" />
                    {uploading ? "আপলোড হচ্ছে..." : "ছবি আপলোড"}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-6">
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
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>বাতিল</Button>
              <Button onClick={handleSave}>{editing ? "আপডেট" : "সেভ করুন"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="প্রোডাক্ট খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* Product Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4">ছবি</th>
                  <th className="text-left py-3 px-4">নাম</th>
                  <th className="text-left py-3 px-4 hidden md:table-cell">দাম</th>
                  <th className="text-left py-3 px-4 hidden md:table-cell">স্টক</th>
                  <th className="text-left py-3 px-4 hidden lg:table-cell">স্ট্যাটাস</th>
                  <th className="text-right py-3 px-4">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4">
                      <img src={p.image_url || "/placeholder.svg"} alt={p.name_bn} className="h-12 w-12 rounded-lg object-cover" />
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{p.name_bn}</p>
                      <p className="text-xs text-muted-foreground">{p.name}</p>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="font-semibold">৳{p.price}</span>
                      {p.compare_price && <span className="text-xs text-muted-foreground line-through ml-2">৳{p.compare_price}</span>}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">{p.stock}</td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs ${p.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {p.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8">কোনো প্রোডাক্ট পাওয়া যায়নি</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProducts;
