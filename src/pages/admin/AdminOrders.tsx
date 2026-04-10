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
  Search, Eye, Package, ShoppingCart, Clock, CheckCircle,
  Truck, XCircle, MapPin, Phone, Mail, CreditCard, FileText, User,
  Send, RefreshCw, ExternalLink, Copy, Check, Loader2, Printer
} from "lucide-react";
import InvoicePrint from "@/components/admin/InvoicePrint";

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
  pathao_consignment_id: string | null;
  pathao_order_status: string | null;
  pathao_tracking_url: string | null;
  delivery_fee: number | null;
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [pathaoLoading, setPathaoLoading] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState<"shop" | "pathao">("shop");
  const { toast } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Failed to load orders", error);
      setError(getErrorMessage(error, "অর্ডার লোড করা যায়নি।"));
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
      toast({ title: "স্ট্যাটাস আপডেট হয়েছে" });
      void fetchOrders();
    }
  };

  const viewOrder = async (order: Order) => {
    setSelectedOrder(order);
    const { data, error } = await supabase.from("order_items").select("*").eq("order_id", order.id);
    if (error) {
      toast({ title: "ত্রুটি", description: getErrorMessage(error, "অর্ডারের বিস্তারিত লোড করা যায়নি।"), variant: "destructive" });
      setOrderItems([]);
      return;
    }
    setOrderItems(data || []);
  };

  const sendToPathao = async (order: Order) => {
    setPathaoLoading(true);
    try {
      const pathaoPayload = {
        order_id: order.id,
        store_id: 1,
        merchant_order_id: order.order_number,
        recipient_name: order.customer_name,
        recipient_phone: order.customer_phone,
        recipient_address: order.shipping_address,
        recipient_city: 1,
        recipient_zone: 1,
        delivery_type: 48,
        item_type: 2,
        special_instruction: order.notes || "",
        item_quantity: orderItems.reduce((s, i) => s + i.quantity, 0) || 1,
        item_weight: 0.5,
        amount_to_collect: Number(order.total),
        item_description: orderItems.map(i => `${i.product_name} x${i.quantity}`).join(", ") || order.order_number,
      };

      const { data, error } = await supabase.functions.invoke("pathao?action=create-order", {
        body: pathaoPayload,
      });

      if (error) throw error;

      const consignmentId = data?.data?.consignment_id;
      if (consignmentId) {
        const updatedOrder = {
          ...order,
          pathao_consignment_id: String(consignmentId),
          pathao_order_status: data?.data?.order_status || "Pending",
          pathao_tracking_url: `https://merchant.pathao.com/tracking?consignment_id=${consignmentId}`,
        };
        setSelectedOrder(updatedOrder);
        toast({ title: "পাঠাও কুরিয়ারে সফলভাবে পাঠানো হয়েছে!", description: `Consignment ID: ${consignmentId}` });
      } else {
        toast({ title: "পাঠাও কুরিয়ারে পাঠানো হয়েছে" });
      }

      void fetchOrders();
    } catch (err: any) {
      console.error("Pathao send error:", err);
      toast({ title: "পাঠাও ত্রুটি", description: err.message || "কুরিয়ারে পাঠানো যায়নি", variant: "destructive" });
    } finally {
      setPathaoLoading(false);
    }
  };

  const refreshTracking = async (order: Order) => {
    if (!order.pathao_consignment_id) return;
    setTrackingLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        `pathao?action=track-order&consignment_id=${order.pathao_consignment_id}`,
        { method: "GET" }
      );
      if (error) throw error;

      const newStatus = data?.data?.order_status;
      if (newStatus) {
        setSelectedOrder({ ...order, pathao_order_status: newStatus });
        toast({ title: "ট্র্যাকিং আপডেট হয়েছে", description: `স্ট্যাটাস: ${newStatus}` });
      }
      void fetchOrders();
    } catch (err: any) {
      toast({ title: "ট্র্যাকিং ত্রুটি", description: err.message, variant: "destructive" });
    } finally {
      setTrackingLoading(false);
    }
  };

  const copyOrderNumber = async (orderNumber: string) => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopiedId(orderNumber);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
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
    const matchSearch = o.order_number.toLowerCase().includes(search.toLowerCase()) || o.customer_name.includes(search) || o.customer_phone.includes(search);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const processingCount = orders.filter((o) => o.status === "processing").length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);

  if (loading) return <AdminPageState loading message="অর্ডার লোড হচ্ছে..." />;
  if (error) return <AdminPageState title="অর্ডার লোড করা যায়নি" message={error} onRetry={fetchOrders} />;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-card rounded-xl border border-border/50 p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-bold truncate">{orders.length}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">মোট অর্ডার</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border/50 p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-bold">{pendingCount}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">পেন্ডিং</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border/50 p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-bold">{processingCount}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">প্রসেসিং</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border/50 p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-bold truncate">৳{totalRevenue.toLocaleString()}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">মোট আয়</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="অর্ডার/কাস্টমার খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সকল স্ট্যাটাস</SelectItem>
            {statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} টি অর্ডার দেখানো হচ্ছে</p>

      {/* Mobile Order Cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((o) => (
          <Card key={o.id} className="border-border/50 overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-primary text-sm">#{o.order_number}</span>
                      <button onClick={() => copyOrderNumber(o.order_number)} className="h-5 w-5 flex items-center justify-center text-muted-foreground">
                        {copiedId === o.order_number ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("bn-BD", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => viewOrder(o)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{o.customer_name}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />{o.customer_phone}
                  </p>
                </div>
                <span className="font-bold text-sm">৳{Number(o.total).toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between">
                <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                  <SelectTrigger className="h-auto w-auto border-0 p-0 shadow-none focus:ring-0 [&>svg]:ml-1">
                    {getStatusBadge(o.status)}
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        <span className="flex items-center gap-2"><s.icon className="h-3.5 w-3.5" />{s.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-[10px] bg-muted px-2 py-0.5 rounded-md font-medium text-muted-foreground">
                  {o.payment_method === "cod" ? "COD" : o.payment_method}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">কোনো অর্ডার পাওয়া যায়নি</p>
          </div>
        )}
      </div>

      {/* Desktop Orders Table */}
      <Card className="border-border/50 overflow-hidden hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border/50">
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">অর্ডার</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">কাস্টমার</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">পেমেন্ট</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">মোট</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">স্ট্যাটাস</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">কুরিয়ার</th>
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
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-primary">#{o.order_number}</span>
                          <button onClick={() => copyOrderNumber(o.order_number)} className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                            {copiedId === o.order_number ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{o.customer_name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{o.customer_phone}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
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
                              <span className="flex items-center gap-2"><s.icon className="h-3.5 w-3.5" />{s.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      {o.pathao_consignment_id ? (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium flex items-center gap-1 w-fit">
                          <Truck className="h-3 w-3" />
                          {o.pathao_order_status || "Pending"}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
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
        <DialogContent className="max-w-xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span>অর্ডার #{selectedOrder?.order_number}</span>
                  {selectedOrder && (
                    <button
                      onClick={() => copyOrderNumber(selectedOrder.order_number)}
                      className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                    >
                      {copiedId === selectedOrder.order_number ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
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

              {/* Pathao Courier Section */}
              <div className="rounded-xl border border-border/50 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  পাঠাও কুরিয়ার
                </h4>

                {selectedOrder.pathao_consignment_id ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Consignment ID: {selectedOrder.pathao_consignment_id}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          স্ট্যাটাস: <span className="font-semibold text-primary">{selectedOrder.pathao_order_status || "Pending"}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refreshTracking(selectedOrder)}
                          disabled={trackingLoading}
                          className="gap-1"
                        >
                          {trackingLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                          রিফ্রেশ
                        </Button>
                        {selectedOrder.pathao_tracking_url && (
                          <Button variant="outline" size="sm" asChild className="gap-1">
                            <a href={selectedOrder.pathao_tracking_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                              ট্র্যাক
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-sm text-muted-foreground mb-3">এই অর্ডারটি এখনও পাঠাও কুরিয়ারে পাঠানো হয়নি</p>
                    <Button
                      onClick={() => sendToPathao(selectedOrder)}
                      disabled={pathaoLoading}
                      className="gap-2"
                      size="sm"
                    >
                      {pathaoLoading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />পাঠানো হচ্ছে...</>
                      ) : (
                        <><Send className="h-4 w-4" />পাঠাও কুরিয়ারে পাঠান</>
                      )}
                    </Button>
                  </div>
                )}
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
                {selectedOrder.delivery_fee != null && Number(selectedOrder.delivery_fee) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">পাঠাও ডেলিভারি ফি</span>
                    <span>৳{Number(selectedOrder.delivery_fee).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border/50">
                  <span className="font-bold text-base">সর্বমোট</span>
                  <span className="font-bold text-base text-primary">৳{Number(selectedOrder.total).toLocaleString()}</span>
                </div>
              </div>

              {/* Invoice Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => { setInvoiceType("shop"); setInvoiceOpen(true); }}
                >
                  <Printer className="h-4 w-4" /> শপ ইনভয়েস প্রিন্ট
                </Button>
                {selectedOrder.pathao_consignment_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => { setInvoiceType("pathao"); setInvoiceOpen(true); }}
                  >
                    <Truck className="h-4 w-4" /> পাঠাও ইনভয়েস প্রিন্ট
                  </Button>
                )}
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
      {selectedOrder && (
        <InvoicePrint
          order={selectedOrder}
          items={orderItems}
          open={invoiceOpen}
          onClose={() => setInvoiceOpen(false)}
          type={invoiceType}
        />
      )}
    </div>
  );
};

export default AdminOrders;
