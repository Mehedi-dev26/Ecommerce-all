import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X, Copy, Check, Loader2, Headphones, Phone, Truck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  PAYMENT_THEMES,
  PROVIDERS_ORDER,
  type PaymentProvider,
} from "@/lib/payment-themes";

interface OrderRow {
  id: string;
  order_number: string;
  total: number;
  payment_expected_amount: number | null;
  payment_verified_at: string | null;
  advance_amount: number;
  customer_phone: string;
}

interface AccountRow {
  id: string;
  method: PaymentProvider;
  account_number: string;
  logo_url: string | null;
}

const PaymentMethodSelect = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"mobile" | "intl">("mobile");
  const [copied, setCopied] = useState(false);
  const [supportPhone, setSupportPhone] = useState<string>("");

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      const [orderRes, accRes, settingsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, order_number, total, payment_expected_amount, payment_verified_at, advance_amount, customer_phone")
          .eq("id", orderId)
          .maybeSingle(),
        supabase
          .from("payment_accounts")
          .select("id, method, account_number, logo_url")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase.from("site_settings").select("value").eq("key", "support_phone").maybeSingle(),
      ]);
      setOrder(orderRes.data as OrderRow | null);
      setAccounts((accRes.data || []) as AccountRow[]);
      setSupportPhone(settingsRes.data?.value || "");
      setLoading(false);

      if (orderRes.data?.payment_verified_at) {
        navigate(`/payment/${orderId}/success`, { replace: true });
      }
    })();
  }, [orderId, navigate]);

  const amount = order?.payment_expected_amount ?? order?.total ?? 0;
  const advanceOnly = (order?.advance_amount ?? 0) > 0;

  const handleCopyInvoice = async () => {
    if (!order) return;
    await navigator.clipboard.writeText(order.order_number);
    setCopied(true);
    toast({ title: "কপি হয়েছে", description: order.order_number });
    setTimeout(() => setCopied(false), 1500);
  };

  const choose = async (method: PaymentProvider | "cod") => {
    if (!order) return;
    if (method === "cod") {
      if (advanceOnly) {
        toast({
          title: "COD সম্ভব নয়",
          description: "এই অর্ডারে অগ্রিম পেমেন্ট প্রয়োজন — bKash / Nagad / Rocket নির্বাচন করুন",
          variant: "destructive",
        });
        return;
      }
      await supabase
        .from("orders")
        .update({ payment_method: "cod", payment_provider: null })
        .eq("id", order.id);
      navigate(`/order-success/${order.order_number}`, { replace: true });
      return;
    }
    navigate(`/payment/${order.id}/number?method=${method}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/30 p-6 text-center">
        <h2 className="text-xl font-semibold">অর্ডার পাওয়া যায়নি</h2>
        <Button onClick={() => navigate("/")}>হোমে ফিরে যান</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] bg-[radial-gradient(circle_at_1px_1px,_rgba(80,120,200,0.07)_1px,_transparent_0)] bg-[length:18px_18px] flex flex-col">
      <div className="mx-auto w-full max-w-xl flex-1 flex flex-col p-4 sm:p-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-full bg-white shadow-sm grid place-items-center hover:bg-muted transition"
            aria-label="ফিরে যান"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate("/")}
            className="h-10 w-10 rounded-full bg-white shadow-sm grid place-items-center hover:bg-muted transition"
            aria-label="বন্ধ করুন"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Card */}
        <div className="mt-6 rounded-3xl bg-white shadow-[0_8px_32px_rgba(80,120,200,0.08)] p-6 sm:p-8 flex-1 flex flex-col">
          {/* Brand + Invoice */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 grid place-items-center text-2xl shrink-0">
              🥭
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground">Sapahar Shop পেমেন্ট</h1>
              <button
                onClick={handleCopyInvoice}
                className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
              >
                <span className="truncate">Invoice ID: {order.order_number}</span>
                {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>

          {/* Action icons */}
          <div className="mt-5 flex items-center justify-center gap-3">
            <a
              href={supportPhone ? `tel:${supportPhone}` : "#"}
              className="h-11 w-11 rounded-xl bg-muted hover:bg-muted/70 grid place-items-center transition"
              aria-label="Support"
            >
              <Headphones className="h-5 w-5 text-muted-foreground" />
            </a>
            <a
              href={supportPhone ? `tel:${supportPhone}` : "#"}
              className="h-11 w-11 rounded-xl bg-muted hover:bg-muted/70 grid place-items-center transition"
              aria-label="Call"
            >
              <Phone className="h-5 w-5 text-muted-foreground" />
            </a>
          </div>

          {/* Tabs */}
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1.5">
            <button
              onClick={() => setTab("mobile")}
              className={`py-2.5 text-sm font-semibold rounded-lg transition ${
                tab === "mobile"
                  ? "bg-[#2962FF] text-white shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mobile Banking
            </button>
            <button
              onClick={() => setTab("intl")}
              disabled
              className="py-2.5 text-sm font-semibold rounded-lg text-muted-foreground/60 cursor-not-allowed"
            >
              International
            </button>
          </div>

          {/* Method grid */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PROVIDERS_ORDER.map((m) => {
              const theme = PAYMENT_THEMES[m];
              const acc = accounts.find((a) => a.method === m);
              const disabled = !acc;
              return (
                <button
                  key={m}
                  disabled={disabled}
                  onClick={() => choose(m)}
                  className={`group rounded-2xl border-2 border-transparent bg-white shadow-sm hover:shadow-md hover:border-primary/30 active:scale-95 transition p-3 h-24 grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed`}
                  style={{ outlineColor: theme.brand }}
                >
                  {acc?.logo_url ? (
                    <img
                      src={acc.logo_url}
                      alt={theme.name}
                      className="max-h-12 max-w-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="font-bold text-lg" style={{ color: theme.brand }}>
                      {theme.name}
                    </span>
                  )}
                </button>
              );
            })}

            {/* COD option */}
            <button
              onClick={() => choose("cod")}
              disabled={advanceOnly}
              className="rounded-2xl border-2 border-transparent bg-white shadow-sm hover:shadow-md hover:border-primary/30 active:scale-95 transition p-3 h-24 flex flex-col items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Truck className="h-6 w-6 text-emerald-600" />
              <span className="text-xs font-semibold text-foreground leading-tight text-center">
                ক্যাশ অন<br />ডেলিভারি
              </span>
            </button>
          </div>

          {advanceOnly && (
            <p className="mt-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ⚠️ এই অর্ডারে অগ্রিম পেমেন্ট প্রয়োজন — শুধু mobile banking ব্যবহার করুন।
            </p>
          )}

          <div className="flex-1" />

          {/* Pay button (informational here) */}
          <div className="mt-6 rounded-2xl bg-[#E8F0FF] text-[#2962FF] font-bold py-3.5 text-center">
            Pay ৳{amount.toLocaleString()} BDT
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            একটি payment method বেছে নিয়ে পরবর্তী step এ যান
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelect;
