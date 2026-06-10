import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Truck, Search, ExternalLink, Loader2, Copy, Package, RefreshCw,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const formatBDT = (n: number) =>
  `৳${Math.round(Number(n || 0)).toLocaleString("bn-BD")}`;

const providerInfo: Record<string, { label: string; color: string }> = {
  pathao:    { label: "পাঠাও",     color: "bg-rose-500/10 text-rose-700 border-rose-200" },
  steadfast: { label: "Steadfast", color: "bg-blue-500/10 text-blue-700 border-blue-200" },
  manual:    { label: "ম্যানুয়াল", color: "bg-gray-500/10 text-gray-700 border-gray-200" },
};

const orderStatusInfo: Record<string, { label: string; color: string }> = {
  pending:    { label: "পেন্ডিং",   color: "bg-amber-100 text-amber-700" },
  confirmed:  { label: "নিশ্চিত",   color: "bg-blue-100 text-blue-700" },
  processing: { label: "প্রসেসিং",   color: "bg-purple-100 text-purple-700" },
  shipped:    { label: "শিপড",       color: "bg-indigo-100 text-indigo-700" },
  delivered:  { label: "ডেলিভার্ড",  color: "bg-green-100 text-green-700" },
  cancelled:  { label: "বাতিল",      color: "bg-red-100 text-red-700" },
  returned:   { label: "ফেরত",       color: "bg-orange-100 text-orange-700" },
};

interface Props {
  providerFilter?: string; // if provided, restrict to that provider
}

const CourierShipmentsLog = ({ providerFilter }: Props) => {
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState<string>(providerFilter || "all");

  const { data: shipments, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["courier-shipments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, order_number, status, total, delivery_fee,
          customer_name, customer_phone, city, district,
          courier_provider, courier_tracking_id,
          pathao_consignment_id, pathao_order_status, pathao_tracking_url,
          created_at,
          order_items(vendor_id, product_name, quantity, vendors:vendor_id(shop_name, shop_name_bn, shop_slug))
        `)
        .or("courier_provider.not.is.null,pathao_consignment_id.not.is.null,courier_tracking_id.not.is.null")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []).map((o: any) => {
        // Derive provider when only legacy pathao fields present
        const derivedProvider =
          o.courier_provider ||
          (o.pathao_consignment_id ? "pathao" : null);
        const trackingId =
          o.courier_tracking_id || o.pathao_consignment_id || null;
        const trackingUrl = o.pathao_tracking_url || null;

        // Unique vendor list per shipment
        const vendorMap = new Map<string, any>();
        (o.order_items || []).forEach((it: any) => {
          if (it.vendor_id && !vendorMap.has(it.vendor_id)) {
            vendorMap.set(it.vendor_id, it.vendors || {});
          }
        });
        const vendors = Array.from(vendorMap.entries()).map(([id, v]) => ({ id, ...v }));

        return { ...o, provider: derivedProvider, trackingId, trackingUrl, vendors };
      });
    },
  });

  // ---- Filters ----
  const filtered = useMemo(() => {
    if (!shipments) return [];
    return shipments.filter((s: any) => {
      if (provider !== "all" && s.provider !== provider) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        s.order_number?.toLowerCase().includes(q) ||
        s.customer_name?.toLowerCase().includes(q) ||
        s.customer_phone?.includes(search) ||
        s.trackingId?.toLowerCase().includes(q) ||
        s.vendors?.some((v: any) =>
          v.shop_name?.toLowerCase().includes(q) ||
          v.shop_name_bn?.includes(search) ||
          v.id.includes(search)
        )
      );
    });
  }, [shipments, search, provider]);

  // ---- Per-provider counts ----
  const counts = useMemo(() => {
    const map: Record<string, { count: number; cod: number }> = {};
    (shipments || []).forEach((s: any) => {
      const p = s.provider || "unknown";
      if (!map[p]) map[p] = { count: 0, cod: 0 };
      map[p].count += 1;
      map[p].cod += Number(s.total || 0);
    });
    return map;
  }, [shipments]);

  const copy = (t: string) => { navigator.clipboard.writeText(t); toast({ title: "কপি হয়েছে" }); };

  return (
    <div className="space-y-4">
      {/* Provider stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(counts).map(([key, val]) => {
          const info = providerInfo[key] || { label: key, color: "bg-muted text-foreground" };
          return (
            <Card key={key}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${info.color}`}>
                    {info.label}
                  </span>
                  <Truck className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xl font-bold">{val.count}টি অর্ডার</p>
                <p className="text-[11px] text-muted-foreground">COD: {formatBDT(val.cod)}</p>
              </CardContent>
            </Card>
          );
        })}
        {Object.keys(counts).length === 0 && (
          <Card className="md:col-span-4">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              এখনো কোনো অর্ডার কুরিয়ার API তে পাঠানো হয়নি
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="অর্ডার নং, কাস্টমার, ফোন, ট্র্যাকিং ID, ভেন্ডর..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Select value={provider} onValueChange={setProvider}>
          <SelectTrigger className="w-full sm:w-48 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সকল কুরিয়ার</SelectItem>
            <SelectItem value="pathao">পাঠাও</SelectItem>
            <SelectItem value="steadfast">Steadfast</SelectItem>
            <SelectItem value="manual">ম্যানুয়াল</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">কোনো শিপমেন্ট পাওয়া যায়নি</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>তারিখ</TableHead>
                    <TableHead>অর্ডার</TableHead>
                    <TableHead>কুরিয়ার</TableHead>
                    <TableHead>ট্র্যাকিং ID</TableHead>
                    <TableHead>ভেন্ডর</TableHead>
                    <TableHead>কাস্টমার</TableHead>
                    <TableHead className="text-right">COD</TableHead>
                    <TableHead>অবস্থা</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s: any) => {
                    const pInfo = providerInfo[s.provider] || { label: s.provider || "—", color: "bg-muted" };
                    const oInfo = orderStatusInfo[s.status] || { label: s.status, color: "bg-muted" };
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {new Date(s.created_at).toLocaleDateString("bn-BD")}
                          <div className="text-[10px] text-muted-foreground">
                            {new Date(s.created_at).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono font-semibold">{s.order_number}</TableCell>
                        <TableCell>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${pInfo.color}`}>
                            {pInfo.label}
                          </span>
                          {s.pathao_order_status && (
                            <div className="text-[10px] text-muted-foreground mt-0.5">{s.pathao_order_status}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {s.trackingId ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => copy(s.trackingId)} className="font-mono hover:text-primary">
                                {s.trackingId}
                              </button>
                              <Copy className="h-3 w-3 text-muted-foreground" />
                              {s.trackingUrl && (
                                <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-primary">
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {s.vendors.length === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <div className="space-y-0.5">
                              {s.vendors.map((v: any) => (
                                <div key={v.id}>
                                  <div className="font-medium">{v.shop_name_bn || v.shop_name || "Unknown"}</div>
                                  <button onClick={() => copy(v.id)} className="text-[10px] text-muted-foreground font-mono hover:text-primary">
                                    ID: {v.id.slice(0, 8)}…
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-medium">{s.customer_name}</div>
                          <div className="text-[10px] text-muted-foreground">{s.customer_phone}</div>
                          <div className="text-[10px] text-muted-foreground">{s.district || s.city}</div>
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold">{formatBDT(s.total)}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${oInfo.color} border-0`}>{oInfo.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground text-right">
        সর্বশেষ ৫০০টি শিপমেন্ট দেখানো হচ্ছে · মোট: {filtered.length}টি
      </p>
    </div>
  );
};

export default CourierShipmentsLog;
