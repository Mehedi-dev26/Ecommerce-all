import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import {
  Loader2, Banknote, Wallet, TrendingUp, Search, CheckCircle2, XCircle,
  Clock, ArrowUpRight, Copy, Building2, Smartphone,
} from "lucide-react";

const formatBDT = (n: number) =>
  `৳${Math.round(Number(n || 0)).toLocaleString("bn-BD")}`;

const statusInfo: Record<string, { label: string; variant: any; icon: any; color: string }> = {
  pending:  { label: "অপেক্ষমাণ",   variant: "secondary",  icon: Clock,         color: "text-amber-600"  },
  approved: { label: "অনুমোদিত",    variant: "default",    icon: CheckCircle2,  color: "text-blue-600"   },
  paid:     { label: "পরিশোধিত",     variant: "default",    icon: CheckCircle2,  color: "text-green-700"  },
  rejected: { label: "প্রত্যাখ্যাত", variant: "destructive", icon: XCircle,       color: "text-red-600"    },
};

const methodLabel: Record<string, string> = {
  bkash: "bKash", nagad: "Nagad", rocket: "Rocket", bank: "ব্যাংক",
};

const AdminVendorWithdrawals = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState("approved");
  const [txnRef, setTxnRef] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);

  // ---- Withdraw requests ----
  const { data: payouts, isLoading: payoutsLoading } = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_payouts" as any)
        .select("*, vendors:vendor_id(id, shop_name, shop_name_bn, shop_slug, owner_name, phone, email)")
        .order("requested_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  // ---- Vendor income aggregation ----
  const { data: vendorIncomes, isLoading: incomeLoading } = useQuery({
    queryKey: ["admin-vendor-incomes"],
    queryFn: async () => {
      const [vendorsRes, itemsRes, payoutsRes, settingsRes] = await Promise.all([
        supabase.from("vendors" as any).select("id, shop_name, shop_name_bn, shop_slug, owner_name, phone, email, status, commission_percent").eq("status", "approved"),
        supabase.from("order_items" as any).select("vendor_id, vendor_payout_amount, commission_amount, quantity, price, orders:order_id(status)"),
        supabase.from("vendor_payouts" as any).select("vendor_id, amount, status"),
        supabase.from("vendor_settings" as any).select("*"),
      ]);

      const vendors = (vendorsRes.data || []) as any[];
      const items   = (itemsRes.data   || []) as any[];
      const ps      = (payoutsRes.data || []) as any[];
      const sets    = (settingsRes.data || []) as any[];

      return vendors.map((v) => {
        const vItems = items.filter((it) => it.vendor_id === v.id);
        const vPay   = ps.filter((p) => p.vendor_id === v.id);
        const setting = sets.find((s) => s.vendor_id === v.id);

        let earned = 0, pending = 0, totalSales = 0, totalCommission = 0, orderCount = 0;
        vItems.forEach((it) => {
          const lineTotal = Number(it.price || 0) * Number(it.quantity || 0);
          const status = it.orders?.status;
          if (status === "delivered") {
            earned += Number(it.vendor_payout_amount || 0);
            totalSales += lineTotal;
            totalCommission += Number(it.commission_amount || 0);
            orderCount += 1;
          } else if (status !== "cancelled") {
            pending += Number(it.vendor_payout_amount || 0);
          }
        });

        const withdrawn = vPay.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount || 0), 0);
        const pendingWithdraw = vPay.filter((p) => p.status === "pending" || p.status === "approved").reduce((s, p) => s + Number(p.amount || 0), 0);
        const balance = earned - withdrawn - pendingWithdraw;

        return {
          vendor: v,
          setting,
          totalSales,
          totalCommission,
          orderCount,
          earned,
          pendingEarn: pending,
          withdrawn,
          pendingWithdraw,
          balance,
        };
      });
    },
  });

  // ---- Filters ----
  const filteredPayouts = useMemo(() => {
    if (!payouts) return [];
    return payouts.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      const v = p.vendors || {};
      return (
        v.shop_name?.toLowerCase().includes(q) ||
        v.shop_name_bn?.includes(search) ||
        v.shop_slug?.toLowerCase().includes(q) ||
        v.owner_name?.toLowerCase().includes(q) ||
        v.phone?.includes(search) ||
        p.payout_account?.toLowerCase().includes(q)
      );
    });
  }, [payouts, search, statusFilter]);

  const filteredIncomes = useMemo(() => {
    if (!vendorIncomes) return [];
    if (!search) return vendorIncomes;
    const q = search.toLowerCase();
    return vendorIncomes.filter((r: any) =>
      r.vendor.shop_name?.toLowerCase().includes(q) ||
      r.vendor.shop_name_bn?.includes(search) ||
      r.vendor.shop_slug?.toLowerCase().includes(q) ||
      r.vendor.owner_name?.toLowerCase().includes(q) ||
      r.vendor.phone?.includes(search) ||
      r.vendor.id.includes(search)
    );
  }, [vendorIncomes, search]);

  // ---- Stats ----
  const stats = useMemo(() => {
    const pendingCount = payouts?.filter((p) => p.status === "pending").length || 0;
    const pendingAmt = payouts?.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount || 0), 0) || 0;
    const paidAmt = payouts?.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount || 0), 0) || 0;
    const totalBalance = vendorIncomes?.reduce((s: number, r: any) => s + r.balance, 0) || 0;
    const totalEarned  = vendorIncomes?.reduce((s: number, r: any) => s + r.earned, 0) || 0;
    return { pendingCount, pendingAmt, paidAmt, totalBalance, totalEarned };
  }, [payouts, vendorIncomes]);

  // ---- Update handler ----
  const openEdit = (p: any) => {
    setEditing(p);
    setEditStatus(p.status === "pending" ? "approved" : p.status);
    setTxnRef(p.transaction_ref || "");
    setAdminNote(p.admin_notes || "");
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (editStatus === "paid" && !txnRef.trim()) {
      toast({ title: "ত্রুটি", description: "ট্রানজেকশন রেফারেন্স আবশ্যক", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const updates: any = {
        status: editStatus,
        admin_notes: adminNote || null,
        transaction_ref: txnRef || null,
        processed_by: user?.id,
        processed_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("vendor_payouts" as any)
        .update(updates)
        .eq("id", editing.id);
      if (error) throw error;
      toast({ title: "✅ আপডেট হয়েছে" });
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-payouts"] });
      qc.invalidateQueries({ queryKey: ["admin-vendor-incomes"] });
    } catch (e: any) {
      toast({ title: "ব্যর্থ", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "কপি হয়েছে" });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">ভেন্ডর উত্তোলন</h1>
        <p className="text-muted-foreground text-sm mt-1">
          সকল ভেন্ডরের আয় ও উত্তোলনের অনুরোধ পরিচালনা
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Clock} label="অপেক্ষমাণ অনুরোধ" value={`${stats.pendingCount}টি`} sub={formatBDT(stats.pendingAmt)} color="text-amber-600" />
        <StatCard icon={Wallet} label="মোট ব্যালেন্স" value={formatBDT(stats.totalBalance)} sub="সকল ভেন্ডর" color="text-green-700" />
        <StatCard icon={TrendingUp} label="মোট প্রদেয় আয়" value={formatBDT(stats.totalEarned)} sub="ডেলিভার্ড অর্ডার" color="text-blue-600" />
        <StatCard icon={ArrowUpRight} label="মোট পরিশোধিত" value={formatBDT(stats.paidAmt)} sub="অল-টাইম" color="text-foreground" />
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
          <TabsList>
            <TabsTrigger value="requests">উত্তোলনের অনুরোধ</TabsTrigger>
            <TabsTrigger value="income">ভেন্ডর আয় ও ব্যালেন্স</TabsTrigger>
          </TabsList>

          <div className="flex gap-2 flex-1 sm:max-w-md">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="দোকান, মালিক, ফোন, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
        </div>

        {/* Withdraw Requests */}
        <TabsContent value="requests" className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {(["all", "pending", "approved", "paid", "rejected"] as const).map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(s)}
                className="h-8"
              >
                {s === "all" ? "সব" : statusInfo[s]?.label}
              </Button>
            ))}
          </div>

          <Card>
            <CardContent className="p-0">
              {payoutsLoading ? (
                <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
              ) : filteredPayouts.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Banknote className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">কোনো অনুরোধ নেই</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>তারিখ</TableHead>
                        <TableHead>ভেন্ডর</TableHead>
                        <TableHead>পদ্ধতি</TableHead>
                        <TableHead>অ্যাকাউন্ট</TableHead>
                        <TableHead className="text-right">পরিমাণ</TableHead>
                        <TableHead>অবস্থা</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayouts.map((p: any) => {
                        const st = statusInfo[p.status] || statusInfo.pending;
                        const v = p.vendors || {};
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="text-xs whitespace-nowrap">
                              {new Date(p.requested_at).toLocaleDateString("bn-BD")}
                              <div className="text-[10px] text-muted-foreground">
                                {new Date(p.requested_at).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="font-semibold">{v.shop_name_bn || v.shop_name}</div>
                              <div className="text-[10px] text-muted-foreground">{v.owner_name} · {v.phone}</div>
                            </TableCell>
                            <TableCell className="text-xs uppercase font-medium">
                              {methodLabel[p.method] || p.method}
                            </TableCell>
                            <TableCell className="text-xs">
                              <button onClick={() => copy(p.payout_account)} className="flex items-center gap-1 hover:text-primary">
                                {p.payout_account} <Copy className="h-3 w-3" />
                              </button>
                            </TableCell>
                            <TableCell className="text-right font-bold">{formatBDT(p.amount)}</TableCell>
                            <TableCell>
                              <Badge variant={st.variant} className="text-[10px] gap-1">
                                <st.icon className="h-3 w-3" /> {st.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                                পরিচালনা
                              </Button>
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
        </TabsContent>

        {/* Vendor Income */}
        <TabsContent value="income">
          <Card>
            <CardContent className="p-0">
              {incomeLoading ? (
                <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
              ) : filteredIncomes.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">কোনো ভেন্ডর নেই</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ভেন্ডর</TableHead>
                        <TableHead className="text-right">অর্ডার</TableHead>
                        <TableHead className="text-right">মোট বিক্রি</TableHead>
                        <TableHead className="text-right">কমিশন</TableHead>
                        <TableHead className="text-right">নেট আয়</TableHead>
                        <TableHead className="text-right">উত্তোলিত</TableHead>
                        <TableHead className="text-right">ব্যালেন্স</TableHead>
                        <TableHead>পেআউট সেটিংস</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIncomes.map((r: any) => (
                        <TableRow key={r.vendor.id}>
                          <TableCell className="text-xs">
                            <div className="font-semibold">{r.vendor.shop_name_bn || r.vendor.shop_name}</div>
                            <div className="text-[10px] text-muted-foreground">
                              ID: <button onClick={() => copy(r.vendor.id)} className="hover:text-primary">{r.vendor.id.slice(0, 8)}…</button> · {r.vendor.owner_name}
                            </div>
                            <div className="text-[10px] text-muted-foreground">কমিশন: {r.vendor.commission_percent}%</div>
                          </TableCell>
                          <TableCell className="text-right text-xs">{r.orderCount}</TableCell>
                          <TableCell className="text-right text-xs">{formatBDT(r.totalSales)}</TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">−{formatBDT(r.totalCommission)}</TableCell>
                          <TableCell className="text-right text-xs font-semibold">{formatBDT(r.earned)}</TableCell>
                          <TableCell className="text-right text-xs">{formatBDT(r.withdrawn)}</TableCell>
                          <TableCell className="text-right font-bold text-green-700">{formatBDT(r.balance)}</TableCell>
                          <TableCell className="text-xs">
                            <PayoutSettingsCell setting={r.setting} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>উত্তোলন পরিচালনা</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">ভেন্ডর:</span> <span className="font-semibold">{editing.vendors?.shop_name_bn || editing.vendors?.shop_name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">পরিমাণ:</span> <span className="font-bold text-green-700">{formatBDT(editing.amount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">পদ্ধতি:</span> <span>{methodLabel[editing.method] || editing.method}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">অ্যাকাউন্ট:</span> <span className="font-mono">{editing.payout_account}</span></div>
                {editing.vendor_notes && (
                  <div className="pt-1 border-t mt-2 text-xs text-muted-foreground">ভেন্ডর: {editing.vendor_notes}</div>
                )}
              </div>

              <div>
                <Label>স্ট্যাটাস *</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">অপেক্ষমাণ</SelectItem>
                    <SelectItem value="approved">অনুমোদন</SelectItem>
                    <SelectItem value="paid">পরিশোধিত</SelectItem>
                    <SelectItem value="rejected">প্রত্যাখ্যান</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>ট্রানজেকশন রেফারেন্স {editStatus === "paid" && "*"}</Label>
                <Input value={txnRef} onChange={(e) => setTxnRef(e.target.value)} placeholder="TrxID, ব্যাংক রেফারেন্স..." />
              </div>

              <div>
                <Label>অ্যাডমিন নোট</Label>
                <Textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={2} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>বাতিল</Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              সংরক্ষণ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color }: any) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </CardContent>
  </Card>
);

const PayoutSettingsCell = ({ setting }: any) => {
  if (!setting) return <span className="text-muted-foreground">—</span>;
  const items = [
    setting.bkash_number && { icon: Smartphone, label: "bKash", val: setting.bkash_number },
    setting.nagad_number && { icon: Smartphone, label: "Nagad", val: setting.nagad_number },
    setting.rocket_number && { icon: Smartphone, label: "Rocket", val: setting.rocket_number },
    setting.bank_name && { icon: Building2, label: setting.bank_name, val: setting.account_number },
  ].filter(Boolean) as any[];
  if (!items.length) return <span className="text-muted-foreground">সেট করা নেই</span>;
  return (
    <div className="space-y-0.5">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-1.5 text-[11px]">
          <it.icon className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium">{it.label}:</span>
          <span className="font-mono">{it.val}</span>
        </div>
      ))}
    </div>
  );
};

export default AdminVendorWithdrawals;
