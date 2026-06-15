import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { PAYMENT_THEMES, type PaymentProvider } from "@/lib/payment-themes";

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

  const confirm = async () => {
    if (!BD_PHONE_REGEX.test(sender)) {
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
    <div className="min-h-screen bg-[#9CA3AF] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header with logo */}
        <div className="py-6 px-6 flex items-center justify-center border-b">
          <span className="text-2xl font-extrabold" style={{ color: theme.brand }}>
            {theme.name}
          </span>
        </div>

        {/* Order row */}
        <div className="px-6 py-4 flex items-center gap-3 border-b">
          <div
            className="h-10 w-10 rounded-full grid place-items-center shrink-0"
            style={{ backgroundColor: theme.brand + "22" }}
          >
            <ShoppingCart className="h-5 w-5" style={{ color: theme.brand }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              Sapahar Shop অর্ডার
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              Inv: {order.order_number}
            </p>
          </div>
          <div className="text-right font-bold text-lg" style={{ color: theme.brand }}>
            ৳{amount.toLocaleString()}
          </div>
        </div>

        {/* Pink/branded body */}
        <div className="px-6 py-8" style={{ backgroundColor: theme.brand }}>
          <h2
            className="text-center font-semibold text-base mb-4"
            style={{ color: theme.onBrand }}
          >
            আপনার {theme.nameBn} অ্যাকাউন্ট নম্বর
          </h2>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={11}
            value={sender}
            onChange={(e) => setSender(e.target.value.replace(/\D/g, ""))}
            placeholder="01XXXXXXXXX"
            className="w-full text-center text-lg font-bold tracking-wide rounded-lg bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-white/40"
          />
          <p
            className="mt-4 text-center text-xs"
            style={{ color: theme.onBrand }}
          >
            Confirm করে এগিয়ে যান, <span className="underline">terms & conditions</span>
          </p>
        </div>

        {/* Footer buttons */}
        <div className="grid grid-cols-2 divide-x border-t bg-white">
          <button
            onClick={() => navigate(-1)}
            className="py-4 font-semibold text-foreground/80 hover:bg-muted transition"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={submitting || !BD_PHONE_REGEX.test(sender)}
            className="py-4 font-semibold text-white transition disabled:opacity-60"
            style={{ backgroundColor: theme.brandDark }}
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            ) : (
              "Confirm"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentNumberEntry;
