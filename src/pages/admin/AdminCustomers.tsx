import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminPageState from "@/components/admin/AdminPageState";
import { getErrorMessage } from "@/lib/error-message";
import { Search, Phone, MapPin, ShoppingBag, Users, TrendingUp, Crown, Printer, AlertTriangle, Clock, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Customer {
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  city: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
  orders: { order_number: string; total: number; status: string; created_at: string }[];
}

interface AbandonedCheckout {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  division: string | null;
  district: string | null;
  upazila: string | null;
  shipping_address: string | null;
  cart_items: any[];
  cart_total: number;
  recovered: boolean;
  created_at: string;
}

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [abandoned, setAbandoned] = useState<AbandonedCheckout[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, abandonedRes] = await Promise.all([
        supabase.from("orders").select("customer_name, customer_phone, customer_email, city, total, status, order_number, created_at"),
        supabase.from("abandoned_checkouts").select("*").eq("recovered", false).order("created_at", { ascending: false }),
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (abandonedRes.error) throw abandonedRes.error;

      const map = new Map<string, Customer>();
      for (const o of ordersRes.data || []) {
        const key = o.customer_phone;
        const orderInfo = { order_number: o.order_number, total: Number(o.total), status: o.status, created_at: o.created_at };
        const existing = map.get(key);
        if (existing) {
          existing.totalOrders++;
          existing.totalSpent += Number(o.total);
          existing.orders.push(orderInfo);
          if (o.created_at > existing.lastOrder) existing.lastOrder = o.created_at;
        } else {
          map.set(key, {
            customer_name: o.customer_name,
            customer_phone: o.customer_phone,
            customer_email: o.customer_email,
            city: o.city,
            totalOrders: 1,
            totalSpent: Number(o.total),
            lastOrder: o.created_at,
            orders: [orderInfo],
          });
        }
      }

      setCustomers(Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent));
      setAbandoned((abandonedRes.data as AbandonedCheckout[]) || []);
    } catch (err) {
      console.error("Failed to load customers", err);
      setError(getErrorMessage(err, "কাস্টমার ডেটা লোড করা যায়নি।"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const filtered = customers.filter(
    (c) => c.customer_name.toLowerCase().includes(search.toLowerCase()) || c.customer_phone.includes(search)
  );

  const totalSpentAll = customers.reduce((s, c) => s + c.totalSpent, 0);
  const avgSpent = customers.length > 0 ? Math.round(totalSpentAll / customers.length) : 0;

  const handlePrintAll = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rows = filtered.map((c, i) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${i + 1}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${c.customer_name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${c.customer_phone}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${c.customer_email || "-"}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${c.city}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${c.totalOrders}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">৳${c.totalSpent.toLocaleString()}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html><head><title>কাস্টমার তালিকা</title>
      <style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th{background:#f3f4f6;padding:10px 8px;text-align:left;font-size:12px;text-transform:uppercase;border-bottom:2px solid #e5e7eb}td{font-size:13px}h1{font-size:20px;margin-bottom:4px}.meta{color:#666;font-size:13px;margin-bottom:16px}</style>
      </head><body>
      <h1>কাস্টমার তালিকা</h1>
      <p class="meta">মোট: ${filtered.length} জন কাস্টমার | মোট ব্যয়: ৳${totalSpentAll.toLocaleString()} | তারিখ: ${new Date().toLocaleDateString("bn-BD")}</p>
      <table>
        <thead><tr><th>#</th><th>নাম</th><th>ফোন</th><th>ইমেইল</th><th>শহর</th><th style="text-align:center">অর্ডার</th><th style="text-align:right">মোট খরচ</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) return <AdminPageState loading message="কাস্টমার লোড হচ্ছে..." />;
  if (error) return <AdminPageState title="কাস্টমার লোড করা যায়নি" message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label="মোট কাস্টমার" value={customers.length} color="primary" />
        <StatCard icon={TrendingUp} label="মোট ব্যয়" value={`৳${totalSpentAll.toLocaleString()}`} color="secondary" />
        <StatCard icon={ShoppingBag} label="গড় ব্যয়" value={`৳${avgSpent.toLocaleString()}`} color="accent" />
        <StatCard icon={AlertTriangle} label="ইনকমপ্লিট অর্ডার" value={abandoned.length} color="destructive" />
      </div>

      <Tabs defaultValue="customers" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="customers" className="gap-1.5 flex-1 sm:flex-none">
              <Users className="h-4 w-4" /> কাস্টমার ({customers.length})
            </TabsTrigger>
            <TabsTrigger value="abandoned" className="gap-1.5 flex-1 sm:flex-none">
              <AlertTriangle className="h-4 w-4" /> ইনকমপ্লিট ({abandoned.length})
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card" />
            </div>
            <Button variant="outline" size="sm" onClick={handlePrintAll} className="gap-1.5 shrink-0">
              <Printer className="h-4 w-4" /> <span className="hidden sm:inline">প্রিন্ট</span>
            </Button>
          </div>
        </div>

        {/* Customers Tab */}
        <TabsContent value="customers">
          <p className="text-xs text-muted-foreground mb-2">{filtered.length} জন কাস্টমার দেখানো হচ্ছে</p>
          <Card className="border-border/50 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/50">
                      <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">কাস্টমার</th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">ফোন</th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">শহর</th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">অর্ডার</th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">মোট খরচ</th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">শেষ অর্ডার</th>
                      <th className="py-3.5 px-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filtered.map((c, index) => (
                      <tr key={c.customer_phone} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary">{c.customer_name.charAt(0)}</span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold truncate">{c.customer_name}</p>
                                {index === 0 && <Crown className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                              </div>
                              {c.customer_email && <p className="text-xs text-muted-foreground truncate">{c.customer_email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" /><span>{c.customer_phone}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" /><span>{c.city}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">{c.totalOrders}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-foreground">৳{c.totalSpent.toLocaleString()}</span>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground text-xs">
                          {new Date(c.lastOrder).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(c)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="text-center py-16">
                    <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">কোনো কাস্টমার পাওয়া যায়নি</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Abandoned Tab */}
        <TabsContent value="abandoned">
          <p className="text-xs text-muted-foreground mb-2">{abandoned.length} টি ইনকমপ্লিট অর্ডার</p>
          <Card className="border-border/50 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/50">
                      <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">কাস্টমার</th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">ফোন</th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">ঠিকানা</th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">কার্ট মূল্য</th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">পণ্য</th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">সময়</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {abandoned.map((a) => (
                      <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold truncate">{a.customer_name || "অজানা"}</p>
                              {a.customer_email && <p className="text-xs text-muted-foreground truncate">{a.customer_email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {a.customer_phone ? (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" /><span>{a.customer_phone}</span>
                            </div>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <span className="text-muted-foreground text-xs">
                            {[a.upazila, a.district, a.division].filter(Boolean).join(", ") || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-foreground">৳{Number(a.cart_total).toLocaleString()}</span>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          <div className="space-y-0.5">
                            {(Array.isArray(a.cart_items) ? a.cart_items : []).slice(0, 2).map((item: any, i: number) => (
                              <p key={i} className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {item.name} × {item.qty}
                              </p>
                            ))}
                            {Array.isArray(a.cart_items) && a.cart_items.length > 2 && (
                              <p className="text-xs text-muted-foreground">+{a.cart_items.length - 2} আরও</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(a.created_at).toLocaleDateString("bn-BD", { day: "numeric", month: "short" })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {abandoned.length === 0 && (
                  <div className="text-center py-16">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">কোনো ইনকমপ্লিট অর্ডার নেই</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{selectedCustomer.customer_name.charAt(0)}</span>
                  </div>
                  {selectedCustomer.customer_name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">ফোন</p>
                    <p className="font-semibold">{selectedCustomer.customer_phone}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">ইমেইল</p>
                    <p className="font-semibold truncate">{selectedCustomer.customer_email || "—"}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">মোট অর্ডার</p>
                    <p className="font-semibold">{selectedCustomer.totalOrders}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">মোট খরচ</p>
                    <p className="font-semibold text-primary">৳{selectedCustomer.totalSpent.toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">অর্ডার ইতিহাস</h4>
                  <div className="space-y-2">
                    {selectedCustomer.orders.sort((a, b) => b.created_at.localeCompare(a.created_at)).map((o) => (
                      <div key={o.order_number} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                        <div>
                          <p className="font-semibold">{o.order_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(o.created_at).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">৳{o.total.toLocaleString()}</p>
                          <Badge variant={o.status === "delivered" ? "default" : "secondary"} className="text-[10px]">
                            {o.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const statColorMap = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent",
  destructive: "bg-destructive/10 text-destructive",
} as const;

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: keyof typeof statColorMap }) => (
  <div className="bg-card rounded-xl border border-border/50 p-4 flex items-center gap-3">
    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${statColorMap[color]}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  </div>
);

export default AdminCustomers;
