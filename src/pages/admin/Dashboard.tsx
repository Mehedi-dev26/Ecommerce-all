import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminPageState from "@/components/admin/AdminPageState";
import { getErrorMessage } from "@/lib/error-message";
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowRight,
  Users,
  FolderTree,
  AlertCircle,
  Eye,
  CheckCircle2,
  Calendar,
  Layers,
  PieChart as PieChartIcon,
  Image as ImageIcon,
  RotateCcw,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  cancelledTotal: number;
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

type PeriodType = "7" | "15" | "30";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    cancelledTotal: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalCategories: 0,
    processingOrders: 0,
    shippedOrders: 0,
    cancelledOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [rawOrders, setRawOrders] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Chart controls
  const [chartPeriod, setChartPeriod] = useState<PeriodType>("7");
  const [pieMode, setPieMode] = useState<"status" | "payment">("status");

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [productsRes, ordersRes, categoriesRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("*"),
        supabase.from("categories").select("id", { count: "exact", head: true }),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (ordersRes.error) throw ordersRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      const orders = ordersRes.data || [];
      setRawOrders(orders);

      const deliveredOrders = orders.filter((o) => o.status === "delivered");
      const cancelledOrdersList = orders.filter((o) => o.status === "cancelled");
      const totalRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      const cancelledTotal = cancelledOrdersList.reduce((sum, o) => sum + Number(o.total || 0), 0);

      setStats({
        totalProducts: productsRes.count || 0,
        totalOrders: orders.length,
        totalRevenue,
        cancelledTotal,
        pendingOrders: orders.filter((o) => o.status === "pending").length,
        processingOrders: orders.filter((o) => o.status === "processing").length,
        shippedOrders: orders.filter((o) => o.status === "shipped").length,
        completedOrders: deliveredOrders.length,
        cancelledOrders: cancelledOrdersList.length,
        totalCategories: categoriesRes.count || 0,
      });

      setRecentOrders(
        orders
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 7)
      );
    } catch (err) {
      console.error("Failed to load dashboard data", err);
      setError(getErrorMessage(err, "ড্যাশবোর্ড ডেটা লোড করা যায়নি।"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  // Top stat cards
  const statCards = [
    {
      title: "মোট আয়",
      value: `৳${stats.totalRevenue.toLocaleString("bn-BD")}`,
      icon: DollarSign,
      bg: "bg-emerald-500/10 text-emerald-600",
      iconColor: "text-emerald-600",
      desc: `${stats.completedOrders.toLocaleString("bn-BD")} টি ডেলিভারড অর্ডার`,
    },
    {
      title: "বাতিল অর্ডার খরচ",
      value: `৳${stats.cancelledTotal.toLocaleString("bn-BD")}`,
      icon: AlertCircle,
      bg: "bg-destructive/10 text-destructive",
      iconColor: "text-destructive",
      desc: `${stats.cancelledOrders.toLocaleString("bn-BD")} টি বাতিল অর্ডার`,
    },
    {
      title: "মোট অর্ডার",
      value: stats.totalOrders.toLocaleString("bn-BD"),
      icon: ShoppingCart,
      bg: "bg-blue-500/10 text-blue-600",
      iconColor: "text-blue-600",
      desc: `${stats.pendingOrders.toLocaleString("bn-BD")} পেন্ডিং / প্রসেসিং`,
    },
    {
      title: "মোট প্রোডাক্ট",
      value: stats.totalProducts.toLocaleString("bn-BD"),
      icon: Package,
      bg: "bg-amber-500/10 text-amber-600",
      iconColor: "text-amber-600",
      desc: `${stats.totalCategories.toLocaleString("bn-BD")} ক্যাটাগরি`,
    },
  ];

  const orderStatusCards = [
    { title: "পেন্ডিং", value: stats.pendingOrders, icon: Clock, className: "border-l-4 border-l-amber-500" },
    { title: "প্রসেসিং", value: stats.processingOrders, icon: TrendingUp, className: "border-l-4 border-l-blue-500" },
    { title: "শিপড", value: stats.shippedOrders, icon: Package, className: "border-l-4 border-l-purple-500" },
    { title: "বাতিল", value: stats.cancelledOrders, icon: AlertCircle, className: "border-l-4 border-l-rose-500" },
  ];

  // 1. Process Time-series data for Wide Chart
  const timelineData = useMemo(() => {
    const days = parseInt(chartPeriod, 10);
    const result: Array<{
      dateKey: string;
      label: string;
      fullDate: string;
      revenue: number;
      orders: number;
      delivered: number;
      pending: number;
      cancelled: number;
    }> = [];

    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateKey = `${yyyy}-${mm}-${dd}`;
      const label = d.toLocaleDateString("bn-BD", { day: "numeric", month: "short" });
      const fullDate = d.toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" });

      result.push({
        dateKey,
        label,
        fullDate,
        revenue: 0,
        orders: 0,
        delivered: 0,
        pending: 0,
        cancelled: 0,
      });
    }

    const dayMap = new Map(result.map((r) => [r.dateKey, r]));

    rawOrders.forEach((o) => {
      if (!o.created_at) return;
      const orderDate = new Date(o.created_at);
      const yyyy = orderDate.getFullYear();
      const mm = String(orderDate.getMonth() + 1).padStart(2, "0");
      const dd = String(orderDate.getDate()).padStart(2, "0");
      const key = `${yyyy}-${mm}-${dd}`;

      const bucket = dayMap.get(key);
      if (bucket) {
        bucket.orders += 1;
        const totalNum = Number(o.total || 0);
        if (o.status === "delivered") {
          bucket.delivered += 1;
          bucket.revenue += totalNum;
        } else if (o.status === "cancelled") {
          bucket.cancelled += 1;
        } else if (o.status === "pending" || o.status === "processing" || o.status === "shipped") {
          bucket.pending += 1;
        }
      }
    });

    return result;
  }, [rawOrders, chartPeriod]);

  // Wide chart summary stats across the selected period
  const periodStats = useMemo(() => {
    const days = parseInt(chartPeriod, 10);
    const totalRev = timelineData.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrd = timelineData.reduce((sum, item) => sum + item.orders, 0);
    const totalDelivered = timelineData.reduce((sum, item) => sum + item.delivered, 0);
    const totalPending = timelineData.reduce((sum, item) => sum + item.pending, 0);
    const totalCancelled = timelineData.reduce((sum, item) => sum + item.cancelled, 0);

    const peakRevDay = timelineData.reduce(
      (prev, curr) => (curr.revenue > prev.revenue ? curr : prev),
      timelineData[0] || { label: "—", revenue: 0, orders: 0 }
    );

    return {
      totalRev,
      totalOrd,
      totalDelivered,
      totalPending,
      totalCancelled,
      avgDailyRev: days > 0 ? Math.round(totalRev / days) : 0,
      avgDailyOrders: days > 0 ? (totalOrd / days).toFixed(1) : "0",
      peakRevDay,
    };
  }, [timelineData, chartPeriod]);

  // 2. Process Circular Chart (Pie/Donut)
  const statusPieData = useMemo(() => {
    const counts: Record<string, number> = {
      delivered: 0,
      processing: 0,
      shipped: 0,
      pending: 0,
      cancelled: 0,
    };
    rawOrders.forEach((o) => {
      const s = o.status || "pending";
      counts[s] = (counts[s] || 0) + 1;
    });

    const items = [
      { name: "ডেলিভারড", key: "delivered", value: counts.delivered, color: "#10b981" },
      { name: "প্রসেসিং", key: "processing", value: counts.processing, color: "#3b82f6" },
      { name: "শিপড", key: "shipped", value: counts.shipped, color: "#8b5cf6" },
      { name: "পেন্ডিং", key: "pending", value: counts.pending, color: "#f59e0b" },
      { name: "বাতিল", key: "cancelled", value: counts.cancelled, color: "#ef4444" },
    ].filter((item) => item.value > 0);

    if (items.length === 0) {
      return [{ name: "কোনো অর্ডার নেই", key: "empty", value: 1, color: "#cbd5e1" }];
    }
    return items;
  }, [rawOrders]);

  const paymentPieData = useMemo(() => {
    const counts: Record<string, number> = {};
    rawOrders.forEach((o) => {
      let p = o.payment_method || "ক্যাশ অন ডেলিভারি";
      if (p === "cod" || p === "cash_on_delivery") p = "ক্যাশ অন ডেলিভারি";
      if (p === "bkash") p = "বিকাশ";
      if (p === "nagad") p = "নগদ";
      if (p === "rocket") p = "রকেট";
      counts[p] = (counts[p] || 0) + 1;
    });

    const palette = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6"];
    const items = Object.entries(counts).map(([name, value], idx) => ({
      name,
      key: name,
      value,
      color: palette[idx % palette.length],
    }));

    if (items.length === 0) {
      return [{ name: "কোনো পেমেন্ট ডাটা নেই", key: "empty", value: 1, color: "#cbd5e1" }];
    }
    return items;
  }, [rawOrders]);

  const activePieData = pieMode === "status" ? statusPieData : paymentPieData;
  const totalPieItems = useMemo(
    () => activePieData.reduce((sum, item) => sum + (item.key === "empty" ? 0 : item.value), 0),
    [activePieData]
  );

  // Performance progress rates for circular section
  const performanceRates = useMemo(() => {
    const total = stats.totalOrders || 1;
    const deliveryRate = Math.min(100, Math.round((stats.completedOrders / total) * 100));
    const activePipeline = stats.pendingOrders + stats.processingOrders + stats.shippedOrders;
    const pipelineRate = Math.min(100, Math.round((activePipeline / total) * 100));
    const cancelRate = Math.min(100, Math.round((stats.cancelledOrders / total) * 100));

    return {
      deliveryRate,
      activePipeline,
      pipelineRate,
      cancelRate,
    };
  }, [stats]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; label: string }> = {
      pending: { bg: "bg-amber-500/15 text-amber-600 border border-amber-300/40", label: "পেন্ডিং" },
      processing: { bg: "bg-blue-500/15 text-blue-600 border border-blue-300/40", label: "প্রসেসিং" },
      shipped: { bg: "bg-purple-500/15 text-purple-600 border border-purple-300/40", label: "শিপড" },
      delivered: { bg: "bg-emerald-500/15 text-emerald-600 border border-emerald-300/40", label: "ডেলিভারড" },
      cancelled: { bg: "bg-rose-500/15 text-rose-600 border border-rose-300/40", label: "বাতিল" },
    };
    const c = config[status] || { bg: "bg-muted text-muted-foreground", label: status };
    return (
      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold", c.bg)}>
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
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/95 via-primary to-accent/90 p-5 sm:p-7 text-primary-foreground shadow-lg shadow-primary/10">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl sm:text-2xl">👋</span>
            <h2 className="text-lg sm:text-2xl font-bold tracking-tight">স্বাগতম, অ্যাডমিন প্যানেলে!</h2>
          </div>
          <p className="text-primary-foreground/90 text-xs sm:text-sm max-w-xl">
            আজকের স্টোর পারফরম্যান্স, লাইভ অর্ডার ট্রেন্ড এবং ব্যবসায়িক গ্রাফ রিপোর্ট পর্যবেক্ষণ করুন।
          </p>
        </div>
        <div className="absolute top-0 right-0 w-52 h-52 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 right-28 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {statCards.map((stat) => (
          <Card
            key={stat.title}
            className="group hover:shadow-md transition-all duration-200 border-border/60 hover:border-primary/40 bg-card rounded-2xl"
          >
            <CardContent className="p-3.5 sm:p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.iconColor}`} />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight mb-1 truncate">
                {stat.value}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-foreground/80">{stat.title}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order Status Breakdown Pills */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {orderStatusCards.map((item) => (
          <Card key={item.title} className={`${item.className} rounded-xl border-border/50 bg-card/60 shadow-xs`}>
            <CardContent className="p-3 flex items-center gap-2.5 sm:gap-3">
              <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-bold text-foreground">
                  {item.value.toLocaleString("bn-BD")}
                </p>
                <p className="text-[11px] text-muted-foreground">{item.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ============================================================== */}
      {/* 🚀 ADVANCED UNIFIED GRAPH CHARTS SECTION (WIDESCREEN & CIRCULAR) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Left: Wide Trend Graph Chart (একক চার্টে বহু-রঙিন ট্রেন্ড লাইন) */}
        <Card className="lg:col-span-2 border-border/60 shadow-xs rounded-2xl overflow-hidden flex flex-col">
          <CardHeader className="p-4 sm:p-5 pb-2.5 border-b border-border/40 bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                    ব্যবসায়িক ট্রেন্ড ও বিশ্লেষণ
                  </CardTitle>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  একটি গ্রাফে বাস্তব ডেটার ভিত্তিতে আয়, অর্ডার ও ডেলিভারি ট্রেন্ড
                </p>
              </div>

              {/* Period selection: 7 days, 15 days, 30 days */}
              <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border/60 self-start sm:self-auto">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground ml-1.5 mr-0.5" />
                {(["7", "15", "30"] as PeriodType[]).map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setChartPeriod(period)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all",
                      chartPeriod === period
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {period === "7" ? "৭ দিন" : period === "15" ? "১৫ দিন" : "৩০ দিন"}
                  </button>
                ))}
              </div>
            </div>

            {/* Clean Static Multi-Color Legend Indicators (No individual filtering needed) */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-3 pb-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-5 rounded-full bg-emerald-500 inline-block shadow-xs" />
                <span className="font-medium text-foreground/90">মোট আয় (৳)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-5 rounded-full bg-blue-500 inline-block shadow-xs" />
                <span className="font-medium text-foreground/90">মোট অর্ডার</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-5 rounded-full bg-cyan-500 inline-block shadow-xs" />
                <span className="font-medium text-foreground/90">ডেলিভারড</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-5 rounded-full bg-amber-500 inline-block shadow-xs" />
                <span className="font-medium text-foreground/90">পেন্ডিং/প্রসেসিং</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-5 rounded-full bg-rose-500 inline-block shadow-xs" />
                <span className="font-medium text-foreground/90">বাতিল</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
            {/* Quick Metrics Bar: নির্বাচিত সময়ের মোট, দৈনিক গড়, শীর্ষ দিন */}
            <div className="grid grid-cols-3 gap-2 p-2.5 mb-4 rounded-xl bg-muted/30 border border-border/40 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground">নির্বাচিত সময়ের মোট আয়</p>
                <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
                  ৳{periodStats.totalRev.toLocaleString("bn-BD")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  ({periodStats.totalOrd.toLocaleString("bn-BD")} টি অর্ডার)
                </p>
              </div>
              <div className="border-x border-border/50">
                <p className="text-[10px] text-muted-foreground">দৈনিক গড় (আয় / অর্ডার)</p>
                <p className="text-sm sm:text-base font-bold text-foreground">
                  ৳{periodStats.avgDailyRev.toLocaleString("bn-BD")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  গড় {periodStats.avgDailyOrders} টি/দিন
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">শীর্ষ দিন ({periodStats.peakRevDay.label})</p>
                <p className="text-sm sm:text-base font-bold text-primary">
                  ৳{Math.round(periodStats.peakRevDay.revenue || 0).toLocaleString("bn-BD")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {(periodStats.peakRevDay.orders || 0).toLocaleString("bn-BD")} টি অর্ডার
                </p>
              </div>
            </div>

            {/* Recharts ComposedChart: Multi-Color Lines on a Single Chart with Dual Y-Axis */}
            <div className="h-[270px] sm:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={timelineData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueFillGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  />
                  {/* Left Y-Axis for Order Counts */}
                  <YAxis
                    yAxisId="ordersAxis"
                    orientation="left"
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    tickFormatter={(val) => String(val)}
                  />
                  {/* Right Y-Axis for Revenue */}
                  <YAxis
                    yAxisId="revenueAxis"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    tickFormatter={(val) =>
                      `৳${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`
                    }
                  />
                  {/* Comprehensive Hover Tooltip Showing All Metrics */}
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-popover/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-2xl p-3.5 text-xs z-50 min-w-[210px] space-y-2">
                            <div className="border-b border-border/50 pb-1.5 flex items-center justify-between">
                              <p className="font-bold text-foreground text-xs">{data.fullDate}</p>
                              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {chartPeriod} দিনের ট্রেন্ড
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                                  <span className="text-muted-foreground">মোট আয়:</span>
                                </div>
                                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                  ৳{Math.round(data.revenue).toLocaleString("bn-BD")}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                  <span className="text-muted-foreground">মোট অর্ডার:</span>
                                </div>
                                <span className="font-bold text-foreground">
                                  {data.orders.toLocaleString("bn-BD")} টি
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-cyan-500 shrink-0" />
                                  <span className="text-muted-foreground">ডেলিভারড:</span>
                                </div>
                                <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                                  {data.delivered.toLocaleString("bn-BD")} টি
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                                  <span className="text-muted-foreground">পেন্ডিং/প্রসেসিং:</span>
                                </div>
                                <span className="font-semibold text-amber-600 dark:text-amber-400">
                                  {data.pending.toLocaleString("bn-BD")} টি
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                                  <span className="text-muted-foreground">বাতিল অর্ডার:</span>
                                </div>
                                <span className="font-semibold text-rose-600 dark:text-rose-400">
                                  {data.cancelled.toLocaleString("bn-BD")} টি
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* Revenue Area & Stroke */}
                  <Area
                    yAxisId="revenueAxis"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#revenueFillGradient)"
                    name="মোট আয়"
                    activeDot={{ r: 5, stroke: "#10b981", strokeWidth: 2, fill: "#fff" }}
                  />
                  {/* Total Orders Line */}
                  <Line
                    yAxisId="ordersAxis"
                    type="monotone"
                    dataKey="orders"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#3b82f6" }}
                    activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2, fill: "#fff" }}
                    name="মোট অর্ডার"
                  />
                  {/* Delivered Orders Line */}
                  <Line
                    yAxisId="ordersAxis"
                    type="monotone"
                    dataKey="delivered"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={{ r: 2.5, fill: "#06b6d4" }}
                    activeDot={{ r: 5 }}
                    name="ডেলিভারড"
                  />
                  {/* Pending Orders Line */}
                  <Line
                    yAxisId="ordersAxis"
                    type="monotone"
                    dataKey="pending"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: "#f59e0b" }}
                    activeDot={{ r: 5 }}
                    name="পেন্ডিং"
                  />
                  {/* Cancelled Orders Line */}
                  <Line
                    yAxisId="ordersAxis"
                    type="monotone"
                    dataKey="cancelled"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: "#f43f5e" }}
                    activeDot={{ r: 5 }}
                    name="বাতিল"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Right: Circular Donut Graph Chart (গোল গ্রাফ চার্ট) */}
        <Card className="border-border/60 shadow-xs rounded-2xl overflow-hidden flex flex-col">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                  <PieChartIcon className="h-4 w-4" />
                </div>
                <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                  বণ্টন অনুপাত
                </CardTitle>
              </div>

              {/* Mode toggle */}
              <div className="flex items-center gap-1 bg-background p-0.5 rounded-lg border border-border/60">
                <button
                  type="button"
                  onClick={() => setPieMode("status")}
                  className={cn(
                    "px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all",
                    pieMode === "status"
                      ? "bg-secondary text-secondary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  স্ট্যাটাস
                </button>
                <button
                  type="button"
                  onClick={() => setPieMode("payment")}
                  className={cn(
                    "px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all",
                    pieMode === "payment"
                      ? "bg-secondary text-secondary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  পেমেন্ট
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pieMode === "status" ? "অর্ডারের বিভিন্ন অবস্থার শতকরা হার" : "গ্রাহকের পছন্দের পেমেন্ট মাধ্যম"}
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 flex-1 flex flex-col items-center justify-between">
            {/* Donut Chart with Center Metric */}
            <div className="relative h-[200px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0];
                        const pct = totalPieItems > 0 ? Math.round(((item.value as number) / totalPieItems) * 100) : 0;
                        return (
                          <div className="bg-popover/95 backdrop-blur-md border border-border/80 shadow-xl rounded-xl p-2.5 text-xs z-50">
                            <p className="font-bold text-foreground">{item.name}</p>
                            <p className="text-muted-foreground">
                              {Number(item.value).toLocaleString("bn-BD")} টি ({pct}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={activePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    cornerRadius={6}
                  >
                    {activePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-extrabold text-foreground">
                  {totalPieItems.toLocaleString("bn-BD")}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  {pieMode === "status" ? "মোট অর্ডার" : "লেনদেন"}
                </span>
              </div>
            </div>

            {/* Interactive Legends */}
            <div className="w-full space-y-1.5 pt-2 border-t border-border/40 mt-1">
              {activePieData.map((item) => {
                const pct = totalPieItems > 0 ? Math.round((item.value / totalPieItems) * 100) : 0;
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between text-xs py-0.5 px-1 rounded-md hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-foreground/80 truncate text-[11px] font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-foreground text-[11px]">
                        {item.value.toLocaleString("bn-BD")}
                      </span>
                      <span className="text-[10px] text-muted-foreground w-8 text-right font-medium">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 3 Real-Time Graphical Progress Overview Lines (গ্রাফিক্যাল রিয়েল-টাইম ওভারভিউ লাইন) */}
            <div className="w-full pt-3 mt-2 border-t border-border/40 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                <span>রিয়েল-টাইম কার্যকারিতা ওভারভিউ</span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  লাইভ
                </span>
              </div>

              {/* Line 1: ডেলিভারি সম্পন্ন হার */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-foreground/80 font-medium">ডেলিভারি সফলতার হার</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {performanceRates.deliveryRate}% ({stats.completedOrders.toLocaleString("bn-BD")}/{stats.totalOrders.toLocaleString("bn-BD")})
                  </span>
                </div>
                <div className="h-2 w-full bg-muted/80 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 transition-all duration-500 shadow-xs"
                    style={{ width: `${Math.max(4, performanceRates.deliveryRate)}%` }}
                  />
                </div>
              </div>

              {/* Line 2: সক্রিয় পাইপলাইন (পেন্ডিং/প্রসেসিং/শিপড) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-foreground/80 font-medium">সক্রিয় পাইপলাইন (প্রসেসিং)</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {performanceRates.pipelineRate}% ({performanceRates.activePipeline.toLocaleString("bn-BD")} টি)
                  </span>
                </div>
                <div className="h-2 w-full bg-muted/80 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-500 shadow-xs"
                    style={{ width: `${Math.max(4, performanceRates.pipelineRate)}%` }}
                  />
                </div>
              </div>

              {/* Line 3: অর্ডার বাতিল / ড্রপ হার */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-foreground/80 font-medium">অর্ডার বাতিল / ড্রপ হার</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {performanceRates.cancelRate}% ({stats.cancelledOrders.toLocaleString("bn-BD")} টি)
                  </span>
                </div>
                <div className="h-2 w-full bg-muted/80 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-500 shadow-xs"
                    style={{ width: `${Math.max(4, performanceRates.cancelRate)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================== */}
      {/* ⬇️ RECENT ORDERS & QUICK ACTIONS (POSITIONED DOWN BELOW) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Recent Orders List (Takes 2 Columns) */}
        <Card className="lg:col-span-2 border-border/60 shadow-xs rounded-2xl">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                    সাম্প্রতিক অর্ডার
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">সর্বশেষ আসা অর্ডার তালিকা</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80 gap-1 text-xs font-semibold rounded-xl"
                onClick={() => navigate("/admin/orders")}
              >
                সব দেখুন <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-4 pt-2">
            {recentOrders.length === 0 ? (
              <div className="text-center py-10">
                <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">বর্তমানে কোনো অর্ডার নেই</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => navigate("/admin/orders")}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ring-1 ring-primary/20">
                        <span className="text-xs font-bold text-primary">
                          {order.customer_name ? order.customer_name.charAt(0) : "ক"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {order.customer_name || "গ্রাহক"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          #{order.order_number || order.id.slice(0, 6)} ·{" "}
                          {new Date(order.created_at).toLocaleDateString("bn-BD")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs sm:text-sm font-bold text-foreground">
                          ৳{Math.round(Number(order.total || 0)).toLocaleString("bn-BD")}
                        </p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions (Takes 1 Column - Compact Height with 2-Column Grid) */}
        <Card className="border-border/60 shadow-xs rounded-2xl flex flex-col">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                  দ্রুত অ্যাকশন
                </CardTitle>
                <p className="text-xs text-muted-foreground">এক ক্লিকে মূল সেকশনে নেভিগেশন</p>
              </div>
            </div>
          </CardHeader>

          {/* Compact Grid of Action Pills */}
          <CardContent className="p-3 sm:p-4 flex-1">
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => navigate("/admin/products")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card hover:bg-primary/5 border border-border/60 hover:border-primary/40 transition-all text-left group shadow-2xs"
              >
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    নতুন প্রোডাক্ট
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">পণ্য যোগ করুন</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin/orders")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card hover:bg-blue-500/5 border border-border/60 hover:border-blue-500/40 transition-all text-left group shadow-2xs"
              >
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate group-hover:text-blue-600 transition-colors">
                    অর্ডার তালিকা
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {stats.pendingOrders} পেন্ডিং
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin/categories")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card hover:bg-amber-500/5 border border-border/60 hover:border-amber-500/40 transition-all text-left group shadow-2xs"
              >
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FolderTree className="h-4 w-4 text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate group-hover:text-amber-600 transition-colors">
                    ক্যাটাগরি
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {stats.totalCategories} টি ক্যাটাগরি
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin/customers")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card hover:bg-purple-500/5 border border-border/60 hover:border-purple-500/40 transition-all text-left group shadow-2xs"
              >
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate group-hover:text-purple-600 transition-colors">
                    কাস্টমার
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">গ্রাহক তথ্য</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin/banners")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card hover:bg-emerald-500/5 border border-border/60 hover:border-emerald-500/40 transition-all text-left group shadow-2xs"
              >
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ImageIcon className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate group-hover:text-emerald-600 transition-colors">
                    ব্যানার স্লাইডার
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">হোম ব্যানার</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => window.open("/", "_blank")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card hover:bg-accent/5 border border-border/60 hover:border-accent/40 transition-all text-left group shadow-2xs"
              >
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate group-hover:text-foreground transition-colors">
                    ওয়েবসাইট
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">লাইভ সাইট</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
