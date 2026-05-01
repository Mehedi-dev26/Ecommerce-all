import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Package, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import AdminPageState from "@/components/admin/AdminPageState";
import { getErrorMessage } from "@/lib/error-message";
import { cn } from "@/lib/utils";

interface ProductRow {
  id: string;
  name_bn: string;
  name: string;
  stock: number;
  price: number;
  cost_price: number;
  image_url: string | null;
}

const StockValuePanel = () => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, name_bn, stock, price, cost_price, image_url")
        .order("name_bn");
      if (error) throw error;
      setProducts((data || []) as ProductRow[]);
    } catch (e) {
      setError(getErrorMessage(e, "স্টক ডেটা লোড করা যায়নি।"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = products.filter((p) =>
    p.name_bn.includes(search) || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalStockUnits = products.reduce((s, p) => s + Number(p.stock), 0);
  const totalCostValue = products.reduce((s, p) => s + Number(p.stock) * Number(p.cost_price || 0), 0);
  const totalSaleValue = products.reduce((s, p) => s + Number(p.stock) * Number(p.price || 0), 0);
  const potentialProfit = totalSaleValue - totalCostValue;
  const lowStock = products.filter((p) => p.stock < 10).length;

  if (loading) return <AdminPageState loading message="স্টক হিসাব লোড হচ্ছে..." />;
  if (error) return <AdminPageState title="লোড করা যায়নি" message={error} onRetry={load} />;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-bold truncate">{totalStockUnits.toLocaleString()}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">মোট ইউনিট</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="h-9 w-9 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
              <DollarSign className="h-4 w-4 text-secondary" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-bold truncate">৳{totalCostValue.toLocaleString()}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">স্টকের ক্রয় মূল্য</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-bold truncate">৳{potentialProfit.toLocaleString()}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">সম্ভাব্য লাভ</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-bold truncate">{lowStock}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">কম স্টক (&lt;10)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="প্রোডাক্ট খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card" />
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {filtered.map((p) => {
          const stockCost = Number(p.stock) * Number(p.cost_price || 0);
          const stockSale = Number(p.stock) * Number(p.price || 0);
          const profit = stockSale - stockCost;
          const isLow = p.stock < 10;
          return (
            <Card key={p.id} className="border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name_bn} className="h-12 w-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.name_bn}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn(
                        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold",
                        isLow ? "bg-destructive/15 text-destructive" : "bg-green-500/15 text-green-600"
                      )}>
                        স্টক: {p.stock}
                      </span>
                      <span className="text-[10px] text-muted-foreground">@ ৳{Number(p.cost_price || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/40">
                  <div>
                    <p className="text-[10px] text-muted-foreground">মোট ক্রয় মূল্য</p>
                    <p className="text-sm font-bold">৳{stockCost.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">সম্ভাব্য লাভ</p>
                    <p className={cn("text-sm font-bold", profit >= 0 ? "text-green-600" : "text-destructive")}>
                      ৳{profit.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">কোনো প্রোডাক্ট নেই</div>
        )}
      </div>

      {/* Desktop Table */}
      <Card className="border-border/50 overflow-hidden hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border/50">
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase text-muted-foreground">প্রোডাক্ট</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase text-muted-foreground">স্টক</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase text-muted-foreground">ক্রয় মূল্য</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase text-muted-foreground hidden sm:table-cell">বিক্রয় মূল্য</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase text-muted-foreground">মোট ক্রয় মূল্য</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase text-muted-foreground hidden md:table-cell">সম্ভাব্য লাভ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map((p) => {
                  const stockCost = Number(p.stock) * Number(p.cost_price || 0);
                  const stockSale = Number(p.stock) * Number(p.price || 0);
                  const profit = stockSale - stockCost;
                  return (
                    <tr key={p.id} className="hover:bg-muted/20">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name_bn} className="h-9 w-9 rounded-md object-cover shrink-0" />
                          ) : (
                            <div className="h-9 w-9 rounded-md bg-muted shrink-0" />
                          )}
                          <span className="font-medium truncate">{p.name_bn}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={p.stock < 10 ? "text-destructive font-semibold" : ""}>{p.stock}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">৳{Number(p.cost_price || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right hidden sm:table-cell">৳{Number(p.price).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-semibold">৳{stockCost.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right hidden md:table-cell">
                        <span className={profit >= 0 ? "text-green-600 font-semibold" : "text-destructive font-semibold"}>
                          ৳{profit.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">কোনো প্রোডাক্ট নেই</div>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground">
        💡 ক্রয় মূল্য সঠিকভাবে দেখাতে প্রতিটি প্রোডাক্ট edit করে "Cost Price" সেট করুন।
      </p>
    </div>
  );
};

export default StockValuePanel;
