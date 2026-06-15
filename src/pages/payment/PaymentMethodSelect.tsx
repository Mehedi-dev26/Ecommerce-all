import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, X, Copy, Check, Loader2, Phone, Truck,
  ShieldCheck, Lock, BadgeCheck,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  PAYMENT_THEMES,
  PROVIDERS_ORDER,
  type PaymentProvider,
} from "@/lib/payment-themes";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

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

type Selection = PaymentProvider | "cod" | null;

const PaymentMethodSelect = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { settings, logoUrl } = useSiteSettings();
  const brandName = settings.brand_name || "Sapahar Shop";
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [supportPhone, setSupportPhone] = useState<string>("");
  const [selected, setSelected] = useState<Selection>(null);
  const [proceeding, setProceeding] = useState(false);

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

  const proceed = async () => {
    if (!order || !selected) return;
    setProceeding(true);
    if (selected === "cod") {
      if (advanceOnly) {
        toast({
          title: "COD সম্ভব নয়",
          description: "এই অর্ডারে অগ্রিম পেমেন্ট প্রয়োজন — bKash / Nagad / Rocket নির্বাচন করুন",
          variant: "destructive",
        });
        setProceeding(false);
        return;
      }
      await supabase
        .from("orders")
        .update({ payment_method: "cod", payment_provider: null })
        .eq("id", order.id);
      navigate(`/order-success/${order.order_number}`, { replace: true });
      return;
    }
    navigate(`/payment/${order.id}/number?method=${selected}`);
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

  const selectedTheme = selected && selected !== "cod" ? PAYMENT_THEMES[selected] : null;
  const payButtonStyle = selectedTheme
    ? { backgroundColor: selectedTheme.brand, color: selectedTheme.onBrand }
    : selected === "cod"
    ? { backgroundColor: "#059669", color: "#fff" }
    : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEF3FB] via-[#F4F7FB] to-[#E8EEF8] flex flex-col">
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
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-white rounded-full px-3 py-1.5 shadow-sm">
            <Lock className="h-3 w-3" /> Secure Payment
          </div>
          <button
            onClick={() => navigate("/")}
            className="h-10 w-10 rounded-full bg-white shadow-sm grid place-items-center hover:bg-muted transition"
            aria-label="বন্ধ করুন"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Card */}
        <div className="mt-5 rounded-3xl bg-white shadow-[0_8px_32px_rgba(80,120,200,0.10)] p-6 sm:p-7 flex-1 flex flex-col">
          {/* Brand + Invoice */}
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 grid place-items-center overflow-hidden shrink-0 border">
              <img src={logoUrl} alt={brandName} className="h-full w-full object-contain p-1" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-bold text-foreground truncate">{brandName} পেমেন্ট</h1>
              <button
                onClick={handleCopyInvoice}
                className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
              >
                <span className="truncate">Invoice: {order.order_number}</span>
                {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total</p>
              <p className="text-xl font-extrabold text-foreground leading-tight">৳{amount.toLocaleString()}</p>
            </div>
          </div>

          {/* Trust strip */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { icon: ShieldCheck, label: "SSL Encrypted" },
              { icon: BadgeCheck,  label: "Verified Shop" },
              { icon: Lock,         label: "Personal Account" },
            ].map((t) => (
              <div key={t.label} className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground bg-muted/50 rounded-lg px-2 py-1.5 justify-center">
                <t.icon className="h-3 w-3 text-emerald-600" />
                {t.label}
              </div>
            ))}
          </div>

          {/* Action icons */}
          {supportPhone && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>সাহায্য দরকার?</span>
              <a href={`tel:${supportPhone}`} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                <Phone className="h-3 w-3" /> {supportPhone}
              </a>
            </div>
          )}

          {/* Section header */}
          <div className="mt-6 mb-3">
            <h2 className="text-sm font-bold text-foreground">পেমেন্ট পদ্ধতি বাছাই করুন</h2>
            <p className="text-[11px] text-muted-foreground">নিচের যেকোনো একটি option নির্বাচন করুন</p>
          </div>

          {/* Mobile banking grid */}
          <div className="grid grid-cols-3 gap-2.5">
            {PROVIDERS_ORDER.map((m) => {
              const theme = PAYMENT_THEMES[m];
              const acc = accounts.find((a) => a.method === m);
              const disabled = !acc;
              const isSelected = selected === m;
              return (
                <button
                  key={m}
                  disabled={disabled}
                  onClick={() => setSelected(m)}
                  className={`relative rounded-2xl bg-white shadow-sm transition p-3 h-28 flex flex-col items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed border-2 ${
                    isSelected ? "shadow-md scale-[1.02]" : "border-transparent hover:border-muted-foreground/20"
                  }`}
                  style={isSelected ? { borderColor: theme.brand, backgroundColor: theme.tint } : undefined}
                >
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full grid place-items-center" style={{ backgroundColor: theme.brand }}>
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  {acc?.logo_url ? (
                    <img src={acc.logo_url} alt={theme.name} className="max-h-10 max-w-full object-contain" loading="lazy" />
                  ) : (
                    <span className="font-bold text-base" style={{ color: theme.brand }}>{theme.name}</span>
                  )}
                  <span className="text-[10px] text-muted-foreground">{theme.tagline}</span>
                </button>
              );
            })}
          </div>

          {/* COD as separate row */}
          <button
            onClick={() => setSelected("cod")}
            disabled={advanceOnly}
            className={`mt-3 rounded-2xl bg-white shadow-sm transition p-4 flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed border-2 ${
              selected === "cod" ? "border-emerald-500 bg-emerald-50" : "border-transparent hover:border-muted-foreground/20"
            }`}
          >
            <div className="h-11 w-11 rounded-xl bg-emerald-100 grid place-items-center shrink-0">
              <Truck className="h-5 w-5 text-emerald-700" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-foreground">ক্যাশ অন ডেলিভারি</p>
              <p className="text-[11px] text-muted-foreground">পণ্য হাতে পেয়ে delivery agent কে দাম দিন</p>
            </div>
            {selected === "cod" && (
              <div className="h-5 w-5 rounded-full bg-emerald-600 grid place-items-center shrink-0">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </button>

          {advanceOnly && (
            <p className="mt-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ⚠️ এই অর্ডারে অগ্রিম পেমেন্ট প্রয়োজন — শুধু mobile banking ব্যবহার করুন।
            </p>
          )}

          <div className="flex-1 min-h-[12px]" />

          {/* Pay button */}
          <button
            onClick={proceed}
            disabled={!selected || proceeding}
            className="mt-6 rounded-2xl font-bold py-4 text-center transition disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground shadow-lg active:scale-[0.98]"
            style={selected ? payButtonStyle : undefined}
          >
            {proceeding ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Processing...</span>
            ) : selected === "cod" ? (
              "Confirm Cash on Delivery"
            ) : selected ? (
              `Pay Now ৳${amount.toLocaleString()} BDT →`
            ) : (
              "একটি পেমেন্ট পদ্ধতি বাছাই করুন"
            )}
          </button>

          <p className="mt-3 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" /> আপনার তথ্য সম্পূর্ণ নিরাপদ ও এনক্রিপ্টেড
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelect;
