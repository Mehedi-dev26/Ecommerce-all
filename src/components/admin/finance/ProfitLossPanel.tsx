import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Receipt, Wallet, Calendar } from "lucide-react";
import AdminPageState from "@/components/admin/AdminPageState";
import { getErrorMessage } from "@/lib/error-message";
import { cn } from "@/lib/utils";

type RangeKey = "this_month" | "last_month" | "last_30" | "this_year" | "all";

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "this_month", label: "এই মাস" },
  { key: "last_month", label: "গত মাস" },
  { key: "last_30",    label: "৩০ দিন" },
  { key: "this_year",  label: "এই বছর" },
  { key: "all",        label: "সব সময়" },
];

const getRange = (key: RangeKey): { from: string | null; to: string | null; label: string } => {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  if (key === "this_month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: fmt(from), to: fmt(now), label: "এই মাস" };
  }
  if (key === "last_month") {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: fmt(from), to: fmt(to), label: "গত মাস" };
  }
  if (key === "last_30") {
    const from = new Date(now); from.setDate(from.getDate() - 30);
    return { from: fmt(from), to: fmt(now), label: "শেষ ৩০ দিন" };
  }
  if (key === "this_year") {
    const from = new Date(now.getFullYear(), 0, 1);
    return { from: fmt(from), to: fmt(now), label: "এই বছর" };
  }
  return { from: null, to: null, label: "সব সময়" };
};

interface OrderItem {
  product_id: string | null;
  quantity: number;
  price: number;
}
interface OrderRow {
  id: string;
  total: number;
  shipping_cost: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
}

const ProfitLossPanel = () => {
  const [range, setRange] = useState<RangeKey>("this_month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenue, setRevenue] = useState(0);
  const [cogs, setCogs] = useState(0);
  const [purchases, setPurchases] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [shippingCollected, setShippingCollected] = useState(0);
  const [deliveredOrders, setDeliveredOrders] = useState(0);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = getRange(range);
      const fromIso = r.from ? new Date(r.from).toISOString() : null;
      const toIso = r.to ? new Date(`${r.to}T23:59:59`).toISOString() : null;

      // Orders (delivered only — same convention as the rest of the app)
      let ordersQuery = supabase
        .from("orders")
        .select("id, total, shipping_cost, status, created_at, order_items(product_id, quantity, price)")
        .eq("status", "delivered");
      if (fromIso) ordersQuery = ordersQuery.gte("created_at", fromIso);
      if (toIso) ordersQuery = ordersQuery.lte("created_at", toIso);

      // Cost prices map
      const [ordersRes, prodRes, purRes, expRes] = await Promise.all([
        ordersQuery,
        supabase.from("products").select("id, cost_price"),
        (() => {
          let q = supabase.from("inventory_purchases").select("total_cost, purchase_date");
          if (r.from) q = q.gte("purchase_date", r.from);
          if (r.to) q = q.lte("purchase_date", r.to);
          return q;
        })(),
        (() => {
          let q = supabase.from("business_expenses").select("amount, expense_date");
          if (r.from) q = q.gte("expense_date", r.from);
          if (r.to) q = q.lte("expense_date", r.to);
          return q;
        })(),
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (prodRes.error) throw prodRes.error;
      if (purRes.error) throw purRes.error;
      if (expRes.error) throw expRes.error;

      const costMap = new Map<string, number>();
      (prodRes.data || []).forEach((p) => costMap.set(p.id, Number(p.cost_price || 0)));

      let rev = 0, c = 0, ship = 0;
      const orders = (ordersRes.data || []) as OrderRow[];
      orders.forEach((o) => {
        rev += Number(o.total);
        ship += Number(o.shipping_cost || 0);
        (o.order_items || []).forEach((it) => {
          if (it.product_id) {
            const cp = costMap.get(it.product_id) || 0;
            c += cp * Number(it.quantity);
          }
        });
      });

      setRevenue(rev);
      setShippingCollected(ship);
      setCogs(c);
      setDeliveredOrders(orders.length);
      setPurchases((purRes.data || []).reduce((s: number, x) => s + Number(x.total_cost), 0));
      setExpenses((expRes.data || []).reduce((s: number, x) => s + Number(x.amount), 0));
    } catch (e) {
      setError(getErrorMessage(e, "লাভ-ক্ষতি হিসাব লোড করা যায়নি।"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [range]);

  if (loading) return <AdminPageState loading message="হিসাব করা হচ্ছে..." />;
  if (error) return <AdminPageState title="লোড করা যায়নি" message={error} onRetry={load} />;

  // Net product revenue = total - shipping (so we don't double count shipping as profit)
  const productRevenue = revenue - shippingCollected;
  const grossProfit = productRevenue - cogs;
  const netProfit = grossProfit - expenses;
  const margin = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0;
  const isProfit = netProfit >= 0;
  const rangeLabel = getRange(range).label;

  return (
    <div className="space-y-4">
      {/* Range filter — button group */}
      <Card className="border-border/50">
        <CardContent className="p-2 sm:p-3">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">সময়সীমা নির্বাচন করুন</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {RANGE_OPTIONS.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={cn(
                  "px-2 py-2 rounded-lg text-xs font-semibold transition-all",
                  range === r.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hero P&L Card */}
      <Card className={`border-2 ${isProfit ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{rangeLabel} এর নিট লাভ/ক্ষতি</p>
              <p className={`text-3xl sm:text-4xl font-bold mt-1 ${isProfit ? "text-green-600" : "text-destructive"}`}>
                {isProfit ? "+" : ""}৳{netProfit.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                মার্জিন: <span className={`font-semibold ${isProfit ? "text-green-600" : "text-destructive"}`}>{margin}%</span>
                {" • "}{deliveredOrders} টি ডেলিভারি অর্ডার
              </p>
            </div>
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${isProfit ? "bg-green-500/15" : "bg-destructive/15"}`}>
              {isProfit ? <TrendingUp className="h-7 w-7 text-green-600" /> : <TrendingDown className="h-7 w-7 text-destructive" />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-bold truncate">৳{revenue.toLocaleString()}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">মোট আয় (Revenue)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
              <ShoppingBag className="h-4 w-4 text-orange-600" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-bold truncate">৳{cogs.toLocaleString()}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">বিক্রিত পণ্যের ক্রয় খরচ</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Wallet className="h-4 w-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-bold truncate">৳{purchases.toLocaleString()}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">স্টক ক্রয় (এই সময়ে)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <Receipt className="h-4 w-4 text-destructive" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-bold truncate">৳{expenses.toLocaleString()}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">অন্যান্য খরচ</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed P&L Statement */}
      <Card className="border-border/50">
        <CardContent className="p-4 sm:p-5">
          <h4 className="font-semibold mb-3 text-sm">বিস্তারিত হিসাব ({rangeLabel})</h4>
          <div className="space-y-2 text-sm">
            <Row label="মোট বিক্রয় (Revenue)" value={revenue} positive />
            <Row label="− শিপিং চার্জ আদায়" value={shippingCollected} muted />
            <Row label="= পণ্য থেকে আয়" value={productRevenue} bold />
            <Row label="− বিক্রিত পণ্যের ক্রয় খরচ (COGS)" value={cogs} negative />
            <Row label="= গ্রস লাভ" value={grossProfit} bold positive={grossProfit >= 0} />
            <Row label="− অন্যান্য ব্যবসায়িক খরচ" value={expenses} negative />
            <div className="pt-2 mt-2 border-t border-border/50">
              <Row
                label="= নিট লাভ / ক্ষতি"
                value={netProfit}
                bold
                large
                positive={isProfit}
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            💡 হিসাব শুধুমাত্র <strong>delivered</strong> অর্ডার থেকে গণনা করা হয়। COGS = প্রতিটি বিক্রিত পণ্যের cost_price × quantity।
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

const Row = ({
  label, value, positive, negative, muted, bold, large,
}: { label: string; value: number; positive?: boolean; negative?: boolean; muted?: boolean; bold?: boolean; large?: boolean }) => {
  const color = positive ? "text-green-600" : negative ? "text-destructive" : muted ? "text-muted-foreground" : "text-foreground";
  return (
    <div className="flex items-center justify-between">
      <span className={`${muted ? "text-muted-foreground" : ""} ${bold ? "font-semibold" : ""}`}>{label}</span>
      <span className={`${color} ${bold ? "font-bold" : ""} ${large ? "text-lg" : ""}`}>
        ৳{value.toLocaleString()}
      </span>
    </div>
  );
};

export default ProfitLossPanel;
