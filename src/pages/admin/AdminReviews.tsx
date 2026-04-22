import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import AdminPageState from "@/components/admin/AdminPageState";
import { getErrorMessage } from "@/lib/error-message";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Star,
  Eye,
  EyeOff,
  MessageSquare,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  UserCheck,
  Inbox,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ReviewStatus = "pending" | "approved" | "rejected";

interface Review {
  id: string;
  customer_name: string;
  customer_image: string | null;
  rating: number;
  review_text: string;
  location: string | null;
  sort_order: number;
  is_active: boolean;
  status: ReviewStatus;
  submitted_by_customer: boolean;
  contact_info: string | null;
  created_at: string;
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

const statusMeta: Record<ReviewStatus, { label: string; classes: string; icon: typeof Clock }> = {
  pending: {
    label: "অপেক্ষমান",
    classes: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    icon: Clock,
  },
  approved: {
    label: "অনুমোদিত",
    classes: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    icon: CheckCircle2,
  },
  rejected: {
    label: "প্রত্যাখ্যাত",
    classes: "bg-destructive/10 text-destructive border-destructive/30",
    icon: XCircle,
  },
};

const formatDate = (s: string) => {
  try {
    return new Date(s).toLocaleDateString("bn-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return s;
  }
};

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<ReviewStatus | "all">("pending");
  const { toast } = useToast();

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("customer_reviews")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setReviews((data as Review[]) || []);
    } catch (err) {
      setError(getErrorMessage(err, "রিভিউ লোড করা যায়নি"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReviews();
  }, []);

  const counts = useMemo(
    () => ({
      pending: reviews.filter((r) => r.status === "pending").length,
      approved: reviews.filter((r) => r.status === "approved").length,
      rejected: reviews.filter((r) => r.status === "rejected").length,
      all: reviews.length,
    }),
    [reviews],
  );

  const filtered = useMemo(
    () => (activeTab === "all" ? reviews : reviews.filter((r) => r.status === activeTab)),
    [reviews, activeTab],
  );

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
      ({ error: err } = await supabase
        .from("customer_reviews")
        .update(payload)
        .eq("id", editing.id));
    } else {
      // Admin-created reviews go straight to approved
      ({ error: err } = await supabase
        .from("customer_reviews")
        .insert({ ...payload, status: "approved", submitted_by_customer: false }));
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

  const setStatus = async (r: Review, status: ReviewStatus) => {
    // Approving auto-activates so it shows on the website
    const updates: Partial<Review> = { status };
    if (status === "approved") updates.is_active = true;
    if (status === "rejected") updates.is_active = false;

    const { error } = await supabase
      .from("customer_reviews")
      .update(updates)
      .eq("id", r.id);
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({
        title:
          status === "approved"
            ? "✓ অনুমোদিত হয়েছে"
            : status === "rejected"
              ? "✕ প্রত্যাখ্যাত"
              : "অপেক্ষমান করা হয়েছে",
      });
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
  if (error)
    return <AdminPageState title="রিভিউ লোড করা যায়নি" message={error} onRetry={fetchReviews} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            মোট {counts.all} টি রিভিউ • {counts.pending} টি অনুমোদনের অপেক্ষায়
          </p>
        </div>
        <Button
          className="gap-2 shadow-lg shadow-primary/20"
          onClick={() => {
            setEditing(null);
            setForm(emptyForm);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          নতুন রিভিউ
        </Button>
      </div>

      {/* Pending alert */}
      {counts.pending > 0 && activeTab !== "pending" && (
        <button
          onClick={() => setActiveTab("pending")}
          className="w-full flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/15 transition-all text-left"
        >
          <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-foreground">
              {counts.pending} টি নতুন রিভিউ অপেক্ষমান
            </p>
            <p className="text-xs text-muted-foreground">
              পর্যালোচনা করতে এখানে ক্লিক করুন
            </p>
          </div>
        </button>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReviewStatus | "all")}>
        <TabsList className="grid grid-cols-4 w-full sm:w-auto sm:inline-grid">
          <TabsTrigger value="pending" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            অপেক্ষমান
            {counts.pending > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {counts.pending}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            অনুমোদিত
            <span className="ml-1 text-[10px] text-muted-foreground">({counts.approved})</span>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-1.5">
            <XCircle className="h-3.5 w-3.5" />
            প্রত্যাখ্যাত
            <span className="ml-1 text-[10px] text-muted-foreground">({counts.rejected})</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-1.5">
            <Inbox className="h-3.5 w-3.5" />
            সব
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((r) => {
              const meta = statusMeta[r.status];
              const StatusIcon = meta.icon;
              return (
                <Card
                  key={r.id}
                  className={`overflow-hidden border-border/50 rounded-2xl transition-all ${
                    r.status === "pending" ? "ring-2 ring-amber-500/30 shadow-md" : ""
                  } ${!r.is_active && r.status === "approved" ? "opacity-60" : ""}`}
                >
                  <CardContent className="p-5">
                    {/* Status row */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${meta.classes}`}>
                        <StatusIcon className="h-3 w-3" />
                        {meta.label}
                      </div>
                      <div className="flex items-center gap-2">
                        {r.submitted_by_customer && (
                          <Badge variant="outline" className="gap-1 text-[10px]">
                            <UserCheck className="h-3 w-3" />
                            গ্রাহক জমা
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(r.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 rounded-full overflow-hidden ring-2 ring-primary/20 shrink-0 bg-muted">
                        {r.customer_image ? (
                          <img
                            src={r.customer_image}
                            alt={r.customer_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-lg">
                            {r.customer_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground truncate">{r.customer_name}</h3>
                        {r.location && (
                          <p className="text-xs text-muted-foreground truncate">{r.location}</p>
                        )}
                        {r.contact_info && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="h-2.5 w-2.5" />
                            {r.contact_info}
                          </p>
                        )}
                        <div className="flex items-center gap-0.5 mt-1.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < r.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-foreground/80 mt-3 line-clamp-4 italic">
                      "{r.review_text}"
                    </p>

                    {/* Action bar */}
                    <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border/50">
                      {r.status === "pending" ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Button
                            size="sm"
                            onClick={() => setStatus(r, "approved")}
                            className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            অনুমোদন
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setStatus(r, "rejected")}
                            className="flex-1 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <XCircle className="h-4 w-4" />
                            প্রত্যাখ্যান
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 flex-1">
                          {r.status === "rejected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setStatus(r, "approved")}
                              className="gap-1.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500 hover:text-white"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              অনুমোদন
                            </Button>
                          )}
                          {r.status === "approved" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleActive(r)}
                                className="gap-1.5"
                              >
                                {r.is_active ? (
                                  <>
                                    <Eye className="h-3.5 w-3.5 text-emerald-500" />
                                    সক্রিয়
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="h-3.5 w-3.5" />
                                    নিষ্ক্রিয়
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setStatus(r, "rejected")}
                                className="gap-1.5 text-destructive hover:text-destructive"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(r)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(r.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16">
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {activeTab === "pending"
                    ? "কোনো রিভিউ অনুমোদনের অপেক্ষায় নেই"
                    : "এই বিভাগে কোনো রিভিউ নেই"}
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v);
          if (!v) {
            setEditing(null);
            setForm(emptyForm);
          }
        }}
      >
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
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                গ্রাহকের ছবি
              </Label>
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-muted ring-2 ring-border shrink-0">
                  {form.customer_image ? (
                    <img
                      src={form.customer_image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <User className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-primary/30 rounded-xl text-sm text-primary hover:bg-primary/5 transition-all flex-1">
                  <Upload className="h-4 w-4" />
                  <span className="text-xs">
                    {uploading ? "আপলোড হচ্ছে..." : "ছবি আপলোড"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleUpload}
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  নাম *
                </Label>
                <Input
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  placeholder="রহিম উদ্দিন"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  এলাকা
                </Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="ঢাকা"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                রিভিউ *
              </Label>
              <textarea
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
                value={form.review_text}
                onChange={(e) => setForm({ ...form, review_text: e.target.value })}
                placeholder="আপনার অভিজ্ঞতা লিখুন..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  রেটিং (1-5)
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: +e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  ক্রম
                </Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: +e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
                <Label>সক্রিয়</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl"
              >
                বাতিল
              </Button>
              <Button onClick={handleSave} className="rounded-xl">
                {editing ? "আপডেট" : "যোগ করুন"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReviews;
