import { useState } from "react";
import { z } from "zod";
import { Star, Send, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const reviewSchema = z.object({
  customer_name: z.string().trim().min(2, "নাম কমপক্ষে ২ অক্ষর হতে হবে").max(60, "নাম খুব বড়"),
  location: z.string().trim().max(80, "এলাকার নাম খুব বড়").optional(),
  contact_info: z.string().trim().max(60, "যোগাযোগ তথ্য খুব বড়").optional(),
  rating: z.number().int().min(1).max(5),
  review_text: z.string().trim().min(10, "অন্তত ১০ অক্ষর লিখুন").max(500, "৫০০ অক্ষরের বেশি নয়"),
});

interface ReviewSubmissionDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const ReviewSubmissionDialog = ({ open, onOpenChange }: ReviewSubmissionDialogProps) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [form, setForm] = useState({
    customer_name: "",
    location: "",
    contact_info: "",
    rating: 5,
    review_text: "",
  });

  const reset = () => {
    setForm({ customer_name: "", location: "", contact_info: "", rating: 5, review_text: "" });
    setSubmitted(false);
    setHoverRating(0);
  };

  const handleClose = (v: boolean) => {
    onOpenChange(v);
    if (!v) setTimeout(reset, 300);
  };

  const handleSubmit = async () => {
    const parsed = reviewSchema.safeParse(form);
    if (!parsed.success) {
      toast({
        title: "ত্রুটি",
        description: parsed.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("customer_reviews").insert({
      customer_name: parsed.data.customer_name,
      location: parsed.data.location || null,
      contact_info: parsed.data.contact_info || null,
      rating: parsed.data.rating,
      review_text: parsed.data.review_text,
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-[95vw] rounded-2xl">
        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-emerald-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">ধন্যবাদ! 🎉</h3>
              <p className="text-sm text-muted-foreground">
                আপনার রিভিউ জমা হয়েছে। অ্যাডমিন অনুমোদনের পর এটি ওয়েবসাইটে দেখানো হবে।
              </p>
            </div>
            <Button onClick={() => handleClose(false)} className="rounded-xl">
              বন্ধ করুন
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary fill-primary" />
                আপনার মতামত দিন
              </DialogTitle>
              <DialogDescription>
                আপনার অভিজ্ঞতা আমাদের সেবা উন্নত করতে সাহায্য করবে।
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Rating */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  রেটিং *
                </Label>
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
                          s <= (hoverRating || form.rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30",
                        )}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {form.rating}/5
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    নাম *
                  </Label>
                  <Input
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                    placeholder="আপনার নাম"
                    maxLength={60}
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
                    maxLength={80}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  ফোন/ইমেইল (ঐচ্ছিক)
                </Label>
                <Input
                  value={form.contact_info}
                  onChange={(e) => setForm({ ...form, contact_info: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  maxLength={60}
                  className="rounded-xl"
                />
                <p className="text-[10px] text-muted-foreground">
                  শুধুমাত্র যাচাইয়ের জন্য — ওয়েবসাইটে দেখানো হবে না।
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  আপনার রিভিউ *
                </Label>
                <textarea
                  value={form.review_text}
                  onChange={(e) => setForm({ ...form, review_text: e.target.value })}
                  placeholder="আপনার অভিজ্ঞতা শেয়ার করুন..."
                  maxLength={500}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
                />
                <p className="text-[10px] text-muted-foreground text-right">
                  {form.review_text.length}/500
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => handleClose(false)} className="rounded-xl">
                  বাতিল
                </Button>
                <Button onClick={handleSubmit} disabled={submitting} className="rounded-xl gap-2">
                  <Send className="h-4 w-4" />
                  {submitting ? "জমা হচ্ছে..." : "জমা দিন"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReviewSubmissionDialog;
