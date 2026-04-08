import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AdminPageState from "@/components/admin/AdminPageState";
import { getErrorMessage } from "@/lib/error-message";
import { Plus, Pencil, Trash2, Upload, FolderTree, GripVertical, Image as ImageIcon } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", name_bn: "", description: "", image_url: "", sort_order: 0 });
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");

      if (error) throw error;

      setCategories(data || []);
    } catch (error) {
      console.error("Failed to load categories", error);
      setError(getErrorMessage(error, "ক্যাটাগরি ডেটা লোড করা যায়নি।"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchCategories(); }, []);

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
      setForm((current) => ({ ...current, image_url: data.publicUrl }));
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
      void fetchCategories();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই ক্যাটাগরি মুছে ফেলতে চান?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "ক্যাটাগরি মুছে ফেলা হয়েছে" });
      void fetchCategories();
    }
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, name_bn: c.name_bn, description: c.description || "", image_url: c.image_url || "", sort_order: c.sort_order });
    setDialogOpen(true);
  };

  if (loading) return <AdminPageState loading message="ক্যাটাগরি লোড হচ্ছে..." />;

  if (error) return <AdminPageState title="ক্যাটাগরি লোড করা যায়নি" message={error} onRetry={fetchCategories} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FolderTree className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{categories.length} টি ক্যাটাগরি</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditing(null); setForm({ name: "", name_bn: "", description: "", image_url: "", sort_order: 0 }); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20"><Plus className="h-4 w-4" />নতুন ক্যাটাগরি</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-primary" />
                {editing ? "ক্যাটাগরি এডিট" : "নতুন ক্যাটাগরি"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">নাম (English)</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">নাম (বাংলা)</Label>
                <Input value={form.name_bn} onChange={(e) => setForm({ ...form, name_bn: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">বিবরণ</Label>
                <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ক্রম</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: +e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ছবি</Label>
                <div className="flex items-center gap-4">
                  {form.image_url ? (
                    <img src={form.image_url} alt="" className="h-20 w-20 rounded-xl object-cover border-2 border-border" />
                  ) : (
                    <div className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                  <label className="cursor-pointer flex flex-col items-center justify-center gap-1 px-5 py-3 border-2 border-dashed border-primary/30 rounded-xl text-sm text-primary hover:bg-primary/5 hover:border-primary/50 transition-all">
                    <Upload className="h-5 w-5" />
                    <span className="text-xs">{uploading ? "আপলোড হচ্ছে..." : "ছবি আপলোড"}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>বাতিল</Button>
              <Button onClick={handleSave} className="shadow-lg shadow-primary/20">{editing ? "আপডেট" : "সেভ"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((c, index) => (
          <Card key={c.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
            <div className="relative">
              {c.image_url ? (
                <img src={c.image_url} alt={c.name_bn} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-36 bg-gradient-to-br from-primary/10 via-muted to-secondary/10 flex items-center justify-center">
                  <FolderTree className="h-12 w-12 text-muted-foreground/20" />
                </div>
              )}
              <div className="absolute top-2 left-2">
                <span className="bg-card/90 backdrop-blur-sm text-xs font-bold px-2 py-1 rounded-lg text-muted-foreground">
                  #{c.sort_order}
                </span>
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="icon" className="h-7 w-7 bg-card/90 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground" onClick={() => openEdit(c)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="secondary" size="icon" className="h-7 w-7 bg-card/90 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleDelete(c.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold text-foreground">{c.name_bn}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{c.name}</p>
              {c.description && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{c.description}</p>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Add New Card */}
        <button
          onClick={() => setDialogOpen(true)}
          className="border-2 border-dashed border-border/50 hover:border-primary/40 rounded-xl h-full min-h-[200px] flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary transition-all hover:bg-primary/5 group"
        >
          <div className="h-12 w-12 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
            <Plus className="h-6 w-6" />
          </div>
          <span className="text-sm font-medium">নতুন ক্যাটাগরি</span>
        </button>
      </div>

      {categories.length === 0 && (
        <div className="text-center py-16">
          <FolderTree className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">কোনো ক্যাটাগরি নেই</p>
          <p className="text-xs text-muted-foreground mt-1">উপরের বাটনে ক্লিক করে নতুন ক্যাটাগরি যোগ করুন</p>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
