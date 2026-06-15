import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Package } from "lucide-react";

interface OrderRow {
  id: string;
  order_number: string;
  total: number;
  payment_expected_amount: number | null;
  payment_provider: string | null;
  payment_txn_id: string | null;
}

const PaymentSuccess = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    supabase
      .from("orders")
      .select("id, order_number, total, payment_expected_amount, payment_provider, payment_txn_id")
      .eq("id", orderId)
      .maybeSingle()
      .then(({ data }) => {
        setOrder(data as OrderRow | null);
        setLoading(false);
        localStorage.removeItem(`payment_attempts_${orderId}`);
      });
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-8 text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-emerald-100 grid place-items-center animate-[loader-slide_1s_ease-out]">
          <CheckCircle2 className="h-12 w-12 text-emerald-600" strokeWidth={2.5} />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold text-foreground">
          পেমেন্ট সফল হয়েছে!
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ধন্যবাদ — আপনার অর্ডার confirm হয়েছে
        </p>

        {order && (
          <div className="mt-6 rounded-2xl bg-muted/50 p-4 space-y-2 text-sm text-left">
            <div className="flex justify-between">
              <span className="text-muted-foreground">অর্ডার নম্বর</span>
              <span className="font-bold">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">পরিশোধিত</span>
              <span className="font-bold text-emerald-600">
                ৳{(order.payment_expected_amount ?? order.total).toLocaleString()}
              </span>
            </div>
            {order.payment_provider && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">মাধ্যম</span>
                <span className="font-semibold uppercase">{order.payment_provider}</span>
              </div>
            )}
            {order.payment_txn_id && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trx ID</span>
                <span className="font-mono text-xs">{order.payment_txn_id}</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="font-semibold"
          >
            শপিং করুন
          </Button>
          <Button
            onClick={() => order && navigate(`/order-success/${order.order_number}`)}
            className="font-semibold inline-flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            Track Order
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
