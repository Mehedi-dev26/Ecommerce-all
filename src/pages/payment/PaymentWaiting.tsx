import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Copy, Check, Loader2, ShoppingCart, RotateCw, Smartphone, Hash,
  ShieldCheck, Phone, Info,
} from "lucide-react";
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
  account_type: string | null;
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
  const [tab, setTab] = useState<"app" | "ussd">("app");
  const [txnId, setTxnId] = useState("");
  const [submittingTxn, setSubmittingTxn] = useState(false);
  const [copied, setCopied] = useState<"num" | "amt" | "ussd" | null>(null);
  const pollRef = useRef<number | null>(null);

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
          .select("account_number, account_type, instructions_bn")
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
      description: "SMS এলে automatically confirm হবে, অন্যথায় admin verify করবেন।",
    });
    navigate(`/order-success/${order.order_number}`, { replace: true });
  };

  const copyText = async (text: string, key: "num" | "amt" | "ussd") => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    toast({ title: "কপি হয়েছে" });
    setTimeout(() => setCopied(null), 1500);
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
  const steps = tab === "app" ? theme.appSteps : theme.ussdSteps;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-3 sm:p-4"
      style={{ background: `linear-gradient(135deg, ${theme.brand}33, #111827)` }}
    >
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Order row */}
        <div className="px-5 py-4 flex items-center gap-3 bg-white">
          <div
            className="h-10 w-10 rounded-full grid place-items-center shrink-0"
            style={{ backgroundColor: theme.brand + "22" }}
          >
            <ShoppingCart className="h-5 w-5" style={{ color: theme.brand }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">Sapahar Shop</p>
            <p className="text-[11px] text-muted-foreground truncate">Inv: {order.order_number}</p>
          </div>
          <div className="text-right font-extrabold text-lg" style={{ color: theme.brand }}>
            ৳{amount.toLocaleString()}
          </div>
        </div>

        {/* Branded body */}
        <div className="px-5 py-5" style={{ backgroundColor: theme.brand }}>
          {/* Personal badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider mb-3"
            style={{ backgroundColor: "rgba(255,255,255,0.2)", color: theme.onBrand }}>
            <ShieldCheck className="h-3 w-3" /> Personal Account · Send Money
          </div>

          {/* Merchant number box */}
          <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/30 p-4 space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: theme.onBrand + "CC" }}>
                {theme.nameBn} Personal নম্বর
              </p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-extrabold tracking-wide flex-1" style={{ color: theme.onBrand }}>
                  {account.account_number}
                </p>
                <button
                  onClick={() => copyText(account.account_number, "num")}
                  className="h-9 px-3 rounded-lg bg-white/20 hover:bg-white/30 grid place-items-center transition text-xs font-semibold gap-1 inline-flex"
                  style={{ color: theme.onBrand }}
                >
                  {copied === "num" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "num" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="h-px bg-white/20" />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: theme.onBrand + "CC" }}>
                  Amount
                </p>
                <button
                  onClick={() => copyText(String(amount), "amt")}
                  className="text-left flex items-center gap-1.5 font-bold text-lg"
                  style={{ color: theme.onBrand }}
                >
                  ৳{amount.toLocaleString()}
                  {copied === "amt" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5 opacity-70" />}
                </button>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: theme.onBrand + "CC" }}>
                  Reference
                </p>
                <p className="font-bold text-xs truncate" style={{ color: theme.onBrand }}>
                  {order.order_number}
                </p>
              </div>
            </div>
          </div>

          {/* Tab switcher: App vs USSD */}
          <div className="mt-5 grid grid-cols-2 gap-1.5 rounded-xl p-1" style={{ backgroundColor: "rgba(0,0,0,0.15)" }}>
            <button
              onClick={() => setTab("app")}
              className="py-2 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition"
              style={{
                backgroundColor: tab === "app" ? theme.onBrand : "transparent",
                color: tab === "app" ? theme.brandDark : theme.onBrand,
              }}
            >
              <Smartphone className="h-3.5 w-3.5" /> Smartphone App
            </button>
            <button
              onClick={() => setTab("ussd")}
              className="py-2 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition"
              style={{
                backgroundColor: tab === "ussd" ? theme.onBrand : "transparent",
                color: tab === "ussd" ? theme.brandDark : theme.onBrand,
              }}
            >
              <Hash className="h-3.5 w-3.5" /> Dial Code ({theme.ussd})
            </button>
          </div>

          {/* USSD quick-dial */}
          {tab === "ussd" && (
            <a
              href={`tel:${encodeURIComponent(theme.ussd)}`}
              onClick={() => copyText(theme.ussd, "ussd")}
              className="mt-3 flex items-center justify-between rounded-xl bg-white/15 hover:bg-white/25 transition px-4 py-3"
              style={{ color: theme.onBrand }}
            >
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="text-sm font-semibold">Tap to dial</span>
              </div>
              <span className="text-lg font-extrabold tracking-wider">{theme.ussd}</span>
            </a>
          )}

          {/* Instructions */}
          <ol className="mt-4 space-y-2.5">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-2.5">
                <span
                  className="h-6 w-6 rounded-full grid place-items-center text-[11px] font-bold shrink-0 mt-0.5"
                  style={{ backgroundColor: theme.onBrand, color: theme.brandDark }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 leading-snug" style={{ color: theme.onBrand }}>
                  <p className="text-sm font-medium">{s.step}</p>
                  {s.hint && (
                    <p className="text-[11px] mt-0.5" style={{ color: theme.onBrand + "AA" }}>
                      <Info className="h-3 w-3 inline -mt-0.5 mr-1" />{s.hint}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>

          {/* Admin custom instructions */}
          {account.instructions_bn && (
            <div className="mt-4 rounded-xl bg-black/15 p-3 text-xs leading-snug" style={{ color: theme.onBrand }}>
              <p className="font-bold mb-1">📌 অতিরিক্ত নির্দেশনা:</p>
              <p>{account.instructions_bn}</p>
            </div>
          )}

          {/* Waiting status */}
          <div className="mt-5 text-center">
            {phase === "waiting" && (
              <>
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-white/15 backdrop-blur" style={{ color: theme.onBrand }}>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-bold text-sm">Payment auto-detect হচ্ছে... {seconds}s</span>
                </div>
                <p className="mt-2 text-[11px]" style={{ color: theme.onBrand + "CC" }}>
                  Attempt {attempts + 1} / {MAX_RETRIES + 1} · টাকা পাঠান, আমরা SMS check করছি
                </p>
              </>
            )}
            {phase === "expired" && (
              <p className="font-semibold text-sm" style={{ color: theme.onBrand }}>
                Payment confirm হয়নি — আবার চেষ্টা করুন বা TrxID দিন
              </p>
            )}
            {phase === "txnForm" && (
              <p className="font-semibold text-sm" style={{ color: theme.onBrand }}>
                আপনার Transaction ID দিয়ে submit করুন
              </p>
            )}
          </div>

          {phase === "txnForm" && (
            <div className="mt-4 rounded-2xl bg-white p-4 space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Transaction ID (SMS থেকে)
                </label>
                <Input
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value.toUpperCase())}
                  placeholder="যেমন: 8N7AB9CDE1"
                  className="mt-1 text-center font-mono tracking-wider text-base"
                />
              </div>
              <Button
                onClick={submitTxn}
                disabled={submittingTxn}
                className="w-full font-bold py-3"
                style={{ backgroundColor: theme.brandDark, color: theme.onBrand }}
              >
                {submittingTxn ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Transaction ID"}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                SMS এলে auto match হবে — না হলে admin manually verify করে অর্ডার confirm করবেন
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
              className="py-4 font-semibold inline-flex items-center justify-center gap-2"
              style={{ backgroundColor: theme.brandDark, color: theme.onBrand, opacity: 0.85 }}
            >
              <Loader2 className="h-4 w-4 animate-spin" /> Waiting...
            </button>
          )}
          {phase === "expired" && (
            <button
              onClick={tryAgain}
              className="py-4 font-bold inline-flex items-center justify-center gap-2"
              style={{ backgroundColor: theme.brandDark, color: theme.onBrand }}
            >
              <RotateCw className="h-4 w-4" /> Try Again ({MAX_RETRIES - attempts} left)
            </button>
          )}
          {phase === "txnForm" && (
            <button
              onClick={submitTxn}
              disabled={submittingTxn}
              className="py-4 font-bold disabled:opacity-60"
              style={{ backgroundColor: theme.brandDark, color: theme.onBrand }}
            >
              {submittingTxn ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Submit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentWaiting;
