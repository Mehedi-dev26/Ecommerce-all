import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye, Package } from "lucide-react";

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
  { value: "pending", label: "পেন্ডিং", color: "bg-yellow-100 text-yellow-800" },
  { value: "processing", label: "প্রসেসিং", color: "bg-blue-100 text-blue-800" },
  { value: "shipped", label: "শিপড", color: "bg-purple-100 text-purple-800" },
  { value: "delivered", label: "ডেলিভারড", color: "bg-green-100 text-green-800" },
  { value: "cancelled", label: "বাতিল", color: "bg-red-100 text-red-800" },
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
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s?.color || "bg-gray-100"}`}>{s?.label || status}</span>;
  };

  const filtered = orders.filter((o) => {
    const matchSearch = o.order_number.includes(search) || o.customer_name.includes(search) || o.customer_phone.includes(search);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">অর্ডার ম্যানেজমেন্ট</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="অর্ডার/কাস্টমার খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সকল স্ট্যাটাস</SelectItem>
            {statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4">অর্ডার #</th>
                  <th className="text-left py-3 px-4">কাস্টমার</th>
                  <th className="text-left py-3 px-4 hidden md:table-cell">ফোন</th>
                  <th className="text-left py-3 px-4">মোট</th>
                  <th className="text-left py-3 px-4">স্ট্যাটাস</th>
                  <th className="text-left py-3 px-4 hidden lg:table-cell">তারিখ</th>
                  <th className="text-right py-3 px-4">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium">{o.order_number}</td>
                    <td className="py-3 px-4">{o.customer_name}</td>
                    <td className="py-3 px-4 hidden md:table-cell">{o.customer_phone}</td>
                    <td className="py-3 px-4 font-semibold">৳{Number(o.total).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                        <SelectTrigger className="h-8 w-[130px]">{getStatusBadge(o.status)}</SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("bn-BD")}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="icon" onClick={() => viewOrder(o)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">কোনো অর্ডার পাওয়া যায়নি</p>}
          </div>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              অর্ডার #{selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">কাস্টমার:</span><p className="font-medium">{selectedOrder.customer_name}</p></div>
                <div><span className="text-muted-foreground">ফোন:</span><p className="font-medium">{selectedOrder.customer_phone}</p></div>
                <div className="col-span-2"><span className="text-muted-foreground">ঠিকানা:</span><p className="font-medium">{selectedOrder.shipping_address}, {selectedOrder.city}</p></div>
                {selectedOrder.notes && <div className="col-span-2"><span className="text-muted-foreground">নোট:</span><p>{selectedOrder.notes}</p></div>}
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-muted/50 border-b"><th className="text-left py-2 px-3">পণ্য</th><th className="text-center py-2 px-3">পরিমাণ</th><th className="text-right py-2 px-3">দাম</th></tr></thead>
                  <tbody>
                    {orderItems.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-2 px-3">{item.product_name}</td>
                        <td className="py-2 px-3 text-center">{item.quantity}</td>
                        <td className="py-2 px-3 text-right">৳{(item.price * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1 text-right">
                <p>সাবটোটাল: ৳{Number(selectedOrder.subtotal).toLocaleString()}</p>
                <p>ডেলিভারি: ৳{Number(selectedOrder.shipping_cost).toLocaleString()}</p>
                <p className="font-bold text-lg">মোট: ৳{Number(selectedOrder.total).toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
