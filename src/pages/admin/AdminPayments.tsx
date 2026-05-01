import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminPageState from "@/components/admin/AdminPageState";
import { getErrorMessage } from "@/lib/error-message";
import { cn } from "@/lib/utils";
import {
  CreditCard, Search, DollarSign, Clock,
  XCircle, Banknote, Wallet, FileText, Phone,
  Package, ShoppingBag, Receipt, TrendingUp, LayoutDashboard, ChevronLeft,
} from "lucide-react";
import StockValuePanel from "@/components/admin/finance/StockValuePanel";
import PurchasesPanel from "@/components/admin/finance/PurchasesPanel";
import ExpensesPanel from "@/components/admin/finance/ExpensesPanel";
import ProfitLossPanel from "@/components/admin/finance/ProfitLossPanel";
import FinanceOverview from "@/components/admin/finance/FinanceOverview";

interface PaymentRecord {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
}

type TabKey = "overview" | "payments" | "profit" | "stock" | "purchases" | "expenses";

const TABS: {
  key: TabKey;
  label: string;
  desc: string;
  icon: typeof CreditCard;
  color: "primary" | "green" | "blue" | "orange" | "destructive" | "purple";
}[] = [
  { key: "overview",  label: "ওভারভিউ",     desc: "এক নজরে সব হিসাব",        icon: LayoutDashboard, color: "purple" },
  { key: "payments",  label: "পেমেন্ট",      desc: "সব অর্ডারের পেমেন্ট",      icon: CreditCard,      color: "primary" },
  { key: "profit",    label: "লাভ-ক্ষতি",     desc: "P&L বিশ্লেষণ",            icon: TrendingUp,      color: "green" },
  { key: "stock",     label: "স্টক ভ্যালু",    desc: "স্টকের মূল্য ও পরিমাণ",   icon: Package,         color: "blue" },
  { key: "purchases", label: "ক্রয়মূল্য",     desc: "নতুন ক্রয় রেকর্ড",        icon: ShoppingBag,     color: "orange" },
  { key: "expenses",  label: "খরচ",          desc: "ভাড়া, মার্কেটিং ও আরও",   icon: Receipt,         color: "destructive" },
];

const colorMap = {
  primary:     { bg: "bg-primary/10",     text: "text-primary",       ring: "ring-primary/30",       grad: "from-primary/15 via-primary/5 to-transparent" },
  green:       { bg: "bg-green-500/10",   text: "text-green-600",     ring: "ring-green-500/30",     grad: "from-green-500/15 via-green-500/5 to-transparent" },
  blue:        { bg: "bg-blue-500/10",    text: "text-blue-600",      ring: "ring-blue-500/30",      grad: "from-blue-500/15 via-blue-500/5 to-transparent" },
  orange:      { bg: "bg-orange-500/10",  text: "text-orange-600",    ring: "ring-orange-500/30",    grad: "from-orange-500/15 via-orange-500/5 to-transparent" },
  destructive: { bg: "bg-destructive/10", text: "text-destructive",   ring: "ring-destructive/30",   grad: "from-destructive/15 via-destructive/5 to-transparent" },
  purple:      { bg: "bg-purple-500/10",  text: "text-purple-600",    ring: "ring-purple-500/30",    grad: "from-purple-500/15 via-purple-500/5 to-transparent" },
};

const AdminPayments = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tab, setTab] = useState<TabKey>("overview");

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, customer_phone, total, payment_method, status, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPayments(data || []);
    } catch (error) {
      console.error("Failed to load payments", error);
      setError(getErrorMessage(error, "পেমেন্ট ডেটা লোড করা যায়নি।"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPayments();
  }, []);

  const filtered = payments.filter((p) => {
    const matchSearch = p.order_number.includes(search) || p.customer_name.includes(search) || p.customer_phone.includes(search);
    const matchMethod = methodFilter === "all" || p.payment_method === methodFilter;
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchMethod && matchStatus;
  });

  const totalRevenue = payments.filter(p => p.status === "delivered").reduce((s, p) => s + Number(p.total), 0);
  const pendingPayments = payments.filter(p => p.status === "pending" || p.status === "processing").reduce((s, p) => s + Number(p.total), 0);
  const codCount = payments.filter(p => p.payment_method === "cod").length;
  const cancelledTotal = payments.filter(p => p.status === "cancelled").reduce((s, p) => s + Number(p.total), 0);

  const getPaymentMethodBadge = (method: string) => {
    const config: Record<string, { icon: typeof CreditCard; label: string; className: string }> = {
      cod:   { icon: Banknote,   label: "ক্যাশ অন ডেলিভারি", className: "bg-primary/10 text-primary border-primary/20" },
      bkash: { icon: Wallet,     label: "বিকাশ",              className: "bg-pink-500/10 text-pink-600 border-pink-500/20" },
      nagad: { icon: Wallet,     label: "নগদ",                className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
      bank:  { icon: CreditCard, label: "ব্যাংক ট্রান্সফার",   className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    };
    const c = config[method] || { icon: CreditCard, label: method, className: "bg-muted text-muted-foreground" };
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.className}`}>
        <Icon className="h-3 w-3" />
        {c.label}
      </span>
    );
  };

  const getPaymentStatus = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      pending:    { label: "পেমেন্ট বাকি",   className: "bg-primary/15 text-primary" },
      processing: { label: "প্রসেসিং",        className: "bg-secondary/15 text-secondary" },
      shipped:    { label: "শিপড - বাকি",     className: "bg-accent/15 text-accent" },
      delivered:  { label: "পেমেন্ট সম্পন্ন",  className: "bg-green-500/15 text-green-600" },
      cancelled:  { label: "বাতিল",            className: "bg-destructive/15 text-destructive" },
    };
    const c = map[status] || { label: status, className: "bg-muted text-muted-foreground" };
    return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${c.className}`}>{c.label}</span>;
  };

  if (loading) return <AdminPageState loading message="পেমেন্ট লোড হচ্ছে..." />;
  if (error) return <AdminPageState title="পেমেন্ট লোড করা যায়নি" message={error} onRetry={fetchPayments} />;

  const activeTab = TABS.find((t) => t.key === tab)!;
  const ActiveIcon = activeTab.icon;
  const activeColors = colorMap[activeTab.color];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">আর্থিক ব্যবস্থাপনা</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">পেমেন্ট, লাভ-ক্ষতি, স্টক ও খরচ — সব এক জায়গায়</p>
      </div>

      {/* Big button-style tab grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {TABS.map((t) => {
          const c = colorMap[t.color];
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "group text-left rounded-xl border bg-card p-3 sm:p-4 transition-all",
                "hover:shadow-md hover:-translate-y-0.5",
                isActive
                  ? `border-transparent ring-2 ${c.ring} shadow-md bg-gradient-to-br ${c.grad}`
                  : "border-border/60 hover:border-border"
              )}
            >
              <div className={cn(
                "h-10 w-10 sm:h-11 sm:w-11 rounded-lg flex items-center justify-center mb-2 transition-transform",
                c.bg,
                isActive && "scale-110"
              )}>
                <Icon className={cn("h-5 w-5", c.text)} />
              </div>
              <p className={cn("text-sm font-semibold leading-tight", isActive && c.text)}>{t.label}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1">{t.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Active section header */}
      <div className="flex items-center gap-3 pt-1">
        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", activeColors.bg)}>
          <ActiveIcon className={cn("h-4 w-4", activeColors.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-bold leading-tight">{activeTab.label}</h2>
          <p className="text-[11px] sm:text-xs text-muted-foreground">{activeTab.desc}</p>
        </div>
        {tab !== "overview" && (
          <button
            onClick={() => setTab("overview")}
            className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            ওভারভিউ
          </button>
        )}
      </div>

      {/* Panels */}
      {tab === "overview"  && <FinanceOverview onNavigate={(t) => setTab(t as TabKey)} />}
      {tab === "profit"    && <ProfitLossPanel />}
      {tab === "stock"     && <StockValuePanel />}
      {tab === "purchases" && <PurchasesPanel />}
      {tab === "expenses"  && <ExpensesPanel />}

      {tab === "payments" && (
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <StatCard icon={DollarSign} color="green"       label="সংগৃহীত পেমেন্ট"  value={`৳${totalRevenue.toLocaleString()}`} />
            <StatCard icon={Clock}      color="primary"     label="পেন্ডিং পেমেন্ট"   value={`৳${pendingPayments.toLocaleString()}`} />
            <StatCard icon={Banknote}   color="blue"        label="ক্যাশ অন ডেলিভারি" value={`${codCount}`} />
            <StatCard icon={XCircle}    color="destructive" label="বাতিল পেমেন্ট"     value={`৳${cancelledTotal.toLocaleString()}`} />
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="অর্ডার/কাস্টমার খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card" />
            </div>
            <div className="flex gap-2">
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="flex-1 sm:w-[180px] bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল পেমেন্ট</SelectItem>
                  <SelectItem value="cod">ক্যাশ অন ডেলিভারি</SelectItem>
                  <SelectItem value="bkash">বিকাশ</SelectItem>
                  <SelectItem value="nagad">নগদ</SelectItem>
                  <SelectItem value="bank">ব্যাংক</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="flex-1 sm:w-[160px] bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল স্ট্যাটাস</SelectItem>
                  <SelectItem value="pending">পেন্ডিং</SelectItem>
                  <SelectItem value="delivered">সম্পন্ন</SelectItem>
                  <SelectItem value="cancelled">বাতিল</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">{filtered.length} টি পেমেন্ট দেখানো হচ্ছে</p>

          {/* Mobile Payment Cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((p) => (
              <Card key={p.id} className="border-border/50">
                <CardContent className="p-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex items-center gap-2">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-primary truncate">#{p.order_number}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.customer_name}</p>
                      </div>
                    </div>
                    <span className="font-bold text-foreground shrink-0">৳{Number(p.total).toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />{p.customer_phone}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {getPaymentMethodBadge(p.payment_method)}
                    {getPaymentStatus(p.status)}
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <CreditCard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">কোনো পেমেন্ট পাওয়া যায়নি</p>
              </div>
            )}
          </div>

          {/* Payment Table */}
          <Card className="border-border/50 overflow-hidden hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/50">
                      <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">অর্ডার</th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">কাস্টমার</th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">পেমেন্ট মেথড</th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">পরিমাণ</th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">স্ট্যাটাস</th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">তারিখ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filtered.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-semibold text-primary">#{p.order_number}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium">{p.customer_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />{p.customer_phone}
                          </p>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          {getPaymentMethodBadge(p.payment_method)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-foreground">৳{Number(p.total).toLocaleString()}</span>
                        </td>
                        <td className="py-3 px-4">
                          {getPaymentStatus(p.status)}
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground text-xs">
                          {new Date(p.created_at).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="text-center py-16">
                    <CreditCard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">কোনো পেমেন্ট পাওয়া যায়নি</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

const StatCard = ({
  icon: Icon, color, label, value,
}: { icon: typeof CreditCard; color: keyof typeof colorMap; label: string; value: string }) => {
  const c = colorMap[color];
  return (
    <Card className="border-border/50 hover:border-border transition-colors">
      <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
        <div className={cn("h-10 w-10 sm:h-11 sm:w-11 rounded-lg flex items-center justify-center shrink-0", c.bg)}>
          <Icon className={cn("h-5 w-5", c.text)} />
        </div>
        <div className="min-w-0">
          <p className="text-base sm:text-xl font-bold truncate">{value}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPayments;
