import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import AdminPageState from "@/components/admin/AdminPageState";
import { getErrorMessage } from "@/lib/error-message";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  CreditCard, Search, DollarSign, Clock,
  XCircle, Banknote, Wallet, FileText, Phone,
  Package, ShoppingBag, Receipt, TrendingUp, LayoutDashboard,
  Download, Printer, RefreshCw, Copy, Check, ExternalLink,
  Eye, ArrowUpRight, ShieldCheck, Filter, X, Calendar,
  Percent, Sparkles, CheckCircle2, ChevronRight, AlertCircle,
  HelpCircle, MapPin
} from "lucide-react";
import StockValuePanel from "@/components/admin/finance/StockValuePanel";
import PurchasesPanel from "@/components/admin/finance/PurchasesPanel";
import ExpensesPanel from "@/components/admin/finance/ExpensesPanel";
import ProfitLossPanel from "@/components/admin/finance/ProfitLossPanel";
import FinanceOverview from "@/components/admin/finance/FinanceOverview";

interface PaymentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  shipping_address: string;
  city: string;
  district: string | null;
  subtotal: number;
  shipping_cost: number;
  total: number;
  status: string;
  payment_method: string;
  notes: string | null;
  created_at: string;
  advance_amount: number | null;
  advance_paid: boolean | null;
  payment_provider: string | null;
  payment_sender_number: string | null;
  payment_txn_id: string | null;
  payment_verified_at: string | null;
  payment_expected_amount: number | null;
}

type TabKey = "payments" | "overview" | "profit" | "stock" | "purchases" | "expenses";
type DateFilter = "all" | "today" | "7d" | "30d" | "this_month";

const FINANCE_TABS: {
  key: TabKey;
  label: string;
  desc: string;
  icon: typeof CreditCard;
}[] = [
  { key: "payments",  label: "পেমেন্ট রিপোর্ট",     desc: "লেনদেন ও পেমেন্ট হিস্ট্রি",    icon: CreditCard },
  { key: "overview",  label: "সামগ্রিক হিসাব",     desc: "ব্যবসায়িক আর্থিক চিত্র",      icon: LayoutDashboard },
  { key: "profit",    label: "লাভ-ক্ষতি (P&L)",    desc: "প্রফিট ও মার্জিন বিশ্লেষণ",   icon: TrendingUp },
  { key: "stock",     label: "স্টক ভ্যালু",        desc: "মজুদ পণ্যের মূল্যমান",        icon: Package },
  { key: "purchases", label: "ক্রয় রেকর্ড",       desc: "ইনভেন্টরি কেনাকাটা",          icon: ShoppingBag },
  { key: "expenses",  label: "দোকানের খরচ",        desc: "অফিস, প্যাকেজিং ও অন্যান্য", icon: Receipt },
];

const AdminPayments = () => {
  const [payments, setPayments] = useState<PaymentOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<TabKey>("payments");

  // Filter States
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  // Modal / Receipt state
  const [selectedPayment, setSelectedPayment] = useState<PaymentOrder | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchPayments = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, order_number, customer_name, customer_phone, customer_email,
          shipping_address, city, district, subtotal, shipping_cost, total,
          status, payment_method, notes, created_at,
          advance_amount, advance_paid, payment_provider, payment_sender_number,
          payment_txn_id, payment_verified_at, payment_expected_amount
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments((data || []) as PaymentOrder[]);
      if (isManualRefresh) {
        toast({ title: "সফল", description: "পেমেন্ট রিপোর্ট সফলভাবে আপডেট হয়েছে।" });
      }
    } catch (err) {
      console.error("Failed to load payments", err);
      setError(getErrorMessage(err, "পেমেন্ট ডেটা লোড করা যায়নি।"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchPayments();
  }, []);

  const handleCopy = (text: string, id: string, label = "কপি করা হয়েছে") => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: "সফল", description: `${label}: ${text}` });
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter Logic
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Search
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        p.order_number.toLowerCase().includes(q) ||
        p.customer_name.toLowerCase().includes(q) ||
        p.customer_phone.toLowerCase().includes(q) ||
        (p.payment_txn_id && p.payment_txn_id.toLowerCase().includes(q)) ||
        (p.payment_sender_number && p.payment_sender_number.toLowerCase().includes(q));

      // Method Filter
      const matchMethod = methodFilter === "all" || p.payment_method === methodFilter;

      // Status Filter
      const matchStatus = statusFilter === "all" || p.status === statusFilter;

      // Date Filter
      let matchDate = true;
      if (dateFilter !== "all") {
        const orderDate = new Date(p.created_at);
        const now = new Date();
        if (dateFilter === "today") {
          matchDate = orderDate.toDateString() === now.toDateString();
        } else if (dateFilter === "7d") {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          matchDate = orderDate >= sevenDaysAgo;
        } else if (dateFilter === "30d") {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          matchDate = orderDate >= thirtyDaysAgo;
        } else if (dateFilter === "this_month") {
          matchDate =
            orderDate.getMonth() === now.getMonth() &&
            orderDate.getFullYear() === now.getFullYear();
        }
      }

      return matchSearch && matchMethod && matchStatus && matchDate;
    });
  }, [payments, search, methodFilter, statusFilter, dateFilter]);

  // Overall Analytics Calculations (from all or filtered payments depending on context)
  const stats = useMemo(() => {
    const list = filteredPayments;
    const totalCount = list.length;
    const grossVolume = list.reduce((s, p) => s + Number(p.total || 0), 0);

    const deliveredOrders = list.filter((p) => p.status === "delivered");
    const deliveredRevenue = deliveredOrders.reduce((s, p) => s + Number(p.total || 0), 0);

    const pendingOrders = list.filter((p) => p.status === "pending" || p.status === "processing");
    const pendingAmount = pendingOrders.reduce((s, p) => s + Number(p.total || 0), 0);

    const shippedOrders = list.filter((p) => p.status === "shipped");
    const shippedAmount = shippedOrders.reduce((s, p) => s + Number(p.total || 0), 0);

    const cancelledOrders = list.filter((p) => p.status === "cancelled");
    const cancelledAmount = cancelledOrders.reduce((s, p) => s + Number(p.total || 0), 0);

    const advanceTotal = list.reduce((s, p) => s + Number(p.advance_amount || 0), 0);

    const aov = totalCount > 0 ? Math.round(grossVolume / totalCount) : 0;
    const successRate = totalCount > 0 ? Math.round((deliveredOrders.length / totalCount) * 100) : 0;

    // Gateway Breakdowns
    const codOrders = list.filter((p) => p.payment_method === "cod");
    const codTotal = codOrders.reduce((s, p) => s + Number(p.total || 0), 0);

    const bkashOrders = list.filter((p) => p.payment_method === "bkash");
    const bkashTotal = bkashOrders.reduce((s, p) => s + Number(p.total || 0), 0);

    const nagadOrders = list.filter((p) => p.payment_method === "nagad");
    const nagadTotal = nagadOrders.reduce((s, p) => s + Number(p.total || 0), 0);

    const otherOrders = list.filter((p) => !["cod", "bkash", "nagad"].includes(p.payment_method));
    const otherTotal = otherOrders.reduce((s, p) => s + Number(p.total || 0), 0);

    return {
      totalCount,
      grossVolume,
      deliveredRevenue,
      deliveredCount: deliveredOrders.length,
      pendingAmount,
      pendingCount: pendingOrders.length,
      shippedAmount,
      shippedCount: shippedOrders.length,
      cancelledAmount,
      cancelledCount: cancelledOrders.length,
      advanceTotal,
      aov,
      successRate,
      gateways: {
        cod: { count: codOrders.length, total: codTotal, share: grossVolume > 0 ? Math.round((codTotal / grossVolume) * 100) : 0 },
        bkash: { count: bkashOrders.length, total: bkashTotal, share: grossVolume > 0 ? Math.round((bkashTotal / grossVolume) * 100) : 0 },
        nagad: { count: nagadOrders.length, total: nagadTotal, share: grossVolume > 0 ? Math.round((nagadTotal / grossVolume) * 100) : 0 },
        other: { count: otherOrders.length, total: otherTotal, share: grossVolume > 0 ? Math.round((otherTotal / grossVolume) * 100) : 0 },
      },
    };
  }, [filteredPayments]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      toast({ title: "সতর্কতা", description: "এক্সপোর্ট করার মতো কোনো ডেটা নেই।" });
      return;
    }

    const headers = [
      "অর্ডার নম্বর",
      "তারিখ",
      "কাস্টমার নাম",
      "ফোন",
      "পেমেন্ট মেথড",
      "মোট টাকা",
      "অগ্রিম টাকা",
      "বাকি টাকা",
      "স্ট্যাটাস",
      "ট্রানজাকশন আইডি",
    ];

    const rows = filteredPayments.map((p) => [
      `"${p.order_number}"`,
      `"${new Date(p.created_at).toLocaleDateString("bn-BD")}"`,
      `"${p.customer_name.replace(/"/g, '""')}"`,
      `"${p.customer_phone}"`,
      `"${p.payment_method.toUpperCase()}"`,
      `"${Number(p.total || 0)}"`,
      `"${Number(p.advance_amount || 0)}"`,
      `"${Math.max(0, Number(p.total || 0) - Number(p.advance_amount || 0))}"`,
      `"${p.status}"`,
      `"${p.payment_txn_id || '-'}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Payment_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "সফল", description: "পেমেন্ট রিপোর্ট CSV ফাইল ডাউনলোড সম্পন্ন হয়েছে।" });
  };

  const handlePrint = () => {
    window.print();
  };

  const getMethodBadge = (method: string, advancePaid = false) => {
    const configs: Record<string, { label: string; icon: typeof CreditCard; bg: string; text: string; border: string }> = {
      cod: {
        label: "ক্যাশ অন ডেলিভারি (COD)",
        icon: Banknote,
        bg: "bg-emerald-500/10",
        text: "text-emerald-700 dark:text-emerald-400",
        border: "border-emerald-500/20",
      },
      bkash: {
        label: "বিকাশ (bKash)",
        icon: Wallet,
        bg: "bg-pink-500/10",
        text: "text-pink-600 dark:text-pink-400",
        border: "border-pink-500/20",
      },
      nagad: {
        label: "নগদ (Nagad)",
        icon: Wallet,
        bg: "bg-amber-500/10",
        text: "text-amber-600 dark:text-amber-400",
        border: "border-amber-500/20",
      },
      rocket: {
        label: "রকেট (Rocket)",
        icon: Wallet,
        bg: "bg-purple-500/10",
        text: "text-purple-600 dark:text-purple-400",
        border: "border-purple-500/20",
      },
      bank: {
        label: "ব্যাংক ট্রান্সফার",
        icon: CreditCard,
        bg: "bg-blue-500/10",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-500/20",
      },
    };

    const cfg = configs[method] || {
      label: method.toUpperCase(),
      icon: CreditCard,
      bg: "bg-muted",
      text: "text-foreground",
      border: "border-border",
    };
    const Icon = cfg.icon;

    return (
      <div className="flex flex-col gap-1 items-start">
        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border", cfg.bg, cfg.text, cfg.border)}>
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span>{cfg.label}</span>
        </span>
        {advancePaid && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="h-2.5 w-2.5" /> অগ্রিম পরিশোধিত
          </span>
        )}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; bg: string; text: string; dot: string; border: string }> = {
      delivered: {
        label: "পেমেন্ট সম্পন্ন",
        bg: "bg-emerald-500/10",
        text: "text-emerald-700 dark:text-emerald-400",
        dot: "bg-emerald-500",
        border: "border-emerald-500/20",
      },
      shipped: {
        label: "শিপড (কুরিয়ারে)",
        bg: "bg-blue-500/10",
        text: "text-blue-600 dark:text-blue-400",
        dot: "bg-blue-500",
        border: "border-blue-500/20",
      },
      processing: {
        label: "প্রসেসিং",
        bg: "bg-indigo-500/10",
        text: "text-indigo-600 dark:text-indigo-400",
        dot: "bg-indigo-500",
        border: "border-indigo-500/20",
      },
      pending: {
        label: "পেন্ডিং",
        bg: "bg-amber-500/10",
        text: "text-amber-600 dark:text-amber-400",
        dot: "bg-amber-500",
        border: "border-amber-500/20",
      },
      cancelled: {
        label: "বাতিল",
        bg: "bg-rose-500/10",
        text: "text-rose-600 dark:text-rose-400",
        dot: "bg-rose-500",
        border: "border-rose-500/20",
      },
    };

    const cfg = map[status] || {
      label: status,
      bg: "bg-muted",
      text: "text-muted-foreground",
      dot: "bg-muted-foreground",
      border: "border-border",
    };

    return (
      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", cfg.bg, cfg.text, cfg.border)}>
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
        {cfg.label}
      </span>
    );
  };

  const hasActiveFilters = search || methodFilter !== "all" || statusFilter !== "all" || dateFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setMethodFilter("all");
    setStatusFilter("all");
    setDateFilter("all");
  };

  if (loading) return <AdminPageState loading message="পেমেন্ট রিপোর্ট ও আর্থিক ডেটা লোড হচ্ছে..." />;
  if (error) return <AdminPageState title="পেমেন্ট রিপোর্ট লোড করা যায়নি" message={error} onRetry={() => fetchPayments(false)} />;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Top Header Banner & Quick Actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Receipt className="h-6 w-6" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              পেমেন্ট রিপোর্ট ও ফিনান্সিয়াল সামারি
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
            সমস্ত পেমেন্ট মেথড, সংগৃহীত অর্থ, প্রসেসিং ও ট্রানজাকশনের রিয়েল-টাইম লাইভ বিবরণ
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPayments(true)}
            disabled={refreshing}
            className="gap-2 h-9 rounded-xl font-medium"
          >
            <RefreshCw className={cn("h-4 w-4 text-muted-foreground", refreshing && "animate-spin text-primary")} />
            <span>{refreshing ? "রিফ্রেশ হচ্ছে..." : "রিফ্রেশ"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-2 h-9 rounded-xl font-medium bg-card hover:bg-muted"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>CSV এক্সপোর্ট</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-2 h-9 rounded-xl font-medium hidden sm:inline-flex"
          >
            <Printer className="h-4 w-4 text-blue-600" />
            <span>প্রিন্ট সামারি</span>
          </Button>

          <Button
            asChild
            size="sm"
            className="gap-2 h-9 rounded-xl font-semibold bg-primary text-primary-foreground shadow-sm hover:opacity-95"
          >
            <Link to="/admin/payment-approvals">
              <ShieldCheck className="h-4 w-4" />
              <span>পেমেন্ট Approval</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Top Segmented Tabs (Clean & Direct) */}
      <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none border-b border-border">
        {FINANCE_TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap",
                isActive
                  ? "border-primary text-primary bg-primary/5 font-bold shadow-sm"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Switch between subpanels if another finance tab is chosen */}
      {tab === "overview"  && <FinanceOverview onNavigate={(t) => setTab(t as TabKey)} />}
      {tab === "profit"    && <ProfitLossPanel />}
      {tab === "stock"     && <StockValuePanel />}
      {tab === "purchases" && <PurchasesPanel />}
      {tab === "expenses"  && <ExpensesPanel />}

      {/* MAIN VIEW: পেমেন্ট রিপোর্ট */}
      {tab === "payments" && (
        <div className="space-y-6">
          {/* 3. মূল Overall View: Executive KPI Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                মূল পেমেন্ট সামারি (Overall Performance View)
              </h2>
              {hasActiveFilters && (
                <span className="text-xs text-primary font-medium bg-primary/10 px-2.5 py-1 rounded-full">
                  ফিল্টারকৃত ফলাফল প্রদর্শিত হচ্ছে
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1: Gross Payment Volume */}
              <Card className="relative overflow-hidden border-border bg-gradient-to-br from-card via-card to-primary/5 hover:shadow-md transition-all">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">মোট পেমেন্ট ভলিউম</span>
                    <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <DollarSign className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl sm:text-3xl font-black text-foreground">
                      ৳{stats.grossVolume.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 font-medium">
                      <FileText className="h-3.5 w-3.5" /> মোট {stats.totalCount} টি অর্ডারের পেমেন্ট
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>গড় অর্ডার মান (AOV):</span>
                    <span className="font-bold text-foreground">৳{stats.aov.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Successfully Collected */}
              <Card className="relative overflow-hidden border-border bg-gradient-to-br from-card via-card to-emerald-500/5 hover:shadow-md transition-all">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">সফলভাবে সংগৃহীত</span>
                    <span className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                      ৳{stats.deliveredRevenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 font-medium">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {stats.deliveredCount} টি অর্ডার ডেলিভার্ড ও পেইড
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-muted-foreground">সাফল্যের হার (Success Rate):</span>
                      <span className="font-bold text-emerald-600">{stats.successRate}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${stats.successRate}%` }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Pending & In-Transit */}
              <Card className="relative overflow-hidden border-border bg-gradient-to-br from-card via-card to-amber-500/5 hover:shadow-md transition-all">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">পেন্ডিং ও প্রক্রিয়াধীন</span>
                    <span className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                      <Clock className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                      ৳{(stats.pendingAmount + stats.shippedAmount).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      {stats.pendingCount + stats.shippedCount} টি অর্ডার প্রসেসিং/কুরিয়ারে
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>অগ্রিম পেমেন্ট প্রাপ্ত:</span>
                    <span className="font-bold text-foreground">৳{stats.advanceTotal.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Cancelled Amount */}
              <Card className="relative overflow-hidden border-border bg-gradient-to-br from-card via-card to-rose-500/5 hover:shadow-md transition-all">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">বাতিলকৃত পেমেন্ট</span>
                    <span className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                      <XCircle className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                      ৳{stats.cancelledAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 font-medium">
                      <XCircle className="h-3.5 w-3.5" /> {stats.cancelledCount} টি অর্ডার বাতিল করা হয়েছে
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>ক্ষতির হার:</span>
                    <span className="font-bold text-rose-600">
                      {stats.totalCount > 0 ? Math.round((stats.cancelledCount / stats.totalCount) * 100) : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 4. পেমেন্ট মেথড ও গেটওয়ে বন্টন (Interactive Gateway Breakdown) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                গেটওয়ে পারফরম্যান্স ও চ্যানেল শেয়ার (Gateway Share)
              </h2>
              <span className="text-xs text-muted-foreground">কার্ডে ক্লিক করে ফিল্টার করুন</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* COD */}
              <button
                type="button"
                onClick={() => setMethodFilter(methodFilter === "cod" ? "all" : "cod")}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all bg-card hover:border-emerald-500/50 hover:shadow-sm",
                  methodFilter === "cod" ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/5" : "border-border"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Banknote className="h-4 w-4" />
                  </span>
                  <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 bg-emerald-500/5 font-bold">
                    {stats.gateways.cod.share}% শেয়ার
                  </Badge>
                </div>
                <p className="text-xs font-semibold text-muted-foreground">ক্যাশ অন ডেলিভারি (COD)</p>
                <p className="text-lg font-black text-foreground mt-0.5">৳{stats.gateways.cod.total.toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{stats.gateways.cod.count} টি ট্রানজাকশন</p>
              </button>

              {/* bKash */}
              <button
                type="button"
                onClick={() => setMethodFilter(methodFilter === "bkash" ? "all" : "bkash")}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all bg-card hover:border-pink-500/50 hover:shadow-sm",
                  methodFilter === "bkash" ? "ring-2 ring-pink-500 border-pink-500 bg-pink-500/5" : "border-border"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-lg bg-pink-500/10 text-pink-600">
                    <Wallet className="h-4 w-4" />
                  </span>
                  <Badge variant="outline" className="text-[10px] border-pink-500/30 text-pink-600 bg-pink-500/5 font-bold">
                    {stats.gateways.bkash.share}% শেয়ার
                  </Badge>
                </div>
                <p className="text-xs font-semibold text-muted-foreground">বিকাশ (bKash)</p>
                <p className="text-lg font-black text-foreground mt-0.5">৳{stats.gateways.bkash.total.toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{stats.gateways.bkash.count} টি ট্রানজাকশন</p>
              </button>

              {/* Nagad */}
              <button
                type="button"
                onClick={() => setMethodFilter(methodFilter === "nagad" ? "all" : "nagad")}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all bg-card hover:border-amber-500/50 hover:shadow-sm",
                  methodFilter === "nagad" ? "ring-2 ring-amber-500 border-amber-500 bg-amber-500/5" : "border-border"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                    <Wallet className="h-4 w-4" />
                  </span>
                  <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 bg-amber-500/5 font-bold">
                    {stats.gateways.nagad.share}% শেয়ার
                  </Badge>
                </div>
                <p className="text-xs font-semibold text-muted-foreground">নগদ (Nagad)</p>
                <p className="text-lg font-black text-foreground mt-0.5">৳{stats.gateways.nagad.total.toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{stats.gateways.nagad.count} টি ট্রানজাকশন</p>
              </button>

              {/* Bank & Others */}
              <button
                type="button"
                onClick={() => setMethodFilter(methodFilter === "bank" ? "all" : "bank")}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all bg-card hover:border-blue-500/50 hover:shadow-sm",
                  methodFilter === "bank" ? "ring-2 ring-blue-500 border-blue-500 bg-blue-500/5" : "border-border"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-600 bg-blue-500/5 font-bold">
                    {stats.gateways.other.share}% শেয়ার
                  </Badge>
                </div>
                <p className="text-xs font-semibold text-muted-foreground">ব্যাংক ও অন্যান্য</p>
                <p className="text-lg font-black text-foreground mt-0.5">৳{stats.gateways.other.total.toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{stats.gateways.other.count} টি ট্রানজাকশন</p>
              </button>
            </div>
          </div>

          {/* 5. ফিল্টার ও সার্চ কন্ট্রোল (Clear & Direct Control Bar) */}
          <Card className="border-border shadow-sm">
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="অর্ডার #, কাস্টমার নাম, ফোন বা ট্রানজাকশন আইডি দিয়ে খুঁজুন..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-10 bg-background rounded-xl border-border focus-visible:ring-primary"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap sm:flex-nowrap gap-2">
                  {/* Time Range Filter */}
                  <Select value={dateFilter} onValueChange={(v: DateFilter) => setDateFilter(v)}>
                    <SelectTrigger className="w-full sm:w-[150px] h-10 rounded-xl bg-background border-border">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="সময়কাল" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">সব সময়</SelectItem>
                      <SelectItem value="today">আজকের পেমেন্ট</SelectItem>
                      <SelectItem value="7d">গত ৭ দিন</SelectItem>
                      <SelectItem value="30d">গত ৩০ দিন</SelectItem>
                      <SelectItem value="this_month">চলতি মাস</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Payment Method */}
                  <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger className="w-full sm:w-[160px] h-10 rounded-xl bg-background border-border">
                      <Wallet className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="পেমেন্ট মেথড" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">সকল মেথড</SelectItem>
                      <SelectItem value="cod">ক্যাশ অন ডেলিভারি</SelectItem>
                      <SelectItem value="bkash">বিকাশ (bKash)</SelectItem>
                      <SelectItem value="nagad">নগদ (Nagad)</SelectItem>
                      <SelectItem value="rocket">রকেট (Rocket)</SelectItem>
                      <SelectItem value="bank">ব্যাংক ট্রান্সফার</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[150px] h-10 rounded-xl bg-background border-border">
                      <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="স্ট্যাটাস" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">সকল স্ট্যাটাস</SelectItem>
                      <SelectItem value="delivered">পেমেন্ট সম্পন্ন</SelectItem>
                      <SelectItem value="processing">প্রসেসিং</SelectItem>
                      <SelectItem value="shipped">শিপড</SelectItem>
                      <SelectItem value="pending">পেন্ডিং</SelectItem>
                      <SelectItem value="cancelled">বাতিল</SelectItem>
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      onClick={clearFilters}
                      className="h-10 px-3 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 gap-1.5 shrink-0"
                    >
                      <X className="h-4 w-4" />
                      <span>রিসেট</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Status summary pill below search */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                <p>
                  মোট <span className="font-bold text-foreground">{filteredPayments.length}</span> টি পেমেন্ট লেনদেন পাওয়া গেছে
                </p>
                {hasActiveFilters && (
                  <p className="text-[11px] text-primary font-medium">
                    ফিল্টার প্রযোজ্য (মোট {payments.length} টির মধ্যে)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 6. পেমেন্ট ট্রানজাকশন তালিকা (Modern, Direct & Responsive Table) */}
          <Card className="border-border shadow-sm overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  পেমেন্ট ট্রানজাকশন হিস্ট্রি
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  প্রতিটি অর্ডারের পেমেন্ট মেথড, টাকার পরিমাণ এবং লেনদেন সংক্রান্ত যাবতীয় তথ্য
                </p>
              </div>
              <Badge variant="outline" className="font-semibold text-xs py-1">
                {filteredPayments.length} টি রেকর্ড
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 px-4">অর্ডার / ইনভয়েস</th>
                      <th className="py-3 px-4">গ্রাহকের বিবরণ</th>
                      <th className="py-3 px-4">পেমেন্ট চ্যানেল</th>
                      <th className="py-3 px-4">মোট টাকা (৳)</th>
                      <th className="py-3 px-4">পেমেন্ট স্ট্যাটাস</th>
                      <th className="py-3 px-4">তারিখ ও সময়</th>
                      <th className="py-3 px-4 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredPayments.map((p) => {
                      const advance = Number(p.advance_amount || 0);
                      const due = Math.max(0, Number(p.total || 0) - advance);
                      const isDelivered = p.status === "delivered";

                      return (
                        <tr key={p.id} className="hover:bg-muted/30 transition-colors group">
                          {/* Order Number */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-primary hover:underline cursor-pointer" onClick={() => setSelectedPayment(p)}>
                                #{p.order_number}
                              </span>
                              <button
                                type="button"
                                title="অর্ডার নম্বর কপি করুন"
                                onClick={() => handleCopy(p.order_number, `order-${p.id}`, "অর্ডার নম্বর")}
                                className="text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 transition-opacity"
                              >
                                {copiedId === `order-${p.id}` ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                            {p.payment_txn_id && (
                              <p className="text-[11px] text-muted-foreground font-mono mt-1 flex items-center gap-1">
                                <span className="text-[10px] font-bold text-primary/70">Txn:</span> {p.payment_txn_id}
                              </p>
                            )}
                          </td>

                          {/* Customer */}
                          <td className="py-3.5 px-4 align-top">
                            <p className="font-semibold text-foreground text-sm">{p.customer_name}</p>
                            <a
                              href={`tel:${p.customer_phone}`}
                              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-0.5 font-mono"
                            >
                              <Phone className="h-3 w-3" />
                              <span>{p.customer_phone}</span>
                            </a>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[180px] mt-0.5">
                              {p.city || p.shipping_address}
                            </p>
                          </td>

                          {/* Method */}
                          <td className="py-3.5 px-4 align-top">
                            {getMethodBadge(p.payment_method, p.advance_paid ?? false)}
                          </td>

                          {/* Total Amount */}
                          <td className="py-3.5 px-4 align-top">
                            <p className="font-black text-base text-foreground">
                              ৳{Number(p.total || 0).toLocaleString()}
                            </p>
                            {advance > 0 && (
                              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                অগ্রিম: ৳{advance.toLocaleString()}
                              </p>
                            )}
                            {!isDelivered && due > 0 && (
                              <p className="text-[11px] text-muted-foreground">
                                বাকি: ৳{due.toLocaleString()}
                              </p>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 align-top">
                            {getStatusBadge(p.status)}
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-4 align-top text-xs text-muted-foreground">
                            <p className="font-medium text-foreground">
                              {new Date(p.created_at).toLocaleDateString("bn-BD", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                            <p className="text-[11px] mt-0.5">
                              {new Date(p.created_at).toLocaleTimeString("bn-BD", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 align-top text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedPayment(p)}
                                className="h-8 px-2.5 rounded-lg text-xs font-semibold gap-1.5 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>রসিদ দেখুন</span>
                              </Button>
                              <Button
                                asChild
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                                title="অর্ডারের বিস্তারিত দেখুন"
                              >
                                <Link to={`/admin/orders`}>
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden divide-y divide-border">
                {filteredPayments.map((p) => {
                  const advance = Number(p.advance_amount || 0);
                  const due = Math.max(0, Number(p.total || 0) - advance);

                  return (
                    <div key={p.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-primary text-base">#{p.order_number}</span>
                            {getStatusBadge(p.status)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(p.created_at).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-foreground">৳{Number(p.total || 0).toLocaleString()}</p>
                          {advance > 0 && (
                            <p className="text-[11px] text-emerald-600 font-medium">অগ্রিম: ৳{advance.toLocaleString()}</p>
                          )}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-muted/40 text-xs space-y-1">
                        <div className="flex items-center justify-between font-medium">
                          <span className="text-foreground">{p.customer_name}</span>
                          <a href={`tel:${p.customer_phone}`} className="text-primary font-mono flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {p.customer_phone}
                          </a>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{p.shipping_address}</p>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div>{getMethodBadge(p.payment_method, p.advance_paid ?? false)}</div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedPayment(p)}
                          className="h-8 px-3 rounded-lg text-xs font-semibold gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>রসিদ দেখুন</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Empty State */}
              {filteredPayments.length === 0 && (
                <div className="py-16 text-center px-4">
                  <div className="h-16 w-16 rounded-2xl bg-muted/50 text-muted-foreground/40 mx-auto flex items-center justify-center mb-3">
                    <Receipt className="h-8 w-8" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">কোনো পেমেন্ট রেকর্ড মেলেনি</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    আপনার নির্বাচিত ফিল্টার বা অনুসন্ধানের সাথে কোনো পেমেন্ট রেকর্ড খুঁজে পাওয়া যায়নি।
                  </p>
                  {hasActiveFilters && (
                    <Button onClick={clearFilters} variant="outline" size="sm" className="mt-4 rounded-xl text-xs font-semibold">
                      সব ফিল্টার রিসেট করুন
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 7. পেমেন্ট রসিদ ও ট্রানজাকশন বিস্তারিত ডায়ালগ (Transaction Receipt Modal) */}
      <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
        {selectedPayment && (
          <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl">
            {/* Header */}
            <div className="bg-primary/10 p-5 border-b border-primary/20 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                  <Receipt className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">পেমেন্ট রসিদ ও ট্রানজাকশন</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">অর্ডার #{selectedPayment.order_number}</p>
                </div>
              </div>
              <div>{getStatusBadge(selectedPayment.status)}</div>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Payment Summary Box */}
              <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>পেমেন্ট মেথড:</span>
                  <span className="font-semibold text-foreground uppercase">{selectedPayment.payment_method}</span>
                </div>
                {selectedPayment.payment_sender_number && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>প্রেরক নম্বর:</span>
                    <span className="font-mono font-semibold text-foreground">{selectedPayment.payment_sender_number}</span>
                  </div>
                )}
                {selectedPayment.payment_txn_id && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>ট্রানজাকশন আইডি (TxnID):</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-primary">
                      <span>{selectedPayment.payment_txn_id}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedPayment.payment_txn_id!, "modal-txn", "Txn ID")}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {copiedId === "modal-txn" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>লেনদেনের তারিখ:</span>
                  <span className="font-medium text-foreground">
                    {new Date(selectedPayment.created_at).toLocaleString("bn-BD")}
                  </span>
                </div>
              </div>

              {/* Amount Breakdown */}
              <div className="rounded-xl border border-border p-4 space-y-2.5 bg-muted/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">টাকার বিবরণী</h4>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">সাবটোটাল:</span>
                  <span className="font-semibold">৳{Number(selectedPayment.subtotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">ডেলিভারি চার্জ:</span>
                  <span className="font-semibold">৳{Number(selectedPayment.shipping_cost || 0).toLocaleString()}</span>
                </div>
                {Number(selectedPayment.advance_amount || 0) > 0 && (
                  <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>অগ্রিম পরিশোধিত:</span>
                    <span>- ৳{Number(selectedPayment.advance_amount).toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-border flex items-center justify-between font-black text-base">
                  <span>সর্বমোট প্রদেয়:</span>
                  <span className="text-primary">৳{Number(selectedPayment.total || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Customer Information */}
              <div className="rounded-xl border border-border p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">গ্রাহকের তথ্য</h4>
                <p className="font-semibold text-sm">{selectedPayment.customer_name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
                  <Phone className="h-3.5 w-3.5 text-primary" /> {selectedPayment.customer_phone}
                </p>
                {selectedPayment.customer_email && (
                  <p className="text-xs text-muted-foreground">{selectedPayment.customer_email}</p>
                )}
                <p className="text-xs text-muted-foreground flex items-start gap-1.5 pt-1">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{selectedPayment.shipping_address}, {selectedPayment.city}</span>
                </p>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <DialogFooter className="p-4 bg-muted/30 border-t border-border flex items-center justify-between gap-2 sm:justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-2 rounded-xl text-xs font-semibold"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>প্রিন্ট রসিদ</span>
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPayment(null)}
                  className="rounded-xl text-xs"
                >
                  বন্ধ করুন
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="rounded-xl text-xs font-semibold bg-primary"
                >
                  <Link to="/admin/orders">
                    <span>অর্ডার ম্যানেজ</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default AdminPayments;
