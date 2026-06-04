import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Store, Package, ShoppingCart, Phone, MapPin, ExternalLink, TrendingUp, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

const STATUS_LABELS_BN: Record<string, string> = {
  pending: "পেন্ডিং",
  processing: "প্রসেসিং",
  shipped: "শিপড",
  delivered: "ডেলিভারড",
  cancelled: "বাতিল",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  processing: "bg-blue-100 text-blue-700 border-blue-200",
  shipped: "bg-purple-100 text-purple-700 border-purple-200",
  delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-700 border-rose-200",
};

interface VendorRow {
  id: string;
  shop_name: string;
  shop_name_bn: string;
  shop_slug: string;
  logo_url: string | null;
  phone: string | null;
  owner_name: string | null;
  district: string | null;
  division: string | null;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  vendor_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  price: number;
  commission_amount: number;
  vendor_payout_amount: number;
}

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  district: string | null;
  total: number;
  status: string;
  payment_method: string;
  created_at: string;
}

const AdminVendorOrders = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // 1. Approved vendors
  const { data: vendors = [], isLoading: vLoading } = useQuery({
    queryKey: ["admin-vendor-orders-vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors" as any)
        .select("id,shop_name,shop_name_bn,shop_slug,logo_url,phone,owner_name,district,division")
        .eq("status", "approved")
        .order("shop_name_bn");
      if (error) throw error;
      return (data as any) as VendorRow[];
    },
  });

  // 2. All order items (grouped client-side by vendor) — limit 1000
  const { data: items = [], isLoading: iLoading } = useQuery({
    queryKey: ["admin-vendor-orders-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("id,order_id,vendor_id,product_id,product_name,quantity,price,commission_amount,vendor_payout_amount")
        .not("vendor_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data as any) as OrderItemRow[];
    },
  });

  // 3. Orders for the items above
  const orderIds = useMemo(() => Array.from(new Set(items.map((i) => i.order_id))), [items]);

  const { data: orders = [], isLoading: oLoading } = useQuery({
    queryKey: ["admin-vendor-orders-orders", orderIds.length, orderIds.slice(0, 5).join(",")],
    enabled: orderIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,order_number,customer_name,customer_phone,shipping_address,city,district,total,status,payment_method,created_at")
        .in("id", orderIds);
      if (error) throw error;
      return (data as any) as OrderRow[];
    },
  });

  const ordersById = useMemo(() => {
    const map: Record<string, OrderRow> = {};
    orders.forEach((o) => { map[o.id] = o; });
    return map;
  }, [orders]);

  // Group items by vendor
  const grouped = useMemo(() => {
    const map = new Map<string, { vendor: VendorRow; orders: Map<string, OrderItemRow[]> }>();
    vendors.forEach((v) => map.set(v.id, { vendor: v, orders: new Map() }));
    items.forEach((it) => {
      const bucket = map.get(it.vendor_id);
      if (!bucket) return;
      const o = ordersById[it.order_id];
      if (!o) return;
      if (statusFilter !== "all" && o.status !== statusFilter) return;
      if (search) {
        const q = search.toLowerCase();
        const hit =
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.toLowerCase().includes(q) ||
          bucket.vendor.shop_name_bn.toLowerCase().includes(q) ||
          bucket.vendor.shop_name.toLowerCase().includes(q);
        if (!hit) return;
      }
      const arr = bucket.orders.get(it.order_id) || [];
      arr.push(it);
      bucket.orders.set(it.order_id, arr);
    });
    return Array.from(map.values()).filter((b) => b.orders.size > 0);
  }, [vendors, items, ordersById, statusFilter, search]);

  const loading = vLoading || iLoading || oLoading;

  // Totals
  const stats = useMemo(() => {
    let totalOrders = 0;
    let totalRevenue = 0;
    let totalPayout = 0;
    let totalCommission = 0;
    grouped.forEach((b) => {
      totalOrders += b.orders.size;
      b.orders.forEach((rows) => {
        rows.forEach((it) => {
          totalRevenue += Number(it.price) * Number(it.quantity);
          totalPayout += Number(it.vendor_payout_amount) || 0;
          totalCommission += Number(it.commission_amount) || 0;
        });
      });
    });
    return { totalOrders, totalRevenue, totalPayout, totalCommission };
  }, [grouped]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">ভেন্ডর অনুযায়ী অর্ডার</h1>
        <p className="text-sm text-muted-foreground mt-1">প্রতিটি বিক্রেতার অর্ডার আলাদা করে দেখুন</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground">মোট ভেন্ডর</p><p className="text-2xl font-bold">{grouped.length}</p></div>
            <Store className="h-8 w-8 text-primary/30" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground">মোট অর্ডার</p><p className="text-2xl font-bold">{stats.totalOrders}</p></div>
            <ShoppingCart className="h-8 w-8 text-primary/30" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground">ভেন্ডর পেআউট</p><p className="text-2xl font-bold">৳{stats.totalPayout.toLocaleString()}</p></div>
            <DollarSign className="h-8 w-8 text-emerald-500/40" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground">কমিশন</p><p className="text-2xl font-bold">৳{stats.totalCommission.toLocaleString()}</p></div>
            <TrendingUp className="h-8 w-8 text-primary/30" />
          </div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <Card><CardContent className="p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="অর্ডার নম্বর, গ্রাহক বা দোকান দিয়ে খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব স্ট্যাটাস</SelectItem>
            {Object.entries(STATUS_LABELS_BN).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </CardContent></Card>

      {/* Vendor groups */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>
      ) : grouped.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          <Package className="mx-auto h-12 w-12 opacity-40 mb-3" />
          কোনো ভেন্ডর অর্ডার পাওয়া যায়নি
        </CardContent></Card>
      ) : (
        <Accordion type="multiple" className="space-y-3">
          {grouped.map(({ vendor, orders: oMap }) => {
            const orderArr = Array.from(oMap.entries());
            const vendorRevenue = orderArr.reduce((s, [, rows]) => s + rows.reduce((ss, it) => ss + Number(it.price) * Number(it.quantity), 0), 0);
            const vendorPayout = orderArr.reduce((s, [, rows]) => s + rows.reduce((ss, it) => ss + Number(it.vendor_payout_amount || 0), 0), 0);

            return (
              <AccordionItem key={vendor.id} value={vendor.id} className="border rounded-2xl bg-card overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40">
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                      {vendor.logo_url ? <img src={vendor.logo_url} alt="" className="h-full w-full object-cover" /> : <Store className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground truncate">{vendor.shop_name_bn}</div>
                      <div className="text-xs text-muted-foreground truncate">{vendor.owner_name} • {vendor.district || vendor.division}</div>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-xs">
                      <div className="text-center"><div className="font-bold text-foreground">{oMap.size}</div><div className="text-muted-foreground">অর্ডার</div></div>
                      <div className="text-center"><div className="font-bold text-emerald-600">৳{vendorPayout.toLocaleString()}</div><div className="text-muted-foreground">পেআউট</div></div>
                      <div className="text-center"><div className="font-bold text-primary">৳{vendorRevenue.toLocaleString()}</div><div className="text-muted-foreground">মোট</div></div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-2 mt-2">
                    {orderArr.map(([oid, rows]) => {
                      const o = ordersById[oid];
                      if (!o) return null;
                      const lineTotal = rows.reduce((s, it) => s + Number(it.price) * Number(it.quantity), 0);
                      const payout = rows.reduce((s, it) => s + Number(it.vendor_payout_amount || 0), 0);
                      return (
                        <div key={oid} className="rounded-xl border bg-background p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <Link to={`/admin/orders?order=${o.order_number}`} className="font-bold text-primary hover:underline inline-flex items-center gap-1">
                                {o.order_number} <ExternalLink className="h-3 w-3" />
                              </Link>
                              <Badge variant="outline" className={STATUS_COLOR[o.status] || ""}>{STATUS_LABELS_BN[o.status] || o.status}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("bn-BD")}</div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div className="text-muted-foreground"><span className="font-medium text-foreground">{o.customer_name}</span> • <Phone className="inline h-3 w-3" /> {o.customer_phone}</div>
                            <div className="text-muted-foreground flex items-start gap-1"><MapPin className="h-3 w-3 mt-0.5 shrink-0" /> {o.shipping_address}, {o.city}</div>
                          </div>
                          <div className="mt-2 border-t pt-2 space-y-1">
                            {rows.map((it) => (
                              <div key={it.id} className="flex items-center justify-between text-sm">
                                <span className="text-foreground">{it.product_name} <span className="text-muted-foreground">× {it.quantity}</span></span>
                                <span className="font-semibold">৳{(Number(it.price) * Number(it.quantity)).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 flex justify-between text-xs">
                            <span className="text-muted-foreground">এই বিক্রেতার অংশ: <span className="font-semibold text-foreground">৳{lineTotal.toLocaleString()}</span></span>
                            <span className="text-muted-foreground">পেআউট: <span className="font-semibold text-emerald-600">৳{payout.toLocaleString()}</span></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
};

export default AdminVendorOrders;
