import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search, Eye, Package, ShoppingCart, Clock, CheckCircle,
  Truck, XCircle, MapPin, Phone, Mail, CreditCard, FileText, User
} from "lucide-react";

interface Order {
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
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
}

const statusOptions = [
  { value: "pending", label: "পেন্ডিং", icon: Clock, color: "bg-primary/15 text-primary" },
  { value: "processing", label: "প্রসেসিং", icon: Package, color: "bg-secondary/15 text-secondary" },
  { value: "shipped", label: "শিপড", icon: Truck, color: "bg-accent/15 text-accent" },
  { value: "delivered", label: "ডেলিভারড", icon: CheckCircle, color: "bg-secondary/15 text-secondary" },
  { value: "cancelled", label: "বাতিল", icon: XCircle, color: "bg-destructive/15 text-destructive" },
];

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const { toast } = useToast();

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "স্ট্যাটাস আপডেট হয়েছে" });
      fetchOrders();
    }
  };

  const viewOrder = async (order: Order) => {
    setSelectedOrder(order);
    const { data } = await supabase.from("order_items").select("*").eq("order_id", order.id);
    setOrderItems(data || []);
  };

  const getStatusBadge = (status: string) => {
    const s = statusOptions.find((o) => o.value === status);
    const Icon = s?.icon || Clock;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s?.color || "bg-muted text-muted-foreground"}`}>
        <Icon className="h-3 w-3" />
        {s?.label || status}
      </span>
    );
  };

  const filtered = orders.filter((o) => {
    const matchSearch = o.order_number.includes(search) || o.customer_name.includes(search) || o.customer_phone.includes(search);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const processingCount = orders.filter((o) => o.status === "processing").length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="animate-spin h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full" />
      <p className="text-sm text-muted-foreground">অর্ডার লোড হচ্ছে...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border/50 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xl font-bold">{orders.length}</p>
            <p className="text-xs text-muted-foreground">মোট অর্ডার</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border/50 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xl font-bold">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">পেন্ডিং</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border/50 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
            <Package className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <p className="text-xl font-bold">{processingCount}</p>
            <p className="text-xs text-muted-foreground">প্রসেসিং</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border/50 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-xl font-bold">৳{totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">মোট আয়</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="অর্ডার/কাস্টমার খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সকল স্ট্যাটাস</SelectItem>
            {statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} টি অর্ডার দেখানো হচ্ছে</p>

      {/* Orders Table */}
      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border/50">
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">অর্ডার</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">কাস্টমার</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">পেমেন্ট</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">মোট</th>
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
                      <div>
                        <p className="font-medium">{o.customer_name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />{o.customer_phone}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="text-xs bg-muted px-2 py-1 rounded-md font-medium">{o.payment_method === "cod" ? "ক্যাশ অন ডেলিভারি" : o.payment_method}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-foreground">৳{Number(o.total).toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                        <SelectTrigger className="h-auto w-auto border-0 p-0 shadow-none focus:ring-0 [&>svg]:ml-1">
                          {getStatusBadge(o.status)}
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((s) => (
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" onClick={() => viewOrder(o)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">কোনো অর্ডার পাওয়া যায়নি</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="block">অর্ডার #{selectedOrder?.order_number}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {selectedOrder && new Date(selectedOrder.created_at).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-5">
              {/* Status */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <span className="text-sm text-muted-foreground">বর্তমান স্ট্যাটাস</span>
                {getStatusBadge(selectedOrder.status)}
              </div>

              {/* Customer Info */}
              <div className="rounded-xl border border-border/50 divide-y divide-border/30">
                <div className="p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">গ্রাহক তথ্য</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedOrder.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedOrder.customer_phone}</span>
                    </div>
                    {selectedOrder.customer_email && (
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedOrder.customer_email}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2 sm:col-span-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{selectedOrder.shipping_address}, {selectedOrder.city}{selectedOrder.district ? `, ${selectedOrder.district}` : ""}</span>
                    </div>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">নোট</h4>
                    <p className="text-sm bg-muted/30 p-2 rounded-lg">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 pt-4 pb-2">পণ্য তালিকা</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-y border-border/30">
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground">পণ্য</th>
                      <th className="text-center py-2.5 px-4 text-xs font-semibold text-muted-foreground">পরিমাণ</th>
                      <th className="text-right py-2.5 px-4 text-xs font-semibold text-muted-foreground">দাম</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {orderItems.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-4 font-medium">{item.product_name}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="bg-muted px-2 py-0.5 rounded-md text-xs font-semibold">{item.quantity}</span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold">৳{(item.price * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="rounded-xl bg-muted/30 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">সাবটোটাল</span>
                  <span>৳{Number(selectedOrder.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ডেলিভারি চার্জ</span>
                  <span>৳{Number(selectedOrder.shipping_cost).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border/50">
                  <span className="font-bold text-base">সর্বমোট</span>
                  <span className="font-bold text-base text-primary">৳{Number(selectedOrder.total).toLocaleString()}</span>
                </div>
              </div>

              {/* Status Update */}
              <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                <span className="text-sm text-muted-foreground">স্ট্যাটাস পরিবর্তন:</span>
                <Select value={selectedOrder.status} onValueChange={(v) => { updateStatus(selectedOrder.id, v); setSelectedOrder({ ...selectedOrder, status: v }); }}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        <span className="flex items-center gap-2"><s.icon className="h-3.5 w-3.5" />{s.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
