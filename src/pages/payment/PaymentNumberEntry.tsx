import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, ShoppingCart, Lock, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { PAYMENT_THEMES, type PaymentProvider } from "@/lib/payment-themes";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

interface OrderRow {
  id: string;
  order_number: string;
  total: number;
  payment_expected_amount: number | null;
  payment_verified_at: string | null;
}

const PaymentNumberEntry = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const brandName = settings.brand_name || "Sapahar Shop";
  const method = (params.get("method") || "bkash") as PaymentProvider;
  const theme = PAYMENT_THEMES[method] || PAYMENT_THEMES.bkash;

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [sender, setSender] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    supabase
      .from("orders")
      .select("id, order_number, total, payment_expected_amount, payment_verified_at")
      .eq("id", orderId)
      .maybeSingle()
      .then(({ data }) => {
        setOrder(data as OrderRow | null);
        setLoading(false);
        if (data?.payment_verified_at) {
          navigate(`/payment/${orderId}/success`, { replace: true });
        }
      });
  }, [orderId, navigate]);

  const amount = order?.payment_expected_amount ?? order?.total ?? 0;
  const valid = BD_PHONE_REGEX.test(sender);

  const confirm = async () => {
    if (!valid) {
      toast({
        title: "ভুল নম্বর",
        description: "সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)",
        variant: "destructive",
      });
      return;
    }
    if (!order) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("orders")
      .update({
        payment_method: method,
        payment_provider: method,
        payment_sender_number: sender,
        payment_expected_amount: amount,
      })
      .eq("id", order.id);
    setSubmitting(false);
    if (error) {
      toast({ title: "সমস্যা", description: error.message, variant: "destructive" });
      return;
    }
    navigate(`/payment/${order.id}/waiting?method=${method}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted p-6 text-center">
        <h2 className="text-xl font-semibold">অর্ডার পাওয়া যায়নি</h2>
        <Button onClick={() => navigate("/")}>হোমে ফিরে যান</Button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: `linear-gradient(135deg, ${theme.brand}33, #1f2937)` }}
    >
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Top bar */}
        <div className="px-5 pt-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full bg-muted grid place-items-center hover:bg-muted/70 transition">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted rounded-full px-2.5 py-1">
            <Lock className="h-3 w-3" /> Secure
          </div>
        </div>

        {/* Header with logo */}
        <div className="py-5 px-6 flex flex-col items-center gap-1">
          <span className="text-3xl font-extrabold" style={{ color: theme.brand }}>
            {theme.name}
          </span>
          <span className="text-[11px] text-muted-foreground">{theme.tagline}</span>
        </div>

        {/* Order row */}
        <div className="px-6 py-3 mx-5 rounded-2xl bg-muted/40 flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-full grid place-items-center shrink-0"
            style={{ backgroundColor: theme.brand + "22" }}
          >
            <ShoppingCart className="h-5 w-5" style={{ color: theme.brand }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">Sapahar Shop</p>
            <p className="text-[11px] text-muted-foreground truncate">Invoice: {order.order_number}</p>
          </div>
          <div className="text-right font-extrabold text-lg" style={{ color: theme.brand }}>
            ৳{amount.toLocaleString()}
          </div>
        </div>

        {/* Branded body */}
        <div className="px-6 pt-7 pb-6 mt-5" style={{ backgroundColor: theme.brand }}>
          <h2 className="text-center font-semibold text-base mb-1" style={{ color: theme.onBrand }}>
            আপনার {theme.nameBn} অ্যাকাউন্ট নম্বর
          </h2>
          <p className="text-center text-[11px] mb-4" style={{ color: theme.onBrand + "CC" }}>
            যে নম্বর থেকে Send Money করবেন সেটি লিখুন
          </p>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={11}
            value={sender}
            onChange={(e) => setSender(e.target.value.replace(/\D/g, ""))}
            placeholder="01XXXXXXXXX"
            autoFocus
            className="w-full text-center text-xl font-bold tracking-widest rounded-xl bg-white px-4 py-3.5 outline-none focus:ring-4 focus:ring-white/40 placeholder:text-muted-foreground/50"
          />
          <p className="mt-3 text-center text-[11px] leading-snug" style={{ color: theme.onBrand + "DD" }}>
            <Info className="h-3 w-3 inline mr-1 -mt-0.5" />
            এটি একটি <b>Personal</b> অ্যাকাউন্ট — Send Money অপশন ব্যবহার করতে হবে
          </p>
        </div>

        {/* Footer buttons */}
        <div className="grid grid-cols-5 divide-x border-t bg-white">
          <button
            onClick={() => navigate(-1)}
            className="col-span-2 py-4 font-semibold text-foreground/80 hover:bg-muted transition"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={submitting || !valid}
            className="col-span-3 py-4 font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: theme.brandDark }}
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            ) : (
              "Confirm & Continue →"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentNumberEntry;
