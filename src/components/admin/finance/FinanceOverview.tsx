import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingBag, Receipt, Wallet, ArrowUpRight, ArrowDownRight, AlertTriangle } from "lucide-react";
import AdminPageState from "@/components/admin/AdminPageState";
import { getErrorMessage } from "@/lib/error-message";

interface Stats {
  revenue: number;
  cogs: number;
  expenses: number;
  purchases: number;
  shipping: number;
  stockCost: number;
  stockSale: number;
  totalUnits: number;
  lowStock: number;
  deliveredCount: number;
  pendingCount: number;
}

const FinanceOverview = ({ onNavigate }: { onNavigate?: (tab: string) => void }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [s, setS] = useState<Stats>({
    revenue: 0, cogs: 0, expenses: 0, purchases: 0, shipping: 0,
    stockCost: 0, stockSale: 0, totalUnits: 0, lowStock: 0,
    deliveredCount: 0, pendingCount: 0,
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const monthStart = new Date();
      monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      const monthIso = monthStart.toISOString();
      const monthDate = monthStart.toISOString().slice(0, 10);

      const [ordersRes, prodRes, purRes, expRes, pendRes] = await Promise.all([
        supabase.from("orders")
          .select("total, shipping_cost, status, order_items(product_id, quantity)")
          .eq("status", "delivered")
          .gte("created_at", monthIso),
        supabase.from("products").select("id, stock, price, cost_price"),
        supabase.from("inventory_purchases").select("total_cost").gte("purchase_date", monthDate),
        supabase.from("business_expenses").select("amount").gte("expense_date", monthDate),
        supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["pending", "processing"]),
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (prodRes.error) throw prodRes.error;

      const costMap = new Map<string, number>();
      (prodRes.data || []).forEach((p) => costMap.set(p.id, Number(p.cost_price || 0)));

      let rev = 0, ship = 0, cogs = 0;
      (ordersRes.data || []).forEach((o: { total: number; shipping_cost: number | null; order_items: { product_id: string | null; quantity: number }[] }) => {
        rev += Number(o.total);
        ship += Number(o.shipping_cost || 0);
        (o.order_items || []).forEach((it) => {
          if (it.product_id) cogs += (costMap.get(it.product_id) || 0) * Number(it.quantity);
        });
      });

      const products = prodRes.data || [];
      const stockCost = products.reduce((a, p) => a + Number(p.stock) * Number(p.cost_price || 0), 0);
      const stockSale = products.reduce((a, p) => a + Number(p.stock) * Number(p.price || 0), 0);
      const totalUnits = products.reduce((a, p) => a + Number(p.stock), 0);
      const lowStock = products.filter((p) => p.stock < 10).length;

      setS({
        revenue: rev,
        cogs,
        shipping: ship,
        expenses: (expRes.data || []).reduce((a, x) => a + Number(x.amount), 0),
        purchases: (purRes.data || []).reduce((a, x) => a + Number(x.total_cost), 0),
        stockCost, stockSale, totalUnits, lowStock,
        deliveredCount: (ordersRes.data || []).length,
        pendingCount: pendRes.count || 0,
      });
    } catch (e) {
      setError(getErrorMessage(e, "ওভারভিউ লোড করা যায়নি।"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  if (loading) return <AdminPageState loading message="হিসাব তৈরি হচ্ছে..." />;
  if (error) return <AdminPageState title="লোড করা যায়নি" message={error} onRetry={load} />;

  const productRevenue = s.revenue - s.shipping;
  const grossProfit = productRevenue - s.cogs;
  const netProfit = grossProfit - s.expenses;
  const isProfit = netProfit >= 0;
  const margin = s.revenue > 0 ? Math.round((netProfit / s.revenue) * 100) : 0;
  const stockPotential = s.stockSale - s.stockCost;

  return (
    <div className="space-y-4">
      {/* Hero — This Month Net Profit */}
      <Card className={`overflow-hidden border-2 ${isProfit ? "border-green-500/30" : "border-destructive/30"}`}>
        <div className={`px-5 py-6 ${isProfit ? "bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent" : "bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent"}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">এই মাসের নিট লাভ</span>
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isProfit ? "bg-green-500/20 text-green-700" : "bg-destructive/20 text-destructive"}`}>
                  {isProfit ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {margin}%
                </span>
              </div>
              <p className={`text-3xl sm:text-5xl font-bold tracking-tight ${isProfit ? "text-green-600" : "text-destructive"}`}>
                {isProfit ? "+" : ""}৳{netProfit.toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                {s.deliveredCount} টি ডেলিভারি অর্ডার থেকে · {s.pendingCount} টি অর্ডার পেন্ডিং
              </p>
            </div>
            <div className={`h-14 w-14 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center shrink-0 ${isProfit ? "bg-green-500/15" : "bg-destructive/15"}`}>
              {isProfit ? <TrendingUp className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" /> : <TrendingDown className="h-7 w-7 sm:h-8 sm:w-8 text-destructive" />}
            </div>
          </div>

          {/* Mini breakdown */}
          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-border/40">
            <MiniStat label="আয়" value={s.revenue} color="text-foreground" />
            <MiniStat label="পণ্য খরচ" value={s.cogs} color="text-orange-600" prefix="−" />
            <MiniStat label="অন্য খরচ" value={s.expenses} color="text-destructive" prefix="−" />
          </div>
        </div>
      </Card>

      {/* Quick action cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <ActionCard
          icon={Package}
          color="primary"
          label="বর্তমান স্টক"
          value={`৳${s.stockCost.toLocaleString()}`}
          sub={`${s.totalUnits} ইউনিট · সম্ভাব্য লাভ ৳${stockPotential.toLocaleString()}`}
          onClick={() => onNavigate?.("stock")}
        />
        <ActionCard
          icon={ShoppingBag}
          color="blue"
          label="এই মাসের ক্রয়"
          value={`৳${s.purchases.toLocaleString()}`}
          sub="নতুন স্টক যোগ করুন"
          onClick={() => onNavigate?.("purchases")}
        />
        <ActionCard
          icon={Receipt}
          color="destructive"
          label="এই মাসের খরচ"
          value={`৳${s.expenses.toLocaleString()}`}
          sub="ভাড়া, মার্কেটিং, পরিবহন"
          onClick={() => onNavigate?.("expenses")}
        />
        <ActionCard
          icon={Wallet}
          color="green"
          label="বিস্তারিত P&L"
          value={`৳${grossProfit.toLocaleString()}`}
          sub="গ্রস লাভ দেখুন →"
          onClick={() => onNavigate?.("profit")}
        />
      </div>

      {/* Health alerts */}
      {(s.lowStock > 0 || s.pendingCount > 0) && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">মনোযোগ প্রয়োজন</p>
                <ul className="text-xs sm:text-sm text-muted-foreground mt-1 space-y-1">
                  {s.lowStock > 0 && (
                    <li>• <strong className="text-foreground">{s.lowStock} টি প্রোডাক্টে</strong> স্টক কম (১০ এর নিচে) — দ্রুত স্টক যোগ করুন</li>
                  )}
                  {s.pendingCount > 0 && (
                    <li>• <strong className="text-foreground">{s.pendingCount} টি অর্ডার</strong> অপেক্ষমান — দ্রুত প্রসেস করুন</li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Simple how-it-works */}
      <Card className="border-border/50 bg-muted/20">
        <CardContent className="p-4">
          <p className="text-xs font-semibold mb-2">📊 হিসাব কীভাবে হয়?</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>নিট লাভ</strong> = (বিক্রয় − শিপিং) − পণ্যের ক্রয় খরচ − অন্য খরচ</p>
            <p>শুধু <strong className="text-green-600">delivered</strong> অর্ডার গণনা করা হয়।</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const MiniStat = ({ label, value, color, prefix = "" }: { label: string; value: number; color: string; prefix?: string }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">{label}</p>
    <p className={`text-sm sm:text-base font-bold ${color}`}>{prefix}৳{value.toLocaleString()}</p>
  </div>
);

const ActionCard = ({
  icon: Icon, color, label, value, sub, onClick,
}: { icon: typeof Package; color: "primary" | "blue" | "destructive" | "green"; label: string; value: string; sub: string; onClick?: () => void }) => {
  const colors = {
    primary: { bg: "bg-primary/10", text: "text-primary" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-600" },
    destructive: { bg: "bg-destructive/10", text: "text-destructive" },
    green: { bg: "bg-green-500/10", text: "text-green-600" },
  }[color];
  return (
    <button onClick={onClick} className="text-left">
      <Card className="border-border/50 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`h-8 w-8 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
              <Icon className={`h-4 w-4 ${colors.text}`} />
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">{label}</p>
          </div>
          <p className="text-base sm:text-xl font-bold truncate">{value}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>
        </CardContent>
      </Card>
    </button>
  );
};

export default FinanceOverview;
