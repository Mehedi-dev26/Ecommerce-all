import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVendor } from "@/hooks/useVendor";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingBag } from "lucide-react";

const statusLabel: Record<string, { label: string; variant: any }> = {
  pending: { label: "অপেক্ষমাণ", variant: "secondary" },
  confirmed: { label: "নিশ্চিত", variant: "default" },
  processing: { label: "প্রক্রিয়াধীন", variant: "default" },
  shipped: { label: "পাঠানো", variant: "default" },
  delivered: { label: "ডেলিভার্ড", variant: "default" },
  cancelled: { label: "বাতিল", variant: "destructive" },
};

const VendorOrders = () => {
  const { vendor } = useVendor();

  const { data: items, isLoading } = useQuery({
    queryKey: ["vendor-orders", vendor?.id],
    enabled: !!vendor?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("order_items" as any)
        .select(
          "id, product_name, quantity, price, vendor_payout_amount, commission_amount, order_id, orders:order_id(order_number, customer_name, customer_phone, status, created_at, shipping_address, district, city)"
        )
        .eq("vendor_id", vendor!.id)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  // Group by order
  const orders = (items || []).reduce((acc: Record<string, any>, item: any) => {
    const id = item.order_id;
    if (!acc[id]) {
      acc[id] = { ...item.orders, order_id: id, items: [], total_payout: 0 };
    }
    acc[id].items.push(item);
    acc[id].total_payout += Number(item.vendor_payout_amount || 0);
    return acc;
  }, {});

  const orderList = Object.values(orders).sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (isLoading) {
    return <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">অর্ডার</h1>
        <p className="text-muted-foreground text-sm mt-1">আপনার পণ্যের অর্ডার তালিকা</p>
      </div>

      {!orderList.length ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>এখনো কোনো অর্ডার আসেনি</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orderList.map((o: any) => {
            const st = statusLabel[o.status] || { label: o.status, variant: "secondary" };
            return (
              <Card key={o.order_id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold">{o.order_number}</p>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(o.created_at).toLocaleString("bn-BD")} • {o.customer_name} • {o.customer_phone}
                      </p>
                      <p className="text-xs text-muted-foreground">{o.shipping_address}, {o.district || o.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">আপনার আয়</p>
                      <p className="font-bold text-green-700">৳{Math.round(o.total_payout).toLocaleString("bn-BD")}</p>
                    </div>
                  </div>
                  <div className="border-t pt-2 space-y-1">
                    {o.items.map((it: any) => (
                      <div key={it.id} className="flex justify-between text-sm">
                        <span className="truncate">{it.product_name} × {it.quantity}</span>
                        <span className="text-muted-foreground">৳{Number(it.price).toLocaleString("bn-BD")}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VendorOrders;
