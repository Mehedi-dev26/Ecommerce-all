import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package, ShoppingCart, DollarSign, TrendingUp, Clock,
  CheckCircle, ArrowUpRight, ArrowRight, Users, FolderTree,
  AlertCircle, Eye
} from "lucide-react";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  totalCategories: number;
  processingOrders: number;
  shippedOrders: number;
  cancelledOrders: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  status: string;
  created_at: string;
  payment_method: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0, totalOrders: 0, totalRevenue: 0,
    pendingOrders: 0, completedOrders: 0, totalCategories: 0,
    processingOrders: 0, shippedOrders: 0, cancelledOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [productsRes, ordersRes, categoriesRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("*"),
        supabase.from("categories").select("id", { count: "exact", head: true }),
      ]);

      const orders = ordersRes.data || [];
      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);

      setStats({
        totalProducts: productsRes.count || 0,
        totalOrders: orders.length,
        totalRevenue,
        pendingOrders: orders.filter((o) => o.status === "pending").length,
        processingOrders: orders.filter((o) => o.status === "processing").length,
        shippedOrders: orders.filter((o) => o.status === "shipped").length,
        completedOrders: orders.filter((o) => o.status === "delivered").length,
        cancelledOrders: orders.filter((o) => o.status === "cancelled").length,
        totalCategories: categoriesRes.count || 0,
      });

      setRecentOrders(
        orders
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 8)
      );
      setLoading(false);
    };
    fetchData();
  }, []);

  const statCards = [
    {
      title: "মোট আয়",
      value: `৳${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      bg: "bg-primary/10",
      iconColor: "text-primary",
      desc: "সর্বমোট বিক্রয়",
    },
    {
      title: "মোট অর্ডার",
      value: stats.totalOrders,
      icon: ShoppingCart,
      bg: "bg-secondary/10",
      iconColor: "text-secondary",
      desc: `${stats.pendingOrders} পেন্ডিং`,
    },
    {
      title: "মোট প্রোডাক্ট",
      value: stats.totalProducts,
      icon: Package,
      bg: "bg-accent/10",
      iconColor: "text-accent",
      desc: `${stats.totalCategories} ক্যাটাগরি`,
    },
    {
      title: "সম্পন্ন অর্ডার",
      value: stats.completedOrders,
      icon: CheckCircle,
      bg: "bg-secondary/10",
      iconColor: "text-secondary",
      desc: "ডেলিভারড",
    },
  ];

  const orderStatusCards = [
    { title: "পেন্ডিং", value: stats.pendingOrders, icon: Clock, className: "border-l-4 border-l-primary" },
    { title: "প্রসেসিং", value: stats.processingOrders, icon: TrendingUp, className: "border-l-4 border-l-secondary" },
    { title: "শিপড", value: stats.shippedOrders, icon: Package, className: "border-l-4 border-l-accent" },
    { title: "বাতিল", value: stats.cancelledOrders, icon: AlertCircle, className: "border-l-4 border-l-destructive" },
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
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="animate-spin h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full" />
        <p className="text-sm text-muted-foreground">ডেটা লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-accent/80 p-6 lg:p-8 text-primary-foreground">
        <div className="relative z-10">
          <h2 className="text-xl lg:text-2xl font-bold mb-1">স্বাগতম, অ্যাডমিন! 🥭</h2>
          <p className="text-primary-foreground/80 text-sm lg:text-base">
            আজকের ব্যবসায়িক সারসংক্ষেপ দেখুন এবং আপনার স্টোর পরিচালনা করুন।
          </p>
        </div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 right-20 w-24 h-24 bg-primary-foreground/5 rounded-full translate-y-1/2" />
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-foreground mb-1">{stat.value}</p>
              <p className="text-sm font-medium text-foreground/80">{stat.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order Status Breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {orderStatusCards.map((item) => (
          <Card key={item.title} className={`${item.className} hover:shadow-md transition-shadow`}>
            <CardContent className="p-4 flex items-center gap-3">
              <item.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">সাম্প্রতিক অর্ডার</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80 gap-1"
                onClick={() => navigate("/admin/orders")}
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
                    onClick={() => navigate("/admin/orders")}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {order.customer_name.charAt(0)}
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
                        <p className="text-sm font-bold">৳{Number(order.total).toLocaleString()}</p>
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
              onClick={() => navigate("/admin/products")}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 border border-border/50 hover:border-primary/30 transition-all text-left group"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">নতুন প্রোডাক্ট যোগ</p>
                <p className="text-xs text-muted-foreground">পণ্য তালিকায় যোগ করুন</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => navigate("/admin/orders")}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/5 border border-border/50 hover:border-secondary/30 transition-all text-left group"
            >
              <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">অর্ডার পরিচালনা</p>
                <p className="text-xs text-muted-foreground">{stats.pendingOrders} পেন্ডিং অর্ডার</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => navigate("/admin/categories")}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent/5 border border-border/50 hover:border-accent/30 transition-all text-left group"
            >
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <FolderTree className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">ক্যাটাগরি ম্যানেজ</p>
                <p className="text-xs text-muted-foreground">{stats.totalCategories} ক্যাটাগরি</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => navigate("/admin/customers")}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 border border-border/50 hover:border-primary/30 transition-all text-left group"
            >
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">কাস্টমার তালিকা</p>
                <p className="text-xs text-muted-foreground">গ্রাহক তথ্য দেখুন</p>
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

export default Dashboard;
