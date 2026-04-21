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
import { Plus, Pencil, Trash2, Upload, Star, Eye, EyeOff, MessageSquare, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Review {
  id: string;
  customer_name: string;
  customer_image: string | null;
  rating: number;
  review_text: string;
  location: string | null;
  sort_order: number;
  is_active: boolean;
}

const emptyForm = {
  customer_name: "",
  customer_image: "",
  rating: 5,
  review_text: "",
  location: "",
  sort_order: 0,
  is_active: true,
};

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("customer_reviews")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      setError(getErrorMessage(err, "রিভিউ লোড করা যায়নি"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchReviews(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `reviews/${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast({ title: "আপলোড ব্যর্থ", description: error.message, variant: "destructive" });
    } else {
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm((f) => ({ ...f, customer_image: data.publicUrl }));
      toast({ title: "ছবি আপলোড সফল" });
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!form.customer_name.trim() || !form.review_text.trim()) {
      toast({ title: "ত্রুটি", description: "নাম ও রিভিউ আবশ্যক", variant: "destructive" });
      return;
    }

    const payload = {
      customer_name: form.customer_name,
      customer_image: form.customer_image || null,
      rating: Number(form.rating),
      review_text: form.review_text,
      location: form.location || null,
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
    };

    let err;
    if (editing) {
      ({ error: err } = await supabase.from("customer_reviews").update(payload).eq("id", editing.id));
    } else {
      ({ error: err } = await supabase.from("customer_reviews").insert(payload));
    }

    if (err) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    } else {
      toast({ title: editing ? "আপডেট সফল" : "রিভিউ যোগ হয়েছে" });
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      void fetchReviews();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই রিভিউটি মুছে ফেলতে চান?")) return;
    const { error } = await supabase.from("customer_reviews").delete().eq("id", id);
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "রিভিউ মুছে ফেলা হয়েছে" });
      void fetchReviews();
    }
  };

  const toggleActive = async (r: Review) => {
    const { error } = await supabase
      .from("customer_reviews")
      .update({ is_active: !r.is_active })
      .eq("id", r.id);
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      void fetchReviews();
    }
  };

  const openEdit = (r: Review) => {
    setEditing(r);
    setForm({
      customer_name: r.customer_name,
      customer_image: r.customer_image || "",
      rating: r.rating,
      review_text: r.review_text,
      location: r.location || "",
      sort_order: r.sort_order,
      is_active: r.is_active,
    });
    setDialogOpen(true);
  };

  if (loading) return <AdminPageState loading message="রিভিউ লোড হচ্ছে..." />;
  if (error) return <AdminPageState title="রিভিউ লোড করা যায়নি" message={error} onRetry={fetchReviews} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {reviews.length} টি রিভিউ • {reviews.filter((r) => r.is_active).length} টি সক্রিয়
          </p>
        </div>
        <Button
          className="gap-2 shadow-lg shadow-primary/20"
          onClick={() => { setEditing(null); setForm(emptyForm); setDialogOpen(true); }}
        >
          <Plus className="h-4 w-4" />নতুন রিভিউ
        </Button>
      </div>

      {/* Review List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map((r) => (
          <Card key={r.id} className={`overflow-hidden border-border/50 rounded-2xl ${!r.is_active ? "opacity-60" : ""}`}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-full overflow-hidden ring-2 ring-primary/20 shrink-0 bg-muted">
                  {r.customer_image ? (
                    <img src={r.customer_image} alt={r.customer_name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-lg">
                      {r.customer_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-foreground truncate">{r.customer_name}</h3>
                      {r.location && <p className="text-xs text-muted-foreground truncate">{r.location}</p>}
                      <div className="flex items-center gap-0.5 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(r)}>
                        {r.is_active ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(r.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 mt-3 line-clamp-3">"{r.review_text}"</p>
                  <p className="text-[10px] text-muted-foreground mt-2">ক্রম: #{r.sort_order}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {reviews.length === 0 && (
          <div className="col-span-full text-center py-16">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">কোনো রিভিউ নেই</p>
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditing(null); setForm(emptyForm); } }}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              {editing ? "রিভিউ এডিট" : "নতুন রিভিউ"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Image */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">গ্রাহকের ছবি</Label>
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-muted ring-2 ring-border shrink-0">
                  {form.customer_image ? (
                    <img src={form.customer_image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <User className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-primary/30 rounded-xl text-sm text-primary hover:bg-primary/5 transition-all flex-1">
                  <Upload className="h-4 w-4" />
                  <span className="text-xs">{uploading ? "আপলোড হচ্ছে..." : "ছবি আপলোড"}</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">নাম *</Label>
                <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} placeholder="রহিম উদ্দিন" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">এলাকা</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="ঢাকা" className="rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">রিভিউ *</Label>
              <textarea
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
                value={form.review_text}
                onChange={(e) => setForm({ ...form, review_text: e.target.value })}
                placeholder="আপনার অভিজ্ঞতা লিখুন..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">রেটিং (1-5)</Label>
                <Input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: +e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ক্রম</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: +e.target.value })} className="rounded-xl" />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>সক্রিয়</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">বাতিল</Button>
              <Button onClick={handleSave} className="rounded-xl">{editing ? "আপডেট" : "যোগ করুন"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReviews;
