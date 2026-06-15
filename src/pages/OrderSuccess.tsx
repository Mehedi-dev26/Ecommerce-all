import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, Check, Loader2, Clock, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";

type PayState = "loading" | "cod" | "pending" | "verified" | "error";

const PROVIDER_LABEL: Record<string, string> = {
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
};

const OrderSuccess = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [copied, setCopied] = useState(false);
  const [payState, setPayState] = useState<PayState>("loading");
  const [order, setOrder] = useState<any>(null);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: "কপি হয়েছে!", description: text });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "কপি করা যায়নি", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!orderNumber) return;
    let cancelled = false;

    const poll = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, payment_method, payment_provider, payment_sender_number, payment_expected_amount, payment_verified_at, payment_txn_id, advance_amount, total")
        .eq("order_number", orderNumber)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) { setPayState("error"); return; }
      setOrder(data);
      if (!data.payment_provider || data.payment_method === "cod") {
        setPayState("cod");
      } else if (data.payment_verified_at) {
        setPayState("verified");
      } else {
        setPayState("pending");
      }
    };

    poll();
    const interval = setInterval(() => {
      if (payState !== "verified" && payState !== "cod") poll();
    }, 3000);
    return () => { cancelled = true; clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber, payState]);

  return (
    <>
      <SEO title="অর্ডার সফল" description="আপনার অর্ডারটি Sapahar Shop সফলভাবে গ্রহণ করেছে।" path="/order-success" noindex />
      <div className="container mx-auto flex flex-col items-center px-4 py-12 sm:py-20 text-center max-w-2xl">
        {/* Header icon */}
        {payState === "verified" || payState === "cod" ? (
          <CheckCircle className="mb-6 h-20 w-20 text-primary" />
        ) : payState === "pending" ? (
          <div className="mb-6 relative">
            <Loader2 className="h-20 w-20 text-primary animate-spin" />
          </div>
        ) : (
          <Clock className="mb-6 h-20 w-20 text-muted-foreground" />
        )}

        <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-foreground">
          {payState === "verified" && "পেমেন্ট সফল! 🎉"}
          {payState === "cod" && "অর্ডার সফল হয়েছে! 🎉"}
          {payState === "pending" && "পেমেন্ট যাচাই হচ্ছে…"}
          {payState === "loading" && "লোড হচ্ছে…"}
          {payState === "error" && "অর্ডার পাওয়া যায়নি"}
        </h1>

        {payState === "pending" && (
          <p className="mb-2 text-sm text-muted-foreground max-w-md">
            আপনার {PROVIDER_LABEL[order?.payment_provider] || "মোবাইল ব্যাংকিং"} SMS-এর অপেক্ষায় আছি। SMS পেলেই অর্ডার automatic confirm হয়ে যাবে।
          </p>
        )}

        <div className="my-4 flex items-center gap-2">
          <p className="text-lg font-semibold text-primary">অর্ডার নম্বর: {orderNumber}</p>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => handleCopy(orderNumber || "")}>
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
          </Button>
        </div>

        {/* Pending payment box */}
        {payState === "pending" && order && (
          <div className="w-full mb-6 rounded-xl border-2 border-primary/30 bg-primary/5 p-4 sm:p-5 text-left space-y-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase">পরিশোধ যোগ্য</p>
              <p className="text-3xl font-extrabold text-primary">৳ {Number(order.payment_expected_amount).toLocaleString()}</p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase text-muted-foreground">আপনার {PROVIDER_LABEL[order.payment_provider]} নম্বর</p>
                <p className="font-mono text-lg font-bold">{order.payment_sender_number}</p>
              </div>
              <Smartphone className="h-5 w-5 text-primary shrink-0" />
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg">
              ⏱️ সাধারণত ১-২ মিনিটের মধ্যে SMS verify হয়ে যায়। দয়া করে এই পেজটি বন্ধ করবেন না।
            </p>
          </div>
        )}

        {/* Verified info */}
        {payState === "verified" && order && (
          <div className="w-full mb-6 rounded-xl border-2 border-green-500/40 bg-green-50 dark:bg-green-950/30 p-4 text-sm space-y-1.5">
            <p className="flex items-center justify-between"><span>Provider</span><span className="font-semibold">{PROVIDER_LABEL[order.payment_provider]}</span></p>
            <p className="flex items-center justify-between"><span>পরিশোধিত</span><span className="font-semibold">৳ {Number(order.payment_expected_amount).toLocaleString()}</span></p>
            {order.payment_txn_id && (
              <p className="flex items-center justify-between"><span>TxnID</span><span className="font-mono text-xs">{order.payment_txn_id}</span></p>
            )}
          </div>
        )}

        {/* COD info */}
        {payState === "cod" && (
          <div className="mb-6 max-w-md rounded-lg bg-muted p-6 text-sm text-left space-y-2">
            <p>📞 আমরা শীঘ্রই আপনার সাথে ফোনে যোগাযোগ করব।</p>
            <p>🚚 অর্ডার কনফার্ম হলে ২-৫ কর্মদিবসের মধ্যে ডেলিভারি পাবেন।</p>
            <p>💰 পণ্য হাতে পেয়ে টাকা পরিশোধ করবেন।</p>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild><Link to="/products">আরও পণ্য দেখুন</Link></Button>
          <Button asChild variant="outline"><Link to="/dashboard">আমার অর্ডার</Link></Button>
          <Button asChild variant="ghost"><Link to="/">হোম পেজ</Link></Button>
        </div>
      </div>
    </>
  );
};

export default OrderSuccess;
