import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVendor } from "@/hooks/useVendor";
import { Card, CardContent } from "@/components/ui/card";
import { Package, ShoppingBag, Wallet, Clock, TrendingUp, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const formatBDT = (n: number) => `৳${Math.round(n).toLocaleString("bn-BD")}`;

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold truncate">{value}</p>
      </div>
    </CardContent>
  </Card>
);

const VendorDashboard = () => {
  const { vendor } = useVendor();

  const { data: stats } = useQuery({
    queryKey: ["vendor-dashboard", vendor?.id],
    enabled: !!vendor?.id,
    queryFn: async () => {
      const vid = vendor!.id;
      const [productsRes, itemsRes] = await Promise.all([
        supabase.from("products").select("id,vendor_status,is_active,stock", { count: "exact" }).eq("vendor_id", vid),
        supabase
          .from("order_items" as any)
          .select("id, vendor_payout_amount, commission_amount, quantity, price, order_id, orders:order_id(status,created_at)")
          .eq("vendor_id", vid),
      ]);

      const products = (productsRes.data || []) as any[];
      const items = (itemsRes.data || []) as any[];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let totalEarnings = 0;
      let pendingEarnings = 0;
      let todayOrders = 0;
      const orderIds = new Set<string>();
      const pendingOrderIds = new Set<string>();

      items.forEach((it) => {
        const status = it.orders?.status;
        const createdAt = it.orders?.created_at ? new Date(it.orders.created_at) : null;
        orderIds.add(it.order_id);
        if (status === "delivered") {
          totalEarnings += Number(it.vendor_payout_amount || 0);
        } else if (status !== "cancelled") {
          pendingEarnings += Number(it.vendor_payout_amount || 0);
          pendingOrderIds.add(it.order_id);
        }
        if (createdAt && createdAt >= today) todayOrders++;
      });

      return {
        productCount: products.length,
        approvedProducts: products.filter((p) => p.vendor_status === "approved").length,
        pendingProducts: products.filter((p) => p.vendor_status === "pending").length,
        totalOrders: orderIds.size,
        pendingOrders: pendingOrderIds.size,
        todayOrders,
        totalEarnings,
        pendingEarnings,
      };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">স্বাগতম, {vendor?.owner_name}!</h1>
        <p className="text-muted-foreground text-sm mt-1">আপনার দোকানের সারসংক্ষেপ</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={ShoppingBag} label="মোট অর্ডার" value={stats?.totalOrders ?? 0} color="bg-blue-100 text-blue-700" />
        <StatCard icon={Clock} label="অপেক্ষমাণ অর্ডার" value={stats?.pendingOrders ?? 0} color="bg-amber-100 text-amber-700" />
        <StatCard icon={CheckCircle2} label="আজকের অর্ডার" value={stats?.todayOrders ?? 0} color="bg-green-100 text-green-700" />
        <StatCard icon={Package} label="সক্রিয় পণ্য" value={stats?.approvedProducts ?? 0} color="bg-purple-100 text-purple-700" />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Wallet className="h-4 w-4" /> মোট আয় (ডেলিভারিকৃত)
            </div>
            <p className="text-3xl font-bold text-green-700">{formatBDT(stats?.totalEarnings ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">কমিশন বাদে আপনার নিট আয়</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <TrendingUp className="h-4 w-4" /> পেন্ডিং আয় (অর্ডার চলমান)
            </div>
            <p className="text-3xl font-bold text-amber-600">{formatBDT(stats?.pendingEarnings ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">ডেলিভারি সম্পন্ন হলে যোগ হবে</p>
          </CardContent>
        </Card>
      </div>

      {(stats?.pendingProducts ?? 0) > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-semibold text-sm">{stats?.pendingProducts}টি পণ্য অনুমোদনের অপেক্ষায়</p>
                <p className="text-xs text-muted-foreground">অ্যাডমিন রিভিউ করার পর লাইভ হবে</p>
              </div>
            </div>
            <Link to="/vendor/products" className="text-sm font-medium text-primary hover:underline">দেখুন →</Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VendorDashboard;
