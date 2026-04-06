import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Category {
  id: string;
  name: string;
  name_bn: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
}

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", name_bn: "", description: "", image_url: "", sort_order: 0 });
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `categories/${Date.now()}.${file.name.split(".").pop()}`;
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
      image_url: form.image_url || null,
      sort_order: Number(form.sort_order),
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from("categories").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("categories").insert(payload));
    }

    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editing ? "আপডেট সফল" : "ক্যাটাগরি যোগ হয়েছে" });
      setDialogOpen(false);
      setEditing(null);
      setForm({ name: "", name_bn: "", description: "", image_url: "", sort_order: 0 });
      fetchCategories();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই ক্যাটাগরি মুছে ফেলতে চান?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "ক্যাটাগরি মুছে ফেলা হয়েছে" });
      fetchCategories();
    }
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, name_bn: c.name_bn, description: c.description || "", image_url: c.image_url || "", sort_order: c.sort_order });
    setDialogOpen(true);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ক্যাটাগরি ম্যানেজমেন্ট</h1>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditing(null); setForm({ name: "", name_bn: "", description: "", image_url: "", sort_order: 0 }); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />নতুন ক্যাটাগরি</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "ক্যাটাগরি এডিট" : "নতুন ক্যাটাগরি"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>নাম (English)</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>নাম (বাংলা)</Label><Input value={form.name_bn} onChange={(e) => setForm({ ...form, name_bn: e.target.value })} /></div>
              <div className="space-y-2"><Label>বিবরণ</Label><textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="space-y-2"><Label>ক্রম</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: +e.target.value })} /></div>
              <div className="space-y-2">
                <Label>ছবি</Label>
                <div className="flex items-center gap-4">
                  {form.image_url && <img src={form.image_url} alt="" className="h-16 w-16 rounded-lg object-cover" />}
                  <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-dashed border-primary rounded-lg text-sm text-primary hover:bg-primary/5">
                    <Upload className="h-4 w-4" />{uploading ? "আপলোড হচ্ছে..." : "ছবি আপলোড"}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>বাতিল</Button>
              <Button onClick={handleSave}>{editing ? "আপডেট" : "সেভ"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => (
          <Card key={c.id} className="overflow-hidden hover:shadow-md transition-shadow">
            {c.image_url && <img src={c.image_url} alt={c.name_bn} className="w-full h-32 object-cover" />}
            <CardContent className="p-4">
              <h3 className="font-bold text-lg">{c.name_bn}</h3>
              <p className="text-sm text-muted-foreground">{c.name}</p>
              {c.description && <p className="text-sm mt-1">{c.description}</p>}
              <div className="flex justify-end gap-2 mt-3">
                <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {categories.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">কোনো ক্যাটাগরি নেই</p>}
      </div>
    </div>
  );
};

export default AdminCategories;
