import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Loader2, ShoppingCart, RotateCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { PAYMENT_THEMES, type PaymentProvider } from "@/lib/payment-themes";

interface OrderRow {
  id: string;
  order_number: string;
  total: number;
  payment_expected_amount: number | null;
  payment_verified_at: string | null;
}

interface AccountRow {
  account_number: string;
  instructions_bn: string | null;
}

const WAIT_SECONDS = 30;
const MAX_RETRIES = 2;

const PaymentWaiting = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const method = (params.get("method") || "bkash") as PaymentProvider;
  const theme = PAYMENT_THEMES[method] || PAYMENT_THEMES.bkash;

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [account, setAccount] = useState<AccountRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [seconds, setSeconds] = useState(WAIT_SECONDS);
  const [attempts, setAttempts] = useState<number>(() => {
    const v = localStorage.getItem(`payment_attempts_${orderId}`);
    return v ? parseInt(v, 10) : 0;
  });
  const [phase, setPhase] = useState<"waiting" | "expired" | "txnForm">("waiting");
  const [txnId, setTxnId] = useState("");
  const [submittingTxn, setSubmittingTxn] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<number | null>(null);

  // Initial fetch + realtime subscribe
  useEffect(() => {
    if (!orderId) return;
    let mounted = true;

    (async () => {
      const [orderRes, accRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, order_number, total, payment_expected_amount, payment_verified_at")
          .eq("id", orderId)
          .maybeSingle(),
        supabase
          .from("payment_accounts")
          .select("account_number, instructions_bn")
          .eq("method", method)
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);
      if (!mounted) return;
      setOrder(orderRes.data as OrderRow | null);
      setAccount(accRes.data as AccountRow | null);
      setLoading(false);
      if (orderRes.data?.payment_verified_at) {
        navigate(`/payment/${orderId}/success`, { replace: true });
      }
    })();

    const channel = supabase
      .channel(`order-payment-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload: any) => {
          if (payload.new?.payment_verified_at) {
            navigate(`/payment/${orderId}/success`, { replace: true });
          }
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [orderId, method, navigate]);

  // Countdown + fallback poll every 3s
  useEffect(() => {
    if (phase !== "waiting") return;
    setSeconds(WAIT_SECONDS);
    const startedAt = Date.now();

    const tick = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remain = WAIT_SECONDS - elapsed;
      setSeconds(remain > 0 ? remain : 0);
      if (remain <= 0) {
        window.clearInterval(tick);
        if (pollRef.current) window.clearInterval(pollRef.current);
        setPhase(attempts >= MAX_RETRIES ? "txnForm" : "expired");
      }
    }, 500);

    pollRef.current = window.setInterval(async () => {
      if (!orderId) return;
      const { data } = await supabase
        .from("orders")
        .select("payment_verified_at")
        .eq("id", orderId)
        .maybeSingle();
      if (data?.payment_verified_at) {
        navigate(`/payment/${orderId}/success`, { replace: true });
      }
    }, 3000) as unknown as number;

    return () => {
      window.clearInterval(tick);
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [phase, attempts, orderId, navigate]);

  const tryAgain = () => {
    const next = attempts + 1;
    setAttempts(next);
    localStorage.setItem(`payment_attempts_${orderId}`, String(next));
    setPhase("waiting");
  };

  const submitTxn = async () => {
    if (!order) return;
    if (!txnId.trim() || txnId.trim().length < 6) {
      toast({
        title: "ভুল Transaction ID",
        description: "সঠিক TrxID দিন (কমপক্ষে ৬ অক্ষর)",
        variant: "destructive",
      });
      return;
    }
    setSubmittingTxn(true);
    const { error } = await supabase
      .from("orders")
      .update({ payment_txn_id: txnId.trim() })
      .eq("id", order.id);
    setSubmittingTxn(false);
    if (error) {
      toast({ title: "সমস্যা", description: error.message, variant: "destructive" });
      return;
    }
    localStorage.removeItem(`payment_attempts_${orderId}`);
    toast({
      title: "জমা হয়েছে",
      description: "SMS এলে automatically confirm হবে, অন্যথায় admin verify করবে।",
    });
    navigate(`/order-success/${order.order_number}`, { replace: true });
  };

  const handleCopy = async () => {
    if (!account) return;
    await navigator.clipboard.writeText(account.account_number);
    setCopied(true);
    toast({ title: "কপি হয়েছে" });
    setTimeout(() => setCopied(false), 1500);
  };

  const cancel = () => {
    localStorage.removeItem(`payment_attempts_${orderId}`);
    navigate(`/payment/${orderId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order || !account) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted p-6 text-center">
        <h2 className="text-xl font-semibold">তথ্য পাওয়া যায়নি</h2>
        <Button onClick={() => navigate("/")}>হোমে ফিরে যান</Button>
      </div>
    );
  }

  const amount = order.payment_expected_amount ?? order.total;

  return (
    <div className="min-h-screen bg-[#9CA3AF] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Order row */}
        <div className="px-6 py-4 flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-full grid place-items-center shrink-0"
            style={{ backgroundColor: theme.brand + "22" }}
          >
            <ShoppingCart className="h-5 w-5" style={{ color: theme.brand }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">Sapahar Shop অর্ডার</p>
            <p className="text-[11px] text-muted-foreground truncate">
              Inv: {order.order_number}
            </p>
          </div>
          <div className="text-right font-bold text-lg" style={{ color: theme.brand }}>
            ৳{amount.toLocaleString()}
          </div>
        </div>

        {/* Branded body */}
        <div className="px-6 py-6" style={{ backgroundColor: theme.brand }}>
          {/* Merchant number box */}
          <div className="rounded-xl border-2 border-white/40 px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p
                className="text-[10px] uppercase tracking-widest font-semibold"
                style={{ color: theme.onBrand + "CC" }}
              >
                Merchant Number
              </p>
              <p
                className="text-2xl font-extrabold tracking-wide truncate"
                style={{ color: theme.onBrand }}
              >
                {account.account_number}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 grid place-items-center transition shrink-0"
              aria-label="Copy"
            >
              {copied ? (
                <Check className="h-5 w-5" style={{ color: theme.onBrand }} />
              ) : (
                <Copy className="h-5 w-5" style={{ color: theme.onBrand }} />
              )}
            </button>
          </div>

          {/* Instructions */}
          <ol className="mt-5 space-y-2.5" style={{ color: theme.onBrand }}>
            {theme.instructions.map((line, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <span
                  className="h-5 w-5 rounded-full grid place-items-center text-[11px] font-bold shrink-0 mt-0.5"
                  style={{ backgroundColor: theme.onBrand, color: theme.brandDark }}
                >
                  {i + 1}
                </span>
                <span className="leading-snug">{line}</span>
              </li>
            ))}
          </ol>

          {/* Waiting status */}
          <div className="mt-6 text-center">
            {phase === "waiting" && (
              <>
                <p
                  className="font-bold text-base animate-pulse"
                  style={{ color: theme.onBrand }}
                >
                  Waiting for payment... ({seconds}s)
                </p>
                <p className="mt-1 text-[11px]" style={{ color: theme.onBrand + "CC" }}>
                  Attempt {attempts + 1} / {MAX_RETRIES + 1}
                </p>
              </>
            )}
            {phase === "expired" && (
              <p className="font-semibold text-sm" style={{ color: theme.onBrand }}>
                Payment confirm হয়নি — আবার চেষ্টা করুন
              </p>
            )}
            {phase === "txnForm" && (
              <p className="font-semibold text-sm" style={{ color: theme.onBrand }}>
                আপনার Transaction ID দিয়ে submit করুন
              </p>
            )}
          </div>

          {/* Txn form */}
          {phase === "txnForm" && (
            <div className="mt-4 rounded-xl bg-white p-3 space-y-2">
              <Input
                value={txnId}
                onChange={(e) => setTxnId(e.target.value.toUpperCase())}
                placeholder="যেমন: 8N7AB9CDE1"
                className="text-center font-mono tracking-wider"
              />
              <Button
                onClick={submitTxn}
                disabled={submittingTxn}
                className="w-full font-bold"
                style={{ backgroundColor: theme.brandDark, color: theme.onBrand }}
              >
                {submittingTxn ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Submit Transaction ID"
                )}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                SMS এলে auto match হবে, না হলে admin manual verify করবে
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="grid grid-cols-2 divide-x border-t bg-white">
          <button
            onClick={cancel}
            className="py-4 font-semibold text-foreground/80 hover:bg-muted transition"
          >
            Cancel
          </button>
          {phase === "waiting" && (
            <button
              disabled
              className="py-4 font-semibold text-white/90 inline-flex items-center justify-center gap-2"
              style={{ backgroundColor: theme.brandDark, opacity: 0.7 }}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              Waiting...
            </button>
          )}
          {phase === "expired" && (
            <button
              onClick={tryAgain}
              className="py-4 font-semibold text-white inline-flex items-center justify-center gap-2"
              style={{ backgroundColor: theme.brandDark }}
            >
              <RotateCw className="h-4 w-4" />
              Try Again ({MAX_RETRIES - attempts} left)
            </button>
          )}
          {phase === "txnForm" && (
            <button
              onClick={submitTxn}
              disabled={submittingTxn}
              className="py-4 font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: theme.brandDark }}
            >
              {submittingTxn ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                "Submit"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentWaiting;
