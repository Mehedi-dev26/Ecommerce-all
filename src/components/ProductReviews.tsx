import { useEffect, useState, useRef } from "react";
import { z } from "zod";
import { Star, Send, CheckCircle2, ImagePlus, X, Loader2, ThumbsUp, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const reviewSchema = z.object({
  customer_name: z.string().trim().min(2, "নাম কমপক্ষে ২ অক্ষর হতে হবে").max(60),
  location: z.string().trim().max(80).optional(),
  contact_info: z.string().trim().max(60).optional(),
  rating: z.number().int().min(1).max(5),
  review_text: z.string().trim().min(10, "অন্তত ১০ অক্ষর লিখুন").max(500),
});

interface ProductReview {
  id: string;
  customer_name: string;
  customer_image: string | null;
  rating: number;
  review_text: string;
  location: string | null;
  review_images: string[] | null;
  created_at: string;
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

const MAX_IMAGES = 4;
const MAX_FILE_MB = 5;

const StarRow = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) => {
  const sz = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={cn(sz, s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
      ))}
    </div>
  );
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
};

const ProductReviews = ({ productId, productName }: ProductReviewsProps) => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    customer_name: "",
    location: "",
    contact_info: "",
    rating: 5,
    review_text: "",
    images: [] as string[],
  });

  const fetchReviews = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("customer_reviews")
      .select("id, customer_name, customer_image, rating, review_text, location, review_images, created_at")
      .eq("product_id", productId)
      .eq("is_active", true)
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    setReviews((data as ProductReview[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (productId) void fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const resetForm = () => {
    setForm({ customer_name: "", location: "", contact_info: "", rating: 5, review_text: "", images: [] });
    setSubmitted(false);
    setHoverRating(0);
  };

  const handleClose = (v: boolean) => {
    setOpen(v);
    if (!v) setTimeout(resetForm, 300);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (form.images.length + files.length > MAX_IMAGES) {
      toast({ title: "সীমা অতিক্রম", description: `সর্বোচ্চ ${MAX_IMAGES}টি ছবি যোগ করা যাবে`, variant: "destructive" });
      return;
    }

    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast({ title: "অসমর্থিত ফাইল", description: "শুধুমাত্র ছবি আপলোড করুন", variant: "destructive" });
        continue;
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        toast({ title: "ফাইল বড়", description: `প্রতিটি ছবি ${MAX_FILE_MB}MB এর কম হতে হবে`, variant: "destructive" });
        continue;
      }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `reviews/${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) {
        toast({ title: "আপলোড ব্যর্থ", description: error.message, variant: "destructive" });
        continue;
      }
      const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
      uploaded.push(pub.publicUrl);
    }
    setForm((f) => ({ ...f, images: [...f.images, ...uploaded] }));
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (url: string) => {
    setForm((f) => ({ ...f, images: f.images.filter((u) => u !== url) }));
  };

  const handleSubmit = async () => {
    const parsed = reviewSchema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "ত্রুটি", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("customer_reviews").insert({
      customer_name: parsed.data.customer_name,
      location: parsed.data.location || null,
      contact_info: parsed.data.contact_info || null,
      rating: parsed.data.rating,
      review_text: parsed.data.review_text,
      review_images: form.images,
      product_id: productId,
      status: "pending",
      submitted_by_customer: true,
      is_active: false,
      sort_order: 999,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "জমা দেওয়া যায়নি", description: error.message, variant: "destructive" });
      return;
    }
    setSubmitted(true);
  };

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1) : "0.0";
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-foreground sm:text-4xl">{avgRating}</span>
              <StarRow rating={Math.round(Number(avgRating))} size="md" />
              <span className="mt-1 text-xs text-muted-foreground">{totalReviews}টি রিভিউ</span>
            </div>
            <Separator orientation="vertical" className="h-20" />
            <div className="flex-1 space-y-1.5 min-w-[160px]">
              {ratingCounts.map(({ star, count }) => {
                const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="w-3 text-xs text-muted-foreground">{star}</span>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right text-[11px] text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <Button
            onClick={() => setOpen(true)}
            className="gap-2 rounded-xl shrink-0"
            size="lg"
          >
            <MessageSquarePlus className="h-4 w-4" />
            রিভিউ লিখুন
          </Button>
        </div>
      </div>

      {/* Review list */}
      {loading ? (
        <div className="text-center py-8 text-sm text-muted-foreground">লোড হচ্ছে...</div>
      ) : reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquarePlus className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">এই পণ্যের প্রথম রিভিউটি আপনিই দিন!</p>
          <p className="mt-1 text-xs text-muted-foreground">আপনার অভিজ্ঞতা অন্য গ্রাহকদের সিদ্ধান্ত নিতে সাহায্য করবে।</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border bg-card p-4 sm:p-5 transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-10 w-10 shrink-0">
                    {review.customer_image ? (
                      <img src={review.customer_image} alt={review.customer_name} className="h-full w-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {review.customer_name.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">{review.customer_name}</span>
                      <Badge variant="secondary" className="text-[10px] gap-0.5 px-1.5 py-0">
                        <CheckCircle2 className="h-2.5 w-2.5" /> যাচাইকৃত
                      </Badge>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{formatDate(review.created_at)}</span>
                      {review.location && <span>• {review.location}</span>}
                    </div>
                  </div>
                </div>
                <StarRow rating={review.rating} />
              </div>
              <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-line">{review.review_text}</p>

              {review.review_images && review.review_images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {review.review_images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLightbox(img)}
                      className="h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-lg border bg-muted hover:opacity-90 transition"
                    >
                      <img src={img} alt={`রিভিউ ছবি ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-3 flex items-center gap-3">
                <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors">
                  <ThumbsUp className="h-3 w-3" /> সহায়ক
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={!!lightbox} onOpenChange={(v) => !v && setLightbox(null)}>
        <DialogContent className="max-w-3xl p-2 bg-black/95 border-0">
          {lightbox && <img src={lightbox} alt="রিভিউ ছবি" className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />}
        </DialogContent>
      </Dialog>

      {/* Submission Dialog */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg w-[95vw] rounded-2xl max-h-[90vh] overflow-y-auto">
          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">ধন্যবাদ! 🎉</h3>
                <p className="text-sm text-muted-foreground">
                  আপনার রিভিউ জমা হয়েছে। অ্যাডমিন অনুমোদনের পর এটি দেখানো হবে।
                </p>
              </div>
              <Button onClick={() => handleClose(false)} className="rounded-xl">বন্ধ করুন</Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary fill-primary" />
                  রিভিউ লিখুন
                </DialogTitle>
                <DialogDescription className="line-clamp-1">
                  পণ্য: <span className="font-medium text-foreground">{productName}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Rating */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">আপনার রেটিং *</Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm({ ...form, rating: s })}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            "h-7 w-7 transition-colors",
                            s <= (hoverRating || form.rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30",
                          )}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">{form.rating}/5</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">নাম *</Label>
                    <Input
                      value={form.customer_name}
                      onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                      placeholder="আপনার নাম"
                      maxLength={60}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">এলাকা</Label>
                    <Input
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="ঢাকা"
                      maxLength={80}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ফোন/ইমেইল (ঐচ্ছিক)</Label>
                  <Input
                    value={form.contact_info}
                    onChange={(e) => setForm({ ...form, contact_info: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    maxLength={60}
                    className="rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground">শুধু যাচাইয়ের জন্য — ওয়েবসাইটে দেখানো হবে না।</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">আপনার রিভিউ *</Label>
                  <textarea
                    value={form.review_text}
                    onChange={(e) => setForm({ ...form, review_text: e.target.value })}
                    placeholder="পণ্যটি সম্পর্কে আপনার অভিজ্ঞতা শেয়ার করুন — ভালো-মন্দ সবকিছু..."
                    maxLength={500}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[110px]"
                  />
                  <p className="text-[10px] text-muted-foreground text-right">{form.review_text.length}/500</p>
                </div>

                {/* Image upload */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    ছবি যোগ করুন (ঐচ্ছিক, সর্বোচ্চ {MAX_IMAGES}টি)
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {form.images.map((url) => (
                      <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg border bg-muted group">
                        <img src={url} alt="upload" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(url)}
                          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {form.images.length < MAX_IMAGES && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="h-20 w-20 rounded-lg border-2 border-dashed border-input bg-muted/30 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition disabled:opacity-50"
                      >
                        {uploading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <ImagePlus className="h-5 w-5" />
                            <span className="text-[10px] mt-1">ছবি যোগ করুন</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <p className="text-[10px] text-muted-foreground">সর্বোচ্চ {MAX_FILE_MB}MB প্রতি ছবি</p>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" onClick={() => handleClose(false)} className="rounded-xl">বাতিল</Button>
                  <Button onClick={handleSubmit} disabled={submitting || uploading} className="rounded-xl gap-2">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {submitting ? "জমা হচ্ছে..." : "রিভিউ জমা দিন"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductReviews;
