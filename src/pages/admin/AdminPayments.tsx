import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AdminPageState from "@/components/admin/AdminPageState";
import { getErrorMessage } from "@/lib/error-message";
import {
  CreditCard, Search, DollarSign, Clock,
  XCircle, Banknote, Wallet, FileText, Phone,
  Package, ShoppingBag, Receipt, TrendingUp, LayoutDashboard,
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

const AdminPayments = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

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
      cod: { icon: Banknote, label: "ক্যাশ অন ডেলিভারি", className: "bg-primary/10 text-primary border-primary/20" },
      bkash: { icon: Wallet, label: "বিকাশ", className: "bg-pink-500/10 text-pink-600 border-pink-500/20" },
      nagad: { icon: Wallet, label: "নগদ", className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
      bank: { icon: CreditCard, label: "ব্যাংক ট্রান্সফার", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
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
      pending: { label: "পেমেন্ট বাকি", className: "bg-primary/15 text-primary" },
      processing: { label: "প্রসেসিং", className: "bg-secondary/15 text-secondary" },
      shipped: { label: "শিপড - বাকি", className: "bg-accent/15 text-accent" },
      delivered: { label: "পেমেন্ট সম্পন্ন", className: "bg-green-500/15 text-green-600" },
      cancelled: { label: "বাতিল", className: "bg-destructive/15 text-destructive" },
    };
    const c = map[status] || { label: status, className: "bg-muted text-muted-foreground" };
    return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${c.className}`}>{c.label}</span>;
  };

  if (loading) return <AdminPageState loading message="পেমেন্ট লোড হচ্ছে..." />;

  if (error) return <AdminPageState title="পেমেন্ট লোড করা যায়নি" message={error} onRetry={fetchPayments} />;

  return (
    <Tabs defaultValue="payments" className="space-y-4">
      <TabsList className="w-full justify-start overflow-x-auto h-auto flex-wrap p-1 bg-muted/50">
        <TabsTrigger value="payments" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" />পেমেন্ট</TabsTrigger>
        <TabsTrigger value="profit" className="gap-1.5"><TrendingUp className="h-3.5 w-3.5" />লাভ-ক্ষতি</TabsTrigger>
        <TabsTrigger value="stock" className="gap-1.5"><Package className="h-3.5 w-3.5" />স্টক ভ্যালু</TabsTrigger>
        <TabsTrigger value="purchases" className="gap-1.5"><ShoppingBag className="h-3.5 w-3.5" />ক্রয়</TabsTrigger>
        <TabsTrigger value="expenses" className="gap-1.5"><Receipt className="h-3.5 w-3.5" />খরচ</TabsTrigger>
      </TabsList>

      <TabsContent value="profit" className="mt-4"><ProfitLossPanel /></TabsContent>
      <TabsContent value="stock" className="mt-4"><StockValuePanel /></TabsContent>
      <TabsContent value="purchases" className="mt-4"><PurchasesPanel /></TabsContent>
      <TabsContent value="expenses" className="mt-4"><ExpensesPanel /></TabsContent>

      <TabsContent value="payments" className="mt-4 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <Card className="border-border/50">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-bold truncate">৳{totalRevenue.toLocaleString()}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">সংগৃহীত পেমেন্ট</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-bold truncate">৳{pendingPayments.toLocaleString()}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">পেন্ডিং পেমেন্ট</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
              <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-bold">{codCount}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">ক্যাশ অন ডেলিভারি</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-bold truncate">৳{cancelledTotal.toLocaleString()}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">বাতিল পেমেন্ট</p>
            </div>
          </CardContent>
        </Card>
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
      </TabsContent>
    </Tabs>
  );
};

export default AdminPayments;
