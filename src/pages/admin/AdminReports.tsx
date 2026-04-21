import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminPageState from "@/components/admin/AdminPageState";
import { getErrorMessage } from "@/lib/error-message";
import {
  BarChart3,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  CircleDollarSign,
  MapPin,
} from "lucide-react";

interface OrderRow {
  id: string;
  customer_phone: string;
  customer_name: string;
  city: string;
  total: number;
  status: string;
  created_at: string;
}

interface ProductRow {
  id: string;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
}

const currency = (value: number) => `৳${value.toLocaleString()}`;

const monthLabel = (dateString: string) =>
  new Date(dateString).toLocaleDateString("bn-BD", { month: "short", year: "numeric" });

const AdminReports = () => {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("30");

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [ordersRes, productsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, customer_phone, customer_name, city, total, status, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("products").select("id, stock, is_active, is_featured"),
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (productsRes.error) throw productsRes.error;

      setOrders((ordersRes.data || []) as OrderRow[]);
      setProducts((productsRes.data || []) as ProductRow[]);
    } catch (err) {
      console.error("Failed to load reports", err);
      setError(getErrorMessage(err, "রিপোর্ট ডেটা লোড করা যায়নি।"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const filteredOrders = useMemo(() => {
    const days = Number(period);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return orders.filter((order) => new Date(order.created_at) >= cutoff);
  }, [orders, period]);

  const deliveredOrders = filteredOrders.filter((order) => order.status === "delivered");
  const pendingOrders = filteredOrders.filter((order) => order.status === "pending" || order.status === "processing");
  const cancelledOrders = filteredOrders.filter((order) => order.status === "cancelled");
  const totalRevenue = deliveredOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const avgOrderValue = deliveredOrders.length ? Math.round(totalRevenue / deliveredOrders.length) : 0;
  const activeProducts = products.filter((product) => product.is_active).length;
  const lowStockProducts = products.filter((product) => product.stock < 10).length;
  const featuredProducts = products.filter((product) => product.is_featured).length;
  const uniqueCustomers = new Set(filteredOrders.map((order) => order.customer_phone)).size;

  const topCities = Object.entries(
    deliveredOrders.reduce<Record<string, number>>((acc, order) => {
      acc[order.city] = (acc[order.city] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const monthlyRevenue = Object.entries(
    deliveredOrders.reduce<Record<string, number>>((acc, order) => {
      const key = monthLabel(order.created_at);
      acc[key] = (acc[key] || 0) + Number(order.total);
      return acc;
    }, {})
  ).slice(0, 6);

  const maxMonthlyRevenue = Math.max(...monthlyRevenue.map(([, value]) => value), 1);

  const statCards = [
    {
      title: "মোট বিক্রি",
      value: currency(totalRevenue),
      description: `${deliveredOrders.length} টি সম্পন্ন অর্ডার`,
      icon: DollarSign,
      iconWrap: "bg-primary/10 text-primary",
    },
    {
      title: "গড় অর্ডার মূল্য",
      value: currency(avgOrderValue),
      description: "ডেলিভারড অর্ডার ভিত্তিক",
      icon: CircleDollarSign,
      iconWrap: "bg-secondary/10 text-secondary",
    },
    {
      title: "ইউনিক কাস্টমার",
      value: uniqueCustomers,
      description: `${filteredOrders.length} টি মোট অর্ডার`,
      icon: Users,
      iconWrap: "bg-accent/10 text-accent",
    },
    {
      title: "অ্যাক্টিভ প্রোডাক্ট",
      value: activeProducts,
      description: `${featuredProducts} টি ফিচারড`,
      icon: Package,
      iconWrap: "bg-muted text-foreground",
    },
  ];

  if (loading) return <AdminPageState loading message="রিপোর্ট লোড হচ্ছে..." />;
  if (error) return <AdminPageState title="রিপোর্ট লোড করা যায়নি" message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            রিপোর্ট ও বিশ্লেষণ
          </h2>
          <p className="text-sm text-muted-foreground">স্টোরের বিক্রি, অর্ডার, কাস্টমার ও প্রোডাক্ট পারফরম্যান্স দেখুন</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-full sm:w-[180px] bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">শেষ ৭ দিন</SelectItem>
            <SelectItem value="30">শেষ ৩০ দিন</SelectItem>
            <SelectItem value="90">শেষ ৯০ দিন</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((item) => (
          <Card key={item.title} className="border-border/50">
            <CardContent className="p-3 sm:p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconWrap}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <TrendingUp className="hidden h-4 w-4 text-muted-foreground sm:block" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-foreground break-words">{item.value}</p>
              <p className="mt-1 text-xs sm:text-sm font-medium text-foreground/80">{item.title}</p>
              <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="border-border/50 xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">মাসভিত্তিক বিক্রি</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {monthlyRevenue.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
                এই সময়ে কোনো delivered order নেই।
              </div>
            ) : (
              monthlyRevenue.map(([label, value]) => (
                <div key={label} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-foreground">{label}</span>
                    <span className="text-muted-foreground">{currency(value)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.max((value / maxMonthlyRevenue) * 100, 8)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">অর্ডার সারাংশ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "সম্পন্ন অর্ডার", value: deliveredOrders.length, tone: "bg-secondary/10 text-secondary" },
              { label: "পেন্ডিং / প্রসেসিং", value: pendingOrders.length, tone: "bg-primary/10 text-primary" },
              { label: "বাতিল অর্ডার", value: cancelledOrders.length, tone: "bg-destructive/10 text-destructive" },
              { label: "কম স্টক প্রোডাক্ট", value: lowStockProducts, tone: "bg-accent/10 text-accent" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-border/50 p-3">
                <span className="text-sm text-foreground/80">{item.label}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.tone}`}>{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">শীর্ষ ডেলিভারি এলাকা</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topCities.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
                এখনও কোনো delivered order নেই।
              </div>
            ) : (
              topCities.map(([city, count]) => (
                <div key={city} className="flex items-center justify-between rounded-xl border border-border/50 p-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <span className="truncate text-sm font-medium text-foreground">{city}</span>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">{count} অর্ডার</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">দ্রুত পারফরম্যান্স চিত্র</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-2">
            {[
              { label: "মোট অর্ডার", value: filteredOrders.length, icon: ShoppingCart, tone: "bg-primary/10 text-primary" },
              { label: "মোট কাস্টমার", value: uniqueCustomers, icon: Users, tone: "bg-secondary/10 text-secondary" },
              { label: "ফিচারড পণ্য", value: featuredProducts, icon: Package, tone: "bg-accent/10 text-accent" },
              { label: "ডেলিভারড", value: deliveredOrders.length, icon: BarChart3, tone: "bg-muted text-foreground" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border/50 p-3">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${item.tone}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="text-xl font-bold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminReports;
