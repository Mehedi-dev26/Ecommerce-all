import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVendor } from "@/hooks/useVendor";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wallet, TrendingUp, Receipt } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const formatBDT = (n: number) => `৳${Math.round(n).toLocaleString("bn-BD")}`;

const VendorEarnings = () => {
  const { vendor } = useVendor();

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-earnings", vendor?.id],
    enabled: !!vendor?.id,
    queryFn: async () => {
      const [itemsRes, payoutsRes] = await Promise.all([
        supabase
          .from("order_items" as any)
          .select(
            "id, product_name, quantity, price, commission_percent, commission_amount, vendor_payout_amount, orders:order_id(order_number, status, created_at)"
          )
          .eq("vendor_id", vendor!.id),
        supabase
          .from("vendor_payouts" as any)
          .select("amount, status")
          .eq("vendor_id", vendor!.id),
      ]);

      const items = (itemsRes.data || []) as any[];
      const payouts = (payoutsRes.data || []) as any[];

      let earned = 0;
      let pendingEarn = 0;
      let totalCommission = 0;

      items.forEach((it) => {
        const status = it.orders?.status;
        if (status === "delivered") {
          earned += Number(it.vendor_payout_amount || 0);
          totalCommission += Number(it.commission_amount || 0);
        } else if (status !== "cancelled") {
          pendingEarn += Number(it.vendor_payout_amount || 0);
        }
      });

      const withdrawn = payouts
        .filter((p) => p.status === "paid")
        .reduce((s, p) => s + Number(p.amount || 0), 0);
      const pendingPayout = payouts
        .filter((p) => p.status === "pending" || p.status === "approved")
        .reduce((s, p) => s + Number(p.amount || 0), 0);

      const balance = earned - withdrawn - pendingPayout;

      return { items, earned, pendingEarn, totalCommission, withdrawn, pendingPayout, balance };
    },
  });

  if (isLoading) {
    return <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">আয়ের বিবরণ</h1>
        <p className="text-muted-foreground text-sm mt-1">প্রতিটি অর্ডার থেকে আপনার আয়</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Wallet className="h-3.5 w-3.5" /> বর্তমান ব্যালেন্স
            </div>
            <p className="text-xl font-bold text-green-700">{formatBDT(data?.balance ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3.5 w-3.5" /> মোট আয়
            </div>
            <p className="text-xl font-bold">{formatBDT(data?.earned ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Receipt className="h-3.5 w-3.5" /> উত্তোলিত
            </div>
            <p className="text-xl font-bold">{formatBDT(data?.withdrawn ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Receipt className="h-3.5 w-3.5" /> পেন্ডিং উত্তোলন
            </div>
            <p className="text-xl font-bold text-amber-600">{formatBDT(data?.pendingPayout ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h2 className="font-bold">অর্ডারভিত্তিক আয়</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>অর্ডার</TableHead>
                  <TableHead>পণ্য</TableHead>
                  <TableHead className="text-right">মোট</TableHead>
                  <TableHead className="text-right">কমিশন</TableHead>
                  <TableHead className="text-right">আপনার আয়</TableHead>
                  <TableHead>অবস্থা</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.items || []).length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">কোনো ডেটা নেই</TableCell></TableRow>
                ) : (
                  data!.items.map((it: any) => (
                    <TableRow key={it.id}>
                      <TableCell className="text-xs">{it.orders?.order_number}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{it.product_name} × {it.quantity}</TableCell>
                      <TableCell className="text-right text-xs">{formatBDT(Number(it.price) * Number(it.quantity))}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        −{formatBDT(Number(it.commission_amount))} ({it.commission_percent}%)
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-700">{formatBDT(Number(it.vendor_payout_amount))}</TableCell>
                      <TableCell>
                        <Badge variant={it.orders?.status === "delivered" ? "default" : it.orders?.status === "cancelled" ? "destructive" : "secondary"} className="text-[10px]">
                          {it.orders?.status === "delivered" ? "পেইড" : it.orders?.status === "cancelled" ? "বাতিল" : "চলমান"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorEarnings;
