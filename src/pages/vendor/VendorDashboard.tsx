import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useVendor } from "@/hooks/useVendor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminPageState from "@/components/admin/AdminPageState";
import { getErrorMessage } from "@/lib/error-message";
import {
  Package, ShoppingCart, DollarSign, TrendingUp, Clock,
  ArrowUpRight, ArrowRight, Wallet, Banknote, Settings,
  AlertCircle, Eye, CheckCircle2,
} from "lucide-react";

interface VStats {
  totalProducts: number;
  approvedProducts: number;
  pendingProducts: number;
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalEarnings: number;
  pendingEarnings: number;
  todayOrders: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

const formatBDT = (n: number) => `৳${Math.round(n).toLocaleString()}`;

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { vendor } = useVendor();
  const [stats, setStats] = useState<VStats>({
    totalProducts: 0, approvedProducts: 0, pendingProducts: 0,
    totalOrders: 0, pendingOrders: 0, processingOrders: 0, shippedOrders: 0,
    deliveredOrders: 0, cancelledOrders: 0,
    totalEarnings: 0, pendingEarnings: 0, todayOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!vendor?.id) return;
    setLoading(true);
    setError(null);

    try {
      const vid = vendor.id;
      const [productsRes, itemsRes] = await Promise.all([
        supabase.from("products").select("id,vendor_status,is_active,stock").eq("vendor_id", vid),
        supabase
          .from("order_items" as any)
          .select("id, vendor_payout_amount, quantity, price, order_id, orders:order_id(id,order_number,customer_name,total,status,created_at)")
          .eq("vendor_id", vid),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (itemsRes.error) throw itemsRes.error;

      const products = (productsRes.data || []) as any[];
      const items = (itemsRes.data || []) as any[];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const orderMap = new Map<string, any>();
      let totalEarnings = 0;
      let pendingEarnings = 0;
      const counters = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
      let todayOrders = 0;

      items.forEach((it) => {
        const o = it.orders;
        if (!o) return;
        if (!orderMap.has(o.id)) {
          orderMap.set(o.id, o);
          if (counters[o.status as keyof typeof counters] !== undefined) {
            counters[o.status as keyof typeof counters]++;
          }
          if (o.created_at && new Date(o.created_at) >= today) todayOrders++;
        }
        if (o.status === "delivered") {
          totalEarnings += Number(it.vendor_payout_amount || 0);
        } else if (o.status !== "cancelled") {
          pendingEarnings += Number(it.vendor_payout_amount || 0);
        }
      });

      const ordersList = Array.from(orderMap.values());

      setStats({
        totalProducts: products.length,
        approvedProducts: products.filter((p) => p.vendor_status === "approved").length,
        pendingProducts: products.filter((p) => p.vendor_status === "pending").length,
        totalOrders: ordersList.length,
        pendingOrders: counters.pending,
        processingOrders: counters.processing,
        shippedOrders: counters.shipped,
        deliveredOrders: counters.delivered,
        cancelledOrders: counters.cancelled,
        totalEarnings,
        pendingEarnings,
        todayOrders,
      });

      setRecentOrders(
        ordersList
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 8)
          .map((o) => ({
            id: o.id, order_number: o.order_number, customer_name: o.customer_name,
            total: Number(o.total), status: o.status, created_at: o.created_at,
          }))
      );
    } catch (err) {
      console.error("Failed to load vendor dashboard", err);
      setError(getErrorMessage(err, "ড্যাশবোর্ড ডেটা লোড করা যায়নি।"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendor?.id]);

  const statCards = [
    {
      title: "মোট আয়",
      value: formatBDT(stats.totalEarnings),
      icon: DollarSign,
      bg: "bg-primary/10",
      iconColor: "text-primary",
      desc: `${stats.deliveredOrders} টি ডেলিভারড অর্ডার থেকে`,
    },
    {
      title: "পেন্ডিং আয়",
      value: formatBDT(stats.pendingEarnings),
      icon: TrendingUp,
      bg: "bg-secondary/10",
      iconColor: "text-secondary",
      desc: "ডেলিভারি সম্পন্ন হলে যোগ হবে",
    },
    {
      title: "মোট অর্ডার",
      value: stats.totalOrders,
      icon: ShoppingCart,
      bg: "bg-accent/10",
      iconColor: "text-accent",
      desc: `${stats.todayOrders} টি আজকের`,
    },
    {
      title: "মোট প্রোডাক্ট",
      value: stats.totalProducts,
      icon: Package,
      bg: "bg-primary/10",
      iconColor: "text-primary",
      desc: `${stats.approvedProducts} সক্রিয় · ${stats.pendingProducts} অপেক্ষমাণ`,
    },
  ];

  const orderStatusCards = [
    { title: "পেন্ডিং", value: stats.pendingOrders, icon: Clock, className: "border-l-4 border-l-primary" },
    { title: "প্রসেসিং", value: stats.processingOrders, icon: TrendingUp, className: "border-l-4 border-l-secondary" },
    { title: "শিপড", value: stats.shippedOrders, icon: Package, className: "border-l-4 border-l-accent" },
    { title: "ডেলিভারড", value: stats.deliveredOrders, icon: CheckCircle2, className: "border-l-4 border-l-primary" },
  ];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; label: string }> = {
      pending: { bg: "bg-primary/15 text-primary", label: "পেন্ডিং" },
      processing: { bg: "bg-secondary/15 text-secondary", label: "প্রসেসিং" },
      shipped: { bg: "bg-accent/15 text-accent", label: "শিপড" },
      delivered: { bg: "bg-secondary/15 text-secondary", label: "ডেলিভারড" },
      cancelled: { bg: "bg-destructive/15 text-destructive", label: "বাতিল" },
    };
    const c = config[status] || { bg: "bg-muted text-muted-foreground", label: status };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.bg}`}>
        {c.label}
      </span>
    );
  };

  if (loading) {
    return <AdminPageState loading message="ড্যাশবোর্ড ডেটা লোড হচ্ছে..." />;
  }

  if (error) {
    return <AdminPageState title="ড্যাশবোর্ড লোড করা যায়নি" message={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-accent/80 p-4 sm:p-6 lg:p-8 text-primary-foreground">
        <div className="relative z-10">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1">
            স্বাগতম, {vendor?.owner_name || "বিক্রেতা"}! 👋
          </h2>
          <p className="text-primary-foreground/80 text-xs sm:text-sm lg:text-base">
            আপনার দোকানের সারসংক্ষেপ দেখুন এবং আপনার অর্ডার ও পণ্য পরিচালনা করুন।
          </p>
          {vendor && (
            <p className="text-primary-foreground/70 text-[11px] sm:text-xs mt-2">
              কমিশন: {vendor.commission_percent}% · দোকান: {vendor.shop_name_bn}
            </p>
          )}
        </div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 right-20 w-24 h-24 bg-primary-foreground/5 rounded-full translate-y-1/2" />
      </div>

      {/* Pending products alert */}
      {stats.pendingProducts > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Clock className="h-5 w-5 text-amber-600 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-sm">{stats.pendingProducts}টি পণ্য অনুমোদনের অপেক্ষায়</p>
                <p className="text-xs text-muted-foreground">অ্যাডমিন রিভিউ করার পর লাইভ হবে</p>
              </div>
            </div>
            <Link to="/vendor/products" className="text-sm font-medium text-primary hover:underline shrink-0">
              দেখুন →
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-start justify-between mb-2 sm:mb-4">
                <div className={`h-9 w-9 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-4 w-4 sm:h-6 sm:w-6 ${stat.iconColor}`} />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
              </div>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground mb-0.5 sm:mb-1 truncate">{stat.value}</p>
              <p className="text-xs sm:text-sm font-medium text-foreground/80">{stat.title}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order Status Breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        {orderStatusCards.map((item) => (
          <Card key={item.title} className={`${item.className} hover:shadow-md transition-shadow`}>
            <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-xl font-bold">{item.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{item.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">সাম্প্রতিক অর্ডার</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80 gap-1"
                onClick={() => navigate("/vendor/orders")}
              >
                সব দেখুন <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {recentOrders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">কোনো অর্ডার নেই</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => navigate("/vendor/orders")}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {order.customer_name?.charAt(0) || "?"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{order.customer_name}</p>
                        <p className="text-xs text-muted-foreground">
                          #{order.order_number} · {new Date(order.created_at).toLocaleDateString("bn-BD")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold">{formatBDT(order.total)}</p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold">দ্রুত অ্যাকশন</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <button
              onClick={() => navigate("/vendor/products")}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 border border-border/50 hover:border-primary/30 transition-all text-left group"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">পণ্য পরিচালনা</p>
                <p className="text-xs text-muted-foreground">{stats.totalProducts} টি পণ্য</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => navigate("/vendor/orders")}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/5 border border-border/50 hover:border-secondary/30 transition-all text-left group"
            >
              <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">অর্ডার দেখুন</p>
                <p className="text-xs text-muted-foreground">{stats.pendingOrders} পেন্ডিং অর্ডার</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => navigate("/vendor/earnings")}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent/5 border border-border/50 hover:border-accent/30 transition-all text-left group"
            >
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">আয়ের বিশ্লেষণ</p>
                <p className="text-xs text-muted-foreground">{formatBDT(stats.totalEarnings)} মোট</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => navigate("/vendor/withdrawals")}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 border border-border/50 hover:border-primary/30 transition-all text-left group"
            >
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Banknote className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">টাকা উত্তোলন</p>
                <p className="text-xs text-muted-foreground">নতুন উত্তোলনের অনুরোধ</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => navigate("/vendor/shop-settings")}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 border border-border/50 hover:border-primary/30 transition-all text-left group"
            >
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Settings className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">শপ সেটিংস</p>
                <p className="text-xs text-muted-foreground">দোকানের তথ্য আপডেট</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => window.open("/", "_blank")}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 border border-border/50 hover:border-primary/30 transition-all text-left group"
            >
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Eye className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">ওয়েবসাইট দেখুন</p>
                <p className="text-xs text-muted-foreground">লাইভ সাইট প্রিভিউ</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorDashboard;
