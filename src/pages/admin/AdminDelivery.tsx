import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import AdminPageState from "@/components/admin/AdminPageState";
import { getErrorMessage } from "@/lib/error-message";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search, Eye, Truck, Clock, CheckCircle, Package,
  XCircle, MapPin, Phone, User, FileText, Navigation
} from "lucide-react";

interface DeliveryOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  district: string | null;
  total: number;
  status: string;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

const deliveryStatuses = [
  { value: "pending", label: "অপেক্ষমাণ", icon: Clock, color: "bg-primary/15 text-primary" },
  { value: "processing", label: "প্রস্তুত হচ্ছে", icon: Package, color: "bg-secondary/15 text-secondary" },
  { value: "shipped", label: "শিপড", icon: Truck, color: "bg-accent/15 text-accent" },
  { value: "delivered", label: "ডেলিভারড", icon: CheckCircle, color: "bg-green-500/15 text-green-600" },
  { value: "cancelled", label: "বাতিল", icon: XCircle, color: "bg-destructive/15 text-destructive" },
];

const AdminDelivery = () => {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const { toast } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, customer_phone, shipping_address, city, district, total, status, created_at, updated_at, notes")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error("Failed to load delivery data", error);
      setError(getErrorMessage(error, "ডেলিভারি ডেটা লোড করা যায়নি।"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchOrders(); }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "ডেলিভারি স্ট্যাটাস আপডেট হয়েছে" });
      void fetchOrders();
    }
  };

  const getStatusBadge = (status: string) => {
    const s = deliveryStatuses.find((o) => o.value === status);
    const Icon = s?.icon || Clock;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s?.color || "bg-muted text-muted-foreground"}`}>
        <Icon className="h-3 w-3" />
        {s?.label || status}
      </span>
    );
  };

  const filtered = orders.filter((o) => {
    const matchSearch = o.order_number.includes(search) || o.customer_name.includes(search) || o.customer_phone.includes(search) || o.city.includes(search);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const shippedCount = orders.filter(o => o.status === "shipped").length;
  const deliveredCount = orders.filter(o => o.status === "delivered").length;
  const pendingCount = orders.filter(o => o.status === "pending" || o.status === "processing").length;

  // Group by city
  const cityGroups = orders.reduce((acc, o) => {
    acc[o.city] = (acc[o.city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topCities = Object.entries(cityGroups).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (loading) return <AdminPageState loading message="ডেলিভারি লোড হচ্ছে..." />;

  if (error) return <AdminPageState title="ডেলিভারি লোড করা যায়নি" message={error} onRetry={fetchOrders} />;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">প্রস্তুতি বাকি</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Truck className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xl font-bold">{shippedCount}</p>
              <p className="text-xs text-muted-foreground">ট্রানজিটে আছে</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{deliveredCount}</p>
              <p className="text-xs text-muted-foreground">ডেলিভারি সম্পন্ন</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Navigation className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-xl font-bold">{Object.keys(cityGroups).length}</p>
              <p className="text-xs text-muted-foreground">ডেলিভারি এলাকা</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top delivery areas */}
      {topCities.length > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              শীর্ষ ডেলিভারি এলাকা
            </h3>
            <div className="flex flex-wrap gap-2">
              {topCities.map(([city, count]) => (
                <span key={city} className="inline-flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full text-xs font-medium">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  {city}
                  <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-[10px] font-bold">{count}</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="অর্ডার/কাস্টমার/শহর খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সকল স্ট্যাটাস</SelectItem>
            {deliveryStatuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} টি ডেলিভারি দেখানো হচ্ছে</p>

      {/* Delivery Table */}
      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border/50">
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">অর্ডার</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">কাস্টমার</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">ঠিকানা</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">স্ট্যাটাস</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">তারিখ</th>
                  <th className="text-right py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-semibold text-primary">#{o.order_number}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{o.customer_name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />{o.customer_phone}
                      </p>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex items-start gap-1.5 text-xs text-muted-foreground max-w-[200px]">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span className="truncate">{o.shipping_address}, {o.city}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                        <SelectTrigger className="h-auto w-auto border-0 p-0 shadow-none focus:ring-0 [&>svg]:ml-1">
                          {getStatusBadge(o.status)}
                        </SelectTrigger>
                        <SelectContent>
                          {deliveryStatuses.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              <span className="flex items-center gap-2">
                                <s.icon className="h-3.5 w-3.5" />
                                {s.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground text-xs">
                      {new Date(o.created_at).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" onClick={() => setSelectedOrder(o)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <Truck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">কোনো ডেলিভারি পাওয়া যায়নি</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="block">ডেলিভারি #{selectedOrder?.order_number}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {selectedOrder && new Date(selectedOrder.created_at).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <span className="text-sm text-muted-foreground">ডেলিভারি স্ট্যাটাস</span>
                {getStatusBadge(selectedOrder.status)}
              </div>

              {/* Delivery Timeline */}
              <div className="space-y-3">
                {deliveryStatuses.slice(0, 4).map((step, i) => {
                  const currentIndex = deliveryStatuses.findIndex(s => s.value === selectedOrder.status);
                  const isDone = i <= currentIndex && selectedOrder.status !== "cancelled";
                  const Icon = step.icon;
                  return (
                    <div key={step.value} className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isDone ? "bg-green-500/15" : "bg-muted"}`}>
                        <Icon className={`h-4 w-4 ${isDone ? "text-green-600" : "text-muted-foreground"}`} />
                      </div>
                      <span className={`text-sm ${isDone ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                        {step.label}
                      </span>
                      {isDone && <CheckCircle className="h-3.5 w-3.5 text-green-600 ml-auto" />}
                    </div>
                  );
                })}
              </div>

              {/* Customer & Address */}
              <div className="rounded-xl border border-border/50 p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ডেলিভারি তথ্য</h4>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedOrder.customer_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedOrder.customer_phone}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{selectedOrder.shipping_address}, {selectedOrder.city}{selectedOrder.district ? `, ${selectedOrder.district}` : ""}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="bg-muted/30 p-3 rounded-xl text-sm">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">নোট:</p>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}

              {/* Quick status update */}
              <div className="flex items-center gap-2 pt-2 border-t border-border/50 flex-wrap">
                <span className="text-sm text-muted-foreground mr-1">স্ট্যাটাস:</span>
                {deliveryStatuses.map((s) => (
                  <Button
                    key={s.value}
                    size="sm"
                    variant={selectedOrder.status === s.value ? "default" : "outline"}
                    className="text-xs h-7 gap-1"
                    onClick={() => {
                      updateStatus(selectedOrder.id, s.value);
                      setSelectedOrder({ ...selectedOrder, status: s.value });
                    }}
                  >
                    <s.icon className="h-3 w-3" />
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDelivery;
